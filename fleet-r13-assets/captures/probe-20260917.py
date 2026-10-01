import concurrent.futures
import datetime
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent
URLS = [
    'https://sigzmusic.com/api/tracks',
    'https://teetime.sigouin.net/api/teetimes',
    'https://teetime.sigouin.net/api/courses',
    'https://bbc.sigouin.net/api/state',
]

def probe(item):
    i, url = item
    headers = ROOT / '.runtime' / f'probe-{i}.headers'
    body = ROOT / '.runtime' / f'probe-{i}.body'
    args = ['curl', '--silent', '--show-error', '--request', 'GET',
            '--header', 'Origin: https://sigouin.net', '--connect-timeout', '15',
            '--max-time', '40', '--dump-header', str(headers), '--output', str(body),
            '--write-out', '%{http_code}', url]
    done = subprocess.run(args, capture_output=True, text=True)
    values = {}
    for line in headers.read_text().splitlines() if headers.exists() else []:
        if line.startswith('HTTP/'):
            values = {}
        elif ':' in line:
            key, value = line.split(':', 1)
            values[key.lower()] = value.strip()
    result = {'url': url, 'method': 'GET', 'request_origin': 'https://sigouin.net',
              'recorded_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'status': int(done.stdout) if done.stdout.strip().isdigit() else None,
              'access-control-allow-origin': values.get('access-control-allow-origin'),
              'cache-control': values.get('cache-control'),
              'content-type': values.get('content-type'),
              'bytes': body.stat().st_size if body.exists() else 0,
              'curl_exit': done.returncode, 'error': done.stderr.strip() or None,
              'redirects_followed': False}
    headers.unlink(missing_ok=True)
    body.unlink(missing_ok=True)
    return result

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(probe, enumerate(URLS)))
output = {'origin': 'https://sigouin.net', 'probes': results}
(ROOT / 'cors-probe.json').write_text(json.dumps(output, indent=2) + '\n')
print(json.dumps(output, indent=2))
