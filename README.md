# 📈 실시간 지수 (모바일 웹)

코스피 · 나스닥 종합 · S&P 500 · 나스닥100 선물(NQ1!) · SOXX · DRAM(Roundhill Memory ETF)을
휴대폰에서 한눈에 보는 웹페이지입니다. 15초마다 자동 갱신됩니다.

## 구조

```
휴대폰 브라우저 ──> GitHub Pages (index.html)
                       │ fetch (15초마다)
                       ▼
               Cloudflare Worker (worker/worker.js) ──> Yahoo Finance
```

브라우저에서 Yahoo/네이버 시세 API를 직접 부르면 CORS로 막히고,
TradingView 무료 위젯은 KOSPI·나스닥·S&P·NQ1! 표시를 막아 두어서,
무료 Cloudflare Worker를 중계 서버로 씁니다. (무료 한도: 하루 10만 요청)

## 1단계: Cloudflare Worker 배포 (5분)

1. https://dash.cloudflare.com 가입/로그인
2. **Workers & Pages → Create → Create Worker** → 이름 예: `stock-proxy` → Deploy
3. **Edit code** 클릭 → 기존 코드를 지우고 `worker/worker.js` 내용을 그대로 붙여넣기 → **Deploy**
4. 주소 확인: `https://stock-proxy.<내아이디>.workers.dev/?symbols=^KS11` 를 열어 JSON이 나오면 성공

## 2단계: 페이지에 Worker 주소 넣기

`index.html`에서 아래 줄을 수정합니다.

```js
const WORKER_URL = "https://stock-proxy.<내아이디>.workers.dev";
```

## 3단계: GitHub Pages 배포

```bash
git init
git add .
git commit -m "실시간 지수 페이지"
git branch -M main
gh repo create stock_index --public --source=. --push
```

GitHub 저장소 → **Settings → Pages → Source: Deploy from a branch → main / (root)** → Save.
1~2분 후 `https://<깃허브아이디>.github.io/stock_index/` 에서 열립니다.

## 갤럭시 홈 화면에 앱처럼 추가

Chrome / 삼성 인터넷에서 페이지 열기 → 메뉴(⋮ 또는 ≡) → **홈 화면에 추가**.

## 로컬 테스트

```bash
node worker/dev-server.mjs          # Worker를 localhost:8787에서 실행
python3 -m http.server 8765         # http://localhost:8765 접속 (localhost면 자동으로 8787 사용)
```

## 종목 바꾸기

- `index.html`의 `SYMBOLS` 배열 (`id` = Yahoo 심볼, `tv` = TradingView 차트 심볼)
- `worker/worker.js`의 `ALLOWED` 목록에도 같은 Yahoo 심볼을 추가 후 Worker 재배포

## 참고

- 상승 빨강 / 하락 파랑 (국내 표기 방식)
- Yahoo 데이터는 거래소에 따라 지연 시세일 수 있습니다.
- DRAM = Roundhill Memory ETF (Cboe BZX 상장)
