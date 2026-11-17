#!/usr/bin/env python3
"""WCAG 2 contrast ratio for OKLCH (or #hex) colours.

Usage:
  python contrast.py "oklch(55% 0.16 300)" "oklch(97.5% 0.006 222)"
  python contrast.py "oklch(76% 0.14 80)" "oklch(76% 0.14 80)" 0.1   # background is that colour at 10% over white (bg-accent/10)
  python contrast.py "oklch(55% 0.16 300)"            # against white, --lp-tint and --lp-band
  python contrast.py --brightest 300 0.16            # lightest L for hue/chroma that passes 4.5:1 on all three

Text needs 4.5:1 (3:1 for large text and UI shapes). Public-page text sits on white and on the
tints, so check all three backgrounds before choosing a colour.
"""
import math
import sys

BACKGROUNDS = {
    "white": "oklch(100% 0 0)",
    "--lp-tint": "oklch(97.5% 0.006 222)",
    "--lp-band": "oklch(97% 0.016 222)",
}


def to_linear_rgb(colour: str):
    colour = colour.strip()
    if colour.startswith("#"):
        h = colour[1:]
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
        return [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    parts = colour.replace("oklch(", "").replace(")", "").replace("/", " ").split()
    lightness = float(parts[0].rstrip("%")) / (100 if parts[0].endswith("%") else 1)
    chroma, hue = float(parts[1]), math.radians(float(parts[2]))
    a, b = chroma * math.cos(hue), chroma * math.sin(hue)
    l_ = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m_ = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s_ = (lightness - 0.0894841775 * a - 1.2914855480 * b) ** 3
    rgb = (
        4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
        -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
        -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_,
    )
    return [min(1.0, max(0.0, x)) for x in rgb]


def luminance(colour: str) -> float:
    r, g, b = to_linear_rgb(colour)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(fg: str, bg: str) -> float:
    hi, lo = sorted((luminance(fg), luminance(bg)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def over_white(colour: str, alpha: float) -> str:
    """Hex for `colour` at `alpha` opacity on white, blended in sRGB like the browser does."""
    encode = lambda c: 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
    srgb = [encode(c) for c in to_linear_rgb(colour)]
    mixed = [alpha * c + (1 - alpha) * 1.0 for c in srgb]
    return "#" + "".join(f"{round(min(1, max(0, c)) * 255):02x}" for c in mixed)


def report(fg: str, backgrounds: dict) -> None:
    for name, bg in backgrounds.items():
        ratio = contrast(fg, bg)
        verdict = "pass" if ratio >= 4.5 else ("large text only" if ratio >= 3 else "FAIL")
        print(f"{fg} on {name:10s} {ratio:5.2f}:1  {verdict}")


def brightest(hue: float, chroma: float) -> None:
    lightness = 80.0
    while lightness > 20:
        colour = f"oklch({lightness:g}% {chroma:g} {hue:g})"
        if all(contrast(colour, bg) >= 4.5 for bg in BACKGROUNDS.values()):
            print(colour)
            report(colour, BACKGROUNDS)
            return
        lightness -= 0.5
    print("no lightness passes; lower the chroma")


if __name__ == "__main__":
    args = sys.argv[1:]
    if len(args) == 3 and args[0] == "--brightest":
        brightest(float(args[1]), float(args[2]))
    elif len(args) == 3:
        bg = over_white(args[1], float(args[2]))
        report(args[0], {f"{args[1]} at {args[2]} over white ({bg})": bg})
    elif len(args) == 2:
        report(args[0], {"given background": args[1]})
    elif len(args) == 1:
        report(args[0], BACKGROUNDS)
    else:
        print(__doc__)
        sys.exit(1)
