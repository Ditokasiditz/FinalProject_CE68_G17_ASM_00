import ssl
import socket
import subprocess
import re
from urllib.parse import urlparse
import concurrent.futures
import argparse
import json
import sys

class OpenSSLVulnScanner:
    def __init__(self):
        self.vulnerable_versions = [
            "3.0.0", "3.0.1", "3.0.2", "3.0.3", "3.0.4", "3.0.5", "3.0.6"
        ]
        # จำกัดพอร์ตเพื่อความรวดเร็วในการรัน API (สามารถเพิ่มได้ตามต้องการ)
        self.common_ports = [443, 8443, 465]
    
    def check_openssl_version_nmap(self, target, port=443):
        """Use nmap to detect OpenSSL version"""
        try:
            cmd = [
                "nmap", "-sV", "--script", "ssl-enum-ciphers",
                "-p", str(port), target
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            
            if result.returncode == 0:
                openssl_match = re.search(r'OpenSSL[/\s]+(\d+\.\d+\.\d+)', result.stdout, re.IGNORECASE)
                if openssl_match:
                    return openssl_match.group(1)
            return None
        except Exception:
            return None
    
    def get_ssl_info(self, hostname, port=443, timeout=5):
        """Get SSL certificate and connection information"""
        try:
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            
            with socket.create_connection((hostname, port), timeout=timeout) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    cipher = ssock.cipher()
                    version = ssock.version()
                    
                    return {'certificate': cert, 'cipher': cipher, 'tls_version': version, 'connected': True}
        except Exception as e:
            return {'error': str(e), 'connected': False}
    
    def check_openssl_banner(self, target, port=443):
        """Try to grab SSL banner for version information"""
        try:
            cmd = [
                "openssl", "s_client", "-connect", f"{target}:{port}",
                "-servername", target, "-showcerts"
            ]
            result = subprocess.run(cmd, input="", capture_output=True, text=True, timeout=10)
            
            openssl_match = re.search(r'OpenSSL[/\s]+(\d+\.\d+\.\d+)', result.stderr, re.IGNORECASE)
            if openssl_match:
                return openssl_match.group(1)
            return None
        except Exception:
            return None
    
    def is_vulnerable_version(self, version):
        """Check if the detected version is vulnerable"""
        if not version:
            return False
        try:
            version_parts = [int(x) for x in version.split('.')]
            if len(version_parts) >= 3 and version_parts[0] == 3 and version_parts[1] == 0:
                if version_parts[2] <= 6:
                    return True
            return False
        except ValueError:
            return False
    
    def scan_port(self, target, port):
        ssl_info = self.get_ssl_info(target, port)
        if not ssl_info.get('connected'):
            return {'port': port, 'status': 'closed'}
        
        openssl_version = self.check_openssl_version_nmap(target, port)
        if not openssl_version:
            openssl_version = self.check_openssl_banner(target, port)
        
        vulnerable = self.is_vulnerable_version(openssl_version)
        return {'port': port, 'status': 'open', 'vulnerable': vulnerable}
    
    def scan_target(self, target, ports=None, threads=3):
        if ports is None:
            ports = self.common_ports
            
        results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=threads) as executor:
            future_to_port = {executor.submit(self.scan_port, target, port): port for port in ports}
            for future in concurrent.futures.as_completed(future_to_port):
                try:
                    results.append(future.result())
                except Exception:
                    pass
        return results

def check(target: str) -> bool:
    """
    ฟังก์ชันมาตรฐานสำหรับ API: รับ target กลับไปเป็น True หากพบช่องโหว่บนพอร์ตใดๆ
    """
    # ล้าง target หากใส่ http/https มา
    if target.startswith(('http://', 'https://')):
        parsed = urlparse(target)
        target = parsed.hostname
        
    if not target:
        return False

    scanner = OpenSSLVulnScanner()
    results = scanner.scan_target(target)
    
    # หากมีพอร์ตใดแจ้งผลสถานะเป็น vulnerable = True คืนค่าทันที
    for r in results:
        if r.get('vulnerable'):
            return True
            
    return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scan for OpenSSL 3.X vulnerability")
    parser.add_argument("--ip", required=True, help="IP address to scan")
    
    args = parser.parse_args()
    
    # Run the module check
    vulnerability_found = check(args.ip)
    
    # Must output raw JSON string to stdout for Node.js to read it
    result = {
        "found": vulnerability_found
    }
    
    # Print the JSON string to STDOUT
    print(json.dumps(result))
    sys.exit(0)
