# 🌊 漂流瓶 (Bottle Mail SNS)

自分がメッセージを海に流すと、日本の誰かが投稿したメッセージを一つだけ受け取れる、ボトルメール形式の次世代SNSです。

即時性といいね競争に疲れた現代に向けて、「言葉を放つことで、偶然どこかの誰かと巡り合う」という一期一会の情緒的なコミュニケーション体験を提供します。

---

## 🛠 技術スタック

- **フロントエンド**: React 19 + TypeScript + Vite
  - 海と波・星空の幻想的なCSSアニメーション
  - 羊皮紙の手紙ペーパー風モーダル＆リアクション演出
  - アイコン: `lucide-react`
  - お祝いエフェクト: `canvas-confetti`
- **バックエンド**: Python 3 + FastAPI + Uvicorn
  - 軽量・高速なRESTful API
  - 自動Swagger UI生成 (`/docs`)
  - クロスオリジン通信対応 (CORS)
- **データベース**: SQLite
  - 外部DBサーバー不要の軽量埋め込みDB (`backend/bottle_sns.db`)
  - 初回起動時に温かい初期メッセージ（シードデータ）を自動投入

---

## 📁 ディレクトリ構成

```text
bottle_message/
├── backend/                  # Pythonバックエンド
│   ├── bottle_sns.db         # SQLiteデータベース（自動生成）
│   ├── database.py           # DB接続・テーブル作成・初期シード投入
│   ├── models.py             # Pydanticデータモデル定義
│   ├── main.py               # FastAPIエンドポイント定義
│   └── requirements.txt      # バックエンド依存関係
├── frontend/                 # Reactフロントエンド
│   ├── src/
│   │   ├── App.tsx           # メインUI（流す/拾う/記録/リアクション）
│   │   ├── index.css         # 波のアニメーション・Glassmorphismスタイル
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── start.bat                 # 1クリック起動バッチ（Windows用）
└── README.md
```

---

## 🚀 起動方法

### 簡単起動（Windows）
プロジェクト直下にある **`start.bat`** をダブルクリックするだけで、バックエンドとフロントエンドが自動で起動します。

---

### 手動で起動する場合

#### 1. バックエンドの起動
ターミナルを開き、以下を実行します：
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
- APIサーバー: http://localhost:8000
- API仕様書 (Swagger): http://localhost:8000/docs

#### 2. フロントエンドの起動
別のターミナルを開き、以下を実行します：
```bash
cd frontend
npm install
npm run dev
```
- ブラウザで **http://localhost:5173** にアクセスします。

---

## 💡 コア機能・仕様

1. **海へ流す（Throw & Receive）**:
   - メッセージ（日常、悩み、秘密、感謝、願いなど）と地域を選択して「海へ流す」を押します。
   - 自分のボトルが海に保存されると同時に、**海を漂流している他の誰かのボトルが1通だけあなたの手元に漂着します**。
   - コルクを開けるような手紙モーダルで本文を読み、温かいリアクション（🌊 祈り、🌸 心が温まった、🕊️ 届いたよ など）を1タップで相手に返すことができます。
2. **拾ったボトル（Received Collection）**:
   - これまで海から拾い上げたメッセージをいつでも振り返ることができるアーカイブ。
3. **流した記録（Sent Bottles & Drift Count）**:
   - 自分がこれまでに海へ放ったボトルの漂流状況（「海を漂流中」または「〇人が拾い上げました」）と、相手から届いたリアクションを確認できます。
4. **海の統計情報**:
   - 現在海を漂うボトルの総数、受け渡された奇跡の回数がヘッダーにリアルタイム表示されます。
