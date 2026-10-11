from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import List, Optional

from database import get_db, init_db
from models import (
    BottleCreate,
    BottleReactionCreate,
    BottleResponse,
    PostBottleResult,
    SentBottleItem,
    ReceivedBottleItem,
    StatsResponse
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # アプリ起動時にデータベースを初期化
    init_db()
    yield

app = FastAPI(
    title="漂流瓶 - Bottle Message SNS API",
    description="メッセージを海に流すと、誰かのメッセージが一つ届くボトルメールSNS",
    version="1.0.0",
    lifespan=lifespan
)

# CORS設定（Reactフロントエンド等からの通信を許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Bottle Message SNS Backend is running smoothly 🌊"}

@app.post("/api/bottles", response_model=PostBottleResult)
def throw_and_receive_bottle(payload: BottleCreate):
    """
    自分がボトルを海に流すと、日本の誰かが流したボトルが1つ手元に流れ着きます。
    """
    conn = get_db()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()

    try:
        # 1. 自分のボトルを海へ流す（INSERT）
        cursor.execute("""
            INSERT INTO bottles (author_id, nickname, prefecture, content, category, created_at, picked_count)
            VALUES (?, ?, ?, ?, ?, ?, 0)
        """, (
            payload.author_id,
            payload.nickname.strip(),
            payload.prefecture.strip(),
            payload.content.strip(),
            payload.category.strip(),
            now_iso
        ))
        new_bottle_id = cursor.lastrowid

        # 2. 海を漂っている他の人のボトルを1件ランダムに引き当てる
        # 条件: 自分以外のボトル かつ まだ自分が拾ったことがないボトル
        cursor.execute("""
            SELECT b.* FROM bottles b
            WHERE b.author_id != ?
            AND b.id NOT IN (
                SELECT bottle_id FROM bottle_receipts WHERE receiver_id = ?
            )
            ORDER BY RANDOM()
            LIMIT 1
        """, (payload.author_id, payload.author_id))
        candidate = cursor.fetchone()

        # もし未読のボトルが無ければ、自分以外のボトルから最も拾われた回数が少ないものをランダムに再抽選
        if not candidate:
            cursor.execute("""
                SELECT b.* FROM bottles b
                WHERE b.author_id != ?
                ORDER BY b.picked_count ASC, RANDOM()
                LIMIT 1
            """, (payload.author_id,))
            candidate = cursor.fetchone()

        received_data = None
        if candidate:
            target_id = candidate["id"]
            # 拾われた回数をインクリメント
            cursor.execute("UPDATE bottles SET picked_count = picked_count + 1 WHERE id = ?", (target_id,))
            
            # 受信履歴に記録
            cursor.execute("""
                INSERT INTO bottle_receipts (bottle_id, receiver_id, received_at)
                VALUES (?, ?, ?)
            """, (target_id, payload.author_id, now_iso))
            
            received_data = BottleResponse(
                id=candidate["id"],
                nickname=candidate["nickname"],
                prefecture=candidate["prefecture"],
                content=candidate["content"],
                category=candidate["category"],
                created_at=candidate["created_at"],
                picked_count=candidate["picked_count"] + 1,
                user_reaction=None
            )

        conn.commit()
        return PostBottleResult(
            message="あなたのメッセージを海に流しました。",
            sent_bottle_id=new_bottle_id,
            received_bottle=received_data
        )
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/bottles/{bottle_id}/react")
def react_to_bottle(bottle_id: int, payload: BottleReactionCreate):
    """
    受け取ったボトルに対して温かいリアクション（波の音、共感、感謝など）を送ります。
    """
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE bottle_receipts
            SET reaction = ?
            WHERE bottle_id = ? AND receiver_id = ?
        """, (payload.reaction, bottle_id, payload.receiver_id))
        
        if cursor.rowcount == 0:
            # まだreceiptがない場合は作成
            now_iso = datetime.now(timezone.utc).isoformat()
            cursor.execute("""
                INSERT INTO bottle_receipts (bottle_id, receiver_id, received_at, reaction)
                VALUES (?, ?, ?, ?)
            """, (bottle_id, payload.receiver_id, now_iso, payload.reaction))
        
        conn.commit()
        return {"status": "ok", "message": "リアクションを海に返しました"}
    finally:
        conn.close()

@app.get("/api/bottles/my-sent", response_model=List[SentBottleItem])
def get_my_sent_bottles(author_id: str = Query(...)):
    """自分が過去に海へ流したボトルの一覧と、誰かに拾われた状況"""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id, content, category, prefecture, created_at, picked_count
            FROM bottles
            WHERE author_id = ?
            ORDER BY id DESC
        """, (author_id,))
        rows = cursor.fetchall()
        
        result = []
        for r in rows:
            # このボトルに寄せられたリアクション一覧を取得
            cursor.execute("""
                SELECT reaction FROM bottle_receipts
                WHERE bottle_id = ? AND reaction IS NOT NULL
            """, (r["id"],))
            reactions = [rec["reaction"] for rec in cursor.fetchall()]

            result.append(SentBottleItem(
                id=r["id"],
                content=r["content"],
                category=r["category"],
                prefecture=r["prefecture"],
                created_at=r["created_at"],
                picked_count=r["picked_count"],
                reactions=reactions
            ))
        return result
    finally:
        conn.close()

@app.get("/api/bottles/my-received", response_model=List[ReceivedBottleItem])
def get_my_received_bottles(receiver_id: str = Query(...)):
    """自分が海から拾い上げたボトルのコレクション（宝箱）"""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT 
                r.id as receipt_id,
                b.id as bottle_id,
                b.nickname,
                b.prefecture,
                b.content,
                b.category,
                r.received_at,
                r.reaction
            FROM bottle_receipts r
            JOIN bottles b ON r.bottle_id = b.id
            WHERE r.receiver_id = ?
            ORDER BY r.id DESC
        """, (receiver_id,))
        rows = cursor.fetchall()
        
        return [
            ReceivedBottleItem(
                receipt_id=r["receipt_id"],
                bottle_id=r["bottle_id"],
                nickname=r["nickname"],
                prefecture=r["prefecture"],
                content=r["content"],
                category=r["category"],
                received_at=r["received_at"],
                reaction=r["reaction"]
            )
            for r in rows
        ]
    finally:
        conn.close()

@app.get("/api/stats", response_model=StatsResponse)
def get_ocean_stats():
    """海全体の統計情報"""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT COUNT(*) as cnt FROM bottles")
        total_bottles = cursor.fetchone()["cnt"]

        cursor.execute("SELECT SUM(picked_count) as total_picked FROM bottles")
        res = cursor.fetchone()["total_picked"]
        total_deliveries = res if res else 0

        cursor.execute("SELECT COUNT(DISTINCT prefecture) as pref_cnt FROM bottles")
        active_prefectures = cursor.fetchone()["pref_cnt"]

        return StatsResponse(
            total_bottles=total_bottles,
            total_deliveries=total_deliveries,
            active_prefectures_count=active_prefectures
        )
    finally:
        conn.close()
