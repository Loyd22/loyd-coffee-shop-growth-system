from __future__ import annotations

"""
Schemas for Step 31 - Next Best Actions.

Why this file exists:
- It defines a strict input contract for structured metrics.
- It defines a strict output contract for UI-friendly action cards.
- It keeps API validation and shape consistency in one place.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

NextBestActionPriority = Literal["High", "Medium", "Low"]
NextBestActionCategory = Literal["Customer", "Branch", "Product", "Overall"]


class BranchPerformanceMetric(BaseModel):
    """
    Snapshot of branch-level performance used by the AI.
    """

    model_config = ConfigDict(extra="forbid")

    branch_name: str = Field(..., description="Branch display name")
    total_revenue: float = Field(..., ge=0, description="Branch total revenue")
    repeat_customer_rate: float = Field(
        ..., ge=0, le=100, description="Branch repeat-customer rate in percent"
    )


class ProductPerformanceMetric(BaseModel):
    """
    Snapshot of product-level performance used by the AI.
    """

    model_config = ConfigDict(extra="forbid")

    product_name: str = Field(..., description="Product display name")
    total_revenue: float = Field(..., ge=0, description="Product total revenue")


class RecommendationSummaryMetric(BaseModel):
    """
    Aggregated recommendation counts from existing recommendation logic.
    """

    model_config = ConfigDict(extra="forbid")

    total_recommendations: int = Field(..., ge=0)
    high_priority_count: int = Field(..., ge=0)
    medium_priority_count: int = Field(..., ge=0)
    low_priority_count: int = Field(..., ge=0)


class NextBestActionMetrics(BaseModel):
    """
    Full structured metrics payload for Step 31.
    """

    model_config = ConfigDict(extra="forbid")

    total_revenue: float = Field(..., ge=0)
    total_orders: int = Field(..., ge=0)
    average_order_value: float = Field(..., ge=0)
    repeat_customer_rate: float = Field(..., ge=0, le=100)
    inactive_customers: int = Field(..., ge=0)
    churned_customers: int = Field(..., ge=0)
    at_risk_customers: int = Field(..., ge=0)
    loyal_customers: int = Field(..., ge=0)
    top_branch: BranchPerformanceMetric
    weakest_branch: BranchPerformanceMetric
    top_product: ProductPerformanceMetric
    weakest_product: ProductPerformanceMetric
    recommendation_summary: RecommendationSummaryMetric


class NextBestActionsRequest(BaseModel):
    """
    Request model for the next-best-action endpoint.
    """

    model_config = ConfigDict(extra="forbid")

    metrics: NextBestActionMetrics
    max_actions: int = Field(default=3, ge=1, le=6)
    notes: str | None = Field(
        default=None,
        max_length=500,
        description="Optional business context to guide action selection",
    )


class NextBestActionItem(BaseModel):
    """
    Single action card returned to the frontend.
    """

    model_config = ConfigDict(extra="forbid")

    title: str = Field(..., min_length=4, max_length=120)
    summary: str = Field(..., min_length=10, max_length=300)
    reasons: list[str] = Field(default_factory=list, min_length=1, max_length=4)
    recommended_action: str = Field(..., min_length=10, max_length=300)
    priority: NextBestActionPriority
    category: NextBestActionCategory


class NextBestActionsResponse(BaseModel):
    """
    Structured response for Step 31.
    """

    model_config = ConfigDict(extra="forbid")

    actions: list[NextBestActionItem] = Field(default_factory=list)
    used_fallback: bool = Field(
        default=False,
        description="True when deterministic fallback actions were used",
    )
