from __future__ import annotations

"""
Step 31 service: generate constrained next best actions from structured metrics.

Why this file exists:
- It keeps AI prompt and parsing logic out of API routes.
- It validates that AI output stays grounded to provided metrics.
- It provides safe deterministic fallback actions if AI is unavailable or invalid.
"""

import json
import os
import re
from typing import Any

from app.schemas.next_best_action import (
    NextBestActionItem,
    NextBestActionsRequest,
    NextBestActionsResponse,
)

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

_METRIC_KEYWORDS = (
    "revenue",
    "orders",
    "average order value",
    "repeat customer rate",
    "inactive",
    "churned",
    "at risk",
    "loyal",
    "top branch",
    "weakest branch",
    "top product",
    "weakest product",
    "recommendation",
)
_EXPECTED_TOP_LEVEL_KEYS = {"actions"}


def _priority_sort_value(priority: str) -> int:
    if priority == "High":
        return 1
    if priority == "Medium":
        return 2
    return 3


def _build_system_prompt() -> str:
    """
    Strict behavior guardrails for Step 31 generation.
    """
    return (
        "You are a business operations strategist for a coffee shop analytics system. "
        "You must generate practical next best actions using ONLY the provided metrics. "
        "Do not invent any metric, event, trend, or number. "
        "Do not mention data not present in the input payload. "
        "Return valid JSON only with this exact top-level shape: "
        '{"actions":[{"title":"...","summary":"...","reasons":["..."],"recommended_action":"...",'
        '"priority":"High|Medium|Low","category":"Customer|Branch|Product|Overall"}]}. '
        "Keep summary short and business-focused. "
        "Keep reasons tied directly to provided metrics."
    )


def _build_user_prompt(payload: NextBestActionsRequest) -> str:
    """
    Provide structured metrics and explicit output constraints.
    """
    return f"""
Generate up to {payload.max_actions} next-best-action items.

Output rules:
- Use only provided metrics
- No invented numbers
- No unsupported claims
- "summary" should be short
- "reasons" should be concise, metric-grounded bullets
- "recommended_action" must be concrete and practical
- priority must be one of High, Medium, Low
- category must be one of Customer, Branch, Product, Overall
- return JSON only

Metrics:
{json.dumps(payload.metrics.model_dump(), indent=2)}

Notes:
{payload.notes or "None"}
""".strip()


def _extract_numbers(text: str) -> list[float]:
    """
    Pull numeric tokens from free text so we can reject unsupported numbers.
    """
    matches = re.findall(r"\d[\d,]*(?:\.\d+)?", text)
    values: list[float] = []

    for match in matches:
        normalized = match.replace(",", "")
        try:
            values.append(float(normalized))
        except ValueError:
            continue

    return values


def _collect_allowed_numbers(value: Any) -> list[float]:
    """
    Recursively collect every numeric value from provided metrics.
    """
    numbers: list[float] = []

    if isinstance(value, bool):
        return numbers

    if isinstance(value, (int, float)):
        numbers.append(float(value))
        return numbers

    if isinstance(value, dict):
        for nested_value in value.values():
            numbers.extend(_collect_allowed_numbers(nested_value))
        return numbers

    if isinstance(value, list):
        for nested_value in value:
            numbers.extend(_collect_allowed_numbers(nested_value))

    return numbers


def _has_allowed_reference(text: str, allowed_entities: list[str]) -> bool:
    """
    Ensure each reason references at least a metric keyword, entity, or explicit number.
    """
    lowered = text.lower()
    if any(keyword in lowered for keyword in _METRIC_KEYWORDS):
        return True
    if any(entity.lower() in lowered for entity in allowed_entities if entity.strip()):
        return True
    return bool(_extract_numbers(text))


def _contains_unsupported_number(text: str, allowed_numbers: list[float]) -> bool:
    """
    Reject text that includes numbers not present in the structured input.
    """
    numbers_in_text = _extract_numbers(text)
    if not numbers_in_text:
        return False

    if not allowed_numbers:
        return True

    for value in numbers_in_text:
        has_match = any(abs(value - allowed_value) < 1e-6 for allowed_value in allowed_numbers)
        if not has_match:
            return True

    return False


def _is_grounded(
    action: NextBestActionItem,
    allowed_numbers: list[float],
    allowed_entities: list[str],
) -> bool:
    """
    Apply grounding checks to stop unsupported AI claims from reaching the UI.
    """
    texts = [
        action.title,
        action.summary,
        action.recommended_action,
        *action.reasons,
    ]

    if any(_contains_unsupported_number(text, allowed_numbers) for text in texts):
        return False

    if any(not _has_allowed_reference(reason, allowed_entities) for reason in action.reasons):
        return False

    if not _has_allowed_reference(action.summary, allowed_entities):
        return False

    return True


def _build_fallback_actions(payload: NextBestActionsRequest) -> list[NextBestActionItem]:
    """
    Deterministic fallback actions based on actual computed metrics.
    """
    metrics = payload.metrics
    actions: list[NextBestActionItem] = []

    if metrics.churned_customers > 0:
        actions.append(
            NextBestActionItem(
                title="Re-engage churned customers",
                summary="Recover lost demand by targeting churned and inactive customer groups.",
                reasons=[
                    f"{metrics.churned_customers} customers are currently churned.",
                    f"{metrics.inactive_customers} customers are currently inactive.",
                ],
                recommended_action=(
                    "Launch a reactivation campaign for churned customers with tailored comeback offers."
                ),
                priority="High",
                category="Customer",
            )
        )

    if metrics.at_risk_customers > 0:
        actions.append(
            NextBestActionItem(
                title="Prevent at-risk customer churn",
                summary="Act early on at-risk customers before they move into churned status.",
                reasons=[
                    f"{metrics.at_risk_customers} customers are marked as at risk.",
                    f"Repeat customer rate is {metrics.repeat_customer_rate:.1f}%.",
                ],
                recommended_action=(
                    "Run a retention follow-up campaign focused on at-risk customers and recent inactive buyers."
                ),
                priority="High",
                category="Customer",
            )
        )

    if metrics.weakest_branch.branch_name != "N/A":
        actions.append(
            NextBestActionItem(
                title=f"Improve branch performance in {metrics.weakest_branch.branch_name}",
                summary="Close branch-level revenue and retention gaps to improve overall branch output.",
                reasons=[
                    (
                        f"{metrics.weakest_branch.branch_name} has "
                        f"{metrics.weakest_branch.total_revenue:,.2f} total revenue."
                    ),
                    (
                        f"Top branch {metrics.top_branch.branch_name} has "
                        f"{metrics.top_branch.total_revenue:,.2f} total revenue."
                    ),
                ],
                recommended_action=(
                    "Review staffing, local offers, and top-selling menu mix, then apply the strongest branch playbook."
                ),
                priority="High",
                category="Branch",
            )
        )

    if metrics.weakest_product.product_name != "N/A":
        actions.append(
            NextBestActionItem(
                title=f"Review weak product: {metrics.weakest_product.product_name}",
                summary="Address low-performing product demand to reduce product-level drag.",
                reasons=[
                    (
                        f"{metrics.weakest_product.product_name} generated "
                        f"{metrics.weakest_product.total_revenue:,.2f} revenue."
                    ),
                    (
                        f"Top product {metrics.top_product.product_name} generated "
                        f"{metrics.top_product.total_revenue:,.2f} revenue."
                    ),
                ],
                recommended_action=(
                    "Test repositioning, bundling, and branch-level placement updates for weak products."
                ),
                priority="Medium",
                category="Product",
            )
        )

    if metrics.loyal_customers > 0:
        actions.append(
            NextBestActionItem(
                title="Reward loyal customers to protect repeat sales",
                summary="Strengthen loyalty-led revenue by increasing retention of repeat buyers.",
                reasons=[
                    f"{metrics.loyal_customers} customers are currently loyal repeat buyers.",
                    f"Average order value is {metrics.average_order_value:,.2f}.",
                ],
                recommended_action=(
                    "Offer targeted loyalty rewards and exclusive bundles for loyal customers."
                ),
                priority="Medium",
                category="Customer",
            )
        )

    if not actions:
        actions.append(
            NextBestActionItem(
                title="Run an overall business performance review",
                summary="Use the current KPI snapshot to prioritize the next operating cycle.",
                reasons=[
                    f"Total revenue is {metrics.total_revenue:,.2f}.",
                    f"Total orders are {metrics.total_orders}.",
                ],
                recommended_action=(
                    "Prioritize initiatives from highest expected impact to lowest effort using current KPI baseline."
                ),
                priority="Low",
                category="Overall",
            )
        )

    sorted_actions = sorted(actions, key=lambda action: _priority_sort_value(action.priority))
    return sorted_actions[: payload.max_actions]


def _parse_and_validate_ai_output(
    *,
    raw_content: str,
    payload: NextBestActionsRequest,
) -> list[NextBestActionItem] | None:
    """
    Parse and validate AI JSON. Return None if output fails validation.
    """
    try:
        decoded = json.loads(raw_content)
    except json.JSONDecodeError:
        return None

    if not isinstance(decoded, dict):
        return None

    # Step 32 safeguard: require the exact top-level JSON shape.
    if set(decoded.keys()) != _EXPECTED_TOP_LEVEL_KEYS:
        return None

    try:
        parsed_response = NextBestActionsResponse.model_validate(
            {
                "actions": decoded.get("actions", []),
                "used_fallback": False,
            }
        )
    except Exception:
        return None

    if not parsed_response.actions:
        return None

    allowed_numbers = _collect_allowed_numbers(payload.metrics.model_dump())
    allowed_entities = [
        payload.metrics.top_branch.branch_name,
        payload.metrics.weakest_branch.branch_name,
        payload.metrics.top_product.product_name,
        payload.metrics.weakest_product.product_name,
    ]

    validated_actions: list[NextBestActionItem] = []
    for action in parsed_response.actions[: payload.max_actions]:
        if _is_grounded(action, allowed_numbers, allowed_entities):
            validated_actions.append(action)

    if not validated_actions:
        return None

    return sorted(validated_actions, key=lambda action: _priority_sort_value(action.priority))


def generate_next_best_actions(payload: NextBestActionsRequest) -> NextBestActionsResponse:
    """
    Main Step 31 service function.

    Behavior:
    1. Try constrained AI generation
    2. Validate and ground output to provided metrics
    3. Fall back to deterministic actions if any step fails
    """
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    fallback_actions = _build_fallback_actions(payload)

    if OpenAI is None or not api_key:
        return NextBestActionsResponse(actions=fallback_actions, used_fallback=True)

    try:
        client = OpenAI(api_key=api_key)

        response = client.chat.completions.create(
            model=model,
            temperature=0.1,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _build_system_prompt()},
                {"role": "user", "content": _build_user_prompt(payload)},
            ],
        )

        raw_content = response.choices[0].message.content or "{}"
        validated_actions = _parse_and_validate_ai_output(
            raw_content=raw_content,
            payload=payload,
        )

        if not validated_actions:
            return NextBestActionsResponse(actions=fallback_actions, used_fallback=True)

        return NextBestActionsResponse(actions=validated_actions, used_fallback=False)

    except Exception:
        return NextBestActionsResponse(actions=fallback_actions, used_fallback=True)
