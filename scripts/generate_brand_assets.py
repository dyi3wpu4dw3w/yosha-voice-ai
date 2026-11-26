from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)

GOLD = (229, 189, 112)
GOLD_DARK = (189, 139, 60)
BG = (9, 10, 14)


def font(size):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def background(size):
    image = Image.new("RGB", (size, size), BG)
    pixels = image.load()
    cx = cy = size / 2
    max_r = math.sqrt(2) * size / 2
    for y in range(size):
        for x in range(size):
            distance = math.sqrt((x-cx)**2 + (y-cy)**2) / max_r
            glow = max(0, 1-distance) * 0.16
            pixels[x, y] = tuple(
                min(255, int(BG[i] + (GOLD_DARK[i]-BG[i])*glow))
                for i in range(3)
            )
    return image


def draw_mark(image, size, include_word=True):
    draw = ImageDraw.Draw(image)
    cx = cy = size // 2
    ring_r = int(size * 0.29)
    ring_w = max(5, int(size * 0.018))
    draw.ellipse(
        (cx-ring_r, cy-ring_r, cx+ring_r, cy+ring_r),
        outline=GOLD, width=ring_w
    )
    # Minimal sound-wave bars with a central Y-shaped mark.
    bar_width = max(7, int(size * 0.035))
    gap = int(size * 0.035)
    heights = [0.12, 0.20, 0.29, 0.20, 0.12]
    start_x = cx - (5*bar_width + 4*gap)//2
    baseline = cy + int(size*0.12)
    for i, fraction in enumerate(heights):
        x = start_x + i*(bar_width+gap)
        h = int(size*fraction)
        draw.rounded_rectangle(
            (x, baseline-h, x+bar_width, baseline),
            radius=bar_width//2, fill=GOLD
        )
    y_font = font(int(size*0.22))
    draw.text((cx, cy-int(size*0.04)), "Y", font=y_font,
              fill=(255, 244, 216), anchor="mm", stroke_width=0)
    if include_word:
        label_font = font(int(size*0.085))
        draw.text((cx, int(size*0.82)), "YOSHA", font=label_font,
                  fill=GOLD, anchor="mm", stroke_width=0)


icon = background(1024)
draw_mark(icon, 1024, include_word=False)
icon.save(ASSETS / "icon-only.png", quality=95)

splash = background(2732)
draw_mark(splash, 2732, include_word=True)
splash.save(ASSETS / "splash.png", quality=95)

print("Generated YOSHA icon and splash assets.")
