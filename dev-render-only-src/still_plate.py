"""Login plate plus a static waveform in the player strip, for the Blender stills."""
import math
from PIL import Image, ImageDraw
SRC = '/Users/ls/Claude-Workspace/personal/sigouin-net/dev-render-only/vybe/assets/login-background.webp'
OUT = '/Users/ls/Claude-Workspace/personal/sigouin-net/dev-render-only-src/login-still.png'
x0, y0, x1, y1 = 740, 870, 1440, 959  # PLAYER in signal.js
img = Image.open(SRC).convert('RGB')
d = ImageDraw.Draw(img)
n, mid, gap = 96, (y0 + y1) / 2, (x1 - x0) / 96
for i in range(n):
    t = i / (n - 1)
    h = (0.25 + 0.75 * abs(math.sin(t * 17.3) * math.sin(t * 5.1 + 1))) * (y1 - y0) * 0.45
    x = x0 + i * gap + gap * 0.2
    d.rounded_rectangle((x, mid - h, x + gap * 0.6, mid + h), radius=2, fill=(205, 77, 14) if t <= 138 / 429 else (40, 52, 64))
img.save(OUT)
print('wrote', OUT)
