#!/usr/bin/env python3
"""Run dopamine.py with the 5 codex concept prompts as proper argv entries."""
import subprocess, sys
from pathlib import Path
prompts = [l.strip() for l in Path(__file__).with_name("codex").joinpath("prompts.txt").read_text().splitlines() if "::" in l]
assert len(prompts) == 5, len(prompts)
cmd = [sys.executable, "/Users/ls/Claude-Workspace/personal/imagegen/dopamine.py",
       "--title", "Hero Concepts", "--size", "1536x1024", "--quality", "high", *prompts]
sys.exit(subprocess.call(cmd, cwd="/Users/ls/Claude-Workspace/personal/imagegen"))
