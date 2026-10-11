import sqlite3
import os
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(__file__), "bottle_sns.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # ボトル（手紙）テーブル
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bottles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author_id TEXT NOT NULL,
            nickname TEXT NOT NULL,
            prefecture TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL,
            created_at TEXT NOT NULL,
            picked_count INTEGER DEFAULT 0
        )
    """)

    # ボトル受信・リアクション履歴テーブル
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bottle_receipts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bottle_id INTEGER NOT NULL,
            receiver_id TEXT NOT NULL,
            received_at TEXT NOT NULL,
            reaction TEXT DEFAULT NULL,
            FOREIGN KEY (bottle_id) REFERENCES bottles(id)
        )
    """)

    # 初期シードデータ投入（ボトルが空の場合）
    cursor.execute("SELECT COUNT(*) as cnt FROM bottles")
    count = cursor.fetchone()["cnt"]
    if count == 0:
        now = datetime.now(timezone.utc).isoformat()
        seed_bottles = [
            (
                "system-origin-001",
                "最初の漂流者",
                "沖縄県",
                "このボトルを開けてくれてありがとう。青い海に向かって流した想いが、遠くのあなたに届いた奇跡に感謝します。明日もあなたにとって優しい一日になりますように。",
                "感謝",
                now,
                0
            ),
            (
                "system-origin-002",
                "夜空を見上げる旅人",
                "北海道",
                "今夜は星がとても綺麗です。忙しい毎日に追われて空を見上げるのを忘れていませんか？深呼吸して、自分を褒めてあげてくださいね。",
                "つぶやき",
                now,
                0
            ),
            (
                "system-origin-003",
                "名無しの風鈴",
                "京都府",
                "誰にも言えない小さな悩みをボトルに詰めて流しました。海の底に沈んでも、誰かに拾われてもいい。言葉にするだけで少し心が軽くなりました。",
                "秘密",
                now,
                0
            ),
            (
                "system-origin-004",
                "潮風の珈琲店主",
                "神奈川県",
                "温かいコーヒーを一杯どうぞ。海を越えて届く言葉には、SNSの即時性にはない温もりがある気がします。",
                "日常",
                now,
                0
            )
        ]
        cursor.executemany("""
            INSERT INTO bottles (author_id, nickname, prefecture, content, category, created_at, picked_count)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, seed_bottles)

    conn.commit()
    conn.close()
