#!/usr/bin/env python3
"""Serve the archived widgell-bach dist/ read-only, with the KV storage API
answered from backups/kv-latest.json. Nothing is written into the archive:
PUT and DELETE are accepted and discarded so the app never errors on save.
"""
import json
import re
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ARCHIVE = "/Users/ls/Claude-Workspace/personal/archive/widgell-bach"
DIST = ARCHIVE + "/dist"
BACKUP = ARCHIVE + "/backups/kv-latest.json"
PORT = 5203

with open(BACKUP) as f:
    KV = {"bach:" + k: v for k, v in json.load(f).items()}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=DIST, **kw)

    def log_message(self, *a):
        pass

    def _json(self, body, status=200):
        payload = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _key(self):
        m = re.match(r"^/api/storage/(.+)$", self.path)
        return urllib.parse.unquote(m.group(1)) if m else None

    def do_GET(self):
        key = self._key()
        if key is not None:
            if key in KV:
                return self._json({"key": key, "value": KV[key]})
            return self._json({"error": "not found"}, 404)
        return super().do_GET()

    def do_PUT(self):
        key = self._key()
        if key is None:
            return self._json({"error": "not found"}, 404)
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length)
        try:
            value = json.loads(raw).get("value", "")
        except Exception:
            return self._json({"error": "invalid JSON"}, 400)
        KV[key] = value  # in memory only, never written back to the archive
        return self._json({"key": key, "value": value})

    def do_DELETE(self):
        key = self._key()
        KV.pop(key, None)
        return self._json({"key": key, "deleted": True})

    def do_POST(self):
        if self.path == "/api/chat/append":
            length = int(self.headers.get("Content-Length") or 0)
            self.rfile.read(length)
            return self._json({"ok": True})
        return self._json({"error": "not found"}, 404)


if __name__ == "__main__":
    print("serving widgell-bach dist on http://127.0.0.1:%d" % PORT)
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
