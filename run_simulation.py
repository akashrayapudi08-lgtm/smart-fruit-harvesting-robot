"""
SMART FRUIT HARVESTING ROBOT - 3D LIVE SIMULATION LAUNCHER
Starts a local HTTP server and automatically opens the 3D web simulation in the default browser.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        # Clean logging
        sys.stderr.write(f"[{self.log_date_time_string()}] {format % args}\n")

def open_in_chrome(url):
    """Launch URL specifically in Google Chrome on Windows"""
    import subprocess
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%PROGRAMFILES%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%PROGRAMFILES(X86)%\Google\Chrome\Application\chrome.exe")
    ]
    for cp in chrome_paths:
        if os.path.exists(cp):
            print(f" Launching Google Chrome: {cp}")
            subprocess.Popen([cp, url])
            return True
    
    # Fallback to webbrowser
    print(" Google Chrome default path not found, using system browser...")
    webbrowser.open(url)
    return False

def run_server():
    os.chdir(DIRECTORY)
    port = PORT
    socketserver.TCPServer.allow_reuse_address = True
    for attempt in range(10):
        try:
            with socketserver.TCPServer(("", port), Handler) as httpd:
                url = f"http://localhost:{port}/index.html"
                print("=" * 70)
                print(" SMART FRUIT HARVESTING ROBOT FOR AUTOMATED FRUIT PICKING")
                print(" 3D Live Web Simulation & Mechatronics Digital Twin")
                print("=" * 70)
                print(f" Serving at: {url}")
                print(" Opening in Google Chrome...")
                print(" Press Ctrl+C in this terminal to stop the server.")
                print("=" * 70)
                
                open_in_chrome(url)
                
                httpd.serve_forever()
                break
        except OSError:
            print(f" Port {port} is occupied, trying next port {port + 1}...")
            port += 1

if __name__ == "__main__":
    try:
        run_server()
    except KeyboardInterrupt:
        print("\nSimulation server stopped by user.")

