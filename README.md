# today_svg

今日（JST）の月・日・曜日・祝日を描いた SVG。日曜・祝日は赤、土曜は青。

![today](https://shinichi-ohki.github.io/today_svg/today.svg)

- `today.svg` — GitHub Actions が毎日 JST 0:00 に生成してコミットする静的 SVG。`<img>` や Cosense（`[https://shinichi-ohki.github.io/today_svg/today.svg]`）にそのまま貼れる。ダーク対応は SVG 内 CSS の `prefers-color-scheme`
- `today_svg.html` — ブラウザで開いた時点の日付を描くページ（`?date=` `?lang=en` `?tz=` `?theme=dark` `?raw`）
- `gen_today_svg.mjs` — 生成スクリプト（`node gen_today_svg.mjs [出力先] [--date=YYYY-MM-DD]`）

## ダークテーマ

ダークテーマには自動で対応する。SVG 内の CSS（`@media (prefers-color-scheme: dark)`）で背景と平日の文字色が切り替わる（日曜・祝日の赤、土曜の青はそのまま）。

- 切り替えは OS / ブラウザのダークモード設定に従う
- 貼り付け先サイト独自のテーマ（例: Cosense のテーマ設定）には連動しない

## 更新タイミング

GitHub Actions は JST 0:00 に動き始めるため、日付が切り替わるまで少し時間がかかる（数分〜数十分程度）。

- Actions の定時実行は混雑時に遅れることがある
- 生成後に GitHub Pages のデプロイが走る
- GitHub Pages は `Cache-Control: max-age=600` を返すので、ブラウザや貼り付け先に最大10分ほど前日の画像が残ることがある

祝日は [holidays-jp](https://holidays-jp.github.io/) から取得し、失敗時は祝日法のルールから計算する。
