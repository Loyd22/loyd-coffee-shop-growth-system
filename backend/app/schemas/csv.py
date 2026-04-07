from __future__ import annotations

from pydantic import BaseModel


class ValidationIssue(BaseModel):
    row: int | str
    field: str
    message: str


class FileValidationResult(BaseModel):
    label: str
    file_name: str
    total_rows: int
    is_valid: bool
    missing_columns: list[str]
    issues: list[ValidationIssue]


class CsvSaveSummary(BaseModel):
    branches_saved: int
    products_saved: int
    customers_saved: int
    transactions_saved: int
    transaction_items_saved: int


class CsvProcessResponse(BaseModel):
    success: bool
    message: str
    all_valid: bool | None = None
    saved: bool | None = None
    results: list[FileValidationResult]
    save_summary: CsvSaveSummary | None = None
