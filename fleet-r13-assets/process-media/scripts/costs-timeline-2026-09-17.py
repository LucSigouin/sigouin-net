#!/usr/bin/env python3
"""Aggregate every costs.jsonl under personal without reading unrelated files."""
import collections
import datetime as dt
from decimal import Decimal
import hashlib
import json
import os
from pathlib import Path

ROOT = Path('/Users/ls/Claude-Workspace/personal')
LANE = Path(__file__).resolve().parents[1]
files = []
walk_errors = []
for directory, dirs, names in os.walk(ROOT, followlinks=False, onerror=lambda e: walk_errors.append(str(e))):
    # No symlink traversal can escape the personal workspace.
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.git') and not Path(directory, d).is_symlink()]
    if 'costs.jsonl' in names:
        p = Path(directory, 'costs.jsonl')
        if not p.is_symlink():
            files.append(p)

rows = []
sources = []
issues = []
for source in sorted(files):
    raw = source.read_bytes()
    lines = raw.decode('utf-8').splitlines()
    sources.append({'path': str(source), 'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw), 'nonempty_lines': sum(bool(x.strip()) for x in lines)})
    for number, line in enumerate(lines, 1):
        if not line.strip():
            continue
        try:
            record = json.loads(line, parse_float=Decimal)
            ts = record.get('ts', record.get('timestamp'))
            if isinstance(ts, (int, float, Decimal)):
                seconds = float(ts) / (1000 if float(ts) > 1e12 else 1)
                timestamp = dt.datetime.fromtimestamp(seconds, dt.timezone.utc).isoformat().replace('+00:00', 'Z')
            elif isinstance(ts, str):
                timestamp = dt.datetime.fromisoformat(ts.replace('Z', '+00:00')).astimezone(dt.timezone.utc).isoformat().replace('+00:00', 'Z')
            else:
                timestamp = None
            usd = next((record[k] for k in ('usd', 'cost_usd', 'total_cost_usd') if isinstance(record.get(k), (int, float, Decimal)) and not isinstance(record.get(k), bool)), None)
            credits = next((record[k] for k in ('credits', 'cost_credits', 'credits_used') if isinstance(record.get(k), (int, float, Decimal)) and not isinstance(record.get(k), bool)), None)
            amount = {'usd': float(usd) if usd is not None else None, 'credits': float(credits) if credits is not None else None}
            project_path = source.parent.relative_to(ROOT).as_posix()
            row = {'ts': timestamp, 'provider': record.get('provider') or 'unknown', 'model': record.get('model'), 'usd_or_credits': amount, 'project': project_path, 'source': str(source), 'source_line': number, 'estimate': record.get('estimate', False)}
            rows.append(row)
            if timestamp is None or (usd is None and credits is None):
                issues.append({'source': str(source), 'line': number, 'issue': 'Missing timestamp or numeric price; preserved as null.'})
        except Exception as e:
            issues.append({'source': str(source), 'line': number, 'issue': type(e).__name__})

rows.sort(key=lambda r: (r['ts'] is None, r['ts'] or '', r['source'], r['source_line']))
def total(items):
    return {'usd': float(sum((Decimal(str(r['usd_or_credits']['usd'])) for r in items if r['usd_or_credits']['usd'] is not None), Decimal(0))), 'credits': float(sum((Decimal(str(r['usd_or_credits']['credits'])) for r in items if r['usd_or_credits']['credits'] is not None), Decimal(0))), 'entries': len(items), 'priced_entries': sum(any(v is not None for v in r['usd_or_credits'].values()) for r in items), 'unknown_price_entries': sum(all(v is None for v in r['usd_or_credits'].values()) for r in items)}
providers = sorted({r['provider'] for r in rows})
models = sorted({(r['provider'], r['model'] or 'unknown') for r in rows})
output = {'schema_version': 1, 'captured_at': dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00', 'Z'), 'scope': str(ROOT), 'entries': rows, 'totals': {'all': total(rows), 'by_provider': {p: total([r for r in rows if r['provider'] == p]) for p in providers}, 'by_model': {p + '/' + m: total([r for r in rows if r['provider'] == p and (r['model'] or 'unknown') == m]) for p, m in models}}, 'sources': sources, 'issues': issues, 'scan_errors': walk_errors, 'notes': ['Every nonempty valid log row is retained; no deduplication or currency conversion.', 'usd_or_credits is an object so USD and provider credits cannot be added together.', 'Missing prices and models stay null. A zero subtotal with unknown entries does not mean free usage.', 'project is the log parent path relative to personal.', 'These logs record selected generation usage; they are not a complete cost ledger for coding or the portfolio.', 'node_modules, .git, and symlink traversal are excluded. No .env files are opened.']}
(LANE / 'costs-timeline.json').write_text(json.dumps(output, indent=2) + '\n')
print(json.dumps({'files': len(files), 'entries': len(rows), 'totals': output['totals'], 'issues': len(issues), 'scan_errors': walk_errors}))
