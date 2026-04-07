from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.recommendations import RecommendationsResponse
from app.services.recommendation_service import get_recommendations

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("", response_model=RecommendationsResponse)
def recommendations(db: Session = Depends(get_db)) -> RecommendationsResponse:
    return RecommendationsResponse.model_validate(get_recommendations(db))
