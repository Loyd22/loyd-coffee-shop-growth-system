from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.ai import AISummaryResponse, NextBestActionsResponse
from app.services.ai_service import generated_at_iso
from app.services.recommendation_service import get_recommendations

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/summary", response_model=AISummaryResponse)
def generate_ai_summary(db: Session = Depends(get_db)) -> AISummaryResponse:
    recommendation_payload = get_recommendations(db)
    return AISummaryResponse(
        summary=recommendation_payload["ai_summary"],
        generated_at=generated_at_iso(),
    )


@router.post("/next-best-actions", response_model=NextBestActionsResponse)
def generate_next_best_actions(db: Session = Depends(get_db)) -> NextBestActionsResponse:
    recommendation_payload = get_recommendations(db)
    return NextBestActionsResponse(
        actions=recommendation_payload["next_best_actions"],
        generated_at=generated_at_iso(),
    )
