"""The LS avatar for the login screens: the hub's monogram (Sigouin-Hub/public/favicon.svg) in
white on the hub's dusk gradient, drawn as a circle so it reads like a lock-screen account picture."""
from PIL import Image, ImageDraw

# The monogram's two strokes in the favicon's 120-unit box: L, then S as cubic segments.
L = [(31, 30), (31, 86), (55, 86)]
S = [(88, 41), [(85, 34), (78, 31), (72, 31)], [(64, 31), (58, 36), (58, 44)], [(58, 52), (65, 55), (73, 57.5)],
     [(82, 60), (89, 64), (89, 73)], [(89, 82), (82, 88), (72.5, 88)], [(65, 88), (59.5, 84.5), (57, 79)]]
STOPS = [(0, (35, 29, 87)), (.65, (74, 49, 130)), (1, (242, 169, 138))]

def flatten(path, n=24):
    pts = [path[0]]
    for c1, c2, end in path[1:]:
        p0 = pts[-1]
        for i in range(1, n + 1):
            t = i / n; u = 1 - t
            pts.append(tuple(u**3 * a + 3 * u * u * t * b + 3 * u * t * t * c + t**3 * d for a, b, c, d in zip(p0, c1, c2, end)))
    return pts

def gradient(t):
    for (t0, c0), (t1, c1) in zip(STOPS, STOPS[1:]):
        if t <= t1:
            k = (t - t0) / (t1 - t0)
            return tuple(round(a + (b - a) * k) for a, b in zip(c0, c1))
    return STOPS[-1][1]

def avatar(D, stroke=9):
    """RGBA disc of diameter D, drawn 4x and scaled down for clean edges."""
    S4 = D * 4; k = S4 / 120
    grad = Image.new('RGB', (S4, S4))
    px = grad.load()
    for y in range(S4):
        for x in range(S4):
            px[x, y] = gradient((x + y) / (2 * S4))  # diagonal, like the favicon's x1=0 y1=0 x2=1 y2=1
    d = ImageDraw.Draw(grad)
    w = round(stroke * k)
    for line in (L, flatten(S)):
        pts = [(x * k, y * k) for x, y in line]
        d.line(pts, fill=(255, 255, 255), width=w)
        for x, y in pts:  # round brush at every vertex: round caps and seamless joints
            d.ellipse((x - w / 2, y - w / 2, x + w / 2, y + w / 2), fill=(255, 255, 255))
    mask = Image.new('L', (S4, S4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, S4 - 1, S4 - 1), fill=255)
    out = grad.convert('RGBA'); out.putalpha(mask)
    return out.resize((D, D), Image.LANCZOS)

if __name__ == '__main__':
    avatar(230).save('ls-avatar-preview.png'); print('wrote ls-avatar-preview.png')
