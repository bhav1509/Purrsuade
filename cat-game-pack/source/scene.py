"""Isometric room + a sample layout, everything at 1:1 pixel scale with the 32x32 cat."""
from PIL import Image
from iso import Spr, shade, mix, hexc
import items as I
import catgen

RW, RD, RH = 180, 180, 140      # room 2.9 m x 2.9 m, walls 2.25 m (cut-away)

ROOM_STYLES = {
    "cream_checker": dict(floor="f4ece0", alt="efe5d7", wallL="e5d4cc", wallR="efe6dc", pattern="checker"),
    "oak_wood":      dict(floor="d9b48c", alt="c9a27a", wallL="e9e2d4", wallR="f3eee4", pattern="wood"),
    "mint_tile":     dict(floor="e6efe9", alt="d6e6dc", wallL="cfe3dc", wallR="e2efea", pattern="checker"),
    "blue_wood":     dict(floor="c8d6e2", alt="b8c9d8", wallL="d7dff0", wallR="e6ebf6", pattern="wood"),
    "rose_carpet":   dict(floor="f1d9d6", alt="f1d9d6", wallL="ecd2d6", wallR="f6e4e6", pattern="plain"),
    "night_wood":    dict(floor="8a6f5e", alt="7a6252", wallL="5f6680", wallR="707894", pattern="wood"),
}

def room(style="cream_checker"):
    st = ROOM_STYLES[style]
    floor, alt = hexc(st["floor"]), hexc(st["alt"])
    s = Spr(RW + RD + 60, RH + (RW + RD) // 2 + 60, RD + 30, RH + 30)
    s.box(-6, -6, -8, RW + 6, RD + 6, 8, floor, shade(floor, .9), shade(floor, .8))
    if st["pattern"] == "checker":
        for i in range(0, RW, 16):
            for j in range(0, RD, 16):
                if (i // 16 + j // 16) % 2:
                    s.poly([(i, j, 0), (min(i + 16, RW), j, 0), (min(i + 16, RW), min(j + 16, RD), 0), (i, min(j + 16, RD), 0)], alt)
    elif st["pattern"] == "wood":
        for j in range(0, RD, 10):
            off = (j // 10 % 3) * 23
            s.poly([(0, j, 0), (RW, j, 0), (RW, j + 1, 0), (0, j + 1, 0)], alt)
            for i in range(off % 60, RW, 60):
                s.poly([(i, j, 0), (i + 1, j, 0), (i + 1, j + 10, 0), (i, j + 10, 0)], alt)
    wallR, wallL, cap = hexc(st["wallR"]), hexc(st["wallL"]), hexc("fbf6ee")
    s.box(-6, -6, 0, RW + 6, 6, RH, cap, wallR, shade(wallR, .9))     # right back wall
    s.box(-6, 0, 0, 6, RD, RH, cap, shade(wallL, .93), wallL)          # left back wall
    s.box(0, 0, 0, RW, 2, 5, hexc("fffaf2"))                           # skirting
    s.box(0, 0, 0, 2, RD, 5, hexc("fffaf2"))
    return s

def place(s, sprite, x, y, z=0, dx=0, dy=0, shadow=None):
    img, (ax, ay) = sprite
    X, Y = s.P(x, y, z)
    if shadow:
        sh = Spr(s.img.width, s.img.height, s.ox, s.oy)
        sh.ell(x, y, z, shadow, (60, 40, 30, 46))
        s.img.alpha_composite(sh.img)
    s.img.alpha_composite(img, (int(round(X - ax + dx)), int(round(Y - ay + dy))))

def place_wall(s, item, side, a0, z0):
    img, (w, h) = item
    if side == "left":
        X, Y = s.P(0, a0, z0 + h)
        s.img.alpha_composite(img, (int(X - img.width), int(Y - 1)))
    else:
        X, Y = s.P(a0, 0, z0 + h)
        s.img.alpha_composite(img, (int(X - 1), int(Y - 1)))

def cat_sprite(anim, frame):
    rows = {n: f() for n, f, _ in catgen.ANIMS if n == anim}
    img = rows[anim][frame]
    bb = img.getbbox()
    return img, (16, 29)  # feet / ground point

def build_scene():
    s = room()
    # wall items
    place_wall(s, I.wall_item(I.window_curtain, "left"), "left", 46, 48)
    place_wall(s, I.wall_item(I.art_plant, "left"), "left", 126, 66)
    place_wall(s, I.wall_item(I.art_heart, "left"), "left", 22, 92)
    place_wall(s, I.wall_item(I.window_blind, "right"), "right", 30, 52)
    place_wall(s, I.wall_item(I.art_cat, "right"), "right", 140, 84)
    place_wall(s, I.wall_item(I.art_waves, "right"), "right", 104, 96)
    # floor: far to near (sorted by x+y)
    place(s, I.rug("sage"), 100, 104)
    floor_items = [
        (I.big_plant(), 16, 22, 9),
        (I.shelf(), 128, 2, None),
        (I.cat_tree(), 98, 22, 16),
        (I.stool(), 22, 108, 11),
        (I.cat_bed("blue"), 58, 56, 19),
        (I.food_bag(), 170, 40, 6),
        (I.ottoman("teal"), 150, 82, 13),
        (I.scratch_post(), 36, 146, 11),
        (I.double_feeder("sky"), 152, 140, 9),
        (I.bowl("mint", "water"), 132, 162, 6),
        (I.yarn_ball(), 86, 132, None),
        (I.fish_toy(), 118, 150, None),
        (I.mouse_toy(), 62, 168, None),
        (I.ball(), 104, 172, None),
        (I.floor_cushion("lavender"), 168, 116, 9),
    ]
    floor_items.sort(key=lambda t: t[1] + t[2] if t[0] is not None else 0)
    for spr, x, y, sh in floor_items:
        place(s, spr, x, y, shadow=sh)
        if spr[1] and (x, y) == (128, 2):
            place(s, I.small_plant(), 150, 9, 62)
            place(s, I.food_can(), 136, 9, 42)
            place(s, I.food_can(I.hexc("e6a3a3")), 142, 9, 42)
        if (x, y) == (58, 56):
            place(s, cat_sprite("sleep", 1), 58, 56, 4, dy=2)
        if (x, y) == (98, 22):
            place(s, cat_sprite("sit", 0), 106, 30, 37)
    place(s, cat_sprite("idle", 0), 108, 108, shadow=8)
    img = s.img.crop(s.img.getbbox())
    return img

if __name__ == "__main__":
    img = build_scene()
    bg = Image.new("RGBA", (img.width + 40, img.height + 40), hexc("34556e"))
    bg.alpha_composite(img, (20, 20))
    bg.save("out/room_scene.png")
    bg.resize((bg.width * 2, bg.height * 2), Image.NEAREST).save("out/room_scene_2x.png")
    print(bg.size)
