# -*- coding: utf-8 -*-
"""Склеивает index.html + style.css + config.js + script.js в один файл."""
from pathlib import Path

base = Path(__file__).parent
html = (base / "index.html").read_text(encoding="utf-8")
css = (base / "style.css").read_text(encoding="utf-8")
config = (base / "config.js").read_text(encoding="utf-8")
script = (base / "script.js").read_text(encoding="utf-8")

# Заменяем подключения внешних файлов на инлайн
html = html.replace(
    '<link rel="stylesheet" href="style.css?v=1" />',
    f"<style>\n{css}\n</style>",
)
html = html.replace(
    '<script src="config.js?v=1"></script>',
    f"<script>\n{config}\n</script>",
)
html = html.replace(
    '<script src="script.js?v=1"></script>',
    f"<script>\n{script}\n</script>",
)

out = base / "harmonia.html"
out.write_text(html, encoding="utf-8")
print(f"OK: {out}  ({out.stat().st_size // 1024} KB)")
