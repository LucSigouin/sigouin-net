#!/usr/bin/env python3
"""Round 13 stills lane: generate one PNG per named prompt into out/.

Same API call and cost logging as personal/imagegen/dopamine.py, but the output
folder is this lane dir (dopamine.py hardcodes imagegen/drops/).

    python3 gen.py <name> "<prompt>" [<name> "<prompt>" ...] [--size 1536x1024]
"""
import base64
import http.client
import json
import os
import pathlib
import sys
import time
import urllib.error
import urllib.request

sys.path.insert(0, "/Users/ls/Claude-Workspace/personal/imagegen")
import costlog  # noqa: E402

OUT = pathlib.Path(__file__).resolve().parent / "out"
ENV_FILE = pathlib.Path("/Users/ls/Claude-Workspace/personal/.env")
MODEL = "gpt-image-2"
QUALITY = "medium"


def load_api_key() -> str:
    for line in ENV_FILE.read_text().splitlines():
        if line.startswith("OPENAI_API_KEY="):
            return line.split("=", 1)[1].strip()
    sys.exit("OPENAI_API_KEY not found")


def generate(api_key: str, name: str, prompt: str, size: str) -> None:
    body = json.dumps(
        {"model": MODEL, "prompt": prompt, "size": size, "quality": QUALITY}
    ).encode()
    request = urllib.request.Request(
        "https://api.openai.com/v1/images/generations",
        data=body,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
    )
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=600) as response:
                payload = json.load(response)
            break
        except (urllib.error.HTTPError, TimeoutError, OSError,
                http.client.IncompleteRead, http.client.HTTPException) as error:
            code = getattr(error, "code", None)
            if (code in (429, 500, 502, 503) or code is None) and attempt < 4:
                wait = 20 * (attempt + 1)
                print(f"  ... {name}: {code or type(error).__name__}, retry in {wait}s", flush=True)
                time.sleep(wait)
            else:
                if isinstance(error, urllib.error.HTTPError):
                    print(error.read().decode()[:500], flush=True)
                raise
    filename = f"{name}.png"
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / filename).write_bytes(base64.b64decode(payload["data"][0]["b64_json"]))
    costlog.record(OUT, filename, "openai", MODEL, usage=payload.get("usage"))
    (OUT / f"{name}.prompt.txt").write_text(prompt)
    print(f"  ok {filename}", flush=True)


def main() -> None:
    args = sys.argv[1:]
    size = "1536x1024"
    if "--size" in args:
        i = args.index("--size")
        size = args[i + 1]
        del args[i : i + 2]
    key = load_api_key()
    for name, prompt in zip(args[0::2], args[1::2]):
        generate(key, name, prompt, size)


if __name__ == "__main__":
    main()
