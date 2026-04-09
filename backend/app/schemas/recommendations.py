from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.ai import AISummaryResponse
from app.schemas.next_best_action import NextBestActionItem

RecommendationCategory = Literal["Customer", "Branch", "Product"]
RecommendationPriority = Literal["High", "Medium", "Low"]


class RecommendationItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    category: RecommendationCategory
    priority: RecommendationPriority
    title: str
    reason: str
    action: str


class RecommendationSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    total_recommendations: int
    high_priority_count: int
    medium_priority_count: int
    low_priority_count: int


class RecommendationsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    summary: RecommendationSummary
    recommendations: list[RecommendationItem]
    customer_recommendations: list[RecommendationItem]
    branch_recommendations: list[RecommendationItem]
    product_recommendations: list[RecommendationItem]
    ai_summary: AISummaryResponse
    next_best_actions: list[NextBestActionItem]
    next_best_actions_used_fallback: bool
