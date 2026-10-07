"""2:1 isometric pixel-art helpers shared by every room item.

SCALE (keep everything consistent with the 32x32 cat):
  1 world unit (u) = 1.6 cm.  x/y axes: 1u -> (+/-1px, +0.5px) on screen.  z: 1u -> 1px up.
  A floor tile (32x16 px diamond) = 16u x 16u = ~26 cm square.
  The cat (sitting ~22px tall, ~20px long) is ~35-45 cm, so a 60 cm bed is 38u wide, a 240 cm
  room is 150u, a 75 cm window is 47u, etc.
"""
import math
from PIL import Image, ImageDraw

CM = 1 / 1.6  # world units per centimetre


def shade(c, f):
    return tuple(max(0, min(255, int(v * f))) for v in c[:3]) + (255,)

def mix(a, b, t):
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3)) + (255,)

def hexc(h):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)


class Spr:
    """A drawing surface. World origin (0,0,0) projects to (ox, oy)."""

    def __init__(self, w=260, h=260, ox=130, oy=190):
        self.img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        self.px = self.img.load()
        self.d = ImageDraw.Draw(self.img)
        self.ox, self.oy = ox, oy

    def P(self, x, y, z=0):
        return (self.ox + x - y, self.oy + (x + y) / 2 - z)

    def set(self, X, Y, c):
        X, Y = int(X), int(Y)
        if 0 <= X < self.img.width and 0 <= Y < self.img.height:
            self.px[X, Y] = c

    # ---- flat polygons in world space ----
    def poly(self, pts, c):
        self.d.polygon([tuple(round(v) for v in self.P(*p)) for p in pts], fill=c)

    def box(self, x, y, z, dx, dy, dz, top, left=None, right=None):
        left = left or shade(top, 0.88)
        right = right or shade(top, 0.74)
        x1, y1, z1 = x + dx, y + dy, z + dz
        self.poly([(x, y1, z), (x1, y1, z), (x1, y1, z1), (x, y1, z1)], left)    # face y=y1
        self.poly([(x1, y, z), (x1, y1, z), (x1, y1, z1), (x1, y, z1)], right)   # face x=x1
        self.poly([(x, y, z1), (x1, y, z1), (x1, y1, z1), (x, y1, z1)], top)

    # ---- ellipses / cylinders (per-pixel, crisp) ----
    def _ell_pixels(self, cx, cy, z, r, dy_shift=0):
        X0, Y0 = self.P(cx, cy, z)
        Y0 += dy_shift
        rx = r * math.sqrt(2); ry = rx / 2
        out = set()
        for X in range(int(X0 - rx) - 1, int(X0 + rx) + 2):
            dx = X + .5 - X0
            if abs(dx) > rx:
                continue
            e = ry * math.sqrt(max(0, 1 - (dx / rx) ** 2))
            for Y in range(int(Y0 - e) - 1, int(Y0 + e) + 2):
                if abs(Y + .5 - Y0) <= e:
                    out.add((X, Y))
        return out

    def ell(self, cx, cy, z, r, c, dy_shift=0, clip=None):
        pts = self._ell_pixels(cx, cy, z, r, dy_shift)
        if clip is not None:
            pts &= clip
        for X, Y in pts:
            self.set(X, Y, c(X, Y) if callable(c) else c)
        return pts

    def cyl(self, cx, cy, z, r, h, top, side=None, stripes=None, top_fn=None):
        """side = (light, mid, dark). stripes = second colour for 2px horizontal bands."""
        side = side or (shade(top, 0.95), shade(top, 0.84), shade(top, 0.70))
        X0, Y0 = self.P(cx, cy, z)
        Y1 = Y0 - h
        rx = r * math.sqrt(2); ry = rx / 2
        for X in range(int(X0 - rx) - 1, int(X0 + rx) + 2):
            dx = X + .5 - X0
            if abs(dx) > rx:
                continue
            t = dx / rx
            e = ry * math.sqrt(max(0, 1 - t * t))
            k = 0 if t < -0.35 else (1 if t < 0.4 else 2)
            for Y in range(int(Y1) - 1, int(Y0 + e) + 2):
                yc = Y + .5
                if Y1 <= yc <= Y0 + e:
                    c = side[k]
                    if stripes and (int(yc - Y1 - e + 100) // 2) % 2:
                        c = shade(stripes, (1.0, 0.86, 0.72)[k])
                    self.set(X, Y, c)
        return self.ell(cx, cy, z + h, r, top_fn or top)

    def bowl(self, cx, cy, z, r, h, rim, inner, content=None, depth=2, content_fn=None):
        self.cyl(cx, cy, z, r, h, rim)
        inn = self.ell(cx, cy, z + h, r - 1.6, inner)
        if content or content_fn:
            self.ell(cx, cy, z + h, r - 1.6, content_fn or content, dy_shift=depth, clip=inn)

    def line(self, a, b, c, w=1):
        A, B = self.P(*a), self.P(*b)
        self.d.line([tuple(round(v) for v in A), tuple(round(v) for v in B)], fill=c, width=w)

    # ---- finish ----
    def outline(self, f=0.55, alpha_min=1):
        src = self.img.copy(); sp = src.load()
        W, H = src.size
        for x in range(W):
            for y in range(H):
                if sp[x, y][3] >= alpha_min:
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < W and 0 <= ny < H and sp[nx, ny][3] > 200:
                        self.px[x, y] = shade(sp[nx, ny], f)
                        break
        return self

    def finish(self, outline=True):
        """Outline, crop. Returns (image, anchor) where anchor = world origin in the crop."""
        if outline:
            self.outline()
        bb = self.img.getbbox()
        img = self.img.crop(bb)
        return img, (self.ox - bb[0], self.oy - bb[1])


# ---- wall items: draw flat, then shear onto a wall ----
def shear_right(flat):
    """Flat art -> right-hand back wall (runs down-right at 2:1)."""
    w, h = flat.size
    out = Image.new("RGBA", (w, h + (w + 1) // 2), (0, 0, 0, 0))
    fp, op = flat.load(), out.load()
    for X in range(w):
        for Y in range(h):
            op[X, Y + X // 2] = fp[X, Y]
    return out

def shear_left(flat):
    """Flat art -> left-hand back wall (runs down-left at 2:1)."""
    m = flat.transpose(Image.FLIP_LEFT_RIGHT)
    return shear_right(m).transpose(Image.FLIP_LEFT_RIGHT)

def outline_img(img, f=0.55):
    s = Spr(img.width + 2, img.height + 2, 0, 0)
    s.img.alpha_composite(img, (1, 1))
    s.outline(f)
    return s.img.crop(s.img.getbbox())
