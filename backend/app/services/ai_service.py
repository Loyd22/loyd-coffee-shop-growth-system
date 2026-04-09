# backend/app/services/ai_service.py

"""
This file contains the AI summary logic for Step 30.

Why this file exists:
- It keeps AI logic out of the API route
- It receives structured metrics
- It turns those metrics into a grounded business summary
- It returns a safe fallback if the AI service is unavailable
"""

import json
import os
import re
from typing import Any, Dict

from app.schemas.ai import AISummaryRequest, AISummaryResponse

# If your project already uses the OpenAI package somewhere else,
# keep that style. This import assumes you are using the modern OpenAI SDK.
try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

_SUMMARY_ALLOWED_KEYS = {"title", "summary", "highlights", "risks", "focus_area"}
_METRIC_KEYWORDS = (
    "revenue",
    "orders",
    "average order value",
    "repeat customer rate",
    "inactive",
    "churn",
    "at risk",
    "loyal",
    "branch",
    "product",
    "recommendation",
)


def build_system_prompt() -> str:
    """
    This system prompt tells the AI how it should behave.
    Keep it strict and business-focused.
    """
    return (
        "You are a business insights assistant for a coffee shop analytics system. "
        "You must explain only the metrics provided to you. "
        "Do not invent missing numbers. "
        "Write in simple business language. "
        "Keep the content operational and business-focused. "
        "Return valid JSON with these keys only: "
        "title, summary, highlights, risks, focus_area."
    )


def build_user_prompt(payload: AISummaryRequest) -> str:
    """
    This user prompt gives the AI the exact data to summarize.
    We send only structured metrics, not raw database rows.
    """
    return f"""
Generate a grounded AI summary for this business insight type: {payload.summary_type}

Rules:
- Explain only what is supported by the metrics below
- Keep the summary short and useful
- Highlights must be a short list
- Risks must be a short list
- Focus area must be one short phrase
- Return JSON only

Metrics:
{json.dumps(payload.metrics, indent=2)}

Extra notes:
{payload.notes or "None"}
""".strip()


def build_fallback_summary(payload: AISummaryRequest) -> AISummaryResponse:
    """
    This fallback summary is used if:
    - OpenAI is not installed
    - API key is missing
    - AI call fails
    """
    metric_names = list(payload.metrics.keys())

    return AISummaryResponse(
        title=f"{payload.summary_type.title()} Insight Summary",
        summary=(
            f"This summary is based on the provided {payload.summary_type} metrics. "
            f"The current payload contains {len(metric_names)} key metrics for review."
        ),
        highlights=[
            f"Summary type: {payload.summary_type}",
            f"Metrics included: {', '.join(metric_names[:3])}" if metric_names else "No metrics provided",
        ],
        risks=[
            "AI response unavailable, using fallback summary",
        ],
        focus_area="Review metrics",
    )


def _extract_numbers(text: str) -> list[float]:
    """
    Extract numeric tokens from text for hallucination checks.
    """
    matches = re.findall(r"\d[\d,]*(?:\.\d+)?", text)
    output: list[float] = []

    for match in matches:
        try:
            output.append(float(match.replace(",", "")))
        except ValueError:
            continue

    return output


def _collect_numbers(value: Any) -> list[float]:
    """
    Recursively collect all numeric values from the input metrics.
    """
    numbers: list[float] = []

    if isinstance(value, bool):
        return numbers

    if isinstance(value, (int, float)):
        numbers.append(float(value))
        return numbers

    if isinstance(value, dict):
        for nested in value.values():
            numbers.extend(_collect_numbers(nested))
        return numbers

    if isinstance(value, list):
        for nested in value:
            numbers.extend(_collect_numbers(nested))

    return numbers


def _collect_strings(value: Any) -> list[str]:
    """
    Recursively collect entity names from metrics (branch names, product names, etc.).
    """
    strings: list[str] = []

    if isinstance(value, str):
        strings.append(value)
        return strings

    if isinstance(value, dict):
        for key, nested in value.items():
            strings.append(str(key))
            strings.extend(_collect_strings(nested))
        return strings

    if isinstance(value, list):
        for nested in value:
            strings.extend(_collect_strings(nested))

    return strings


def _contains_unsupported_number(text: str, allowed_numbers: list[float]) -> bool:
    """
    True when text contains a number that was not present in the input metrics.
    """
    numbers = _extract_numbers(text)
    if not numbers:
        return False

    for number in numbers:
        if not any(abs(number - allowed) < 1e-6 for allowed in allowed_numbers):
            return True

    return False


def _has_grounded_reference(text: str, allowed_entities: list[str]) -> bool:
    """
    True when text references a metric keyword, an input entity, or explicit input number.
    """
    lowered = text.lower()
    if any(keyword in lowered for keyword in _METRIC_KEYWORDS):
        return True
    if any(entity.lower() in lowered for entity in allowed_entities if entity.strip()):
        return True
    return bool(_extract_numbers(text))


def _validate_grounded_summary(data: Dict[str, Any], payload: AISummaryRequest) -> bool:
    """
    Validate summary content to reduce random or ungrounded statements.
    """
    if set(data.keys()) != _SUMMARY_ALLOWED_KEYS:
        return False

    try:
        parsed = AISummaryResponse.model_validate(data)
    except Exception:
        return False

    allowed_numbers = _collect_numbers(payload.metrics)
    allowed_entities = _collect_strings(payload.metrics)

    text_fields = [parsed.summary, parsed.focus_area, *parsed.highlights, *parsed.risks]

    if any(_contains_unsupported_number(text, allowed_numbers) for text in text_fields):
        return False

    if any(not _has_grounded_reference(text, allowed_entities) for text in parsed.highlights):
        return False

    return True


def generate_ai_summary(payload: AISummaryRequest) -> AISummaryResponse:
    """
    Main service function for Step 30.

    What it does:
    1. Checks whether OpenAI is available
    2. Sends the structured prompt
    3. Parses the JSON response
    4. Returns a safe fallback if something fails
    """
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    # If OpenAI package or API key is missing, use fallback
    if OpenAI is None or not api_key:
        return build_fallback_summary(payload)

    try:
        client = OpenAI(api_key=api_key)

        response = client.chat.completions.create(
            model=model,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": build_system_prompt(),
                },
                {
                    "role": "user",
                    "content": build_user_prompt(payload),
                },
            ],
        )

        raw_content = response.choices[0].message.content
        data: Dict[str, Any] = json.loads(raw_content)

        # Validate both shape and grounding before returning AI output.
        if not _validate_grounded_summary(data, payload):
            return build_fallback_summary(payload)

        return AISummaryResponse.model_validate(data)

    except Exception:
        return build_fallback_summary(payload)
