# シマエナガ算数（PWA）

GitHub Pages で公開する手順（ユーザー: **kichitaka-png** / リポジトリ: **shimaenaga-math**）。

## 使い方（WebだけでOK）
1. GitHubで空のリポジトリを作成: **kichitaka-png/shimaenaga-math**
2. このフォルダの中身を丸ごとアップロード（ドラッグ＆ドロップでOK）。
3. 自動で **GitHub Actions** が走ります（`.github/workflows/pages.yml`）。
4. 1〜2分後、公開URL: `https://kichitaka-png.github.io/shimaenaga-math/`

> 404が出る場合は1〜2分待ってからリロードしてください。

## ローカル開発（任意）
```bash
npm install
npm run dev
# ブラウザで http://localhost:5173
```

## ビルド（任意）
```bash
npm run build
npm run preview
```

## PWA について
- `public/manifest.webmanifest` と `public/sw.js` を同一オリジンで配信しています。
- Service Worker は相対パス `sw.js` で登録しているので、GitHub Pages のサブパスでも動作します。
- iOS の場合は Safari の共有メニューから「ホーム画面に追加」でインストールできます。

## アイコン差し替え（任意）
- `public/icons/icon-192.png` と `public/icons/icon-512.png` をお好みの画像に変更してください。

---

このプロジェクトには以下が含まれています：
- React + Vite + Tailwind + framer-motion
- アップテンポBGM / 効果音
- 絵柄バリエーション（名札3匹：きちひさ・いちか・ななか）
- ご褒美演出（紙吹雪・行進）
- GitHub Pages 自動デプロイ用ワークフロー
