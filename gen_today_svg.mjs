// 今日（JST）の月日・曜日・祝日を描いた静的SVGを生成する。GitHub Actions から毎日実行する想定。
// 使い方: node gen_today_svg.mjs [出力先ディレクトリ=.] [--date=YYYY-MM-DD]
//   → today.svg を書き出す（ダーク対応は SVG 内 CSS の prefers-color-scheme）
// 描画・祝日計算は today_svg.html / today.svg と同じ処理（直すときは揃える）。
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const outDir = args.find(a => !a.startsWith('--')) || '.';
const dateArg = (args.find(a => a.startsWith('--date=')) || '').slice(7);

function parts(d) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', weekday: 'short', year: 'numeric' });
  const o = Object.fromEntries(f.formatToParts(d).map(p => [p.type, p.value]));
  const wd = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(o.weekday);
  return { y: +o.year, m: +o.month, d: +o.day, wd };
}

function fromParam(s) {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s || '');
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  return { y, m: mo, d, wd: new Date(Date.UTC(y, mo - 1, d)).getUTCDay() };
}

const key = t => `${t.y}-${String(t.m).padStart(2, '0')}-${String(t.d).padStart(2, '0')}`;

// 祝日計算（API 取得失敗時のフォールバック。現行の祝日法ベース、春分・秋分は 1980–2099 の近似式）
function calcHolidays(y) {
  const h = {};
  const k = (m, d) => key({ y, m, d });
  const nthMon = (m, n) => 1 + ((8 - new Date(Date.UTC(y, m - 1, 1)).getUTCDay()) % 7) + (n - 1) * 7;
  const eq = c => Math.floor(c + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
  [[1, 1, '元日'], [1, nthMon(1, 2), '成人の日'], [2, 11, '建国記念の日'], [2, 23, '天皇誕生日'],
   [3, eq(20.8431), '春分の日'], [4, 29, '昭和の日'], [5, 3, '憲法記念日'], [5, 4, 'みどりの日'],
   [5, 5, 'こどもの日'], [7, nthMon(7, 3), '海の日'], [8, 11, '山の日'], [9, nthMon(9, 3), '敬老の日'],
   [9, eq(23.2488), '秋分の日'], [10, nthMon(10, 2), 'スポーツの日'], [11, 3, '文化の日'], [11, 23, '勤労感謝の日'],
  ].forEach(([m, d, n]) => { h[k(m, d)] = n; });
  const day = i => { const t = new Date(Date.UTC(y, 0, 1 + i)); return { k: key({ y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }), wd: t.getUTCDay() }; };
  const base = { ...h };
  // 国民の休日: 前後が祝日に挟まれた平日
  for (let i = 1; i < 365; i++) {
    const c = day(i);
    if (!base[c.k] && c.wd !== 0 && base[day(i - 1).k] && base[day(i + 1).k]) h[c.k] = '国民の休日';
  }
  // 振替休日: 日曜の祝日の後、最初の祝日でない日
  for (let i = 0; i < 366; i++) {
    const c = day(i);
    if (c.wd === 0 && base[c.k]) {
      let j = i + 1;
      while (h[day(j).k]) j++;
      h[day(j).k] = '振替休日';
    }
  }
  return h;
}

// holidays-jp（内閣府データ準拠）。その年が収録されていなければ計算にフォールバック
async function holidayName(t) {
  try {
    const res = await fetch('https://holidays-jp.github.io/api/v1/date.json', { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    if (Object.keys(data).some(d => d.startsWith(`${t.y}-`))) return data[key(t)] || null;
  } catch (e) {
    console.warn('holidays-jp 取得失敗、計算にフォールバック:', e.message);
  }
  return calcHolidays(t.y)[key(t)] || null;
}

// ライト/ダークは SVG 内 CSS の prefers-color-scheme で切替（<img> 表示でも CSS は効く）
function buildSVG(t) {
  const W = 500, H = 400;
  // 日曜・祝日=赤、土曜=青は両テーマ共通。平日だけ CSS 変数でテーマ色にする
  const red = t.holiday || t.wd === 0;
  const wdColor = red ? '#d64545' : t.wd === 6 ? '#3a6fd8' : 'var(--fg)';
  const head = red ? '#d64545' : t.wd === 6 ? '#3a6fd8' : 'var(--head)';
  const dy = t.holiday ? -14 : 0;
  const wdText = `${['日','月','火','水','木','金','土'][t.wd]}曜日`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${t.m}月 ${t.d}日 ${wdText}${t.holiday ? ' ' + t.holiday : ''}">
  <style>
    svg { --bg: #fffdf8; --line: #e2ddd2; --fg: #222; --head: #4a4a4a; }
    @media (prefers-color-scheme: dark) {
      svg { --bg: #1d1d1f; --line: #333; --fg: #f2f2f2; --head: #3a3a3c; }
    }
    text { font-family: 'Hiragino Sans', 'Noto Sans JP', 'Helvetica Neue', Arial, sans-serif; text-anchor: middle; }
    .bg { fill: var(--bg); stroke: var(--line); stroke-width: 2; }
    .head { fill: ${head}; }
    .month { fill: #fff; font-size: 34px; font-weight: 700; letter-spacing: 2px; }
    .day, .wd, .hol { fill: ${wdColor}; }
    .day { font-size: 170px; font-weight: 800; }
    .wd { font-size: 40px; font-weight: 600; letter-spacing: 6px; }
    .hol { font-size: 24px; font-weight: 600; letter-spacing: 2px; }
  </style>
  <rect class="bg" x="10" y="10" width="${W - 20}" height="${H - 20}" rx="28"/>
  <path class="head" d="M10 38 a28 28 0 0 1 28 -28 h${W - 76} a28 28 0 0 1 28 28 v62 h-${W - 20} z"/>
  <text class="month" x="${W / 2}" y="70">${t.m}月</text>
  <text class="day" x="${W / 2}" y="${270 + dy}">${t.d}</text>
  <text class="wd" x="${W / 2}" y="${340 + dy}">${wdText}</text>${t.holiday ? `
  <text class="hol" x="${W / 2}" y="368">${t.holiday}</text>` : ''}
</svg>
`;
}

const t = fromParam(dateArg) || parts(new Date());
t.holiday = await holidayName(t);
writeFileSync(join(outDir, 'today.svg'), buildSVG(t));
console.log(`generated ${key(t)} ${t.holiday || ''}`.trim());
