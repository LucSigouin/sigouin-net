"""Round 20 manifest: every file under site/ and shots/, with kind and size."""

import json
import os

LANE = "/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r20-header"

KINDS = {
    ".html": "markup", ".css": "style", ".js": "script", ".ts": "script",
    ".json": "data", ".jsonl": "data", ".webp": "image", ".png": "image",
    ".jpg": "image", ".svg": "image", ".mp4": "video", ".glb": "model",
    ".txt": "data", ".md": "doc",
}

files = []
for root in ("site", "shots"):
    for dirpath, _, names in os.walk(os.path.join(LANE, root)):
        for n in sorted(names):
            if n == ".DS_Store":
                continue
            p = os.path.join(dirpath, n)
            files.append({
                "path": p,
                "kind": KINDS.get(os.path.splitext(n)[1].lower(), "data"),
                "bytes": os.path.getsize(p),
            })

files.sort(key=lambda f: f["path"])
out = {"lane": "r20-header", "files": files}
with open(os.path.join(LANE, "manifest.json"), "w") as fh:
    json.dump(out, fh, indent=1)
    fh.write("\n")
print(len(files), "files,", sum(f["bytes"] for f in files) / 1e6, "MB")
print(json.dumps([f["path"] for f in files if "/shots/" in f["path"]], indent=1))
