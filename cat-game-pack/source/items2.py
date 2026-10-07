"""Extra room items (same scale: 1u = 1.6 cm, 1px vertical = 1.6 cm)."""
import math
from PIL import Image, ImageDraw
from iso import Spr, shade, mix, hexc, shear_left, shear_right, outline_img, CM
from items import SOFT, SISAL, SISAL2, GREEN1, GREEN2, GREEN3, SOIL, CREAMW, _leaf, _frame

WHITE = (255, 255, 255, 255)
DARK = hexc("3a302c")

def litter_box(color=hexc("b7d3c6"), hooded=True):
    """50 x 40 cm litter box (31 x 25 u)."""
    s = Spr()
    if hooded:
        s.box(-15, -12, 0, 30, 24, 7, shade(color, .9))
        s.box(-14, -11, 7, 28, 22, 14, color)
        s.box(-10, -8, 21, 20, 16, 2, mix(color, WHITE, .3))
        X, Y = s.P(-2, 11, 11)           # door on left face (plane y = 11)
        s.d.ellipse([X - 6, Y - 6, X + 4, Y + 5], fill=shade(color, .45))
        s.d.rectangle([X - 6, Y, X + 4, Y + 5], fill=shade(color, .45))
        s.box(10, 4, 23, 2, 2, 0.5, shade(color, .6))
    else:
        s.box(-15, -12, 0, 30, 24, 7, color)
        s.poly([(-13, -10, 7), (13, -10, 7), (13, 10, 7), (-13, 10, 7)], hexc("e8dcc4"))
        for (x, y) in ((-6, -2), (3, 4), (6, -5), (-2, 6)):
            X, Y = s.P(x, y, 7); s.set(X, Y, hexc("cdbf9f"))
    return s.finish()

def litter_scoop(color=hexc("b7d3c6")):
    img = Image.new("RGBA", (14, 7), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.line([(0, 6), (6, 3)], fill=shade(color, .8), width=2)
    d.polygon([(6, 1), (13, 0), (13, 5), (7, 5)], fill=color)
    for x in (8, 10, 12): d.line([(x, 1), (x, 4)], fill=shade(color, .6))
    s = Spr(20, 12, 0, 0); s.img.alpha_composite(img, (2, 2)); img, _ = s.finish()
    return img, (img.width // 2, img.height - 1)

def carrier(color=hexc("e3a6a6")):
    """Pet carrier 48 x 32 x 30 cm."""
    s = Spr()
    s.box(-15, -10, 0, 30, 20, 18, color)
    s.box(-12, -8, 18, 24, 16, 1, mix(color, WHITE, .35))
    # wire door on left face (plane y=10)
    for i in range(5):
        a = s.P(-10 + i * 4.5, 10, 3); b = s.P(-10 + i * 4.5, 10, 15)
        s.d.line([a, b], fill=hexc("6b6f78"))
    s.line((-11, 10, 3), (9, 10, 3), hexc("6b6f78")); s.line((-11, 10, 15), (9, 10, 15), hexc("6b6f78"))
    X, Y = s.P(0, 0, 20)
    s.d.arc([X - 6, Y - 6, X + 6, Y + 4], 180, 360, fill=shade(color, .55), width=2)
    return s.finish()

def tunnel(color=hexc("8fb2d9")):
    """Crinkle tunnel 90 cm long, 25 cm wide, along the x axis."""
    s = Spr()
    L, r = 56, 8
    hi = mix(color, WHITE, .35)
    for i in range(L, -1, -1):       # far end first
        X, Y = s.P(i - L / 2, 0, r)
        c = hi if (i // 4) % 2 else color
        c = shade(c, .9) if i > L / 2 else c
        s.d.ellipse([X - r * .7, Y - r, X + r * .7, Y + r], fill=c)
    X, Y = s.P(-L / 2, 0, r)
    s.d.ellipse([X - r * .55, Y - r + 2, X + r * .55, Y + r - 2], fill=shade(color, .35))
    return s.finish()

def cardboard_box():
    s = Spr()
    b, bl, bd = hexc("dea668"), hexc("f0c48a"), hexc("b8804a")
    s.poly([(-12, -10, 14), (-12, 10, 14), (-20, 10, 20), (-20, -10, 20)], bd)   # back-left flap
    s.poly([(-12, -10, 14), (12, -10, 14), (12, -18, 20), (-12, -18, 20)], bd)   # back-right flap
    s.box(-12, -10, 0, 24, 20, 14, b, b, bd)
    s.poly([(-11, -9, 14), (11, -9, 14), (11, 9, 14), (-11, 9, 14)], hexc("6e4e33"))
    s.poly([(-12, 10, 14), (12, 10, 14), (12, 18, 9), (-12, 18, 9)], bl)          # front flap
    s.poly([(12, -10, 14), (12, 10, 14), (19, 10, 10), (19, -10, 10)], shade(bl, .9))
    return s.finish()

def teepee(color=hexc("f2d9c4"), trim=hexc("d98f8f")):
    """Cat teepee ~70 cm tall."""
    s = Spr(200, 200, 100, 150)
    a = (0, 0, 44)
    s.poly([(14, -14, 0), (14, 14, 0), a], shade(color, .76))
    s.poly([(-14, 14, 0), (14, 14, 0), a], color)
    s.poly([(-2, 14, 0), (8, 14, 0), (3, 14, 26)], shade(color, .5))             # entrance
    s.poly([(-14, 14, 0), (14, 14, 0), (14, 14, 4), (-14, 14, 4)], trim)
    s.poly([(14, -14, 0), (14, 14, 0), (14, 14, 4), (14, -14, 4)], shade(trim, .8))
    for (x, y) in ((-3, -3), (3, -3), (3, 3), (-3, 3)):
        s.line((x * .2, y * .2, 44), (x, y, 54), hexc("9a7656"))
    return s.finish()

def sofa(color="blue"):
    """2-seat sofa 140 x 80 cm, seat 42 cm, back 80 cm. Long side along x, back against y=0 wall."""
    main, light = SOFT[color]
    s = Spr(300, 260, 150, 190)
    L, D = 88, 50
    s.box(0, 0, 0, L, D, 6, shade(main, .7))                         # plinth
    s.box(0, 0, 6, L, 14, 44, main)                                   # backrest
    s.box(0, 14, 6, L, D - 14, 16, main)                              # seat base
    s.box(8, 14, 22, (L - 16) / 2 - 1, D - 16, 6, mix(main, light, .35))
    s.box(L / 2 + 1, 14, 22, (L - 16) / 2 - 1, D - 16, 6, mix(main, light, .35))
    s.box(8, 6, 22, (L - 16) / 2 - 1, 8, 24, mix(main, light, .25))
    s.box(L / 2 + 1, 6, 22, (L - 16) / 2 - 1, 8, 24, mix(main, light, .25))
    s.box(0, 0, 6, 8, D, 28, main)                                    # arms
    s.box(L - 8, 0, 6, 8, D, 28, main)
    return s.finish()

def armchair(color="rose"):
    main, light = SOFT[color]
    s = Spr()
    W, D = 46, 46
    s.box(0, 0, 0, W, D, 6, shade(main, .7))
    s.box(0, 0, 6, W, 12, 42, main)
    s.box(0, 12, 6, W, D - 12, 16, main)
    s.box(8, 12, 22, W - 16, D - 14, 6, mix(main, light, .35))
    s.box(0, 0, 6, 8, D, 26, main)
    s.box(W - 8, 0, 6, 8, D, 26, main)
    return s.finish()

def side_table(color=hexc("e8d4b8")):
    """Round side table 42 cm wide, 50 cm tall."""
    s = Spr()
    s.cyl(0, 0, 0, 7, 2, shade(color, .8))
    s.cyl(0, 0, 2, 1.8, 27, shade(color, .7))
    s.cyl(0, 0, 29, 13, 2.5, color)
    return s.finish()

def table_lamp(shade_col=hexc("f6e7c8")):
    s = Spr()
    s.cyl(0, 0, 0, 4, 2, hexc("c9a27a"))
    s.cyl(0, 0, 2, 1, 10, hexc("a98a6a"))
    s.cyl(0, 0, 11, 6, 9, shade_col, side=(shade_col, shade(shade_col, .92), shade(shade_col, .8)))
    s.ell(0, 0, 20, 4, hexc("fff6d8"))
    return s.finish()

def floor_lamp(shade_col=hexc("f6e7c8")):
    s = Spr(200, 240, 100, 210)
    s.cyl(0, 0, 0, 7, 2, hexc("6b6157"))
    s.cyl(0, 0, 2, 1, 84, hexc("6b6157"))
    s.cyl(0, 0, 80, 9, 12, shade_col, side=(shade_col, shade(shade_col, .92), shade(shade_col, .8)))
    s.ell(0, 0, 92, 6, hexc("fff6d8"))
    return s.finish()

def fountain(color=hexc("f2f2f2")):
    """Water fountain 18 cm."""
    s = Spr()
    s.cyl(0, 0, 0, 8, 6, color)
    inn = s.ell(0, 0, 6, 6.5, hexc("5b8fc4"))
    s.cyl(0, 0, 6, 2.5, 4, mix(color, hexc("9cc6e4"), .3))
    X, Y = s.P(0, 0, 10)
    for (dx, dy) in ((-2, 1), (2, 1), (-3, 3), (3, 3)):
        s.set(X + dx, Y + dy, hexc("a9d4f5"))
    return s.finish()

def treat_jar(lid=hexc("e3a6a6")):
    s = Spr()
    glass = hexc("d6ebf2")
    s.cyl(0, 0, 0, 4.5, 11, glass, side=(hexc("e6f4f8"), glass, hexc("b9d6e0")))
    for (x, y) in [(-3, 3), (-1, 4), (1, 3), (3, 4), (-2, 6), (0, 5), (2, 6), (-1, 8), (1, 7)]:
        X, Y = s.P(0, 0, 0)
        s.set(X + x, Y - y, hexc("b8743e"))
    s.cyl(0, 0, 11, 4.8, 2, lid)
    return s.finish()

def feather_wand(feather=hexc("6fc0c0")):
    img = Image.new("RGBA", (34, 10), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.line([(0, 8), (22, 3)], fill=hexc("c9a27a"))
    d.line([(22, 3), (27, 6)], fill=hexc("9a9a9a"))
    for i, c in enumerate([feather, mix(feather, WHITE, .4), hexc("e8a0b4")]):
        d.ellipse([26 + i, 2 + i * 2, 33, 6 + i * 2], fill=c)
    s = Spr(40, 16, 0, 0); s.img.alpha_composite(img, (2, 2)); img, _ = s.finish()
    return img, (img.width // 2, img.height - 1)

def basket_bed(blanket="rose"):
    main, light = SOFT[blanket]
    s = Spr()
    w1, w2 = hexc("d4ac78"), hexc("b88c58")
    s.cyl(0, 0, 0, 15, 9, w1, side=(w1, shade(w1, .9), shade(w1, .78)), stripes=w2)
    inn = s.ell(0, 0, 9, 13, shade(w1, .6))
    s.ell(0, 0, 9, 13, light, dy_shift=2, clip=inn)
    s.ell(0, 0, 9, 9, mix(light, main, .35), dy_shift=3, clip=inn)
    return s.finish()

def aquarium(cab=hexc("e7e2da")):
    """60 cm tank on a cabinet."""
    s = Spr(220, 240, 110, 200)
    s.box(0, 0, 0, 38, 18, 40, cab)
    s.box(0, 0, 40, 38, 18, 24, hexc("bfe3ef"), hexc("a9d5e6"), hexc("8fc2d6"))
    s.poly([(0, 0, 58), (38, 0, 58), (38, 18, 58), (0, 18, 58)], hexc("7fb8d6"))
    s.box(0, 0, 64, 38, 18, 2, shade(cab, .7))
    s.poly([(2, 18, 41), (36, 18, 41), (36, 18, 44), (2, 18, 44)], hexc("e8d9a8"))   # sand
    for (x, z, c) in ((10, 50, hexc("f29a5a")), (24, 54, hexc("f2d35a")), (30, 47, hexc("e07a8a"))):
        X, Y = s.P(x, 18, z); s.set(X, Y, c); s.set(X + 1, Y, c); s.set(X - 1, Y, shade(c, .8))
    X, Y = s.P(6, 18, 44)
    s.d.line([(X, Y), (X + 1, Y - 9)], fill=GREEN2); s.d.line([(X + 3, Y), (X + 2, Y - 6)], fill=GREEN1)
    s.box(36, 6, 10, 0.5, 6, 2, shade(cab, .55))
    return s.finish()

def cactus(pot=hexc("e9978e")):
    s = Spr()
    s.cyl(0, 0, 0, 4, 6, pot)
    X, Y = s.P(0, 0, 6)
    g = hexc("6aa86a")
    s.d.rounded_rectangle([X - 2, Y - 14, X + 2, Y], 2, fill=g)
    s.d.rounded_rectangle([X - 6, Y - 10, X - 3, Y - 4], 1, fill=g)
    s.d.line([(X - 3, Y - 5), (X - 2, Y - 5)], fill=g)
    s.d.rounded_rectangle([X + 3, Y - 12, X + 6, Y - 6], 1, fill=g)
    s.d.point([(X, Y - 15)], fill=hexc("f29ab0"))
    s.d.line([(X - 1, Y - 12), (X - 1, Y - 2)], fill=shade(g, .8))
    return s.finish()

def book_stack():
    s = Spr()
    cols = [hexc("d98f8f"), hexc("8fb2d9"), hexc("e8d9a8"), hexc("9dbb8f")]
    z = 0
    for i, c in enumerate(cols):
        o = (i % 2) * 1.5
        s.box(-7 + o, -5 - o, z, 14, 10, 3, mix(c, WHITE, .6), c, shade(c, .8)); z += 3
    return s.finish()

def blanket(color="sage"):
    main, light = SOFT[color]
    s = Spr()
    s.box(-14, -10, 0, 28, 20, 2, light)
    for i in range(-12, 14, 6):
        s.poly([(i, -10, 2), (i + 3, -10, 2), (i + 3, 10, 2), (i, 10, 2)], mix(light, main, .45))
    return s.finish()

def bookshelf_full(color=hexc("c9a27a")):
    s = Spr(260, 260, 130, 200)
    W, D, H, t = 50, 18, 62, 3
    inner = mix(color, WHITE, .4)
    s.box(0, 0, 0, t, D, H, color)
    s.poly([(t, 0, 0), (W - t, 0, 0), (W - t, 0, H), (t, 0, H)], shade(inner, .75))
    bc = [hexc(c) for c in ("d98f8f", "8fb2d9", "e8d9a8", "9dbb8f", "b8addb", "f0b48a")]
    for k, z in enumerate((0, 20, 40)):
        s.box(t, 0, z, W - 2 * t, D, t, inner)
        x, i = t + 1, 0
        while x < W - t - 4:
            h = 11 + (i * 5 + k) % 5; w = 3 + (i + k) % 2
            if (i + k) % 5 == 3: x += 4; i += 1; continue
            c = bc[(i + k * 2) % len(bc)]
            s.box(x, 3, z + t, w, 11, h, c, shade(c, .9), shade(c, .75)); x += w; i += 1
    s.box(t, 0, H - t, W - 2 * t, D, t, inner)
    s.box(W - t, 0, 0, t, D, H, color)
    return s.finish()

def cat_steps_left(color=hexc("e8d4b8")):
    """Three floating cat steps mounted on the LEFT wall (anchor = wall base)."""
    s = Spr(200, 240, 100, 200)
    for (y, z) in ((40, 30), (22, 54), (4, 78)):
        s.box(0, y, z, 14, 16, 3, color)
        s.box(0, y + 6, z - 6, 2, 4, 6, shade(color, .6))
    return s.finish()

def cat_steps_right(color=hexc("e8d4b8")):
    s = Spr(200, 240, 100, 200)
    for (x, z) in ((40, 30), (22, 54), (4, 78)):
        s.box(x, 0, z, 16, 14, 3, color)
        s.box(x + 6, 0, z - 6, 4, 2, 6, shade(color, .6))
    return s.finish()

def window_perch_left(color="sage"):
    """Window hammock perch for the left wall (place under a window sill)."""
    main, light = SOFT[color]
    s = Spr()
    s.box(0, 0, 0, 16, 26, 2, light)
    s.box(0, 0, 2, 16, 2, 3, main); s.box(0, 24, 2, 16, 2, 3, main); s.box(14, 0, 2, 2, 26, 3, main)
    s.line((14, 2, 0), (2, 4, -10), hexc("8a8a8a")); s.line((14, 24, 0), (2, 22, -10), hexc("8a8a8a"))
    return s.finish()

# ---- flat wall art ----
def wall_clock(rim=hexc("8fb2d9")):
    img = Image.new("RGBA", (15, 15), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.ellipse([0, 0, 14, 14], fill=rim); d.ellipse([2, 2, 12, 12], fill=hexc("fbf7ef"))
    for (x, y) in ((7, 3), (11, 7), (7, 11), (3, 7)): d.point((x, y), fill=hexc("6b6157"))
    d.line([(7, 7), (7, 4)], fill=DARK); d.line([(7, 7), (9, 8)], fill=DARK)
    return img

def door(color=hexc("e8dcc8")):
    """Door 90 x 210 cm -> 56 x 131 px."""
    w, h = 56, 131
    img = Image.new("RGBA", (w + 6, h + 3), hexc("fbf6ee")); d = ImageDraw.Draw(img)
    d.rectangle([3, 3, w + 2, h + 2], fill=color)
    for (y0, y1) in ((10, 56), (66, 124)):
        d.rectangle([10, y0, w - 4, y1], outline=shade(color, .82))
    d.rectangle([w - 6, 66, w - 2, 68], fill=hexc("c9a27a"))
    return img

def cat_door(color=hexc("d9cfc3")):
    img = Image.new("RGBA", (18, 18), color); d = ImageDraw.Draw(img)
    d.rounded_rectangle([3, 3, 14, 15], 3, fill=shade(color, .7))
    d.rounded_rectangle([4, 4, 13, 14], 2, fill=hexc("b9d6e0"))
    d.line([(4, 5), (13, 5)], fill=shade(color, .6))
    return img

def wall_shelf_plants(board=hexc("c9a27a")):
    img = Image.new("RGBA", (30, 16), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rectangle([0, 13, 29, 15], fill=board)
    d.rectangle([3, 8, 8, 12], fill=hexc("f2d7c9")); d.ellipse([2, 3, 9, 9], fill=GREEN2)
    d.rectangle([13, 6, 15, 12], fill=hexc("d98f8f")); d.rectangle([16, 4, 18, 12], fill=hexc("8fb2d9")); d.rectangle([19, 7, 21, 12], fill=hexc("e8d9a8"))
    d.rectangle([24, 9, 27, 12], fill=hexc("eeeeee")); d.ellipse([23, 5, 28, 10], fill=GREEN1)
    return img

def garland(c1=hexc("f2b8c6"), c2=hexc("f4e1a0"), c3=hexc("a6c8e8")):
    img = Image.new("RGBA", (50, 12), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    pts = [(x, int(2 + 4 * math.sin(math.pi * x / 49))) for x in range(50)]
    d.line(pts, fill=hexc("8a7a72"))
    for i, x in enumerate(range(3, 48, 6)):
        y = pts[x][1]; c = (c1, c2, c3)[i % 3]
        d.polygon([(x - 2, y), (x + 2, y), (x, y + 5)], fill=c)
    return img

def wall_cat_name_sign(bg=hexc("f6e7c8")):
    """Little paw sign (no text) for over the bed."""
    img, d = _frame(20, 10, hexc("c9a27a"), bg)
    for x0 in (4, 12):
        d.rectangle([x0, 5, x0 + 2, 7], fill=hexc("b98a6a"))
        for (dx, dy) in ((-1, 3), (1, 2), (3, 2), (4, 3)): d.point((x0 + dx - 0, dy), fill=hexc("b98a6a"))
    return img
