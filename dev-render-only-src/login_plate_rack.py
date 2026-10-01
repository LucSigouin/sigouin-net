"""Login screen for the phone-only rack monitor (1274x1040, the rack screen's aspect).

Same courtyard art as login_plate.py (scaled to the narrower screen, dark foreground extended
below), minus the now-playing strip, so a big glowing Walk in button owns the screen. ENTER must match the tap ring in vybe/render-only.css.
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import os

W, H = 1274, 1040
FONT = '/Users/ls/Claude-Workspace/personal/sigouin-net/site/vybe/assets/inter-400.ttf'
OUT = '/Users/ls/Claude-Workspace/personal/sigouin-net/dev-render-only-src/login-rack.png'
ORANGE = (255, 122, 20)  # hotter than the desk plate: the render desaturates it
ENTER = (W // 2 - 400, 560, W // 2 + 400, 780)

ART = os.environ.get('ART', '/Users/ls/Claude-Workspace/personal/sigouin-net/dev-render-only-src/art/courtyard-plate.png')
art = Image.open(ART).convert('RGB')
art = art.resize((W, round(W * art.height / art.width)), Image.LANCZOS)
# Courtyard ground (~60% down the art) lands above the button; the foreground below is extended
# by stretching the art's last rows, which are plain dark lawn.
top = -40
img = art.crop((0, art.height - 60, W, art.height)).resize((W, H)).convert('RGBA')
img.alpha_composite(art.convert('RGBA'), (0, top))

def layer(fn, blur=0):
    over = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    fn(ImageDraw.Draw(over))
    img.alpha_composite(over.filter(ImageFilter.GaussianBlur(blur)) if blur else over)

cx = W // 2

# Walk in: amber halo, then the pill, then heavy dark text and arrow, centred as one group.
r = (ENTER[3] - ENTER[1]) // 2
halo = (ENTER[0] - 40, ENTER[1] - 40, ENTER[2] + 40, ENTER[3] + 40)
layer(lambda d: d.rounded_rectangle(halo, radius=r + 40, fill=(255, 120, 20, 200)), blur=38)
layer(lambda d: d.rounded_rectangle((ENTER[0], ENTER[1] + 10, ENTER[2], ENTER[3] + 10), radius=r, fill=(0, 0, 0, 110)), blur=6)
d = ImageDraw.Draw(img)
d.rounded_rectangle(ENTER, radius=r, fill=ORANGE, outline=(255, 214, 170), width=6)
mid = (ENTER[1] + ENTER[3]) // 2
ink = (28, 18, 8)
big = ImageFont.truetype(FONT, 112)
tw = big.getlength('Walk in'); left = cx - (tw + 40 + 86) / 2
d.text((left, mid), 'Walk in', font=big, fill=ink, anchor='lm', stroke_width=3, stroke_fill=ink)
ax = left + tw + 40 + 44
d.line((ax - 44, mid, ax + 40, mid), fill=ink, width=14)
d.line((ax + 2, mid - 38, ax + 42, mid), fill=ink, width=14)
d.line((ax + 2, mid + 38, ax + 42, mid), fill=ink, width=14)
ImageDraw.Draw(img).text((cx, 900), 'Tap to walk into the hub', font=ImageFont.truetype(FONT, 50), fill=(225, 228, 234), anchor='mm')

img.convert('RGB').save(OUT)
print('wrote', OUT)
