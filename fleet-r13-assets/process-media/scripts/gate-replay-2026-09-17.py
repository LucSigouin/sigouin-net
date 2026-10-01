#!/usr/bin/env python3
"""Run the three real round 12 gate cases. All temporary writes stay in this lane."""
import argparse
import json
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

LANE = Path(__file__).resolve().parents[1]
ROUND = Path('/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery')
CHECK = ROUND / 'check-lane.py'
PASSING = ROUND / 'tooling'
parser = argparse.ArgumentParser()
parser.add_argument('--record', action='store_true')
args = parser.parse_args()

runtime = LANE / '.runtime'
runtime.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='gate-', dir=runtime) as tmp:
    root = Path(tmp)
    empty = root / 'empty'
    empty.mkdir()
    mutant = root / 'em-dash'
    mutant.mkdir()
    shutil.copy2(PASSING / 'REPORT.md', mutant / 'REPORT.md')
    result = json.loads((PASSING / 'result.json').read_text())
    original = Path(result['deliverable'])
    deliverable = mutant / original.name
    deliverable.write_text(original.read_text() + '\nGate mutation: ' + chr(0x2014) + '\n')
    result['deliverable'] = str(deliverable)
    (mutant / 'result.json').write_text(json.dumps(result, indent=2) + '\n')
    cases = [('1. Empty lane', empty, 1), ('2. Copy with one em dash', mutant, 1), ('3. Unchanged tooling lane', PASSING, 0)]
    transcript = []
    evidence = []
    for label, target, expected in cases:
        command = ['python3', str(CHECK), str(target)]
        run = subprocess.run(command, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        plain = f'{label}\n$ ' + ' '.join(command) + '\n' + run.stdout + f'exit {run.returncode}\n'
        transcript.append(plain)
        if args.record:
            print('\033[36m' + label + '\033[0m', flush=True)
            # Paths are printed exactly as executed. Color does not change the gate output.
            print('$ ' + ' '.join(command), flush=True)
            color = '\033[31m' if run.returncode else '\033[32m'
            print(color + run.stdout.rstrip() + f'\nexit {run.returncode}' + '\033[0m\n', flush=True)
            time.sleep(1.5 if expected else 0)
        else:
            print(plain, flush=True)
        evidence.append({'case': label, 'command': command, 'exit': run.returncode, 'expected_exit': expected, 'output': run.stdout})
        if run.returncode != expected:
            raise SystemExit(f'Unexpected gate result for {label}')
    (LANE / 'gate-red-green.txt').write_text('\n'.join(transcript))
    (LANE / 'evidence/gate-cases-2026-09-17.json').write_text(json.dumps(evidence, indent=2) + '\n')
