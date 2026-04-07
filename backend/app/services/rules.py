from __future__ import annotations

from datetime import datetime, timedelta

CUSTOMER_SEGMENTS: list[str] = [
    "Loyal Customer",
    "High-Value Customer",
    "Frequent Buyer",
    "Occasional Buyer",
    "Inactive Customer",
    "New / One-Time Customer",
    "No Orders Yet",
]

CHURN_STATUSES: list[str] = [
    "Active",
    "At Risk",
    "Churned",
    "No Orders Yet",
]


def get_customer_segment(
    *,
    total_visits: int,
    total_spending: float,
    loyalty_member: bool,
    latest_transaction_date: datetime | None,
    today: datetime,
) -> str:
    if total_visits == 0:
        return "No Orders Yet"

    thirty_days_ago = today - timedelta(days=30)

    is_inactive = (
        latest_transaction_date is not None and latest_transaction_date < thirty_days_ago
    )

    if is_inactive:
        return "Inactive Customer"

    if loyalty_member and total_visits > 1:
        return "Loyal Customer"

    if total_spending >= 3000:
        return "High-Value Customer"

    if total_visits >= 5:
        return "Frequent Buyer"

    if 2 <= total_visits <= 4:
        return "Occasional Buyer"

    return "New / One-Time Customer"


def get_churn_status(
    *,
    total_visits: int,
    latest_transaction_date: datetime | None,
    today: datetime,
) -> str:
    if total_visits == 0 or latest_transaction_date is None:
        return "No Orders Yet"

    diff_in_days = (today - latest_transaction_date).days

    if diff_in_days <= 30:
        return "Active"

    if diff_in_days <= 60:
        return "At Risk"

    return "Churned"


def get_days_since_last_purchase(
    *, latest_transaction_date: datetime | None, today: datetime
) -> int | None:
    if latest_transaction_date is None:
        return None

    return (today - latest_transaction_date).days


def format_short_date(value: datetime) -> str:
    return value.strftime("%b %d")


def to_iso_datetime(value: datetime | None) -> str | None:
    if value is None:
        return None

    return value.isoformat()
