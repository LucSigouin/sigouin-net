from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
import hashlib
import json
import subprocess

out = Path(__file__).parent
(out / 'local-curl').mkdir(exist_ok=True)
routes = [('/', 'index'), ('/process/', 'process'), ('/api/live/sigz/tracks', 'sigz-tracks'), ('/api/live/bbc/state', 'bbc-state')]

def probe(pair):
    route, name = pair
    body = out / 'local-curl' / (name + '.body')
    headers = out / 'local-curl' / (name + '.headers')
    result = subprocess.run([
        'curl', '--silent', '--show-error', '--max-time', '20',
        '--dump-header', str(headers), '--output', str(body),
        '--write-out', '%{http_code}', 'http://127.0.0.1:8799' + route,
    ], capture_output=True, text=True)
    content = body.read_bytes() if body.exists() else b''
    data = {
        'route': route, 'status': int(result.stdout or 0), 'curl_exit': result.returncode,
        'bytes': len(content), 'sha256': hashlib.sha256(content).hexdigest(),
        'first_200_bytes': content[:200].decode('utf-8', errors='replace'),
        'first_200_hex': content[:200].hex(),
        'checked_at': datetime.now(timezone.utc).isoformat(), 'error': result.stderr,
    }
    if route.startswith('/api/'):
        data['json_valid'] = isinstance(json.loads(content), dict)
    return data

with ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(probe, routes))
(out / 'local-curl.json').write_text(json.dumps(results, indent=2) + '\n')
for row in results:
    print(row['route'], row['status'], repr(row['first_200_bytes']))
assert all(r['status'] == 200 and r['curl_exit'] == 0 for r in results)
