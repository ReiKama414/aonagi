# AONAGI 青凪

沉浸式月夜水庭視覺故事：滾動驅動的 GSAP 分層場景、小黑貓、環境配樂與自動播放

- GitHub: [ReiKama414/aonagi](https://github.com/ReiKama414/aonagi)
- Site: [reikama414.vercel.app](https://reikama414.vercel.app/)
- Demo: [reikama414.github.io/aonagi](https://reikama414.github.io/aonagi/)
- 規範: [Rei / Code 專案規範](../../README.md)

## 技術棧

- Next.js 14（App Router）+ TypeScript
- GSAP + ScrollTrigger
- 靜態匯出部署至 GitHub Pages

## 啟動

需要 Node.js 18+

```bash
npm install
npm run dev
```

本機建置（無 basePath）:

```bash
npm run build
```

GitHub Pages 建置會帶 `GITHUB_PAGES=true`，由 Actions 執行 `npm run build`（`basePath=/aonagi`）

## 操作

| 操作 | 行為 |
| --- | --- |
| 滾輪／觸控 | 推進場景 |
| 左上播放 | 自動捲動整段旅程 |
| 右上箭頭 | 回到頂部 |
| 左下喇叭 | 靜音／取消靜音 |
| 右側細條 | 捲動進度 |

## 專案結構

```
app/                 # Next.js 路由與全域樣式
components/          # 場景、貓、HUD、預載
lib/                 # 動畫設定、素材路徑、音訊、自動捲動
public/assets/       # 畫面素材（WebP + PNG fallback）
public/audio/        # 循環配樂
.github/workflows/   # GitHub Pages 部署
```

## 第三方與素材

- 畫面與配樂素材由作者自行製作，隨倉庫一併釋出，再散布時請保留 MIT 聲明
- Google Fonts: Shippori Mincho、Noto Serif TC、Jost

## License / 權限

[MIT License](./LICENSE) — Copyright (c) 2026 ReiKama414

程式碼與隨附素材依 [LICENSE](./LICENSE) 授權

- GitHub: [ReiKama414/aonagi](https://github.com/ReiKama414/aonagi)
- Site: [reikama414.vercel.app](https://reikama414.vercel.app/)
