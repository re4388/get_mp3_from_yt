# get_mp3_from_yt

A tool to download MP3 audio from YouTube videos.


## Usage

使用 pnpm 安裝依賴：

```bash
pnpm install
```

下載音訊（指定輸出檔名，副檔名自動補 .mp3）：

```bash
tsx index.ts "<youtube_url>" "<output_name>"
```

範例：
```bash
tsx index.ts "https://www.youtube.com/watch?v=tpH8TEkKQI4" "abc"
# 產出 abc.mp3

# 第二參數為必填，若缺少會直接顯示錯誤並結束
# tsx index.ts "https://www.youtube.com/watch?v=fjOeJssZX_Q"
```

注意：
- 第一個參數必須是有效的 YouTube 連結
- 第二個參數必須提供（中文或英文皆可），會自動補上 .mp3 並過濾不安全字元
- 需有 ffmpeg 環境（若未允許 ffmpeg-static 的腳本，請自行安裝系統 ffmpeg）

執行單元測試：
```bash
pnpm test
```
