# today_svg

今日（JST）の月・日・曜日・祝日を描いた SVG。日曜・祝日は赤、土曜は青。

![today](https://shinichi-ohki.github.io/today_svg/today.svg)

- `today.svg` — GitHub Actions が毎日 JST 0:00 に生成してコミットする静的 SVG。`<img>` や Cosense（`[https://shinichi-ohki.github.io/today_svg/today.svg]`）にそのまま貼れる。ダーク対応は SVG 内 CSS の `prefers-color-scheme`
- `today_svg.html` — ブラウザで開いた時点の日付を描くページ（`?date=` `?lang=en` `?tz=` `?theme=dark` `?raw`）
- `gen_today_svg.mjs` — 生成スクリプト（`node gen_today_svg.mjs [出力先] [--date=YYYY-MM-DD]`）

祝日は [holidays-jp](https://holidays-jp.github.io/) から取得し、失敗時は祝日法のルールから計算する。
