"""Login screen for the phone-only rack monitor (1274x1040, the rack screen's aspect).

Same wallpaper and avatar as login_plate.py, minus the now-playing strip, so a big glowing
Enter button owns the screen. ENTER must match the tap ring in vybe/render-only.css.
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1274, 1040
WALL = '/Users/ls/Claude-Workspace/personal/vybe-workstation/revisions/realism-v2/source/textures/mountains.jpg'
FACE = '/Users/ls/Claude-Workspace/personal/sigouin-net/Sigouin-Hub/art/character/front.png'
FONT = '/Users/ls/Claude-Workspace/personal/sigouin-net/site/vybe/assets/inter-400.ttf'
OUT = '/Users/ls/Claude-Workspace/personal/sigouin-net/dev-render-only-src/login-rack.png'
ORANGE = (255, 122, 20)  # hotter than the desk plate: the render desaturates it
ENTER = (W // 2 - 400, 560, W // 2 + 400, 780)

wall = Image.open(WALL).convert('RGB')
x = (wall.width - W) // 2
wall = wall.crop((x, 110, x + W, 110 + H)).filter(ImageFilter.GaussianBlur(6))
img = Image.blend(wall, Image.new('RGB', (W, H), (12, 16, 24)), 0.45).convert('RGBA')

def layer(fn, blur=0):
    over = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    fn(ImageDraw.Draw(over))
    img.alpha_composite(over.filter(ImageFilter.GaussianBlur(blur)) if blur else over)

D, cx, cy = 210, W // 2, 205
face = Image.open(FACE).convert('RGB').crop((282, 8, 452, 178)).resize((D, D), Image.LANCZOS)
mask = Image.new('L', (D * 4, D * 4), 0)
ImageDraw.Draw(mask).ellipse((0, 0, D * 4 - 1, D * 4 - 1), fill=255)
mask = mask.resize((D, D), Image.LANCZOS)
layer(lambda d: d.ellipse((cx - D // 2 - 7, cy - D // 2 - 7, cx + D // 2 + 7, cy + D // 2 + 7), fill=(255, 255, 255, 70)))
img.paste(face, (cx - D // 2, cy - D // 2), mask)
ImageDraw.Draw(img).text((cx, 395), 'Luc Sigouin', font=ImageFont.truetype(FONT, 72), fill=(245, 245, 247), anchor='mm')

# Enter: amber halo, then the pill, then heavy dark text and arrow.
r = (ENTER[3] - ENTER[1]) // 2
halo = (ENTER[0] - 40, ENTER[1] - 40, ENTER[2] + 40, ENTER[3] + 40)
layer(lambda d: d.rounded_rectangle(halo, radius=r + 40, fill=(255, 120, 20, 200)), blur=38)
layer(lambda d: d.rounded_rectangle((ENTER[0], ENTER[1] + 10, ENTER[2], ENTER[3] + 10), radius=r, fill=(0, 0, 0, 110)), blur=6)
d = ImageDraw.Draw(img)
d.rounded_rectangle(ENTER, radius=r, fill=ORANGE, outline=(255, 214, 170), width=6)
mid = (ENTER[1] + ENTER[3]) // 2
ink = (28, 18, 8)
d.text((cx - 50, mid), 'Enter', font=ImageFont.truetype(FONT, 118), fill=ink, anchor='mm', stroke_width=3, stroke_fill=ink)
ax = cx + 190
d.line((ax - 44, mid, ax + 40, mid), fill=ink, width=14)
d.line((ax + 2, mid - 38, ax + 42, mid), fill=ink, width=14)
d.line((ax + 2, mid + 38, ax + 42, mid), fill=ink, width=14)
ImageDraw.Draw(img).text((cx, 900), 'Tap to enter the hub', font=ImageFont.truetype(FONT, 50), fill=(225, 228, 234), anchor='mm')

img.convert('RGB').save(OUT)
print('wrote', OUT)
