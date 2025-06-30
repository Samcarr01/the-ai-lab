#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 8080
os.chdir('.next')

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Server running at http://localhost:{PORT}/")
    print(f"Also try: http://127.0.0.1:{PORT}/")
    httpd.serve_forever()