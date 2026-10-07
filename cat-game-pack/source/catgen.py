"""Original 32x32 pixel-art cat sprite sheet generator (cream with brown)."""
import math, json, os
from PIL import Image, ImageDraw

S = 32
GROUND = 29

# ---------- palette ----------
OUT   = (78, 54, 48, 255)
CREAM = (252, 240, 220, 255)
SHADE = (234, 214, 188, 255)
FAR   = (214, 190, 162, 255)
BROWN = (190, 140, 108, 255)
BRDK  = (158, 112, 86, 255)
PINK  = (242, 158, 160, 255)
BLUSH = (248, 196, 190, 255)
EYE   = (44, 32, 34, 255)
WHITE = (255, 255, 255, 255)
BOX   = (222, 166, 104, 255)
BOXL  = (240, 196, 138, 255)
BOXD  = (184, 128, 74, 255)
YARN  = (214, 84, 104, 255)
YARNL = (240, 136, 150, 255)


# ---------- colour options ----------
TIP, BACK, CAL2, PATTERN = CREAM, BROWN, (60, 54, 60, 255), None
_BASE = dict(OUT=OUT, CREAM=CREAM, SHADE=SHADE, FAR=FAR, BROWN=BROWN, BRDK=BRDK, EYE=EYE,
             BLUSH=BLUSH, TIP=CREAM, BACK=BROWN, CAL2=(60, 54, 60, 255), PATTERN=None)
def _c(*v): return tuple(v) + (255,)
PALETTES = {
    "cream":        {},
    "orange_tabby": dict(CREAM=_c(250, 214, 168), SHADE=_c(238, 190, 140), FAR=_c(218, 164, 112),
                         BROWN=_c(228, 134, 66), BRDK=_c(190, 100, 44), BACK=_c(228, 134, 66),
                         TIP=_c(250, 214, 168), OUT=_c(110, 58, 34), PATTERN="stripes"),
    "brown_tabby":  dict(CREAM=_c(222, 196, 164), SHADE=_c(202, 172, 138), FAR=_c(178, 146, 112),
                         BROWN=_c(150, 108, 76), BRDK=_c(96, 66, 46), BACK=_c(150, 108, 76),
                         TIP=_c(96, 66, 46), OUT=_c(64, 42, 30), PATTERN="stripes"),
    "grey":         dict(CREAM=_c(236, 238, 242), SHADE=_c(214, 217, 224), FAR=_c(186, 190, 200),
                         BROWN=_c(132, 140, 156), BRDK=_c(104, 110, 126), BACK=_c(132, 140, 156),
                         TIP=_c(132, 140, 156), OUT=_c(58, 60, 72)),
    "black":        dict(CREAM=_c(72, 68, 82), SHADE=_c(58, 54, 68), FAR=_c(46, 42, 56),
                         BROWN=_c(50, 46, 58), BRDK=_c(38, 34, 44), BACK=_c(50, 46, 58),
                         TIP=_c(50, 46, 58), OUT=_c(22, 18, 26), EYE=_c(222, 196, 70), BLUSH=_c(122, 84, 100)),
    "tuxedo":       dict(CREAM=_c(252, 252, 252), SHADE=_c(228, 230, 236), FAR=_c(200, 202, 212),
                         BROWN=_c(54, 50, 60), BRDK=_c(40, 36, 46), BACK=_c(54, 50, 60),
                         TIP=_c(252, 252, 252), OUT=_c(28, 24, 30), EYE=_c(70, 140, 90)),
    "white":        dict(CREAM=_c(255, 255, 255), SHADE=_c(234, 236, 242), FAR=_c(212, 214, 224),
                         BROWN=_c(240, 232, 222), BRDK=_c(214, 204, 192), BACK=_c(255, 255, 255),
                         TIP=_c(255, 255, 255), OUT=_c(110, 104, 112), EYE=_c(80, 130, 196)),
    "siamese":      dict(CREAM=_c(248, 238, 220), SHADE=_c(230, 216, 194), FAR=_c(196, 176, 156),
                         BROWN=_c(108, 78, 64), BRDK=_c(80, 56, 46), BACK=_c(234, 216, 192),
                         TIP=_c(108, 78, 64), OUT=_c(66, 46, 38), EYE=_c(70, 132, 206), PATTERN="points"),
    "calico":       dict(CREAM=_c(255, 252, 246), SHADE=_c(236, 230, 220), FAR=_c(212, 204, 192),
                         BROWN=_c(230, 148, 76), BRDK=_c(196, 112, 50), CAL2=_c(62, 56, 62),
                         TIP=_c(62, 56, 62), OUT=_c(70, 48, 40), PATTERN="calico"),
}

def apply_palette(name):
    g = globals(); g.update(_BASE); g.update(PALETTES[name])

def patch(x, y, part, cx=0):
    if PATTERN == "calico":
        if part == "earL": return CAL2
        if part == "earR": return BROWN
        if part == "tail": return CAL2 if (x // 3) % 2 else BROWN
        return CAL2 if x < cx else BROWN
    if part == "back": base = BACK
    else: base = BROWN
    if PATTERN == "stripes" and part in ("back", "cap", "tail"):
        k = x + y if part == "tail" else x
        if k % 3 == 0: return BRDK
    return base


class Canvas:
    def __init__(self):
        self.g = {}       # filled body pixels (get outlined)
        self.top = {}     # detail pixels drawn after outline

    def put(self, pts, color, layer="g"):
        d = self.g if layer == "g" else self.top
        for (x, y) in pts:
            if 0 <= x < S and 0 <= y < S:
                d[(x, y)] = color(x, y) if callable(color) else color

    def render(self):
        img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        px = img.load()
        for (x, y), c in self.g.items():
            px[x, y] = c
        for x in range(S):
            for y in range(S):
                if (x, y) in self.g:
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    if (x + dx, y + dy) in self.g:
                        px[x, y] = OUT
                        break
        for (x, y), c in self.top.items():
            if 0 <= x < S and 0 <= y < S:
                px[x, y] = c
        return img


# ---------- geometry ----------
def ellipse(cx, cy, rx, ry):
    return [(x, y) for x in range(S) for y in range(S)
            if ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1]

def tri(a, b, c):
    def sign(p, q, r):
        return (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1])
    out = []
    for x in range(S):
        for y in range(S):
            p = (x + .5, y + .5)
            d1, d2, d3 = sign(p, a, b), sign(p, b, c), sign(p, c, a)
            neg = d1 < 0 or d2 < 0 or d3 < 0
            pos = d1 > 0 or d2 > 0 or d3 > 0
            if not (neg and pos):
                out.append((x, y))
    return out

def rect(x0, y0, x1, y1):
    return [(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)]

def thick(points, w=2):
    """Polyline stamped with a w x w square."""
    out = set()
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        n = max(1, int(max(abs(x1 - x0), abs(y1 - y0)) * 2))
        for i in range(n + 1):
            t = i / n
            x = round(x0 + (x1 - x0) * t); y = round(y0 + (y1 - y0) * t)
            for dx in range(w):
                for dy in range(w):
                    out.add((x + dx, y + dy))
    return list(out)


# ---------- parts ----------
def draw_tail(c, pts):
    seg = thick(pts)
    tip = set(thick(pts[-2:]))
    c.put(seg, lambda x, y: TIP if (x, y) in tip else patch(x, y, 'tail'))

def draw_leg(c, hip, foot, near=True):
    c.put(thick([hip, foot]), CREAM if near else FAR)

def draw_body(c, cx, cy, rx, ry):
    def col(x, y):
        if y + .5 < cy - ry * 0.35:
            return patch(x, y, 'back', cx)
        if y + .5 > cy + ry * 0.45:
            return SHADE
        return CREAM
    c.put(ellipse(cx, cy, rx, ry), col)

def draw_head(c, hx, hy, eyes="open", ear_twitch=0, mouth=False, blush=True):
    """Cute near-frontal head; (hx, hy) = head centre."""
    lt = 1 if ear_twitch else 0
    # ears
    le = tri((hx - 5, hy - 1), (hx - 4 - lt, hy - 7 + lt), (hx - 0.5, hy - 3.5))
    re = tri((hx + 0.5, hy - 3.5), (hx + 4, hy - 7), (hx + 5, hy - 1))
    c.put(le, patch(0, 0, 'earL')); c.put(re, patch(0, 0, 'earR'))
    def col(x, y):
        if y + .5 < hy - 1.5 and not (hx - 1 <= x <= hx - 1 + 1 and y + .5 > hy - 4):
            return patch(x, y, 'cap', hx)
        return CREAM
    c.put(ellipse(hx, hy, 5.6, 4.6), col)
    # details (after outline)
    t = c.top
    t[(int(hx - 4 - lt), int(hy - 5 + lt))] = PINK
    t[(int(hx + 3), int(hy - 5))] = PINK
    ex1, ex2, ey = int(hx - 4), int(hx + 1), int(hy)
    if eyes == "open":
        for ex in (ex1, ex2):
            for (dx, dy) in ((0, 0), (1, 0), (0, 1), (1, 1)):
                t[(ex + dx, ey - 1 + dy)] = EYE
            t[(ex + 1, ey - 1)] = WHITE
    elif eyes == "closed":
        for ex in (ex1, ex2):
            t[(ex, ey)] = OUT; t[(ex + 1, ey)] = OUT
    elif eyes == "happy":
        for ex in (ex1, ex2):
            t[(ex, ey)] = OUT; t[(ex + 1, ey - 1)] = OUT; t[(ex + 2, ey)] = OUT if ex == ex1 else t.get((ex+2,ey), OUT)
    nx = int(hx - 1)
    t[(nx, ey + 1)] = PINK; t[(nx + 1, ey + 1)] = PINK
    if mouth:
        t[(nx, ey + 2)] = OUT; t[(nx + 1, ey + 2)] = OUT; t[(nx, ey + 3)] = PINK; t[(nx+1, ey + 3)] = PINK
    else:
        t[(nx - 1, ey + 2)] = OUT; t[(nx + 2, ey + 2)] = OUT
    if blush and eyes != "closed":
        t[(ex1 - 1, ey + 1)] = BLUSH; t[(ex2 + 2, ey + 1)] = BLUSH


# ---------- poses ----------
def stand(dy=0, hdy=0, ry=4.5, tail=None, eyes="open", legs=None, rx=8,
          bx=14, hx=23, ear=0, mouth=False, extra=None):
    c = Canvas()
    by = 21 + dy
    tail = tail or [(7, by - 1), (4, by - 4), (3, by - 8), (5, by - 11)]
    draw_tail(c, tail)
    if legs is None:
        legs = {"ff": (20, GROUND), "fn": (17, GROUND), "rf": (10, GROUND), "rn": (7, GROUND)}
    hipF, hipR = (bx + 4, by + 1), (bx - 5, by + 1)
    draw_leg(c, (hipF[0] + 2, hipF[1]), legs["ff"], near=False)
    draw_leg(c, (hipR[0] + 2, hipR[1]), legs["rf"], near=False)
    draw_body(c, bx, by, rx, ry)
    draw_leg(c, hipF, legs["fn"])
    draw_leg(c, hipR, legs["rn"])
    if extra: extra(c)
    draw_head(c, hx, 14 + dy + hdy, eyes, ear, mouth)
    return c.render()

def idle():
    frames = []
    sway = [0, 1, 1, 0]
    for i in range(4):
        s = sway[i]
        tail = [(7, 20), (4, 17), (3 - s, 13), (5 - s, 10)]
        frames.append(stand(ry=4.5 + (0.4 if i in (1, 2) else 0), hdy=1 if i in (1, 2) else 0,
                            tail=tail, eyes="closed" if i == 3 else "open"))
    return frames

def sit_frame(tail_tip=0, eyes="open", ear=0, hdy=0):
    c = Canvas()
    tail = [(9, 28), (5, 28), (2, 27), (1 + tail_tip, 24 - abs(tail_tip))]
    draw_tail(c, tail)
    c.put(thick([(16, 19), (16, GROUND)]), FAR)
    draw_body(c, 13, 22, 6.5, 6.8)
    c.put(ellipse(10, 25.5, 4.2, 3.5), CREAM)          # haunch
    c.put(rect(8, 28, 12, GROUND), CREAM)
    c.put(thick([(18, 19), (18, GROUND)]), CREAM)      # near front leg
    draw_head(c, 17, 12 + hdy, eyes, ear)
    return c.render()

def sit():
    return [sit_frame(0), sit_frame(1, ear=1), sit_frame(2), sit_frame(1, eyes="closed")]

def walk():
    frames = []
    for i in range(6):
        ph = i / 6 * 2 * math.pi
        def foot(base, p):
            off = 2.2 * math.sin(ph + p)
            lift = 1 if math.cos(ph + p) > 0.3 else 0
            return (round(base + off), GROUND - lift)
        legs = {"fn": foot(17, 0), "rf": foot(10, 0),
                "ff": foot(20, math.pi), "rn": foot(7, math.pi)}
        s = round(math.sin(ph))
        tail = [(7, 20), (4, 17), (3 + s, 13), (5 + s, 10)]
        frames.append(stand(legs=legs, hdy=1 if i % 3 == 1 else 0, tail=tail))
    return frames

def run():
    data = [  # dy, ff, fn, rf, rn
        (-2, (26, 25), (24, 26), (3, 25), (1, 24)),
        (-1, (25, 28), (23, 27), (5, 27), (3, 26)),
        (0,  (21, 29), (20, 29), (8, 28), (6, 29)),
        (0,  (17, 29), (16, 28), (13, 29), (11, 28)),
        (-1, (20, 27), (18, 28), (10, 29), (8, 29)),
        (-2, (24, 26), (22, 26), (6, 28), (4, 28)),
    ]
    frames = []
    for i, (dy, ff, fn, rf, rn) in enumerate(data):
        w = 1 if i % 2 else 0
        tail = [(6, 20 + dy), (3, 18 + dy - w), (1, 17 + dy + w)]
        frames.append(stand(dy=dy, ry=3.8, rx=9 if i != 3 else 7.5,
                            legs={"ff": ff, "fn": fn, "rf": rf, "rn": rn},
                            tail=tail, hx=24, mouth=(i == 0)))
    return frames

def sleep():
    frames = []
    for i in range(4):
        c = Canvas()
        b = 0.5 if i in (1, 2) else 0
        draw_body(c, 15, 24 - b / 2, 10, 5 + b)
        draw_head(c, 22, 23, eyes="closed", blush=False)
        draw_tail(c, [(5, 27), (9, 29), (15, 29), (19, 28)])
        img = c.render()
        # floating z
        px = img.load()
        zx, zy = 26 + (i % 2), 14 - 2 * i
        for (x, y) in [(0, 0), (1, 0), (2, 0), (3, 0), (2, 1), (1, 2), (0, 3), (1, 3), (2, 3), (3, 3)]:
            if i != 0:
                px[zx + x - 1, zy + y] = BRDK
        frames.append(img)
    return frames

def jump():
    frames = []
    # crouch
    frames.append(stand(dy=2, ry=4.2, legs={"ff": (21, GROUND), "fn": (18, GROUND),
                                            "rf": (11, GROUND), "rn": (8, GROUND)}, ear=1))
    # takeoff: stretched, rear legs pushing
    frames.append(stand(dy=-1, rx=9, ry=3.8, hx=24, legs={"ff": (25, 22), "fn": (23, 23),
                        "rf": (5, GROUND), "rn": (3, GROUND - 1)},
                        tail=[(6, 19), (3, 21), (1, 23)]))
    # rising
    frames.append(stand(dy=-4, rx=8.5, ry=4, legs={"ff": (25, 21), "fn": (23, 22),
                        "rf": (5, 25), "rn": (3, 24)}, tail=[(6, 16), (3, 18), (1, 21)]))
    # peak tuck
    frames.append(stand(dy=-5, rx=7.5, ry=4.5, legs={"ff": (20, 22), "fn": (18, 22),
                        "rf": (10, 22), "rn": (8, 22)}, tail=[(7, 15), (4, 13), (3, 10)], mouth=True))
    # falling: front legs reach down
    frames.append(stand(dy=-3, rx=8.5, ry=4, legs={"ff": (22, 27), "fn": (20, 27),
                        "rf": (7, 23), "rn": (5, 22)}, tail=[(7, 17), (4, 14), (3, 10)]))
    # land
    frames.append(stand(dy=2, ry=4.2, legs={"ff": (22, GROUND), "fn": (19, GROUND),
                                            "rf": (10, GROUND), "rn": (7, GROUND)}))
    return frames

def draw_box(img):
    d = img.load()
    c = Canvas()
    c.put(tri((5, 19), (2, 15), (11, 19)), BOXD)        # left flap
    c.put(tri((21, 19), (30, 15), (27, 19)), BOXD)      # right flap
    c.put(rect(5, 19, 26, 29), lambda x, y: BOXL if y == 19 else (BOXD if x > 21 else BOX))
    box = c.render()
    out = img.copy()
    out.alpha_composite(box)
    p = out.load()
    for x in range(12, 20):                              # tape stripe
        pass
    for y in range(21, 29):
        p[15, y] = BOXL; p[16, y] = BOXL
    return out

def box():
    frames = []
    spec = [(21, "open", 0, False), (17, "open", 0, False), (14, "open", 0, True),
            (14, "closed", 0, True), (14, "open", 1, True), (17, "open", 1, False)]
    for hy, eyes, ear, paws in spec:
        c = Canvas()
        draw_head(c, 16, hy, eyes, ear)
        img = c.render()
        img = draw_box(img)
        if paws:
            c2 = Canvas()
            c2.put(rect(10, 18, 12, 19) + rect(19, 18, 21, 19), CREAM)
            p = c2.render()
            img.alpha_composite(p)
            q = img.load()
            q[11, 18] = SHADE; q[20, 18] = SHADE
        frames.append(img)
    return frames

def play():
    frames = []
    ball_x = [27, 27, 27, 28, 28, 27]
    paws = [(17, GROUND), (21, 23), (25, 25), (26, 27), (22, 25), (17, GROUND)]
    for i in range(6):
        bx = ball_x[i]
        def yarn(c, bx=bx, i=i):
            pass
        img = stand(dy=1, legs={"ff": (20, GROUND), "fn": paws[i], "rf": (10, GROUND), "rn": (7, GROUND)},
                    hdy=1 if i in (2, 3) else 0, ear=1 if i == 1 else 0, mouth=(i == 3))
        c = Canvas()
        c.put(ellipse(bx + 0.5, 26.5, 2.4, 2.4),
              lambda x, y: YARNL if (x + y) % 3 == 0 else YARN)
        ball = c.render()
        img.alpha_composite(ball)
        frames.append(img)
    return frames


ANIMS = [("idle", idle, 6), ("sit", sit, 4), ("walk", walk, 10), ("run", run, 12),
         ("sleep", sleep, 3), ("jump", jump, 10), ("box", box, 5), ("play", play, 8)]

def build(outdir):
    os.makedirs(outdir, exist_ok=True)
    rows = [(n, f(), fps) for n, f, fps in ANIMS]
    cols = max(len(fr) for _, fr, _ in rows)
    sheet = Image.new("RGBA", (cols * S, len(rows) * S), (0, 0, 0, 0))
    meta = {"frameWidth": S, "frameHeight": S, "columns": cols, "rows": len(rows),
            "image": "cat_spritesheet.png", "animations": {}}
    for r, (name, frames, fps) in enumerate(rows):
        meta["animations"][name] = {"row": r, "frames": len(frames), "fps": fps,
                                    "loop": name not in ("jump",),
                                    "rects": [[i * S, r * S, S, S] for i in range(len(frames))]}
        for i, f in enumerate(frames):
            sheet.alpha_composite(f, (i * S, r * S))
    sheet.save(f"{outdir}/cat_spritesheet.png")
    sheet.resize((sheet.width * 4, sheet.height * 4), Image.NEAREST).save(f"{outdir}/cat_spritesheet_4x.png")
    with open(f"{outdir}/cat_spritesheet.json", "w") as fh:
        json.dump(meta, fh, indent=2)
    return rows, sheet

if __name__ == "__main__":
    import sys
    build(sys.argv[1] if len(sys.argv) > 1 else "out")
