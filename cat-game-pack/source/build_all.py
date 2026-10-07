"""Builds the complete pack: all cats (every colour) + all room items + rooms in ONE atlas, plus loose files."""
import os, json, shutil
from PIL import Image, ImageDraw
import catgen as C
import scene
from catalog import items, I
import items2 as J
from iso import hexc

OUT = "/mnt/user-data/outputs/cat-game-pack"
if os.path.exists(OUT): shutil.rmtree(OUT)
for d in ("cats", "items", "rooms", "previews", "source"): os.makedirs(f"{OUT}/{d}")

# ---------- cats ----------
cat_sheets, cat_frames, anim_meta = {}, {}, None
for name in C.PALETTES:
    C.apply_palette(name)
    rows = [(n, f(), fps) for n, f, fps in C.ANIMS]
    cols = max(len(fr) for _, fr, _ in rows)
    sh = Image.new("RGBA", (cols * 32, len(rows) * 32), (0, 0, 0, 0))
    for r, (n, fr, _) in enumerate(rows):
        for i, f in enumerate(fr): sh.alpha_composite(f, (i * 32, r * 32))
    cat_sheets[name] = sh; cat_frames[name] = {n: fr for n, fr, _ in rows}
    sh.save(f"{OUT}/cats/cat_{name}.png")
    sh.resize((sh.width * 4, sh.height * 4), Image.NEAREST).save(f"{OUT}/cats/cat_{name}_4x.png")
    anim_meta = {n: {"row": r, "frames": len(fr), "fps": fps, "loop": n != "jump"} for r, (n, fr, fps) in enumerate(rows)}
C.apply_palette("cream")

# ---------- rooms ----------
rooms = {}
for st in scene.ROOM_STYLES:
    r = scene.room(st); bb = r.img.getbbox()
    rooms[st] = (r.img.crop(bb), (r.ox - bb[0], r.oy - bb[1]))
    rooms[st][0].save(f"{OUT}/rooms/room_{st}.png")

# ---------- loose item sprites ----------
for k, ((img, anc), kind, m) in items.items():
    img.save(f"{OUT}/items/{k}.png")

# ---------- ONE atlas ----------
W = 2048
pos, x, y, rowh = {}, 2, 2, 0
def put(key, img):
    global x, y, rowh
    if x + img.width + 2 > W: x, y, rowh = 2, y + rowh + 2, 0
    pos[key] = (x, y); x += img.width + 2; rowh = max(rowh, img.height)
for n, sh in cat_sheets.items(): put(("cat", n), sh)
x, y, rowh = 2, y + rowh + 2, 0
for n, (img, _) in rooms.items(): put(("room", n), img)
x, y, rowh = 2, y + rowh + 2, 0
for k in sorted(items, key=lambda k: -items[k][0][0].height): put(("item", k), items[k][0][0])
H = y + rowh + 2
atlas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
meta = {
    "image": "cat_game_atlas.png", "size": [W, H],
    "scale": {"unit_cm": 1.6, "floor_tile_px": [32, 16], "cat_frame_px": 32,
              "iso": "2:1; world x -> (+1,+0.5)px, y -> (-1,+0.5)px, z -> -1px",
              "rule": "Draw everything at 1:1 and scale the whole screen by whole numbers (2x, 3x, 4x)."},
    "cats": {}, "rooms": {}, "sprites": {}}
for (kind, k), (px, py) in pos.items():
    if kind == "cat":
        atlas.alpha_composite(cat_sheets[k], (px, py))
        meta["cats"][k] = {"x": px, "y": py, "frameWidth": 32, "frameHeight": 32, "feetAnchor": [16, 29],
                           "animations": {a: dict(v, rects=[[px + i * 32, py + v["row"] * 32, 32, 32] for i in range(v["frames"])])
                                          for a, v in anim_meta.items()}}
    elif kind == "room":
        img, anc = rooms[k]; atlas.alpha_composite(img, (px, py))
        meta["rooms"][k] = {"x": px, "y": py, "w": img.width, "h": img.height, "floorOrigin": list(anc),
                            "floorSizeU": [scene.RW, scene.RD], "wallHeightPx": scene.RH}
    else:
        (img, anc), t, m = items[k]; atlas.alpha_composite(img, (px, py))
        e = {"x": px, "y": py, "w": img.width, "h": img.height, "type": t}
        if t == "floor": e["anchor"] = list(anc)
        e.update(m); meta["sprites"][k] = e
atlas.save(f"{OUT}/cat_game_atlas.png")
atlas.resize((W * 2, H * 2), Image.NEAREST).save(f"{OUT}/previews/cat_game_atlas_2x.png")
json.dump(meta, open(f"{OUT}/cat_game_atlas.json", "w"), indent=1)

# ---------- previews ----------
# 1) every cat colour x every animation (animated GIF, 2x)
names, anims = list(cat_frames), [a for a, _, _ in C.ANIMS]
cw, lab = 64, 70
gif = []
for t in range(48):
    im = Image.new("RGBA", (lab + cw * len(anims), 16 + cw * len(names)), (238, 242, 236, 255)); d = ImageDraw.Draw(im)
    for j, a in enumerate(anims): d.text((lab + j * cw + 6, 2), a, fill=(78, 54, 48))
    for i, n in enumerate(names):
        d.text((4, 16 + i * cw + 26), n.replace("_", " "), fill=(78, 54, 48))
        for j, a in enumerate(anims):
            fr = cat_frames[n][a]; fps = anim_meta[a]["fps"]
            im.alpha_composite(fr[int(t * 0.1 * fps) % len(fr)].resize((cw, cw), Image.NEAREST), (lab + j * cw, 16 + i * cw))
    gif.append(im.convert("P", palette=Image.ADAPTIVE))
gif[0].save(f"{OUT}/previews/all_cats_animated.gif", save_all=True, append_images=gif[1:], duration=100, loop=0)

# 2) sample scenes
def bg(img, col="34556e"):
    b = Image.new("RGBA", (img.width + 40, img.height + 40), hexc(col)); b.alpha_composite(img, (20, 20)); return b

def cat_spr(colour, anim, f):
    return cat_frames[colour][anim][f], (16, 29)

s1 = scene.build_scene()
bg(s1).resize(((s1.width + 40) * 2, (s1.height + 40) * 2), Image.NEAREST).save(f"{OUT}/previews/scene_cat_room_2x.png")

def living_room():
    s = scene.room("oak_wood"); P, pl, pw = s.P, scene.place, scene.place_wall
    pw(s, I.wall_item(I.window_curtain, "left", frame=hexc("6c7fb8"), rail=hexc("8fa3d9")), "left", 40, 48)
    pw(s, I.wall_item(J.door, "left", color=hexc("f6f4f0")), "left", 116, 0)
    pw(s, I.wall_item(J.wall_clock, "left"), "left", 30, 100)
    pw(s, I.wall_item(J.garland, "right"), "right", 50, 112)
    pw(s, I.wall_item(I.art_cat, "right"), "right", 62, 84)
    pw(s, I.wall_item(I.art_waves, "right"), "right", 84, 88)
    pw(s, I.wall_item(J.wall_shelf_plants, "right"), "right", 140, 82)
    pl(s, items["rug_blue"][0], 92, 96)
    seq = [("bookshelf_full_oak", 128, 2, None), ("plant_big_taupe", 14, 18, 9), ("sofa_grey", 40, 2, None),
           ("floor_lamp_cream", 16, 50, 7), ("side_table_oak", 18, 96, 11), ("cat_steps_leftwall_oak", 0, 0, None),
           ("teepee_cream_rose", 150, 70, 15), ("tunnel_blue", 100, 120, 10), ("litter_box_hooded_mint", 160, 150, 16),
           ("fountain_white", 132, 168, 7), ("bowl_butter_kibble", 116, 172, 6), ("basket_bed_rose", 60, 120, 14),
           ("toy_feather_wand_teal", 86, 160, None), ("cardboard_box", 40, 160, 12)]
    seq.sort(key=lambda t: t[1] + t[2])
    for k, x, y, sh in seq:
        pl(s, items[k][0], x, y, shadow=sh)
        if k == "side_table_oak": pl(s, items["table_lamp_mint"][0], 18, 96, 31.5)
        if k == "sofa_grey": pl(s, cat_spr("black", "sleep", 2), 62, 26, 28)
        if k == "basket_bed_rose": pl(s, cat_spr("orange_tabby", "sleep", 0), 60, 120, 6, dy=1)
        if k == "bookshelf_full_oak": pl(s, cat_spr("siamese", "sit", 0), 154, 9, 62)
        if k == "cat_steps_leftwall_oak": pl(s, cat_spr("tuxedo", "idle", 0), 7, 12, 81, dx=-4)
        if k == "cardboard_box": pass
    pl(s, cat_spr("calico", "walk", 1), 104, 92, shadow=8)
    pl(s, cat_spr("grey", "play", 2), 72, 150, shadow=8)
    img = s.img.crop(s.img.getbbox())
    return img
s2 = living_room()
bg(s2, "2f4a3f").resize(((s2.width + 40) * 2, (s2.height + 40) * 2), Image.NEAREST).save(f"{OUT}/previews/scene_living_room_2x.png")

# ---------- source + readme ----------
for f in ("iso.py", "items.py", "items2.py", "catalog.py", "scene.py", "catgen.py", "build_all.py"):
    shutil.copy(f, f"{OUT}/source/{f}")
open(f"{OUT}/README.txt", "w").write(f"""CAT GAME PIXEL PACK  (original art, free to use in your game)

ONE FILE:  cat_game_atlas.png  +  cat_game_atlas.json
  - "cats":    {len(cat_sheets)} colours, each a 32x32 sheet with 8 animations (idle, sit, walk, run, sleep, jump, box, play).
               feetAnchor (16,29) = the point that touches the floor.
  - "rooms":   {len(rooms)} empty room styles. floorOrigin = screen position of the back floor corner (world 0,0,0).
  - "sprites": {len(items)} furniture / accessory sprites.
               floor items: anchor = pixel that sits on the floor point you place it at.
               wall items:  _left / _right versions for each back wall.

SCALE: everything is drawn at the same scale (1 unit = 1.6 cm, floor tile 32x16 px).
  Draw at 1:1, then zoom the whole game by 2x/3x/4x (nearest-neighbour). Never resize single sprites.
  Isometric: world (x, y, z) -> screen (originX + x - y, originY + (x + y)/2 - z).

Loose files are in cats/, items/, rooms/. Previews in previews/. Python generators in source/ (run build_all.py).
""")
print("cats", len(cat_sheets), "rooms", len(rooms), "items", len(items), "atlas", W, H)
