# backend/app/api/routes/ai.py

"""
This file exposes the AI summary API endpoint.

Why this file exists:
- It receives requests from the frontend
- It validates them using schemas
- It calls the AI service
- It returns a structured response
"""

from fastapi import APIRouter

from app.schemas.ai import AISummaryRequest, AISummaryResponse
from app.schemas.next_best_action import NextBestActionsRequest, NextBestActionsResponse
from app.services.ai_service import generate_ai_summary
from app.services.next_best_action_service import generate_next_best_actions

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/summary", response_model=AISummaryResponse)
def create_ai_summary(payload: AISummaryRequest) -> AISummaryResponse:
    """
    Generate a grounded AI summary from structured business metrics.
    """
    return generate_ai_summary(payload)


@router.post("/next-best-actions", response_model=NextBestActionsResponse)
def create_next_best_actions(payload: NextBestActionsRequest) -> NextBestActionsResponse:
    """
    Generate grounded next-best-action suggestions from structured business metrics.
    """
    return generate_next_best_actions(payload)
