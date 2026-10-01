"""Round 20 header comparison.

Stacks the settled header strip from three rounds, top to bottom, at 1440 wide:
round 17 (the waveform bed Luc liked), round 18 (the flat ink wash he did not), and
round 20 (this lane). The crops come out of each round's own
shots/index-after-overture-1440.png, which is a 1440 wide capture of the settled page, so
the pixels are the same ones Playwright wrote. The strip is the top 96 px of that frame.
"""

from PIL import Image, ImageDraw

BASE = "/Users/ls/Claude-Workspace/personal/sigouin-net"
STRIP_H = 96
LABEL_H = 26
WIDTH = 1440

rounds = [
    ("round 17: waveform bed behind the name", f"{BASE}/fleet-r17-noscroll/shots/index-after-overture-1440.png"),
    ("round 18: starfield ground only, the strip reads black", f"{BASE}/fleet-r18-background/shots/index-after-overture-1440.png"),
    ("round 20 (this lane): waveform bed restored", f"{BASE}/fleet-r20-header/shots/index-after-overture-1440.png"),
]

out = Image.new("RGB", (WIDTH, len(rounds) * (STRIP_H + LABEL_H)), (10, 10, 11))
draw = ImageDraw.Draw(out)

y = 0
for label, path in rounds:
    draw.rectangle([0, y, WIDTH, y + LABEL_H], fill=(24, 24, 28))
    draw.text((12, y + 8), label, fill=(236, 231, 221))
    y += LABEL_H
    strip = Image.open(path).convert("RGB").crop((0, 0, WIDTH, STRIP_H))
    out.paste(strip, (0, y))
    draw.line([0, y + STRIP_H - 1, WIDTH, y + STRIP_H - 1], fill=(60, 60, 66))
    y += STRIP_H

dest = f"{BASE}/fleet-r20-header/shots/header-compare-1440.png"
out.save(dest)
print("wrote", dest, out.size)
