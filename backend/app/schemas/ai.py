"""
This file defines the request and response models for the AI summary feature.

Why this file exists:
- It validates the data coming from the frontend
- It keeps the backend API structured and predictable
- It helps FastAPI generate clear docs in Swagger
"""

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

SummaryType = Literal["dashboard", "branch", "customer", "product"]


class AISummaryRequest(BaseModel):
    """
    This is the data the frontend sends to the backend.

    summary_type:
    - tells the backend what kind of summary we want

    metrics:
    - contains already-computed business data
    - this is important because the AI must summarize facts, not raw tables

    notes:
    - optional extra context from the frontend
    """

    model_config = ConfigDict(extra="forbid")

    summary_type: SummaryType = Field(..., description="Type of summary to generate")
    metrics: Dict[str, Any] = Field(
        ...,
        min_length=1,
        description="Structured business metrics",
    )
    notes: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Optional extra context",
    )


class AISummaryResponse(BaseModel):
    """
    This is the structured summary the backend returns to the frontend.
    """

    model_config = ConfigDict(extra="forbid")

    title: str = Field(..., min_length=3, max_length=120)
    summary: str = Field(..., min_length=10, max_length=500)
    highlights: List[str] = Field(default_factory=list, max_length=5)
    risks: List[str] = Field(default_factory=list, max_length=5)
    focus_area: str = Field(..., min_length=3, max_length=80)
