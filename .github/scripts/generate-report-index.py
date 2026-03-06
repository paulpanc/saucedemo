#!/usr/bin/env python3
"""Generate the landing page index.html for the GitHub Pages test report."""

import os

run_number = os.environ["RUN_NUMBER"]
git_sha = os.environ["GIT_SHA"]
run_url = os.environ["RUN_URL"]

browsers = sorted(
    d for d in os.listdir("report")
    if os.path.isdir(f"report/{d}")
)

cards = "\n".join(
    f'        <li><a href="{b}/index.html">{b}</a></li>'
    for b in browsers
)

html = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Saucedemo E2E — Test Reports</title>
    <style>
      *, *::before, *::after {{ box-sizing: border-box; }}
      body {{
        font-family: system-ui, -apple-system, sans-serif;
        max-width: 680px;
        margin: 4rem auto;
        padding: 0 1.25rem;
        color: #1f2328;
        background: #fff;
      }}
      h1 {{ font-size: 1.4rem; margin: 0 0 .35rem; }}
      .meta {{
        font-size: .85rem;
        color: #57606a;
        margin: 0 0 2rem;
      }}
      .meta a {{ color: inherit; }}
      ul {{
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-wrap: wrap;
        gap: .75rem;
      }}
      li a {{
        display: inline-block;
        padding: .5rem 1.25rem;
        border-radius: 6px;
        background: #0969da;
        color: #fff;
        text-decoration: none;
        font-size: .9rem;
        font-weight: 500;
        transition: background .15s;
      }}
      li a:hover {{ background: #0550ae; }}
    </style>
  </head>
  <body>
    <h1>Saucedemo E2E Test Reports</h1>
    <p class="meta">
      <a href="{run_url}">Run #{run_number}</a>
      &ensp;&middot;&ensp;
      Commit <code>{git_sha[:8]}</code>
    </p>
    <ul>
{cards}
    </ul>
  </body>
</html>
"""

with open("report/index.html", "w") as f:
    f.write(html)

print(f"Landing page written — browsers: {', '.join(browsers)}")
