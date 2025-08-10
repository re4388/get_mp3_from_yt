# get_mp3_from_yt

一個用 React + Vite 打造的前端介面，透過後端 Express API（搭配 ffmpeg 與 ytdl）從 YouTube 下載並轉成 MP3，於瀏覽器觸發下載。

## 需求條件（Prerequisites）
- Node.js 18+
- pnpm 8+
- ffmpeg（如果未允許 `ffmpeg-static` 的安裝腳本，請先在系統安裝 ffmpeg，例如 macOS: `brew install ffmpeg`）

## 安裝依賴（Install Dependencies）
```bash
pnpm install
```

## 開發模式（Development）
同時啟動前端（Vite）與後端（Express）：
```bash
pnpm dev
```
- 前端開發伺服器：http://localhost:5173
- 後端 API：http://localhost:5175
- 前端以 Vite 代理 `/api` 到後端，無需手動設定 CORS

你也可以分開啟動：
```bash
# 啟動後端 API（Express）
pnpm dev:server

# 另開一個終端，啟動前端（Vite）
pnpm dev:vite
```

## 建置（Build）
建置前端：
```bash
pnpm build
```
預覽前端（靜態預覽）：
```bash
pnpm preview
```
注意：正式環境建議同時部署：
- 一個 Node 進程執行 `server/index.ts`（提供 `/api/download`）
- 一個靜態伺服器（或 Vite Preview）提供前端打包檔

## 專案腳本（Scripts）
- `pnpm dev`：同時啟動前端與後端（開發模式）
- `pnpm dev:server`：啟動後端 API（Express）
- `pnpm dev:vite`：啟動前端 Vite 開發伺服器
- `pnpm build`：建置前端
- `pnpm preview`：預覽前端打包結果
- `pnpm test`：執行單元測試（Vitest）
- `pnpm test:integration`：執行整合測試（實際連線下載）

## 輸出位置（Output Folder）
- 一般使用（在瀏覽器）：
  - 檔案會由瀏覽器直接下載（Browser download），不會長期存放在伺服器。
- 後端暫存目錄：
  - 伺服器會將轉檔結果暫存於 `tmp_rovodev_build/`，並在回傳後嘗試刪除。
- 整合測試輸出：
  - 整合測試會將檔案輸出至 `integration_test_result/`，檔名格式為 `test_<YYYY_MM_DD>.mp3`。

## 測試（Tests）
- 單元測試：
```bash
pnpm test
```
- 整合測試（會實際連線 YouTube 並下載檔案）：
```bash
pnpm test:integration
```

## 其他說明
- UI 使用 Tailwind CSS 與 shadcn/ui（精簡的按鈕與輸入元件）。
- UI 本身非常直覺：輸入 YouTube 連結與輸出檔名後，按下「下載 MP3」即可觸發瀏覽器下載。
