from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.insights import (
    BranchInsightsResponse,
    ChurnDetectionResponse,
    CustomerInsightsResponse,
    CustomerSegmentationResponse,
    ProductInsightsResponse,
)
from app.services.analytics_service import (
    get_branch_insights,
    get_churn_detection,
    get_customer_insights,
    get_customer_segmentation,
    get_product_insights,
)

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/branches", response_model=BranchInsightsResponse)
def branch_insights(db: Session = Depends(get_db)) -> BranchInsightsResponse:
    return BranchInsightsResponse.model_validate(get_branch_insights(db))


@router.get("/products", response_model=ProductInsightsResponse)
def product_insights(db: Session = Depends(get_db)) -> ProductInsightsResponse:
    return ProductInsightsResponse.model_validate(get_product_insights(db))


@router.get("/customers", response_model=CustomerInsightsResponse)
def customer_insights(db: Session = Depends(get_db)) -> CustomerInsightsResponse:
    return CustomerInsightsResponse.model_validate(get_customer_insights(db))


@router.get("/segmentation", response_model=CustomerSegmentationResponse)
def customer_segmentation(db: Session = Depends(get_db)) -> CustomerSegmentationResponse:
    return CustomerSegmentationResponse.model_validate(get_customer_segmentation(db))


@router.get("/churn", response_model=ChurnDetectionResponse)
def churn_detection(db: Session = Depends(get_db)) -> ChurnDetectionResponse:
    return ChurnDetectionResponse.model_validate(get_churn_detection(db))
