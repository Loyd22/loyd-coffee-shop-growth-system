from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.csv import CsvProcessResponse
from app.services.csv_service import process_csv_files

router = APIRouter(prefix="/csv", tags=["csv"])


@router.post("/upload", response_model=CsvProcessResponse)
async def upload_csv_files(
    transactions_file: UploadFile | None = File(default=None, alias="transactionsFile"),
    customers_file: UploadFile | None = File(default=None, alias="customersFile"),
    products_file: UploadFile | None = File(default=None, alias="productsFile"),
    branches_file: UploadFile | None = File(default=None, alias="branchesFile"),
    db: Session = Depends(get_db),
) -> CsvProcessResponse:
    try:
        payload = await process_csv_files(
            db=db,
            files={
                "transactionsFile": transactions_file,
                "customersFile": customers_file,
                "productsFile": products_file,
                "branchesFile": branches_file,
            },
            persist_if_valid=True,
        )
        return CsvProcessResponse.model_validate(payload)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/validate", response_model=CsvProcessResponse)
async def validate_csv_files_only(
    transactions_file: UploadFile | None = File(default=None, alias="transactionsFile"),
    customers_file: UploadFile | None = File(default=None, alias="customersFile"),
    products_file: UploadFile | None = File(default=None, alias="productsFile"),
    branches_file: UploadFile | None = File(default=None, alias="branchesFile"),
    db: Session = Depends(get_db),
) -> CsvProcessResponse:
    try:
        payload = await process_csv_files(
            db=db,
            files={
                "transactionsFile": transactions_file,
                "customersFile": customers_file,
                "productsFile": products_file,
                "branchesFile": branches_file,
            },
            persist_if_valid=False,
        )
        return CsvProcessResponse.model_validate(payload)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/persist", response_model=CsvProcessResponse)
async def persist_csv_files(
    transactions_file: UploadFile | None = File(default=None, alias="transactionsFile"),
    customers_file: UploadFile | None = File(default=None, alias="customersFile"),
    products_file: UploadFile | None = File(default=None, alias="productsFile"),
    branches_file: UploadFile | None = File(default=None, alias="branchesFile"),
    db: Session = Depends(get_db),
) -> CsvProcessResponse:
    try:
        payload = await process_csv_files(
            db=db,
            files={
                "transactionsFile": transactions_file,
                "customersFile": customers_file,
                "productsFile": products_file,
                "branchesFile": branches_file,
            },
            persist_if_valid=True,
        )
        return CsvProcessResponse.model_validate(payload)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
