import subprocess
import urllib.request
import json
import time
import sys
import os

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
html_path = r"file:///C:/Users/mido1/PhpstormProjects/car-market-frontend/feasibility/study_v4.html"
pdf_path = r"C:\Users\mido1\PhpstormProjects\car-market-frontend\feasibility\NegmCars_Feasibility_Study_v4.pdf"

# Launch Edge with remote debugging
cmd = [
    edge_path,
    "--headless=new",
    "--remote-debugging-port=9222",
    "--disable-gpu",
    html_path
]

print("Starting Edge...")
proc = subprocess.Popen(cmd)
time.sleep(3)

try:
    req = urllib.request.urlopen("http://127.0.0.1:9222/json")
    targets = json.loads(req.read().decode('utf-8'))
    page_target = next((t for t in targets if t.get('type') == 'page'), None)
    
    if not page_target:
        print("No page target found!")
        sys.exit(1)
        
    ws_url = page_target['webSocketDebuggerUrl']
    print(f"Connecting to CDP at {ws_url}")
    
    # Try importing websocket or installing
    try:
        import websocket
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "websocket-client"])
        import websocket

    ws = websocket.create_connection(ws_url)
    msg = {
        "id": 1,
        "method": "Page.printToPDF",
        "params": {
            "paperWidth": 8.27,
            "paperHeight": 11.69,
            "marginTop": 0,
            "marginBottom": 0,
            "marginLeft": 0,
            "marginRight": 0,
            "printBackground": True,
            "displayHeaderFooter": False,
            "preferCSSPageSize": True
        }
    }
    ws.send(json.dumps(msg))
    
    result = json.loads(ws.recv())
    if "result" in result and "data" in result["result"]:
        import base64
        pdf_data = base64.b64decode(result["result"]["data"])
        with open(pdf_path, "wb") as f:
            f.write(pdf_data)
        print(f"SUCCESS: Written PDF to {pdf_path} ({len(pdf_data)} bytes)")
    else:
        print("Failed to generate PDF:", result)
        
    ws.close()
finally:
    proc.terminate()
