from __future__ import annotations

from datetime import datetime
from typing import Any


def build_ai_summary(
    *, dashboard_summary: dict[str, Any], recommendations: list[dict[str, Any]]
) -> str:
    total_revenue = dashboard_summary["summary"]["total_revenue"]
    total_orders = dashboard_summary["summary"]["total_orders"]
    repeat_rate = dashboard_summary["summary"]["repeat_customer_rate"]

    high_priority_count = sum(
        1 for recommendation in recommendations if recommendation["priority"] == "High"
    )

    if recommendations:
        top_focus = recommendations[0]["title"]
    else:
        top_focus = "No immediate actions detected from current data."

    return (
        "Business snapshot: PHP "
        f"{total_revenue:,.2f} revenue from {total_orders} orders with "
        f"{repeat_rate:.1f}% repeat-customer rate. "
        f"There are {high_priority_count} high-priority recommendations. "
        f"Top focus: {top_focus}"
    )


def build_next_best_actions(
    *, recommendations: list[dict[str, Any]], limit: int = 5
) -> list[str]:
    if not recommendations:
        return [
            "No urgent action is needed right now; continue monitoring daily KPIs and data quality."
        ]

    return [
        f"[{recommendation['priority']}] {recommendation['title']} - {recommendation['action']}"
        for recommendation in recommendations[:limit]
    ]


def generated_at_iso() -> str:
    return datetime.now().isoformat()
