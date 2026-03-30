import argparse
import json
import sys
import requests

def check_httponly(target: str) -> bool:
    """
    ตรวจสอบ Session Cookie Missing 'HttpOnly' Attribute
    ฟังก์ชันมาตรฐานสำหรับ API: คืนค่า True หากพบ Cookie ที่ไม่มี HttpOnly (Vulnerable)
    """
    if not target:
        return False
        
    # จัดการใส่ https:// เข้าไปถ้าผู้ใช้ส่งมาแค่ชื่อโดเมน
    if not target.startswith(('http://', 'https://')):
        url = 'https://' + target
    else:
        url = target

    try:
        # ใช้ HEAD method เพื่อให้ทำงานเร็วที่สุด คล้ายๆ Invoke-WebRequest -Method HEAD
        # ใส่ User-Agent เพื่อป้องกันบางเว็บแบนคำขอเปล่าๆ
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.head(url, headers=headers, timeout=10, allow_redirects=True)
        
        # ถ้าระบบใช้ GET อาจจะให้ set-cookie ได้ชัดเจนกว่าในบางเว็บ (Fallback)
        if 'set-cookie' not in response.headers:
             response = requests.get(url, headers=headers, timeout=10, allow_redirects=True)

        cookies = response.headers.get('set-cookie')
        
        if cookies:
            # วิเคราะห์ Cookie: ใน requests อาจะแยกด้วยเครื่องหมาย comma ถ้ามีหลาย Cookie
            # หรือเราสามารถใช้ response.cookies ได้เลยซึ่งจะผ่านการ parse มาแล้ว
            for cookie in response.cookies:
                # ตรวจสอบ attribute HttpOnly 
                # (requests Cookie object มี has_nonstandard_attr หรือ เช็คจาก _rest dict ได้เลย)
                if not cookie.has_nonstandard_attr('HttpOnly') and 'httponly' not in str(cookie._rest).lower():
                    # ถ้าเจอแม้แต่หนึ่ง Cookie (ใน session) ที่ไม่มี HttpOnly ถือว่าเสี่ยง
                    return True
                    
        return False

    except Exception:
        # หากเชื่อมต่อไม่ได้ คืนค่า False ไปก่อน
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scan for Session Cookie Missing 'HttpOnly' Attribute")
    parser.add_argument("--ip", required=True, help="IP address to scan")
    
    args = parser.parse_args()
    vulnerability_found = check_httponly(args.ip)
    
    result = {"found": vulnerability_found}
    print(json.dumps(result))
    sys.exit(0)
