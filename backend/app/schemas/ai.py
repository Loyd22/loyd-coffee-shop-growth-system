from __future__ import annotations

from pydantic import BaseModel


class AISummaryResponse(BaseModel):
    summary: str
    generated_at: str


class NextBestActionsResponse(BaseModel):
    actions: list[str]
    generated_at: str
