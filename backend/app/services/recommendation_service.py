from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.schemas.next_best_action import (
    BranchPerformanceMetric,
    NextBestActionMetrics,
    NextBestActionsRequest,
    ProductPerformanceMetric,
    RecommendationSummaryMetric,
)
from app.schemas.ai import AISummaryResponse
from app.services import analytics_service
from app.services.next_best_action_service import generate_next_best_actions


def _format_currency(value: float) -> str:
    """
    Format a number as Philippine peso currency text.
    """
    return f"PHP {value:,.2f}"


def _build_ai_summary(
    dashboard_summary: dict[str, Any],
    recommendations: list[dict[str, Any]],
) -> AISummaryResponse:
    """
    Build a structured AI-style business summary that matches
    the real AISummaryResponse schema.
    """
    total_revenue = dashboard_summary.get("total_revenue", 0)
    total_orders = dashboard_summary.get("total_orders", 0)
    repeat_customer_rate = dashboard_summary.get("repeat_customer_rate", 0)

    high_priority_recommendations = [
        recommendation
        for recommendation in recommendations
        if recommendation["priority"] == "High"
    ]

    top_focus = (
        high_priority_recommendations[0]["title"]
        if high_priority_recommendations
        else (recommendations[0]["title"] if recommendations else "General business review")
    )

    highlights = [
        f"Total revenue is {_format_currency(total_revenue)}.",
        f"Total recorded orders are {total_orders}.",
        f"Repeat customer rate is {repeat_customer_rate:.1f}%.",
    ]

    risks = []
    if high_priority_recommendations:
        risks.append(
            f"There are {len(high_priority_recommendations)} high-priority recommendation(s) that need attention."
        )
    else:
        risks.append("No high-priority recommendation is currently flagged.")

    return AISummaryResponse(
        title="AI Business Summary",
        summary=(
            f"Business snapshot: {_format_currency(total_revenue)} revenue from "
            f"{total_orders} orders with {repeat_customer_rate:.1f}% repeat-customer rate. "
            f"Top focus: {top_focus}."
        ),
        highlights=highlights,
        risks=risks,
        focus_area=top_focus,
    )


def _build_branch_metric(branch: dict[str, Any] | None) -> BranchPerformanceMetric:
    """
    Convert branch analytics into the strict Step 31 branch metric schema.
    """
    if not branch:
        return BranchPerformanceMetric(
            branch_name="N/A",
            total_revenue=0.0,
            repeat_customer_rate=0.0,
        )

    return BranchPerformanceMetric(
        branch_name=branch.get("branch_name", "N/A"),
        total_revenue=float(branch.get("total_revenue", 0.0)),
        repeat_customer_rate=float(branch.get("repeat_customer_rate", 0.0)),
    )


def _build_product_metric(product: dict[str, Any] | None) -> ProductPerformanceMetric:
    """
    Convert product analytics into the strict Step 31 product metric schema.
    """
    if not product:
        return ProductPerformanceMetric(
            product_name="N/A",
            total_revenue=0.0,
        )

    return ProductPerformanceMetric(
        product_name=product.get("product_name", "N/A"),
        total_revenue=float(product.get("total_revenue", 0.0)),
    )


def _build_next_best_action_metrics(
    *,
    dashboard_data: dict[str, Any],
    top_branch: dict[str, Any] | None,
    weakest_branch: dict[str, Any] | None,
    top_product: dict[str, Any] | None,
    weakest_product: dict[str, Any] | None,
    inactive_customers: int,
    churned_customers: int,
    at_risk_customers: int,
    loyal_customers: int,
    recommendation_summary: dict[str, int],
) -> NextBestActionMetrics:
    """
    Build the exact Step 31 structured metrics payload from existing analytics.
    """
    dashboard_summary = dashboard_data.get("summary", {})

    return NextBestActionMetrics(
        total_revenue=float(dashboard_summary.get("total_revenue", 0.0)),
        total_orders=int(dashboard_summary.get("total_orders", 0)),
        average_order_value=float(dashboard_summary.get("average_order_value", 0.0)),
        repeat_customer_rate=float(dashboard_summary.get("repeat_customer_rate", 0.0)),
        inactive_customers=inactive_customers,
        churned_customers=churned_customers,
        at_risk_customers=at_risk_customers,
        loyal_customers=loyal_customers,
        top_branch=_build_branch_metric(top_branch),
        weakest_branch=_build_branch_metric(weakest_branch),
        top_product=_build_product_metric(top_product),
        weakest_product=_build_product_metric(weakest_product),
        recommendation_summary=RecommendationSummaryMetric(
            total_recommendations=int(
                recommendation_summary.get("total_recommendations", 0)
            ),
            high_priority_count=int(recommendation_summary.get("high_priority_count", 0)),
            medium_priority_count=int(
                recommendation_summary.get("medium_priority_count", 0)
            ),
            low_priority_count=int(recommendation_summary.get("low_priority_count", 0)),
        ),
    )


def get_recommendations(db: Session) -> dict[str, Any]:
    """
    Build the full recommendations response for the frontend.
    """
    customer_data = analytics_service.get_customer_insights(db)
    branch_data = analytics_service.get_branch_insights(db)
    product_data = analytics_service.get_product_insights(db)
    dashboard_data = analytics_service.get_dashboard_summary(db)

    customers = customer_data["customers"]
    branches = branch_data["branches"]
    products = product_data["products"]

    churned_customers = [
        customer for customer in customers if customer["churn_status"] == "Churned"
    ]
    at_risk_customers = [
        customer for customer in customers if customer["churn_status"] == "At Risk"
    ]
    loyal_customers = [
        customer
        for customer in customers
        if customer["loyalty_member"]
        and customer["total_visits"] > 1
        and customer["churn_status"] == "Active"
    ]

    top_branch = (
        max(branches, key=lambda branch: branch["total_revenue"])
        if branches
        else None
    )
    weakest_branch = (
        min(branches, key=lambda branch: branch["total_revenue"])
        if branches
        else None
    )
    lowest_repeat_branch = (
        min(branches, key=lambda branch: branch["repeat_customer_rate"])
        if branches
        else None
    )

    top_product = (
        max(products, key=lambda product: product["total_revenue"])
        if products
        else None
    )
    weakest_product = (
        min(products, key=lambda product: product["total_revenue"])
        if products
        else None
    )

    recommendations: list[dict[str, Any]] = []

    if churned_customers:
        recommendations.append(
            {
                "id": "customer-churned-reengagement",
                "category": "Customer",
                "priority": "High",
                "title": "Run a re-engagement promo for churned customers",
                "reason": (
                    f"{len(churned_customers)} customers have not purchased for more than 60 days."
                ),
                "action": (
                    "Create a limited-time promo or comeback offer targeted at churned customers to bring them back."
                ),
            }
        )

    if at_risk_customers:
        recommendations.append(
            {
                "id": "customer-at-risk-reminder",
                "category": "Customer",
                "priority": "High",
                "title": "Follow up with at-risk customers before they churn",
                "reason": (
                    f"{len(at_risk_customers)} customers have not purchased for 31 to 60 days."
                ),
                "action": (
                    "Send a reminder campaign, loyalty message, or personalized offer before they become fully churned."
                ),
            }
        )

    if loyal_customers:
        recommendations.append(
            {
                "id": "customer-loyal-reward",
                "category": "Customer",
                "priority": "Medium",
                "title": "Reward loyal customers to improve retention",
                "reason": (
                    f"{len(loyal_customers)} customers are active loyalty-driven repeat buyers."
                ),
                "action": (
                    "Offer VIP perks, exclusive drinks, or loyalty rewards to keep loyal customers engaged."
                ),
            }
        )

    if weakest_branch:
        recommendations.append(
            {
                "id": "branch-weakest-review",
                "category": "Branch",
                "priority": "High",
                "title": f"Review low-performing branch: {weakest_branch['branch_name']}",
                "reason": (
                    f"{weakest_branch['branch_name']} currently has the lowest recorded branch revenue at "
                    f"{_format_currency(weakest_branch['total_revenue'])}."
                ),
                "action": (
                    "Review local demand, staffing, branch promos, and product mix to improve branch performance."
                ),
            }
        )

    if lowest_repeat_branch:
        recommendations.append(
            {
                "id": "branch-repeat-rate-improvement",
                "category": "Branch",
                "priority": "Medium",
                "title": f"Improve repeat customer rate in {lowest_repeat_branch['branch_name']}",
                "reason": (
                    f"{lowest_repeat_branch['branch_name']} has the lowest repeat customer rate at "
                    f"{lowest_repeat_branch['repeat_customer_rate']:.1f}%."
                ),
                "action": (
                    "Use branch-specific promos, local retention campaigns, and better customer engagement to improve repeat visits."
                ),
            }
        )

    if top_product:
        recommendations.append(
            {
                "id": "product-top-seller-feature",
                "category": "Product",
                "priority": "Low",
                "title": f"Feature top-selling product: {top_product['product_name']}",
                "reason": (
                    f"{top_product['product_name']} is currently the strongest revenue-driving product at "
                    f"{_format_currency(top_product['total_revenue'])}."
                ),
                "action": (
                    "Promote this product more in weaker branches, bundles, and campaign materials to maximize sales."
                ),
            }
        )

    if weakest_product:
        recommendations.append(
            {
                "id": "product-weakest-review",
                "category": "Product",
                "priority": "Medium",
                "title": f"Review weak product performance: {weakest_product['product_name']}",
                "reason": (
                    f"{weakest_product['product_name']} has the lowest product revenue at "
                    f"{_format_currency(weakest_product['total_revenue'])}."
                ),
                "action": (
                    "Consider bundling, repositioning, discounting, or replacing this product if demand remains low."
                ),
            }
        )

    if top_branch:
        recommendations.append(
            {
                "id": "branch-top-branch-replicate",
                "category": "Branch",
                "priority": "Low",
                "title": f"Study what works in {top_branch['branch_name']}",
                "reason": (
                    f"{top_branch['branch_name']} is currently the top-performing branch with "
                    f"{_format_currency(top_branch['total_revenue'])} in revenue."
                ),
                "action": (
                    "Review its product mix, local offers, and customer behavior, then apply similar strategies to weaker branches."
                ),
            }
        )

    priority_order = {
        "High": 1,
        "Medium": 2,
        "Low": 3,
    }

    sorted_recommendations = sorted(
        recommendations,
        key=lambda recommendation: priority_order[recommendation["priority"]],
    )

    summary = {
        "total_recommendations": len(sorted_recommendations),
        "high_priority_count": len(
            [
                recommendation
                for recommendation in sorted_recommendations
                if recommendation["priority"] == "High"
            ]
        ),
        "medium_priority_count": len(
            [
                recommendation
                for recommendation in sorted_recommendations
                if recommendation["priority"] == "Medium"
            ]
        ),
        "low_priority_count": len(
            [
                recommendation
                for recommendation in sorted_recommendations
                if recommendation["priority"] == "Low"
            ]
        ),
    }

    customer_recommendations = [
        recommendation
        for recommendation in sorted_recommendations
        if recommendation["category"] == "Customer"
    ]
    branch_recommendations = [
        recommendation
        for recommendation in sorted_recommendations
        if recommendation["category"] == "Branch"
    ]
    product_recommendations = [
        recommendation
        for recommendation in sorted_recommendations
        if recommendation["category"] == "Product"
    ]

    ai_summary = _build_ai_summary(
        dashboard_summary=dashboard_data.get("summary", {}),
        recommendations=sorted_recommendations,
    )

    next_best_action_metrics = _build_next_best_action_metrics(
        dashboard_data=dashboard_data,
        top_branch=top_branch,
        weakest_branch=weakest_branch,
        top_product=top_product,
        weakest_product=weakest_product,
        inactive_customers=int(
            dashboard_data.get("summary", {}).get("inactive_customer_count", 0)
        ),
        churned_customers=len(churned_customers),
        at_risk_customers=len(at_risk_customers),
        loyal_customers=len(loyal_customers),
        recommendation_summary=summary,
    )

    next_best_actions_response = generate_next_best_actions(
        NextBestActionsRequest(
            metrics=next_best_action_metrics,
            max_actions=3,
            notes=(
                "These actions are generated from computed dashboard, branch, customer, "
                "product, and recommendation metrics."
            ),
        )
    )
    next_best_actions = [
        action.model_dump() for action in next_best_actions_response.actions
    ]

    return {
        "summary": summary,
        "recommendations": sorted_recommendations,
        "customer_recommendations": customer_recommendations,
        "branch_recommendations": branch_recommendations,
        "product_recommendations": product_recommendations,
        "ai_summary": ai_summary.model_dump(),
        "next_best_actions": next_best_actions,
        "next_best_actions_used_fallback": next_best_actions_response.used_fallback,
    }
