#!/usr/bin/env python3
"""Baut aus index.html, css/ und js/ eine einzige, offline lauffähige Datei: nachtschicht.html"""
import base64, pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')

def font_uri(m):
    data = (root / 'fonts' / m.group(1)).read_bytes()
    return "url(data:font/woff2;base64," + base64.b64encode(data).decode() + ")"

def inline_css(m):
    css = (root / m.group(1)).read_text(encoding='utf-8')
    css = re.sub(r"url\(\.\./fonts/([^)]+)\)", font_uri, css)
    return '<style>\n' + css + '\n</style>'

def inline_js(m):
    js = (root / m.group(1)).read_text(encoding='utf-8').replace('</script', '<\\/script')
    return '<script>\n' + js + '\n</script>'

html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', inline_css, html)
html = re.sub(r'<script src="([^"]+)"></script>', inline_js, html)
out = root / 'nachtschicht.html'
out.write_text(html, encoding='utf-8')
print(f'{out.name}: {out.stat().st_size / 1024:.0f} KB')
