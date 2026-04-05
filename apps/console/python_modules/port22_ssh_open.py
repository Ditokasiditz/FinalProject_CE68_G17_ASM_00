import argparse
import json
import sys
import subprocess


def check_ssh_port22(target: str) -> bool:
    """
    ตรวจสอบ Port 22 (SSH) ว่าเปิดอยู่หรือไม่ด้วย Nmap
    ฟังก์ชันมาตรฐานสำหรับ API: คืนค่า True หากพบว่า Port 22 เปิดอยู่ (Open)
    """
    if not target:
        return False

    # จัดการตัด http:// หรือ https:// ออกในกรณีที่ผู้ใช้เผลอส่ง URL มาแทน IP/Domain
    if target.startswith("http://"):
        target = target.replace("http://", "", 1)
    elif target.startswith("https://"):
        target = target.replace("https://", "", 1)

    # ตัด path ด้านหลังออกถ้ามี (เช่น example.com/path -> example.com)
    target = target.split("/")[0]

    try:
        # ใช้ subprocess เพื่อเรียกคำสั่ง nmap โดยตรง
        # -p 22: กำหนดเป้าหมายเฉพาะ Port 22
        # -Pn: ข้ามการทำ Host Discovery (Ping) เพื่อให้เช็คพอร์ตโดยตรง
        command = ["nmap", "-p", "22", "-Pn", target]

        # รันคำสั่ง nmap และดึงผลลัพธ์ออกมา (capture_output)
        response = subprocess.run(command, capture_output=True, text=True, timeout=15)

        # วิเคราะห์ผลลัพธ์: ตรวจสอบหา string ที่บ่งบอกว่า port เปิดอยู่
        # nmap มักจะแสดงผลในรูปแบบ "22/tcp open  ssh"
        output = response.stdout.lower()
        if "22/tcp open" in output or "22/tcp  open" in output:
            return True

        return False
    except Exception:
        # หากเชื่อมต่อไม่ได้ เกิด Timeout หรือในเครื่องไม่มี Nmap ติดตั้งอยู่ คืนค่า False ไปก่อน
        return False

def get_metadata() -> dict:
    """
    บันทึกข้อความรายละเอียด CVSS และช่องโหว่ กลับไปยังตาราง Backend
    """
    return {
        "cve_id": "Open-SSH-Port-22",
        "severity": "Medium",
        "cvss_score": 5.0,
        "details": "The SSH service (port 22) is open and accessible from the internet. This could expose the system to brute-force attacks or exploitation of SSH vulnerabilities if not properly secured."
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Scan for Open SSH Port (22) using Nmap"
    )
    parser.add_argument("--ip", required=True, help="IP address or domain to scan")

    args = parser.parse_args()
    vulnerability_found = check_ssh_port22(args.ip)

    result = {"found": vulnerability_found}
    print(json.dumps(result))
    sys.exit(0)
