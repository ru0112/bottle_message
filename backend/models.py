from pydantic import BaseModel, Field
from typing import Optional, List

class BottleCreate(BaseModel):
    author_id: str = Field(..., description="匿名ユーザーの識別ID")
    nickname: str = Field(..., max_length=30, description="ペンネーム")
    prefecture: str = Field(..., max_length=20, description="流した地域・都道府県")
    content: str = Field(..., min_length=1, max_length=1000, description="メッセージ本文")
    category: str = Field(default="日常", max_length=20, description="ボトルのテーマ（日常、秘密、悩み、感謝など）")

class BottleReactionCreate(BaseModel):
    receiver_id: str
    reaction: str = Field(..., description="絵文字またはリアクション（🌊 読んだよ, 🌸 心が温まった など）")

class BottleResponse(BaseModel):
    id: int
    nickname: str
    prefecture: str
    content: str
    category: str
    created_at: str
    picked_count: int
    user_reaction: Optional[str] = None

class PostBottleResult(BaseModel):
    message: str
    sent_bottle_id: int
    received_bottle: Optional[BottleResponse] = None

class SentBottleItem(BaseModel):
    id: int
    content: str
    category: str
    prefecture: str
    created_at: str
    picked_count: int
    reactions: List[str] = []

class ReceivedBottleItem(BaseModel):
    receipt_id: int
    bottle_id: int
    nickname: str
    prefecture: str
    content: str
    category: str
    received_at: str
    reaction: Optional[str] = None

class StatsResponse(BaseModel):
    total_bottles: int
    total_deliveries: int
    active_prefectures_count: int
