"""Renders the monitor's login screen (1920x1040) for the render-only homepage.

Art: the glowing courtyard at dusk (gpt-image-2, picked by Luc 2026-10-01; recomposed so the lower
part is empty), cropped to the screen. Over it: a Walk in button and the now-playing strip. The face,
then an LS badge, and the name used to sit here (until 2026-10-01). Layout constants must match ENTER and PLAYER in
vybe/signal.js; the Blender Vybe bars render live into PLAYER.
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import os

W, H = 1920, 1040
OLD = '/Users/ls/Claude-Workspace/personal/sigouin-net/retired/site-unused-20260925/vybe/assets/player-background.webp'
FONT = '/Users/ls/Claude-Workspace/personal/sigouin-net/site/vybe/assets/inter-400.ttf'
OUT = '/Users/ls/Claude-Workspace/personal/sigouin-net/dev-render-only/vybe/assets/login-background.webp'
ORANGE = (255, 163, 78)
ENTER = (960 - 150, 610, 960 + 150, 694)
PLAYER = (740, 870, 1440, 959)

ART = os.environ.get('ART', '/Users/ls/Claude-Workspace/personal/sigouin-net/dev-render-only-src/art/courtyard-plate.png')
CROP_TOP = int(os.environ.get('CROP_TOP', '190'))  # rows cut off the top once scaled to 1920 wide (1280 tall)
art = Image.open(ART).convert('RGB').resize((W, round(W * 1024 / 1536)), Image.LANCZOS)
img = art.crop((0, CROP_TOP, W, CROP_TOP + H)).convert('RGBA')

def overlay(draw_fn):
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(layer))
    img.alpha_composite(layer)

btn_font = ImageFont.truetype(FONT, 40)
small = ImageFont.truetype(FONT, 30)
tiny = ImageFont.truetype(FONT, 24)

# Walk in button (the ENTER hit area); label and arrow centred as one group.
overlay(lambda d: d.rounded_rectangle((ENTER[0], ENTER[1] + 6, ENTER[2], ENTER[3] + 6), radius=42, fill=(0, 0, 0, 90)))
d = ImageDraw.Draw(img)
d.rounded_rectangle(ENTER, radius=42, fill=ORANGE)
label = 'Walk in'
tw = btn_font.getlength(label); left = 960 - (tw + 14 + 31) / 2
d.text((left, (ENTER[1] + ENTER[3]) // 2), label, font=btn_font, fill=(28, 18, 8), anchor='lm')
ax, ay = left + tw + 14 + 16, (ENTER[1] + ENTER[3]) // 2
d.line((ax - 16, ay, ax + 14, ay), fill=(28, 18, 8), width=5)
d.line((ax + 2, ay - 12, ax + 15, ay), fill=(28, 18, 8), width=5)
d.line((ax + 2, ay + 12, ax + 15, ay), fill=(28, 18, 8), width=5)

# Now-playing strip, like a lock-screen media widget; the live waveform draws into PLAYER.
overlay(lambda d: d.rounded_rectangle((440, 845, 1480, 985), radius=28, fill=(8, 12, 18, 150), outline=(255, 255, 255, 30), width=2))
art = Image.open(OLD).convert('RGB').crop((332, 543, 537, 748)).resize((100, 100), Image.LANCZOS)
img.paste(art, (470, 865))
d = ImageDraw.Draw(img)
d.text((592, 885), 'Vybe', font=small, fill=(245, 245, 247))
d.text((592, 925), 'SiGz', font=tiny, fill=(190, 196, 206))

img.convert('RGB').save(OUT, 'WEBP', quality=90)
img.convert('RGB').save(OUT.replace('.webp', '-preview.png'))
print('wrote', OUT)
