from __future__ import annotations

from pydantic import BaseModel


class BranchInsightItem(BaseModel):
    id: str
    branch_name: str
    branch_code: str
    city: str
    address: str
    status: str
    total_revenue: float
    total_orders: int
    average_order_value: float
    unique_customer_count: int
    repeat_customer_rate: float
    latest_transaction_date: str | None


class BranchInsightsSummary(BaseModel):
    total_branches: int
    top_branch_name: str | None
    weakest_branch_name: str | None
    total_branch_revenue: float


class BranchInsightsResponse(BaseModel):
    summary: BranchInsightsSummary
    top_branches: list[BranchInsightItem]
    recent_activity: list[BranchInsightItem]
    branches: list[BranchInsightItem]


class ProductInsightItem(BaseModel):
    id: str
    product_name: str
    category: str
    status: str
    base_price: float
    total_revenue: float
    total_units_sold: int
    total_orders: int
    average_selling_price: float
    latest_activity_date: str | None


class ProductInsightsSummary(BaseModel):
    total_products: int
    top_product_name: str | None
    weakest_product_name: str | None
    total_product_revenue: float


class ProductInsightsResponse(BaseModel):
    summary: ProductInsightsSummary
    top_products: list[ProductInsightItem]
    recent_activity: list[ProductInsightItem]
    products: list[ProductInsightItem]


class SegmentSummaryItem(BaseModel):
    segment: str
    count: int


class ChurnSummaryItem(BaseModel):
    status: str
    count: int


class CustomerInsightItem(BaseModel):
    id: str
    customer_code: str
    full_name: str
    email: str
    phone_number: str
    gender: str
    loyalty_member: bool
    total_visits: int
    total_spending: float
    average_order_value: float
    latest_transaction_date: str | None
    latest_branch_name: str | None
    is_repeat_customer: bool
    is_active_customer: bool
    is_inactive_customer: bool
    segment: str
    churn_status: str
    days_since_last_purchase: int | None


class CustomerInsightsSummary(BaseModel):
    total_customers: int
    active_customers: int
    repeat_customers: int
    inactive_customers: int
    loyalty_members: int
    total_customer_spending: float
    average_customer_spending: float
    repeat_customer_rate: float


class CustomerInsightsResponse(BaseModel):
    summary: CustomerInsightsSummary
    segment_summary: list[SegmentSummaryItem]
    churn_summary: list[ChurnSummaryItem]
    top_customers: list[CustomerInsightItem]
    churn_priority_customers: list[CustomerInsightItem]
    recent_activity: list[CustomerInsightItem]
    customers: list[CustomerInsightItem]


class CustomerSegmentationResponse(BaseModel):
    segment_summary: list[SegmentSummaryItem]


class ChurnDetectionResponse(BaseModel):
    churn_summary: list[ChurnSummaryItem]
    priority_customers: list[CustomerInsightItem]
