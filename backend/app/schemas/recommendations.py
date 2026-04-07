from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

RecommendationCategory = Literal["Customer", "Branch", "Product"]
RecommendationPriority = Literal["High", "Medium", "Low"]


class RecommendationItem(BaseModel):
    id: str
    category: RecommendationCategory
    priority: RecommendationPriority
    title: str
    reason: str
    action: str


class RecommendationSummary(BaseModel):
    total_recommendations: int
    high_priority_count: int
    medium_priority_count: int
    low_priority_count: int


class RecommendationsResponse(BaseModel):
    summary: RecommendationSummary
    recommendations: list[RecommendationItem]
    customer_recommendations: list[RecommendationItem]
    branch_recommendations: list[RecommendationItem]
    product_recommendations: list[RecommendationItem]
    ai_summary: str
    next_best_actions: list[str]
