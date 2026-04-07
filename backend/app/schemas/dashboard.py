from __future__ import annotations

from pydantic import BaseModel


class DashboardKpiSummary(BaseModel):
    total_orders: int
    total_revenue: float
    average_order_value: float
    repeat_customer_rate: float
    inactive_customer_count: int


class TopProductSummary(BaseModel):
    product_id: str
    product_name: str
    total_sales: float
    total_units: int


class TopBranchSummary(BaseModel):
    branch_id: str
    branch_name: str
    total_revenue: float
    total_orders: int


class RevenueTrendPoint(BaseModel):
    date: str
    label: str
    revenue: float


class RecentTransactionSummary(BaseModel):
    transaction_id: str
    transaction_code: str
    branch_name: str
    transaction_date: str
    total_amount: float


class DashboardSummaryResponse(BaseModel):
    summary: DashboardKpiSummary
    top_products: list[TopProductSummary]
    top_branches: list[TopBranchSummary]
    revenue_trend: list[RevenueTrendPoint]
    recent_transactions: list[RecentTransactionSummary]
