import requests
import urllib.parse
from typing import Dict
import argparse
import json
import sys

class RedirectChainDetector:
    def __init__(self, timeout: int = 10, max_redirects: int = 10):
        self.timeout = timeout
        self.max_redirects = max_redirects
        self.session = requests.Session()
        self.session.max_redirects = max_redirects
        
        # Set realistic headers
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })

    def check_redirect_chain(self, url: str) -> Dict:
        """
        Check redirect chain for HTTP vulnerabilities
        Returns detailed analysis of the redirect chain
        """
        result = {
            'url': url,
            'vulnerable': False,
            'redirect_chain': [],
            'http_steps': [],
            'total_redirects': 0,
            'final_url': '',
            'status_code': None,
            'error': None
        }
        
        try:
            # Make request with redirect following
            response = self.session.get(url, allow_redirects=True, timeout=self.timeout)
            
            # Analyze redirect history
            redirect_chain = []
            http_found = []
            
            # Add initial request if it was redirected
            if response.history:
                for i, resp in enumerate(response.history):
                    step_info = {
                        'step': i + 1,
                        'url': resp.url,
                        'status_code': resp.status_code,
                        'protocol': urllib.parse.urlparse(resp.url).scheme.lower(),
                        'is_http': resp.url.startswith('http://'),
                        'location_header': resp.headers.get('Location', 'N/A')
                    }
                    
                    redirect_chain.append(step_info)
                    
                    # Check for HTTP in redirect chain
                    if step_info['is_http']:
                        http_found.append(step_info)
                        result['vulnerable'] = True
            
            # Add final destination
            final_info = {
                'step': len(redirect_chain) + 1,
                'url': response.url,
                'status_code': response.status_code,
                'protocol': urllib.parse.urlparse(response.url).scheme.lower(),
                'is_http': response.url.startswith('http://'),
                'location_header': 'Final Destination'
            }
            
            if final_info['is_http']:
                http_found.append(final_info)
                # Note: We consider it vulnerable if any step, or the final destination, is HTTP
                result['vulnerable'] = True
            
            # Update result
            result.update({
                'redirect_chain': redirect_chain,
                'http_steps': http_found,
                'total_redirects': len(redirect_chain),
                'final_url': response.url,
                'status_code': response.status_code
            })
            
        except requests.exceptions.TooManyRedirects:
            result['error'] = f"Too many redirects (>{self.max_redirects})"
        except requests.exceptions.Timeout:
            result['error'] = f"Request timeout ({self.timeout}s)"
        except requests.exceptions.ConnectionError as e:
            result['error'] = f"Connection error: {str(e)}"
        except Exception as e:
            result['error'] = f"Unexpected error: {str(e)}"
        
        return result


def check(target: str) -> bool:
    """
    ฟังก์ชันมาตรฐานสำหรับ API: รับ target เป็น URL หรือ Domain
    กลับไปเป็น True หากพบช่องโหว่ Redirect ผ่าน HTTP
    """
    if not target:
        return False

    # จัดการใส่ https:// เข้าไปถ้าผู้ใช้ส่งมาแค่ชื่อโดเมน
    if not target.startswith(('http://', 'https://')):
        url = 'https://' + target
    else:
        url = target

    detector = RedirectChainDetector()
    result = detector.check_redirect_chain(url)
    
    # ส่งกลับแค่ค่า Boolean ตามมาตรฐานโมดูลที่ออกแบบไว้
    return result.get('vulnerable', False)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scan for Insecure HTTP Redirect Chains")
    parser.add_argument("--ip", required=True, help="IP address or domain to scan")
    
    args = parser.parse_args()
    
    # Run the module check
    vulnerability_found = check(args.ip)
    
    # Must output raw JSON string to stdout for Node.js to read it
    result = {
        "found": vulnerability_found
    }
    
    print(json.dumps(result))
    sys.exit(0)
