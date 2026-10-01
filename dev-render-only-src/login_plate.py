"""Renders the monitor's login screen (1920x1040) for the render-only homepage.

Wallpaper: the workstation's own mountains.jpg, blurred like a lock screen. Avatar: the face
from Luc's character sheet. Layout constants must match ENTER and PLAYER in vybe/signal.js.
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1920, 1040
WALL = '/Users/ls/Claude-Workspace/personal/vybe-workstation/revisions/realism-v2/source/textures/mountains.jpg'
FACE = '/Users/ls/Claude-Workspace/personal/sigouin-net/Sigouin-Hub/art/character/front.png'
OLD = '/Users/ls/Claude-Workspace/personal/sigouin-net/site/vybe/assets/player-background.webp'
FONT = '/Users/ls/Claude-Workspace/personal/sigouin-net/site/vybe/assets/inter-400.ttf'
OUT = '/Users/ls/Claude-Workspace/personal/sigouin-net/dev-render-only/vybe/assets/login-background.webp'
ORANGE = (255, 163, 78)
ENTER = (960 - 150, 610, 960 + 150, 694)
PLAYER = (740, 870, 1440, 959)

wall = Image.open(WALL).convert('RGB').crop((0, 110, 1920, 110 + H))
wall = wall.filter(ImageFilter.GaussianBlur(5))
wall = Image.blend(wall, Image.new('RGB', (W, H), (12, 16, 24)), 0.35)
img = wall.convert('RGBA')

def overlay(draw_fn):
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(layer))
    img.alpha_composite(layer)

# Avatar: the character's face in a ringed circle.
D = 230
face = Image.open(FACE).convert('RGB').crop((282, 8, 452, 178)).resize((D, D), Image.LANCZOS)
mask = Image.new('L', (D * 4, D * 4), 0)
ImageDraw.Draw(mask).ellipse((0, 0, D * 4 - 1, D * 4 - 1), fill=255)
mask = mask.resize((D, D), Image.LANCZOS)
cx, cy = 960, 330
overlay(lambda d: d.ellipse((cx - D // 2 - 7, cy - D // 2 - 7, cx + D // 2 + 7, cy + D // 2 + 7), fill=(255, 255, 255, 70)))
img.paste(face, (cx - D // 2, cy - D // 2), mask)

name_font = ImageFont.truetype(FONT, 60)
btn_font = ImageFont.truetype(FONT, 40)
small = ImageFont.truetype(FONT, 30)
tiny = ImageFont.truetype(FONT, 24)
d = ImageDraw.Draw(img)
d.text((960, 520), 'Luc Sigouin', font=name_font, fill=(245, 245, 247), anchor='mm')

# Enter button.
overlay(lambda d: d.rounded_rectangle((ENTER[0], ENTER[1] + 6, ENTER[2], ENTER[3] + 6), radius=42, fill=(0, 0, 0, 90)))
d = ImageDraw.Draw(img)
d.rounded_rectangle(ENTER, radius=42, fill=ORANGE)
d.text((960 - 18, (ENTER[1] + ENTER[3]) // 2), 'Enter', font=btn_font, fill=(28, 18, 8), anchor='mm')
ax, ay = 960 + 70, (ENTER[1] + ENTER[3]) // 2
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
