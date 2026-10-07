"""Every room item and its colour variants. `items` maps name -> ((img, anchor), kind, meta)."""
import os, json, shutil
from PIL import Image
import items as I, scene
from iso import hexc

items = {}
def add(name, spr, kind="floor", **meta):
    items[name] = (spr, kind, meta)

for c in I.SOFT: add(f"bed_{c}", I.cat_bed(c))
for n, c in [("cream", I.CREAMW), ("oak", I.OAK)]: add(f"scratch_post_{n}", I.scratch_post(c))
for n, c in [("white", hexc("f5f3ee")), ("mint", hexc("d6efe9")), ("lilac", hexc("e6def3"))]: add(f"cat_tree_{n}", I.cat_tree(c))
for n, c in [("rose", hexc("e08e8e")), ("sage", hexc("9cbf8e")), ("blue", hexc("8fb2d9"))]: add(f"scratcher_{n}", I.scratcher(c))
for n, c in [("butter", hexc("f3e3a6")), ("mint", hexc("bfe6cf")), ("sky", hexc("c4dff2")), ("blush", hexc("f2cfcf")), ("lilac", hexc("ddd3f2")), ("peach", hexc("f6d6b4"))]:
    add(f"perch_{n}", I.perch(c))
for n, c in [("cream", hexc("efe3cf")), ("oak", hexc("c9a07a"))]: add(f"condo_{n}", I.condo(c))
for n, c in [("peach", hexc("e7a98f")), ("sage", hexc("9dbb8f")), ("sky", hexc("8fb2d0")), ("lilac", hexc("a99cc6"))]: add(f"shelf_{n}", I.shelf(c))
for n, c in [("grey", hexc("dde3ea")), ("cream", hexc("f6ecd2")), ("blue", hexc("bcd6ea")), ("lilac", hexc("d9d3f3"))]: add(f"stool_{n}", I.stool(c))
for c in ("teal", "rose", "grey"): add(f"ottoman_{c}", I.ottoman(c))
for c in ("sage", "blue", "rose"): add(f"rug_{c}", I.rug(c))
for c in I.SOFT: add(f"floor_cushion_{c}", I.floor_cushion(c))
for n, c in [("navy", hexc("3b4466")), ("taupe", hexc("8a7a72")), ("sky", hexc("8fb2d0")), ("mauve", hexc("a98aa6"))]: add(f"plant_big_{n}", I.big_plant(c))
for n, c in [("blush", hexc("f2d7c9")), ("white", hexc("eeeeee")), ("sky", hexc("bcd6ea")), ("butter", hexc("f3e3a6"))]: add(f"plant_small_{n}", I.small_plant(c))
for c in I.BOWL_COLS:
    for f in ("kibble", "water", "empty"): add(f"bowl_{c}_{f}", I.bowl(c, f))
for c in ("sky", "mint", "blush"): add(f"double_feeder_{c}", I.double_feeder(c))
for n, c in [("tan", hexc("e9c48f")), ("mint", hexc("b9dcc8"))]: add(f"food_bag_{n}", I.food_bag(c))
for n, c in [("blue", hexc("8fb5d9")), ("pink", hexc("e6a3a3")), ("green", hexc("9fcfb0")), ("lilac", hexc("b9addb"))]: add(f"food_can_{n}", I.food_can(c))
for n, c in [("pink", hexc("d65a74")), ("blue", hexc("6f9ac4")), ("yellow", hexc("e3c15a")), ("green", hexc("6fae7f"))]: add(f"toy_yarn_{n}", I.yarn_ball(c))
for n, st in [("pastel", ("f2b8c6", "a6c8e8", "f4e1a0")), ("ocean", ("8fb2d9", "6f9ac4", "cfe7e6")), ("leaf", ("9cbf8e", "f4e1a0", "7f9a72"))]:
    add(f"toy_fish_{n}", I.fish_toy(st))
for n, c in [("grey", hexc("b9a79a")), ("brown", hexc("b98a6a"))]: add(f"toy_mouse_{n}", I.mouse_toy(c))
for n, c in [("blue", hexc("7fb3d5")), ("green", hexc("8cc9a2")), ("pink", hexc("e9a0b4")), ("yellow", hexc("ead27a"))]: add(f"toy_ball_{n}", I.ball(c))
wall = {"art_cat": {}, "art_heart": {}, "art_plant": {}, "art_waves": {},
        "window_curtain_grey": dict(fn=I.window_curtain, frame=hexc("8d97a3")),
        "window_curtain_rose": dict(fn=I.window_curtain, frame=hexc("b47c7c"), rail=hexc("d99a9a")),
        "window_curtain_blue": dict(fn=I.window_curtain, frame=hexc("6c7fb8"), rail=hexc("8fa3d9")),
        "window_blind_lilac": dict(fn=I.window_blind, frame=hexc("9c8fbf")),
        "window_blind_teal": dict(fn=I.window_blind, frame=hexc("6f9ea0")),
        "window_blind_white": dict(fn=I.window_blind, frame=hexc("d8d8dc"))}
for name, kw in wall.items():
    kw = dict(kw); fn = kw.pop("fn", None) or I.WALL_ART[name]
    for side in ("left", "right"):
        img, (w, h) = I.wall_item(fn, side, **kw)
        add(f"{name}_{side}", (img, (0, 0)), kind="wall", side=side, wall_width_u=w, height_px=h)


# ===== extra accessories =====
import items2 as J
for n, c in [("mint", hexc("b7d3c6")), ("pink", hexc("e8b4b8")), ("grey", hexc("c8ccd4")), ("lilac", hexc("c9bfe6"))]:
    add(f"litter_box_hooded_{n}", J.litter_box(c)); add(f"litter_tray_{n}", J.litter_box(c, hooded=False))
    add(f"litter_scoop_{n}", J.litter_scoop(c))
for n, c in [("pink", hexc("e3a6a6")), ("blue", hexc("9cbcdc")), ("grey", hexc("b8bcc6"))]: add(f"carrier_{n}", J.carrier(c))
for n, c in [("blue", hexc("8fb2d9")), ("pink", hexc("e9a0b4")), ("green", hexc("9cbf8e"))]: add(f"tunnel_{n}", J.tunnel(c))
add("cardboard_box", J.cardboard_box())
for n, (c, t) in [("cream_rose", (hexc("f2d9c4"), hexc("d98f8f"))), ("grey_mint", (hexc("dcdde2"), hexc("8fc4b0"))), ("white_blue", (hexc("f6f4f0"), hexc("8fb2d9")))]:
    add(f"teepee_{n}", J.teepee(c, t))
for c in ("blue", "grey", "sage", "rose"): add(f"sofa_{c}", J.sofa(c))
for c in ("rose", "teal", "lavender", "grey"): add(f"armchair_{c}", J.armchair(c))
for n, c in [("oak", hexc("e8d4b8")), ("white", hexc("f2f2f2")), ("walnut", hexc("a9805e"))]: add(f"side_table_{n}", J.side_table(c))
for n, c in [("cream", hexc("f6e7c8")), ("mint", hexc("cfe7dc")), ("pink", hexc("f4d0d0"))]:
    add(f"table_lamp_{n}", J.table_lamp(c)); add(f"floor_lamp_{n}", J.floor_lamp(c))
for n, c in [("white", hexc("f2f2f2")), ("mint", hexc("c9e6d8")), ("pink", hexc("f2cfd2"))]: add(f"fountain_{n}", J.fountain(c))
for n, c in [("pink", hexc("e3a6a6")), ("blue", hexc("9cbcdc")), ("yellow", hexc("ead27a"))]: add(f"treat_jar_{n}", J.treat_jar(c))
for n, c in [("teal", hexc("6fc0c0")), ("pink", hexc("e98fb0")), ("yellow", hexc("ead27a"))]: add(f"toy_feather_wand_{n}", J.feather_wand(c))
for c in ("rose", "blue", "sage"): add(f"basket_bed_{c}", J.basket_bed(c))
for n, c in [("white", hexc("e7e2da")), ("oak", hexc("c9a27a"))]: add(f"aquarium_{n}", J.aquarium(c))
for n, c in [("terracotta", hexc("e9978e")), ("white", hexc("eeeeee")), ("blue", hexc("9cbcdc"))]: add(f"cactus_{n}", J.cactus(c))
add("book_stack", J.book_stack())
for c in ("sage", "rose", "blue", "lavender"): add(f"blanket_{c}", J.blanket(c))
for n, c in [("oak", hexc("c9a27a")), ("white", hexc("ece8e2")), ("walnut", hexc("8f6a4e"))]: add(f"bookshelf_full_{n}", J.bookshelf_full(c))
for n, c in [("oak", hexc("e8d4b8")), ("white", hexc("f2f2f2"))]:
    add(f"cat_steps_leftwall_{n}", J.cat_steps_left(c), wall_mounted="left")
    add(f"cat_steps_rightwall_{n}", J.cat_steps_right(c), wall_mounted="right")
for c in ("sage", "rose", "blue"): add(f"window_perch_leftwall_{c}", J.window_perch_left(c), wall_mounted="left")
for name, fn, kw in [("wall_clock_blue", J.wall_clock, {}), ("wall_clock_pink", J.wall_clock, dict(rim=hexc("e3a6a6"))),
                     ("door_cream", J.door, {}), ("door_oak", J.door, dict(color=hexc("c9a27a"))), ("door_white", J.door, dict(color=hexc("f6f4f0"))),
                     ("cat_flap", J.cat_door, {}), ("wall_shelf_plants", J.wall_shelf_plants, {}), ("garland", J.garland, {}),
                     ("paw_sign", J.wall_cat_name_sign, {})]:
    for side in ("left", "right"):
        img, (w, h) = I.wall_item(fn, side, **kw)
        add(f"{name}_{side}", (img, (0, 0)), kind="wall", side=side, wall_width_u=w, height_px=h)
