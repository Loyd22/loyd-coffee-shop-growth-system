from __future__ import annotations

import csv
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from fastapi import UploadFile
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas.csv import CsvSaveSummary, FileValidationResult, ValidationIssue


@dataclass(frozen=True)
class FileRule:
    label: str
    required_columns: list[str]
    id_field: str | None = None
    required_row_fields: list[str] = field(default_factory=list)
    non_negative_number_fields: list[str] = field(default_factory=list)
    date_fields: list[str] = field(default_factory=list)


FILE_RULES: dict[str, FileRule] = {
    "transactionsFile": FileRule(
        label="Transactions CSV",
        required_columns=[
            "transaction_id",
            "customer_id",
            "branch_id",
            "product_id",
            "quantity",
            "price",
            "total_amount",
            "transaction_date",
        ],
        id_field="transaction_id",
        required_row_fields=[
            "transaction_id",
            "branch_id",
            "product_id",
            "quantity",
            "price",
            "total_amount",
            "transaction_date",
        ],
        non_negative_number_fields=["quantity", "price", "total_amount"],
        date_fields=["transaction_date"],
    ),
    "customersFile": FileRule(
        label="Customers CSV",
        required_columns=["customer_id", "customer_name", "email", "phone"],
        id_field="customer_id",
        required_row_fields=["customer_id", "customer_name", "email", "phone"],
    ),
    "productsFile": FileRule(
        label="Products CSV",
        required_columns=["product_id", "product_name", "category", "price"],
        id_field="product_id",
        required_row_fields=["product_id", "product_name", "category", "price"],
        non_negative_number_fields=["price"],
    ),
    "branchesFile": FileRule(
        label="Branches CSV",
        required_columns=["branch_id", "branch_name", "location"],
        id_field="branch_id",
        required_row_fields=["branch_id", "branch_name", "location"],
    ),
}


def _clean_cell_value(value: str | None) -> str:
    if value is None:
        return ""

    cleaned = value.strip()
    if cleaned.startswith('"') and cleaned.endswith('"'):
        cleaned = cleaned[1:-1]

    return cleaned.strip()


def _parse_csv_text(text_value: str) -> tuple[list[str], list[dict[str, str]]]:
    non_empty_lines = [line for line in text_value.splitlines() if line.strip()]
    if not non_empty_lines:
        return [], []

    reader = csv.reader(non_empty_lines)
    rows = list(reader)
    if not rows:
        return [], []

    headers = [_clean_cell_value(header) for header in rows[0]]
    body_rows: list[dict[str, str]] = []

    for row in rows[1:]:
        row_object: dict[str, str] = {}
        for index, header in enumerate(headers):
            row_object[header] = _clean_cell_value(row[index] if index < len(row) else "")
        body_rows.append(row_object)

    return headers, body_rows


def _is_valid_date(value: str) -> bool:
    if not value:
        return False

    known_formats = [
        "%Y-%m-%d",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%m/%d/%Y",
        "%m/%d/%Y %H:%M:%S",
    ]

    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return True
    except ValueError:
        pass

    for date_format in known_formats:
        try:
            datetime.strptime(value, date_format)
            return True
        except ValueError:
            continue

    return False


def _parse_datetime(value: str) -> datetime:
    known_formats = [
        "%Y-%m-%d",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%m/%d/%Y",
        "%m/%d/%Y %H:%M:%S",
    ]

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        pass

    for date_format in known_formats:
        try:
            return datetime.strptime(value, date_format)
        except ValueError:
            continue

    raise ValueError(f"Invalid date format: {value}")


def _validate_rows(rows: list[dict[str, str]], rule: FileRule) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    seen_ids: set[str] = set()

    for index, row in enumerate(rows):
        row_number = index + 2

        for field_name in rule.required_row_fields:
            value = _clean_cell_value(row.get(field_name))
            if not value:
                issues.append(
                    ValidationIssue(
                        row=row_number,
                        field=field_name,
                        message=f"{field_name} is required.",
                    )
                )

        if rule.id_field:
            id_value = _clean_cell_value(row.get(rule.id_field))
            if id_value:
                if id_value in seen_ids:
                    issues.append(
                        ValidationIssue(
                            row=row_number,
                            field=rule.id_field,
                            message=f"Duplicate {rule.id_field} found: {id_value}",
                        )
                    )
                else:
                    seen_ids.add(id_value)

        for field_name in rule.non_negative_number_fields:
            raw_value = _clean_cell_value(row.get(field_name))
            if not raw_value:
                continue

            try:
                numeric_value = float(raw_value)
            except ValueError:
                issues.append(
                    ValidationIssue(
                        row=row_number,
                        field=field_name,
                        message=f"{field_name} must be a valid number.",
                    )
                )
                continue

            if numeric_value < 0:
                issues.append(
                    ValidationIssue(
                        row=row_number,
                        field=field_name,
                        message=f"{field_name} cannot be negative.",
                    )
                )

        for field_name in rule.date_fields:
            raw_value = _clean_cell_value(row.get(field_name))
            if not raw_value:
                continue

            if not _is_valid_date(raw_value):
                issues.append(
                    ValidationIssue(
                        row=row_number,
                        field=field_name,
                        message=f"{field_name} must be a valid date.",
                    )
                )

    return issues


def _is_csv_upload(upload_file: UploadFile) -> bool:
    if upload_file.filename is None:
        return False

    allowed_types = {
        "text/csv",
        "application/csv",
        "application/vnd.ms-excel",
        "",
        None,
    }

    is_csv_by_name = upload_file.filename.lower().endswith(".csv")
    is_csv_by_type = upload_file.content_type in allowed_types

    return is_csv_by_name or is_csv_by_type


async def _validate_uploaded_file(
    upload_file: UploadFile,
    field_name: str,
) -> tuple[FileValidationResult, list[dict[str, str]]]:
    rule = FILE_RULES[field_name]

    raw_bytes = await upload_file.read()
    text_value = raw_bytes.decode("utf-8-sig", errors="replace")

    if not text_value.strip():
        result = FileValidationResult(
            label=rule.label,
            file_name=upload_file.filename or "unknown.csv",
            total_rows=0,
            is_valid=False,
            missing_columns=[],
            issues=[
                ValidationIssue(
                    row="file",
                    field="file",
                    message="The uploaded file is empty.",
                )
            ],
        )
        return result, []

    headers, rows = _parse_csv_text(text_value)

    if not headers:
        result = FileValidationResult(
            label=rule.label,
            file_name=upload_file.filename or "unknown.csv",
            total_rows=0,
            is_valid=False,
            missing_columns=[],
            issues=[
                ValidationIssue(
                    row="header",
                    field="header",
                    message="The CSV file does not contain a valid header row.",
                )
            ],
        )
        return result, []

    missing_columns = [
        column for column in rule.required_columns if column not in headers
    ]

    if missing_columns:
        result = FileValidationResult(
            label=rule.label,
            file_name=upload_file.filename or "unknown.csv",
            total_rows=len(rows),
            is_valid=False,
            missing_columns=missing_columns,
            issues=[
                ValidationIssue(
                    row="header",
                    field="header",
                    message=f"Missing required columns: {', '.join(missing_columns)}",
                )
            ],
        )
        return result, rows

    issues = _validate_rows(rows, rule)
    result = FileValidationResult(
        label=rule.label,
        file_name=upload_file.filename or "unknown.csv",
        total_rows=len(rows),
        is_valid=len(issues) == 0,
        missing_columns=[],
        issues=issues,
    )
    return result, rows


def _load_existing_ids(db: Session, table_name: str) -> set[str]:
    rows = db.execute(text(f'SELECT id FROM "{table_name}"')).scalars().all()
    return {str(value) for value in rows}


def _append_reference_issues(
    *,
    validation_results: list[FileValidationResult],
    parsed_rows_by_field: dict[str, list[dict[str, str]]],
    db: Session,
) -> None:
    transaction_rows = parsed_rows_by_field.get("transactionsFile")
    if not transaction_rows:
        return

    transaction_result = next(
        (
            result
            for result in validation_results
            if result.label == FILE_RULES["transactionsFile"].label
        ),
        None,
    )

    if transaction_result is None:
        return

    branch_ids = _load_existing_ids(db, "Branch")
    product_ids = _load_existing_ids(db, "Product")
    customer_ids = _load_existing_ids(db, "Customer")

    branch_rows = parsed_rows_by_field.get("branchesFile", [])
    product_rows = parsed_rows_by_field.get("productsFile", [])
    customer_rows = parsed_rows_by_field.get("customersFile", [])

    branch_ids.update(_clean_cell_value(row.get("branch_id")) for row in branch_rows)
    product_ids.update(_clean_cell_value(row.get("product_id")) for row in product_rows)
    customer_ids.update(_clean_cell_value(row.get("customer_id")) for row in customer_rows)

    branch_ids.discard("")
    product_ids.discard("")
    customer_ids.discard("")

    for index, row in enumerate(transaction_rows):
        row_number = index + 2

        branch_id = _clean_cell_value(row.get("branch_id"))
        product_id = _clean_cell_value(row.get("product_id"))
        customer_id = _clean_cell_value(row.get("customer_id"))

        if branch_id and branch_id not in branch_ids:
            transaction_result.issues.append(
                ValidationIssue(
                    row=row_number,
                    field="branch_id",
                    message=(
                        f"branch_id '{branch_id}' does not exist in uploaded files or database."
                    ),
                )
            )

        if product_id and product_id not in product_ids:
            transaction_result.issues.append(
                ValidationIssue(
                    row=row_number,
                    field="product_id",
                    message=(
                        f"product_id '{product_id}' does not exist in uploaded files or database."
                    ),
                )
            )

        if customer_id and customer_id not in customer_ids:
            transaction_result.issues.append(
                ValidationIssue(
                    row=row_number,
                    field="customer_id",
                    message=(
                        f"customer_id '{customer_id}' does not exist in uploaded files or database."
                    ),
                )
            )

    transaction_result.is_valid = len(transaction_result.issues) == 0


def _persist_branches(db: Session, rows: list[dict[str, str]]) -> int:
    count = 0

    for row in rows:
        branch_id = _clean_cell_value(row.get("branch_id"))
        branch_name = _clean_cell_value(row.get("branch_name"))
        location = _clean_cell_value(row.get("location"))

        db.execute(
            text(
                '''
                INSERT INTO "Branch" (
                    id,
                    "branchName",
                    "branchCode",
                    address,
                    city,
                    status,
                    "createdAt",
                    "updatedAt"
                ) VALUES (
                    :id,
                    :branch_name,
                    :branch_code,
                    :address,
                    :city,
                    'active',
                    NOW(),
                    NOW()
                )
                ON CONFLICT (id)
                DO UPDATE SET
                    "branchName" = EXCLUDED."branchName",
                    "branchCode" = EXCLUDED."branchCode",
                    address = EXCLUDED.address,
                    city = EXCLUDED.city,
                    status = EXCLUDED.status,
                    "updatedAt" = NOW()
                '''
            ),
            {
                "id": branch_id,
                "branch_name": branch_name,
                "branch_code": branch_id,
                "address": location or None,
                "city": location or None,
            },
        )
        count += 1

    return count


def _persist_products(db: Session, rows: list[dict[str, str]]) -> int:
    count = 0

    for row in rows:
        product_id = _clean_cell_value(row.get("product_id"))
        product_name = _clean_cell_value(row.get("product_name"))
        category = _clean_cell_value(row.get("category"))
        price = float(_clean_cell_value(row.get("price")) or 0)

        db.execute(
            text(
                '''
                INSERT INTO "Product" (
                    id,
                    "productName",
                    category,
                    price,
                    status,
                    "createdAt",
                    "updatedAt"
                ) VALUES (
                    :id,
                    :product_name,
                    :category,
                    :price,
                    'active',
                    NOW(),
                    NOW()
                )
                ON CONFLICT (id)
                DO UPDATE SET
                    "productName" = EXCLUDED."productName",
                    category = EXCLUDED.category,
                    price = EXCLUDED.price,
                    status = EXCLUDED.status,
                    "updatedAt" = NOW()
                '''
            ),
            {
                "id": product_id,
                "product_name": product_name,
                "category": category or None,
                "price": price,
            },
        )
        count += 1

    return count


def _persist_customers(db: Session, rows: list[dict[str, str]]) -> int:
    count = 0

    for row in rows:
        customer_id = _clean_cell_value(row.get("customer_id"))
        customer_name = _clean_cell_value(row.get("customer_name"))
        email = _clean_cell_value(row.get("email"))
        phone = _clean_cell_value(row.get("phone"))

        db.execute(
            text(
                '''
                INSERT INTO "Customer" (
                    id,
                    "customerCode",
                    "fullName",
                    email,
                    "phoneNumber",
                    "loyaltyMember",
                    "createdAt",
                    "updatedAt"
                ) VALUES (
                    :id,
                    :customer_code,
                    :full_name,
                    :email,
                    :phone_number,
                    false,
                    NOW(),
                    NOW()
                )
                ON CONFLICT (id)
                DO UPDATE SET
                    "customerCode" = EXCLUDED."customerCode",
                    "fullName" = EXCLUDED."fullName",
                    email = EXCLUDED.email,
                    "phoneNumber" = EXCLUDED."phoneNumber",
                    "updatedAt" = NOW()
                '''
            ),
            {
                "id": customer_id,
                "customer_code": customer_id,
                "full_name": customer_name or None,
                "email": email or None,
                "phone_number": phone or None,
            },
        )
        count += 1

    return count


def _persist_transactions(db: Session, rows: list[dict[str, str]]) -> tuple[int, int]:
    transactions_saved = 0
    transaction_items_saved = 0

    for row in rows:
        transaction_id = _clean_cell_value(row.get("transaction_id"))
        customer_id = _clean_cell_value(row.get("customer_id"))
        branch_id = _clean_cell_value(row.get("branch_id"))
        product_id = _clean_cell_value(row.get("product_id"))

        quantity = int(float(_clean_cell_value(row.get("quantity")) or 0))
        price = float(_clean_cell_value(row.get("price")) or 0)
        total_amount = float(_clean_cell_value(row.get("total_amount")) or 0)
        transaction_date = _parse_datetime(_clean_cell_value(row.get("transaction_date")))

        db.execute(
            text(
                '''
                INSERT INTO "Transaction" (
                    id,
                    "transactionCode",
                    "customerId",
                    "branchId",
                    "transactionDate",
                    "paymentMethod",
                    subtotal,
                    "discountAmount",
                    "totalAmount",
                    "createdAt",
                    "updatedAt"
                ) VALUES (
                    :id,
                    :transaction_code,
                    :customer_id,
                    :branch_id,
                    :transaction_date,
                    'Unknown',
                    :subtotal,
                    0,
                    :total_amount,
                    NOW(),
                    NOW()
                )
                ON CONFLICT (id)
                DO UPDATE SET
                    "transactionCode" = EXCLUDED."transactionCode",
                    "customerId" = EXCLUDED."customerId",
                    "branchId" = EXCLUDED."branchId",
                    "transactionDate" = EXCLUDED."transactionDate",
                    subtotal = EXCLUDED.subtotal,
                    "totalAmount" = EXCLUDED."totalAmount",
                    "updatedAt" = NOW()
                '''
            ),
            {
                "id": transaction_id,
                "transaction_code": transaction_id,
                "customer_id": customer_id or None,
                "branch_id": branch_id,
                "transaction_date": transaction_date,
                "subtotal": total_amount,
                "total_amount": total_amount,
            },
        )
        transactions_saved += 1

        transaction_item_id = f"{transaction_id}::{product_id}"

        db.execute(
            text(
                '''
                INSERT INTO "TransactionItem" (
                    id,
                    "transactionId",
                    "productId",
                    quantity,
                    "unitPrice",
                    "lineTotal",
                    "createdAt",
                    "updatedAt"
                ) VALUES (
                    :id,
                    :transaction_id,
                    :product_id,
                    :quantity,
                    :unit_price,
                    :line_total,
                    NOW(),
                    NOW()
                )
                ON CONFLICT (id)
                DO UPDATE SET
                    "transactionId" = EXCLUDED."transactionId",
                    "productId" = EXCLUDED."productId",
                    quantity = EXCLUDED.quantity,
                    "unitPrice" = EXCLUDED."unitPrice",
                    "lineTotal" = EXCLUDED."lineTotal",
                    "updatedAt" = NOW()
                '''
            ),
            {
                "id": transaction_item_id,
                "transaction_id": transaction_id,
                "product_id": product_id,
                "quantity": quantity,
                "unit_price": price,
                "line_total": total_amount,
            },
        )
        transaction_items_saved += 1

    return transactions_saved, transaction_items_saved


async def validate_csv_files(
    *,
    db: Session,
    files: dict[str, UploadFile | None],
) -> tuple[list[FileValidationResult], bool, dict[str, list[dict[str, str]]]]:
    uploaded_entries = [
        {"field_name": field_name, "file": upload_file}
        for field_name, upload_file in files.items()
        if upload_file is not None
    ]

    validation_results: list[FileValidationResult] = []
    parsed_rows_by_field: dict[str, list[dict[str, str]]] = {}

    for entry in uploaded_entries:
        upload_file = entry["file"]
        field_name = entry["field_name"]

        if upload_file is None:
            continue

        if not _is_csv_upload(upload_file):
            label = FILE_RULES[field_name].label
            raise ValueError(f"{label} must be a CSV file.")

        result, rows = await _validate_uploaded_file(upload_file, field_name)
        validation_results.append(result)
        parsed_rows_by_field[field_name] = rows

    _append_reference_issues(
        validation_results=validation_results,
        parsed_rows_by_field=parsed_rows_by_field,
        db=db,
    )

    all_valid = all(result.is_valid for result in validation_results)
    return validation_results, all_valid, parsed_rows_by_field


def persist_validated_csv(
    *,
    db: Session,
    parsed_rows_by_field: dict[str, list[dict[str, str]]],
) -> CsvSaveSummary:
    branches_saved = _persist_branches(db, parsed_rows_by_field.get("branchesFile", []))
    products_saved = _persist_products(db, parsed_rows_by_field.get("productsFile", []))
    customers_saved = _persist_customers(db, parsed_rows_by_field.get("customersFile", []))

    transactions_saved, transaction_items_saved = _persist_transactions(
        db,
        parsed_rows_by_field.get("transactionsFile", []),
    )

    return CsvSaveSummary(
        branches_saved=branches_saved,
        products_saved=products_saved,
        customers_saved=customers_saved,
        transactions_saved=transactions_saved,
        transaction_items_saved=transaction_items_saved,
    )


async def process_csv_files(
    *,
    db: Session,
    files: dict[str, UploadFile | None],
    persist_if_valid: bool,
) -> dict[str, Any]:
    uploaded_files = [upload_file for upload_file in files.values() if upload_file is not None]

    if not uploaded_files:
        return {
            "success": False,
            "message": "Please upload at least one CSV file.",
            "results": [],
            "all_valid": None,
            "saved": None,
            "save_summary": None,
        }

    validation_results, all_valid, parsed_rows_by_field = await validate_csv_files(
        db=db,
        files=files,
    )

    response_payload = {
        "success": True,
        "message": (
            "All uploaded CSV files passed validation."
            if all_valid
            else "Some uploaded CSV files have validation issues."
        ),
        "all_valid": all_valid,
        "saved": False,
        "results": [result.model_dump() for result in validation_results],
        "save_summary": None,
    }

    if not all_valid or not persist_if_valid:
        return response_payload

    try:
        save_summary = persist_validated_csv(
            db=db,
            parsed_rows_by_field=parsed_rows_by_field,
        )
        db.commit()
    except Exception:
        db.rollback()
        raise

    response_payload["message"] = (
        "All uploaded CSV files passed validation and data was saved to the database."
    )
    response_payload["saved"] = True
    response_payload["save_summary"] = save_summary.model_dump()

    return response_payload
