"""Original isometric room items for the cat game. All sizes in world units (1u = 1.6 cm)."""
import math
from PIL import Image, ImageDraw
from iso import Spr, shade, mix, hexc, shear_left, shear_right, outline_img, CM

# ---------------- shared palettes ----------------
SOFT = {   # fabric colours: (main, light)
    "blue":     (hexc("6f9ac4"), hexc("dfe9f3")),
    "grey":     (hexc("8d8f96"), hexc("e6e6e8")),
    "rose":     (hexc("c98a8d"), hexc("f4dcdc")),
    "sage":     (hexc("7f9a72"), hexc("dde6cf")),
    "lavender": (hexc("8f86b8"), hexc("e6e1f6")),
    "teal":     (hexc("5f9ea0"), hexc("cfe7e6")),
}
WOOD  = hexc("c9a27a")
OAK   = hexc("a97f58")
CREAMW = hexc("f3e8d6")
SISAL = hexc("d9b98a")
SISAL2 = hexc("b8935f")
GREEN1, GREEN2, GREEN3 = hexc("2f7a5a"), hexc("3f9a6e"), hexc("6cc08e")
SOIL = hexc("5a4033")


# ================= FLOOR ITEMS =================
def cat_bed(color="blue"):
    """Round bolster bed, 60 cm across (cat curls up inside)."""
    main, light = SOFT[color]
    s = Spr()
    r = 30 * CM / 1  # radius 30cm -> ~19u
    s.cyl(0, 0, 0, r, 7, mix(main, light, .25), side=(main, shade(main, .9), shade(main, .76)))
    # bolster highlight along the back arc
    top = s._ell_pixels(0, 0, 7, r)
    hi = s._ell_pixels(0, 0, 7, r - 2.2, dy_shift=-1.2)
    for p in top - hi:
        s.set(*p, mix(main, light, .45))
    inner = s.ell(0, 0, 7, r - 4.5, shade(main, .72))
    s.ell(0, 0, 7, r - 4.5, light, dy_shift=3, clip=inner)          # cushion
    s.ell(0, 0, 7, r - 7.5, mix(light, main, .12), dy_shift=4, clip=inner)
    return s.finish()

def scratch_post(base=CREAMW):
    """70 cm sisal post on a round base."""
    s = Spr()
    s.cyl(0, 0, 0, 12, 3, base)
    s.cyl(0, 0, 3, 3.2, 40, SISAL, side=(SISAL, shade(SISAL, .86), shade(SISAL, .72)), stripes=SISAL2)
    s.cyl(0, 0, 43, 3.8, 3, mix(base, (255, 255, 255, 255), .3))
    # dangling toy
    X, Y = s.P(0, 0, 43)
    s.d.line([(X + 4, Y - 1), (X + 9, Y + 10)], fill=shade(base, .6))
    s.d.ellipse([X + 7, Y + 9, X + 11, Y + 13], fill=hexc("e07a8a"))
    return s.finish()

def cat_tree(plat=hexc("f5f3ee")):
    """Three-level tower, ~150 cm. Staggered square platforms + sisal posts + pom-pom."""
    s = Spr(260, 300, 130, 250)
    side = (SISAL, shade(SISAL, .86), shade(SISAL, .72))
    post = lambda x, y, z, h: s.cyl(x, y, z, 2.8, h, SISAL, side=side, stripes=SISAL2)
    s.box(-16, -16, 0, 32, 32, 4, plat)                 # base
    post(-9, -9, 4, 62)                                 # tall back post
    post(8, 8, 4, 30)                                   # short front post
    s.box(-2, -2, 34, 20, 20, 3, plat)                  # level 1 (front)
    s.box(-20, -20, 66, 22, 22, 3, plat)                # level 2 (back)
    post(-9, -9, 69, 24)
    s.box(-17, -17, 93, 18, 18, 3, plat)                # top
    s.ell(-8, -8, 96, 6, shade(plat, .86))              # top dip
    X, Y = s.P(2, -20, 66)                              # pom-pom hanging off level 2
    s.d.line([(X, Y), (X, Y + 13)], fill=shade(plat, .55))
    s.d.ellipse([X - 2, Y + 12, X + 2, Y + 16], fill=hexc("f0f0f0"))
    return s.finish()

def scratcher(stripe=hexc("e08e8e")):
    """Small 65 cm scratcher: square base, striped post, square top."""
    s = Spr()
    s.box(-12, -12, 0, 24, 24, 3, mix(stripe, (255, 255, 255, 255), .55))
    s.cyl(0, 0, 3, 4, 34, CREAMW, stripes=stripe)
    s.box(-10, -10, 37, 20, 20, 3, mix(stripe, (255, 255, 255, 255), .55))
    return s.finish()

def perch(top=hexc("f3e3a6")):
    """Two-level round perch, 90 cm."""
    s = Spr()
    post = hexc("d79f8c")
    s.cyl(0, 0, 0, 10, 3, top)
    s.cyl(0, 0, 3, 2.6, 50, post)
    s.cyl(0, 0, 26, 9, 3, top)
    s.cyl(0, 0, 29, 2.6, 24, post)
    s.cyl(0, 0, 53, 10, 3, top)
    return s.finish()

def condo(body=hexc("efe3cf")):
    """Cube condo with entry hole and a lookout perch."""
    s = Spr(260, 260, 130, 210)
    s.box(-14, -14, 0, 30, 26, 26, body)
    # entrance hole on left face (plane y = 12)
    X, Y = s.P(-1, 12, 13)
    s.d.ellipse([X - 7, Y - 8, X + 5, Y + 6], fill=hexc("4a3f3a"))
    s.d.ellipse([X - 5, Y - 6, X + 3, Y + 4], fill=hexc("3a302c"))
    s.cyl(8, -8, 26, 2.6, 28, SISAL, side=(SISAL, shade(SISAL, .86), shade(SISAL, .72)), stripes=SISAL2)
    s.cyl(8, -8, 54, 10, 3, body)
    s.ell(8, -8, 57, 7, shade(body, .88))
    return s.finish()

def shelf(color=hexc("e7a98f")):
    """Open 4-tier shelf, 80 x 30 x 100 cm (long side along x)."""
    s = Spr(260, 260, 130, 200)
    W, D, H, t = 50, 18, 62, 3
    inner = mix(color, (255, 255, 255, 255), .55)
    s.box(0, 0, 0, t, D, H, color)                      # far side panel
    s.poly([(t, 0, 0), (W - t, 0, 0), (W - t, 0, H), (t, 0, H)], shade(inner, .8))  # back
    for z in (0, 20, 40):
        s.box(t, 0, z, W - 2 * t, D, t, inner)
    s.box(t, 0, H - t, W - 2 * t, D, t, inner)
    s.box(W - t, 0, 0, t, D, H, color)                  # near side panel
    return s.finish()

def stool(color=hexc("dde3ea")):
    """Padded stool, 40 cm wide x 45 cm tall."""
    s = Spr()
    leg = shade(color, .55)
    for (x, y) in ((-8, -8), (8, -8), (-8, 8), (8, 8)):
        if (x, y) != (8, 8):
            s.box(x - 1, y - 1, 0, 2, 2, 22, leg)
    s.cyl(0, 0, 22, 12.5, 5, color)
    s.box(7, 7, 0, 2, 2, 22, leg)
    return s.finish()

def ottoman(color="teal"):
    main, light = SOFT[color]
    s = Spr()
    s.cyl(0, 0, 0, 10.5, 12, mix(main, light, .35), side=(main, shade(main, .9), shade(main, .76)))
    s.ell(0, 0, 12, 6, mix(main, light, .5))
    X, Y = s.P(0, 0, 12)
    s.set(X, Y, shade(main, .7))
    return s.finish()

def rug(color="sage"):
    main, light = SOFT[color]
    s = Spr(300, 200, 150, 100)
    s.ell(0, 0, 0, 44, main)
    s.ell(0, 0, 0, 40, light)
    s.ell(0, 0, 0, 30, mix(light, main, .25))
    s.ell(0, 0, 0, 26, light)
    return s.finish(outline=False)

def floor_cushion(color="lavender"):
    main, light = SOFT[color]
    s = Spr()
    s.cyl(0, 0, 0, 9, 4, mix(main, light, .3), side=(main, shade(main, .9), shade(main, .78)))
    s.ell(0, 0, 4, 4, mix(main, light, .55))
    return s.finish()


# ---- plants ----
def _leaf(d, x, y, ang, ln, wd, c, rib):
    a = math.radians(ang)
    tx, ty = x + math.cos(a) * ln, y - math.sin(a) * ln
    mx, my = x + math.cos(a) * ln * .45, y - math.sin(a) * ln * .45
    nx, ny = -math.sin(a) * wd, -math.cos(a) * wd
    d.polygon([(x, y), (mx + nx, my + ny), (tx, ty), (mx - nx, my - ny)], fill=c)
    d.line([(x, y), (mx + (tx - mx) * .6, my + (ty - my) * .6)], fill=rib)

def big_plant(pot=hexc("3b4466")):
    """Fiddle-leaf style plant, ~120 cm."""
    s = Spr(200, 240, 100, 200)
    s.cyl(0, 0, 0, 8, 16, pot)
    s.ell(0, 0, 16, 6.4, SOIL)
    X, Y = s.P(0, 0, 16)
    trunk = hexc("5b4232")
    s.d.line([(X, Y), (X, Y - 52)], fill=trunk, width=2)
    leaves = [(-10, 150, 13, 5, GREEN1), (-14, 30, 13, 5, GREEN1), (-22, 160, 14, 5, GREEN2),
              (-26, 25, 14, 5, GREEN2), (-34, 145, 13, 5, GREEN1), (-38, 40, 14, 5, GREEN2),
              (-45, 120, 12, 5, GREEN2), (-48, 60, 12, 5, GREEN1), (-52, 95, 11, 4, GREEN3)]
    for dy, ang, ln, wd, c in leaves:
        _leaf(s.d, X + .5, Y + dy, ang, ln, wd, c, shade(c, .7))
    return s.finish()

def small_plant(pot=hexc("f2d7c9")):
    s = Spr()
    s.cyl(0, 0, 0, 4.5, 7, pot)
    X, Y = s.P(0, 0, 7)
    for (dx, dy, r, c) in ((-3, -2, 3, GREEN1), (3, -2, 3, GREEN1), (0, -5, 3.5, GREEN2),
                           (-2, -4, 2, GREEN3), (2, -7, 1.6, GREEN3)):
        s.d.ellipse([X + dx - r, Y + dy - r, X + dx + r, Y + dy + r], fill=c)
    return s.finish()


# ---- bowls, food, toys ----
BOWL_COLS = {"sky": hexc("9cc6e4"), "butter": hexc("e8d9a8"), "blush": hexc("e2a9a6"),
             "mint": hexc("a6d3bb"), "lilac": hexc("b8addb"), "white": hexc("eeeeee")}

def bowl(color="sky", fill="kibble"):
    """16 cm bowl."""
    s = Spr()
    rim = BOWL_COLS[color]
    if fill == "kibble":
        kib = hexc("b8743e")
        fn = lambda X, Y: hexc("e0a060") if (X * 3 + Y * 5) % 7 == 0 else (hexc("8f5530") if (X + Y * 2) % 5 == 0 else kib)
        s.bowl(0, 0, 0, 6.5, 4, rim, shade(rim, .7), content_fn=fn, depth=1)
    elif fill == "water":
        s.bowl(0, 0, 0, 6.5, 4, rim, shade(rim, .7), hexc("5b8fc4"), depth=1)
        X, Y = s.P(0, 0, 4)
        s.set(X - 2, Y, hexc("a9cdf0")); s.set(X - 1, Y, hexc("a9cdf0"))
    else:
        s.bowl(0, 0, 0, 6.5, 4, rim, shade(rim, .7), shade(rim, .85), depth=2)
    return s.finish()

def double_feeder(color="sky"):
    s = Spr()
    rim = BOWL_COLS[color]
    s.box(-8, -14, 0, 16, 28, 3, mix(rim, (255, 255, 255, 255), .4))
    kib = hexc("b8743e")
    s.bowl(0, -6, 3, 6, 3, rim, shade(rim, .7), kib, depth=1)
    s.bowl(0, 7, 3, 6, 3, rim, shade(rim, .7), hexc("5b8fc4"), depth=1)
    return s.finish()

def food_bag(color=hexc("e9c48f")):
    s = Spr()
    s.box(-6, -3, 0, 12, 6, 17, color)
    s.box(-6, -3, 17, 12, 6, 3, shade(color, 1.08))
    s.box(-6, -1, 20, 12, 2, 1, shade(color, .9))
    # paw print on left face (plane y = 3)
    X, Y = s.P(0, 3, 9)
    paw = hexc("6b4a3a")
    for (dx, dy) in ((-1, 0), (0, 0), (1, 0), (-1, 1), (0, 1), (1, 1), (0, 2)):
        s.set(X + dx - 1, Y + dy, paw)
    for (dx, dy) in ((-3, -2), (-1, -3), (1, -3), (3, -2)):
        s.set(X + dx - 1, Y + dy + 1, paw)
    return s.finish()

def food_can(label=hexc("8fb5d9")):
    s = Spr()
    s.cyl(0, 0, 0, 3.5, 3, hexc("d7d9de"), side=(label, shade(label, .88), shade(label, .74)))
    return s.finish()

def yarn_ball(color=hexc("d65a74")):
    img = Image.new("RGBA", (9, 9), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.ellipse([0, 0, 8, 8], fill=color)
    d.arc([1, -2, 11, 7], 120, 200, fill=shade(color, .7))
    d.arc([-2, 2, 8, 11], 280, 360, fill=mix(color, (255, 255, 255, 255), .4))
    d.point([(6, 1), (5, 2)], fill=mix(color, (255, 255, 255, 255), .5))
    d.line([(8, 7), (11, 8)], fill=shade(color, .8))
    s = Spr(20, 20, 0, 0); s.img.alpha_composite(img, (2, 2))
    img, _ = s.finish()
    return img, (img.width // 2 - 1, img.height - 1)

def fish_toy(stripes=("f2b8c6", "a6c8e8", "f4e1a0")):
    img = Image.new("RGBA", (18, 8), (0, 0, 0, 0)); px = img.load()
    cols = [hexc(c) for c in stripes]
    for x in range(14):
        h = int(3.4 * math.sin(math.pi * (x + 1) / 15)) + 1
        for y in range(4 - h, 4 + h):
            px[x, y] = cols[(x // 3) % len(cols)]
    for i, (x0) in enumerate(range(13, 18)):
        for y in range(4 - (i + 1) // 2 - 1, 4 + (i + 1) // 2 + 1):
            px[x0, y] = hexc("efe6d8")
    px[2, 3] = hexc("3a3030")
    s = Spr(24, 14, 0, 0); s.img.alpha_composite(img, (2, 3))
    img, _ = s.finish()
    return img, (img.width // 2, img.height - 1)

def mouse_toy(color=hexc("b9a79a")):
    img = Image.new("RGBA", (16, 8), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.line([(0, 6), (3, 5), (5, 6)], fill=shade(color, .7))
    d.ellipse([4, 2, 13, 7], fill=color)
    d.ellipse([9, 0, 12, 3], fill=hexc("e8b4b4"))
    d.point([(13, 5)], fill=hexc("e88a9a")); d.point([(11, 4)], fill=hexc("2e2626"))
    s = Spr(22, 14, 0, 0); s.img.alpha_composite(img, (2, 3))
    img, _ = s.finish()
    return img, (img.width // 2, img.height - 1)

def ball(color=hexc("7fb3d5")):
    img = Image.new("RGBA", (7, 7), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.ellipse([0, 0, 6, 6], fill=color)
    d.point([(2, 1), (1, 2)], fill=mix(color, (255, 255, 255, 255), .6))
    d.line([(1, 4), (5, 4)], fill=shade(color, .75))
    s = Spr(12, 12, 0, 0); s.img.alpha_composite(img, (2, 2))
    img, _ = s.finish()
    return img, (img.width // 2, img.height - 1)


# ================= WALL ITEMS (flat art, sheared) =================
def _frame(w, h, frame, mat=hexc("f7f2ea")):
    img = Image.new("RGBA", (w, h), frame); d = ImageDraw.Draw(img)
    d.rectangle([1, 1, w - 2, h - 2], fill=mat)
    return img, d

def art_cat(frame=hexc("8a7a72")):
    """Portrait of our own cream & brown cat."""
    img, d = _frame(16, 20, frame, hexc("cfe3ef"))
    cream, brown, out = hexc("fcf0dc"), hexc("be8c6c"), hexc("4e3630")
    d.polygon([(3, 9), (4, 4), (7, 7)], fill=brown); d.polygon([(8, 7), (11, 4), (12, 9)], fill=brown)
    d.ellipse([3, 6, 12, 15], fill=cream)
    d.rectangle([4, 6, 11, 8], fill=brown); d.rectangle([7, 6, 8, 9], fill=cream)
    d.point([(5, 11), (10, 11)], fill=out); d.point([(7, 12), (8, 12)], fill=hexc("f29ea0"))
    d.rectangle([3, 15, 12, 18], fill=cream)
    return img

def art_heart(frame=hexc("7c8aa8"), heart=hexc("d97a8a")):
    img, d = _frame(12, 15, frame, hexc("f3ecf2"))
    for (x, y) in [(3, 5), (4, 5), (7, 5), (8, 5), (2, 6), (3, 6), (4, 6), (5, 6), (6, 6), (7, 6), (8, 6), (9, 6),
                   (3, 7), (4, 7), (5, 7), (6, 7), (7, 7), (8, 7), (4, 8), (5, 8), (6, 8), (7, 8), (5, 9), (6, 9)]:
        d.point((x, y), fill=heart)
    return img

def art_plant(frame=hexc("8f8178")):
    img, d = _frame(20, 28, frame, hexc("f4ecdc"))
    d.rectangle([7, 18, 12, 23], fill=hexc("d9827a")); d.rectangle([6, 17, 13, 18], fill=hexc("e9978e"))
    for (x0, y0, x1, y1, c) in [(9, 7, 11, 17, GREEN2), (5, 9, 9, 15, GREEN1), (11, 8, 15, 14, GREEN1), (7, 4, 10, 10, GREEN3), (11, 11, 14, 16, GREEN2)]:
        d.ellipse([x0, y0, x1, y1], fill=c)
    return img

def art_waves(frame=hexc("6f6a66")):
    img, d = _frame(24, 18, frame, hexc("f2e3d3"))
    for i, c in enumerate([hexc("e4a28f"), hexc("d7c3a3"), hexc("9fb7c9")]):
        d.chord([2 - i * 2, 6 + i * 3, 26 - i * 2, 22 + i * 3], 180, 360, fill=c)
    return img

def window_curtain(frame=hexc("8d97a3"), rail=hexc("e7c9b0")):
    """Window 100 x 120 cm (62 x 75 u) with pleated valance and sill."""
    w, h = 62, 75
    img = Image.new("RGBA", (w + 4, h + 4), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rectangle([2, 4, w + 1, h], fill=frame)
    d.rectangle([5, 7, w - 2, h - 3], fill=hexc("bfe3ea"))
    d.rectangle([5, 7, w - 2, 8], fill=shade(hexc("bfe3ea"), .8)); d.rectangle([5, 7, 6, h - 3], fill=shade(hexc("bfe3ea"), .8))
    for k in range(3):
        d.line([(14 + k * 18, h - 6), (24 + k * 18, 20)], fill=hexc("e4f4f7"))
    d.rectangle([w // 2, 7, w // 2 + 1, h - 3], fill=frame)
    d.rectangle([5, h // 2 + 6, w - 2, h // 2 + 7], fill=frame)
    d.rectangle([0, h, w + 3, h + 3], fill=mix(frame, (255, 255, 255, 255), .5))   # sill
    # valance
    d.rectangle([0, 0, w + 3, 2], fill=rail)
    cl, cd = hexc("f6ead8"), hexc("ddc7aa")
    for i, x in enumerate(range(1, w + 3, 4)):
        L = 26 + (3 if i % 2 else 0)
        d.rectangle([x, 3, x + 1, L], fill=cl); d.rectangle([x + 2, 3, x + 3, L - 2], fill=cd)
        d.point((x + 1, L + 1), fill=cl)
    return img

def window_blind(frame=hexc("9c8fbf")):
    w, h = 44, 66
    img = Image.new("RGBA", (w + 4, h + 4), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rectangle([2, 0, w + 1, h], fill=frame)
    d.rectangle([5, 3, w - 2, h - 3], fill=hexc("bfe3ea"))
    d.rectangle([5, 3, 6, h - 3], fill=shade(hexc("bfe3ea"), .8))
    d.rectangle([w // 2, 3, w // 2 + 1, h - 3], fill=frame)
    d.rectangle([5, 40, w - 2, 41], fill=frame)
    for y in range(3, 24):
        d.line([(4, y), (w - 1, y)], fill=hexc("e8c9a5") if y % 3 else hexc("c9a27f"))
    d.rectangle([0, h, w + 3, h + 3], fill=mix(frame, (255, 255, 255, 255), .5))
    return img

WALL_ART = {"art_cat": art_cat, "art_heart": art_heart, "art_plant": art_plant, "art_waves": art_waves,
            "window_curtain": window_curtain, "window_blind": window_blind}

def wall_item(fn, side="left", **kw):
    flat = fn(**kw)
    img = shear_left(flat) if side == "left" else shear_right(flat)
    img = outline_img(img)
    return img, flat.size
