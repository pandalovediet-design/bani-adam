"""Builds the Bani Adam logo set as pure vector SVG (text converted to outlines) plus PNG exports.

Fonts: Tajawal (SIL Open Font License) from the @fontsource/tajawal npm package.
Usage: python3 build_logo.py <fontsource files dir> <output dir>
"""
import io, sys, os
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

FILES, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

NAVY, ORANGE, WARM, GREY = "#0E1520", "#F28A2E", "#F8F4EC", "#94A3B8"
SWASH = "M196 4c3 0 4 6 1 8-26 3-70 6-108 9-32 3-58 5-80 8-6 1-9-6-4-9 20-6 52-10 86-12 36-2 72-3 105-4zM150 16c-30 3-62 6-96 10-3 0-3 3 0 3 34-2 66-5 96-9 2 0 2-4 0-4z"  # 200x30 dry-brush stroke


def load(name):
    f = TTFont(os.path.join(FILES, name))
    f.flavor = None
    buf = io.BytesIO(); f.save(buf)
    data = buf.getvalue()
    return TTFont(io.BytesIO(data)), hb.Font(hb.Face(data))


AR, AR_HB = load("tajawal-arabic-900-normal.woff")
AR8, AR8_HB = load("tajawal-arabic-800-normal.woff")
LA, LA_HB = load("tajawal-latin-800-normal.woff")


def text_path(tt, hbfont, text, size, rtl=False, tracking=0):
    """Shape text and return (svg path d, xmin, ymin, xmax, ymax) in px, baseline at y=0, y down."""
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    if rtl: buf.direction = "rtl"
    hb.shape(hbfont, buf, {"liga": True, "kern": True})
    upm = tt["head"].unitsPerEm; s = size / upm
    gs = tt.getGlyphSet(); order = tt.getGlyphOrder()
    pen = SVGPathPen(gs); bp = BoundsPen(gs)
    x = 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        g = order[info.codepoint]
        t = (s, 0, 0, -s, (x + pos.x_offset) * s, -pos.y_offset * s)
        gs[g].draw(TransformPen(pen, t)); gs[g].draw(TransformPen(bp, t))
        x += pos.x_advance + tracking * upm / size
    b = bp.bounds or (0, 0, x * s, 0)
    return pen.getCommands(), b


def place(d, bounds, x, y):
    """Translate a path so its bbox top-left lands at (x, y)."""
    return f'<path transform="translate({x - bounds[0]:.1f} {y - bounds[1]:.1f})" d="{d}"/>'


def swash(x, y, w, h, color, rot=-1.5):
    return f'<path transform="translate({x:.1f} {y:.1f}) rotate({rot} {w/2:.1f} {h/2:.1f}) scale({w/200:.4f} {h/30:.4f})" fill="{color}" d="{SWASH}"/>'


def wordmark(fg, accent, sub, with_english=True):
    main_d, mb = text_path(AR, AR_HB, "بني آدم", 300, rtl=True)
    top_d, tb = text_path(AR8, AR8_HB, "مشروع", 110, rtl=True)
    mw, mh = mb[2] - mb[0], mb[3] - mb[1]
    tw, th = tb[2] - tb[0], tb[3] - tb[1]
    pad = 40
    W = mw + pad * 2
    parts = []
    y = pad
    parts.append(f'<g fill="{fg}">' + place(top_d, tb, W - pad - tw, y) + "</g>")  # right-aligned (RTL)
    y += th + 18
    parts.append(f'<g fill="{fg}">' + place(main_d, mb, pad, y) + "</g>")
    y += mh + 6
    parts.append(swash(pad, y - 10, mw, 88, accent))
    y += 78 + 34
    if with_english:
        en_d, eb = text_path(LA, LA_HB, "BANI ADAM PROJECT", 48, tracking=9)
        ew, eh = eb[2] - eb[0], eb[3] - eb[1]
        ex = (W - ew) / 2
        parts.append(f'<g fill="{sub}">' + place(en_d, eb, ex, y) + "</g>")
        ly = y + eh / 2 - 2
        parts.append(f'<rect x="{pad}" y="{ly:.1f}" width="{max(0, ex - pad - 26):.1f}" height="5" rx="2.5" fill="{accent}"/>')
        parts.append(f'<rect x="{ex + ew + 26:.1f}" y="{ly:.1f}" width="{max(0, W - pad - ex - ew - 26):.1f}" height="5" rx="2.5" fill="{accent}"/>')
        y += eh
    H = y + pad
    return W, H, "\n  ".join(parts)


def svg(W, H, body, bg=None, rx=0, title="مشروع بني آدم"):
    bgr = f'<rect width="{W:.0f}" height="{H:.0f}" rx="{rx}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}" width="{W:.0f}" height="{H:.0f}" role="img" aria-label="{title}"><title>{title}</title>\n  {bgr}\n  {body}\n</svg>\n'


def save(name, content, png_width=None):
    p = os.path.join(OUT, name); open(p, "w").write(content)
    if png_width:
        import cairosvg
        cairosvg.svg2png(bytestring=content.encode(), write_to=p.replace(".svg", ".png"), output_width=png_width)


# 1. Wordmarks
W, H, body = wordmark(WARM, ORANGE, WARM)
save("logo-dark-bg.svg", svg(W, H, body), 2400)            # for night/dark backgrounds (transparent)
save("logo-dark-bg-filled.svg", svg(W, H, body, NAVY), 2400)
W, H, body = wordmark(NAVY, ORANGE, NAVY)
save("logo-light-bg.svg", svg(W, H, body), 2400)            # for light backgrounds (transparent)

# 2. App icon: "بني آدم" + swash on navy, 1024 square
d, b = text_path(AR, AR_HB, "بني آدم", 300, rtl=True)
w, h = b[2] - b[0], b[3] - b[1]
k = 760 / w
inner = f'<g transform="translate({(1024 - w * k) / 2:.1f} {(1024 - (h + 84) * k) / 2:.1f}) scale({k:.4f})"><g fill="{WARM}">{place(d, b, 0, 0)}</g>{swash(0, h - 4, w, 88, ORANGE)}</g>'
save("app-icon.svg", svg(1024, 1024, inner, NAVY, 224), 1024)

# 3. Favicon: the letter ب in streetlight orange
d, b = text_path(AR, AR_HB, "ب", 300, rtl=True)
w, h = b[2] - b[0], b[3] - b[1]
k = 44 / max(w, h)
inner = f'<g transform="translate({(64 - w * k) / 2:.1f} {(64 - h * k) / 2:.1f}) scale({k:.4f})"><g fill="{ORANGE}">{place(d, b, 0, 0)}</g></g>'
save("favicon.svg", svg(64, 64, inner, NAVY, 14), 256)

print("done", sorted(os.listdir(OUT)))
