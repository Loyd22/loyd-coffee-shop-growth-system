from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.rules import (
    CHURN_STATUSES,
    CUSTOMER_SEGMENTS,
    format_short_date,
    get_churn_status,
    get_customer_segment,
    get_days_since_last_purchase,
    to_iso_datetime,
)


def _fetch_rows(db: Session, sql: str) -> list[dict[str, Any]]:
    return [dict(row) for row in db.execute(text(sql)).mappings().all()]


def _to_float(value: Any) -> float:
    if value is None:
        return 0.0
    return float(value)


def _load_dataset(db: Session) -> dict[str, list[dict[str, Any]]]:
    branches = _fetch_rows(
        db,
        '''
        SELECT id, "branchName", "branchCode", address, city, status, "createdAt"
        FROM "Branch"
        ORDER BY "branchName" ASC
        ''',
    )

    products = _fetch_rows(
        db,
        '''
        SELECT id, "productName", category, status, price, "createdAt"
        FROM "Product"
        ORDER BY "productName" ASC
        ''',
    )

    customers = _fetch_rows(
        db,
        '''
        SELECT id, "customerCode", "fullName", email, "phoneNumber", gender,
               "loyaltyMember", "createdAt"
        FROM "Customer"
        ORDER BY "createdAt" DESC
        ''',
    )

    transactions = _fetch_rows(
        db,
        '''
        SELECT id, "transactionCode", "customerId", "branchId", "transactionDate",
               "totalAmount", subtotal, "discountAmount"
        FROM "Transaction"
        ORDER BY "transactionDate" DESC
        ''',
    )

    transaction_items = _fetch_rows(
        db,
        '''
        SELECT id, "transactionId", "productId", quantity, "unitPrice", "lineTotal", "createdAt"
        FROM "TransactionItem"
        ORDER BY "createdAt" DESC
        ''',
    )

    return {
        "branches": branches,
        "products": products,
        "customers": customers,
        "transactions": transactions,
        "transaction_items": transaction_items,
    }


def _group_transactions_by_customer(
    transactions: list[dict[str, Any]],
) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for transaction in transactions:
        customer_id = transaction.get("customerId")
        if customer_id:
            grouped[customer_id].append(transaction)

    for customer_id in grouped:
        grouped[customer_id].sort(
            key=lambda txn: txn["transactionDate"], reverse=True
        )

    return grouped


def _group_transactions_by_branch(
    transactions: list[dict[str, Any]],
) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for transaction in transactions:
        grouped[transaction["branchId"]].append(transaction)

    for branch_id in grouped:
        grouped[branch_id].sort(key=lambda txn: txn["transactionDate"], reverse=True)

    return grouped


def _group_items_by_transaction(
    transaction_items: list[dict[str, Any]],
) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for item in transaction_items:
        grouped[item["transactionId"]].append(item)

    return grouped


def _build_customer_insight_list(
    *,
    customers: list[dict[str, Any]],
    transactions_by_customer: dict[str, list[dict[str, Any]]],
    branch_by_id: dict[str, dict[str, Any]],
    today: datetime,
) -> list[dict[str, Any]]:
    thirty_days_ago = today - timedelta(days=30)
    customer_insights: list[dict[str, Any]] = []

    for customer in customers:
        customer_transactions = transactions_by_customer.get(customer["id"], [])

        total_visits = len(customer_transactions)
        total_spending = sum(_to_float(txn["totalAmount"]) for txn in customer_transactions)
        average_order_value = total_spending / total_visits if total_visits > 0 else 0.0

        latest_transaction = customer_transactions[0] if customer_transactions else None
        latest_transaction_date = (
            latest_transaction["transactionDate"] if latest_transaction else None
        )

        latest_branch_name = None
        if latest_transaction is not None:
            latest_branch = branch_by_id.get(latest_transaction["branchId"])
            latest_branch_name = (
                latest_branch.get("branchName") if latest_branch is not None else None
            )

        is_repeat_customer = total_visits > 1
        is_active_customer = (
            latest_transaction_date is not None and latest_transaction_date >= thirty_days_ago
        )
        is_inactive_customer = (
            total_visits > 0
            and latest_transaction_date is not None
            and latest_transaction_date < thirty_days_ago
        )

        segment = get_customer_segment(
            total_visits=total_visits,
            total_spending=total_spending,
            loyalty_member=bool(customer.get("loyaltyMember")),
            latest_transaction_date=latest_transaction_date,
            today=today,
        )

        churn_status = get_churn_status(
            total_visits=total_visits,
            latest_transaction_date=latest_transaction_date,
            today=today,
        )

        days_since_last_purchase = get_days_since_last_purchase(
            latest_transaction_date=latest_transaction_date,
            today=today,
        )

        customer_insights.append(
            {
                "id": customer["id"],
                "customer_code": customer.get("customerCode") or "N/A",
                "full_name": customer.get("fullName") or "Unnamed Customer",
                "email": customer.get("email") or "No email",
                "phone_number": customer.get("phoneNumber") or "No phone",
                "gender": customer.get("gender") or "N/A",
                "loyalty_member": bool(customer.get("loyaltyMember")),
                "total_visits": total_visits,
                "total_spending": total_spending,
                "average_order_value": average_order_value,
                "latest_transaction_date": to_iso_datetime(latest_transaction_date),
                "latest_branch_name": latest_branch_name,
                "is_repeat_customer": is_repeat_customer,
                "is_active_customer": is_active_customer,
                "is_inactive_customer": is_inactive_customer,
                "segment": segment,
                "churn_status": churn_status,
                "days_since_last_purchase": days_since_last_purchase,
            }
        )

    return customer_insights


def get_dashboard_summary(db: Session) -> dict[str, Any]:
    dataset = _load_dataset(db)

    transactions = dataset["transactions"]
    transaction_items = dataset["transaction_items"]
    customers = dataset["customers"]
    branches = dataset["branches"]
    products = dataset["products"]

    items_by_transaction = _group_items_by_transaction(transaction_items)
    transactions_by_customer = _group_transactions_by_customer(transactions)

    branch_by_id = {branch["id"]: branch for branch in branches}
    product_by_id = {product["id"]: product for product in products}

    total_orders = len(transactions)
    total_revenue = sum(_to_float(txn["totalAmount"]) for txn in transactions)
    average_order_value = total_revenue / total_orders if total_orders > 0 else 0.0

    customers_with_orders = [
        customer
        for customer in customers
        if len(transactions_by_customer.get(customer["id"], [])) > 0
    ]

    repeat_customers = [
        customer
        for customer in customers_with_orders
        if len(transactions_by_customer.get(customer["id"], [])) > 1
    ]

    repeat_customer_rate = (
        (len(repeat_customers) / len(customers_with_orders)) * 100
        if customers_with_orders
        else 0.0
    )

    today = datetime.now()
    thirty_days_ago = today - timedelta(days=30)

    inactive_customer_count = 0
    for customer in customers_with_orders:
        customer_transactions = transactions_by_customer.get(customer["id"], [])
        latest_transaction_date = max(
            txn["transactionDate"] for txn in customer_transactions
        )
        if latest_transaction_date < thirty_days_ago:
            inactive_customer_count += 1

    product_map: dict[str, dict[str, Any]] = {}
    for transaction in transactions:
        for item in items_by_transaction.get(transaction["id"], []):
            product_id = item["productId"]
            product_name = product_by_id.get(product_id, {}).get(
                "productName", "Unknown Product"
            )

            if product_id not in product_map:
                product_map[product_id] = {
                    "product_id": product_id,
                    "product_name": product_name,
                    "total_sales": 0.0,
                    "total_units": 0,
                }

            product_map[product_id]["total_sales"] += _to_float(item["lineTotal"])
            product_map[product_id]["total_units"] += int(item["quantity"])

    top_products = sorted(
        product_map.values(), key=lambda product: product["total_sales"], reverse=True
    )[:5]

    branch_map: dict[str, dict[str, Any]] = {}
    for transaction in transactions:
        branch_id = transaction["branchId"]
        branch_name = branch_by_id.get(branch_id, {}).get("branchName", "Unknown Branch")

        if branch_id not in branch_map:
            branch_map[branch_id] = {
                "branch_id": branch_id,
                "branch_name": branch_name,
                "total_revenue": 0.0,
                "total_orders": 0,
            }

        branch_map[branch_id]["total_revenue"] += _to_float(transaction["totalAmount"])
        branch_map[branch_id]["total_orders"] += 1

    top_branches = sorted(
        branch_map.values(), key=lambda branch: branch["total_revenue"], reverse=True
    )[:5]

    revenue_trend: list[dict[str, Any]] = []
    for index in range(7):
        current_day = today - timedelta(days=(6 - index))
        revenue_for_day = sum(
            _to_float(transaction["totalAmount"])
            for transaction in transactions
            if transaction["transactionDate"].date() == current_day.date()
        )

        revenue_trend.append(
            {
                "date": current_day.date().isoformat(),
                "label": format_short_date(current_day),
                "revenue": revenue_for_day,
            }
        )

    recent_transactions = []
    for transaction in transactions[:5]:
        branch_name = branch_by_id.get(transaction["branchId"], {}).get(
            "branchName", "Unknown Branch"
        )
        recent_transactions.append(
            {
                "transaction_id": transaction["id"],
                "transaction_code": transaction["transactionCode"],
                "branch_name": branch_name,
                "transaction_date": to_iso_datetime(transaction["transactionDate"]),
                "total_amount": _to_float(transaction["totalAmount"]),
            }
        )

    return {
        "summary": {
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "average_order_value": average_order_value,
            "repeat_customer_rate": repeat_customer_rate,
            "inactive_customer_count": inactive_customer_count,
        },
        "top_products": top_products,
        "top_branches": top_branches,
        "revenue_trend": revenue_trend,
        "recent_transactions": recent_transactions,
    }


def get_branch_insights(db: Session) -> dict[str, Any]:
    dataset = _load_dataset(db)

    branches = dataset["branches"]
    transactions = dataset["transactions"]

    transactions_by_branch = _group_transactions_by_branch(transactions)

    branch_insights: list[dict[str, Any]] = []

    for branch in branches:
        branch_transactions = transactions_by_branch.get(branch["id"], [])

        total_revenue = sum(
            _to_float(transaction["totalAmount"]) for transaction in branch_transactions
        )
        total_orders = len(branch_transactions)
        average_order_value = total_revenue / total_orders if total_orders > 0 else 0.0

        unique_customers = {
            transaction["customerId"]
            for transaction in branch_transactions
            if transaction.get("customerId")
        }

        customer_order_count: dict[str, int] = defaultdict(int)
        for transaction in branch_transactions:
            customer_id = transaction.get("customerId")
            if not customer_id:
                continue
            customer_order_count[customer_id] += 1

        repeat_customer_count = sum(
            1 for value in customer_order_count.values() if value > 1
        )
        repeat_customer_rate = (
            (repeat_customer_count / len(unique_customers)) * 100
            if unique_customers
            else 0.0
        )

        latest_transaction_date = (
            branch_transactions[0]["transactionDate"] if branch_transactions else None
        )

        branch_insights.append(
            {
                "id": branch["id"],
                "branch_name": branch["branchName"],
                "branch_code": branch["branchCode"],
                "city": branch.get("city") or "N/A",
                "address": branch.get("address") or "N/A",
                "status": branch.get("status") or "active",
                "total_revenue": total_revenue,
                "total_orders": total_orders,
                "average_order_value": average_order_value,
                "unique_customer_count": len(unique_customers),
                "repeat_customer_rate": repeat_customer_rate,
                "latest_transaction_date": to_iso_datetime(latest_transaction_date),
            }
        )

    top_branch = (
        max(branch_insights, key=lambda branch: branch["total_revenue"])
        if branch_insights
        else None
    )
    weakest_branch = (
        min(branch_insights, key=lambda branch: branch["total_revenue"])
        if branch_insights
        else None
    )

    total_branch_revenue = sum(branch["total_revenue"] for branch in branch_insights)

    top_branches = sorted(
        branch_insights, key=lambda branch: branch["total_revenue"], reverse=True
    )[:5]

    recent_activity = sorted(
        [branch for branch in branch_insights if branch["latest_transaction_date"]],
        key=lambda branch: branch["latest_transaction_date"],
        reverse=True,
    )[:5]

    return {
        "summary": {
            "total_branches": len(branch_insights),
            "top_branch_name": top_branch["branch_name"] if top_branch else None,
            "weakest_branch_name": (
                weakest_branch["branch_name"] if weakest_branch else None
            ),
            "total_branch_revenue": total_branch_revenue,
        },
        "top_branches": top_branches,
        "recent_activity": recent_activity,
        "branches": branch_insights,
    }


def get_product_insights(db: Session) -> dict[str, Any]:
    dataset = _load_dataset(db)

    products = dataset["products"]
    transactions = dataset["transactions"]
    transaction_items = dataset["transaction_items"]

    transaction_by_id = {transaction["id"]: transaction for transaction in transactions}

    items_by_product: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in transaction_items:
        transaction = transaction_by_id.get(item["transactionId"])
        if transaction is None:
            continue

        items_by_product[item["productId"]].append(
            {
                **item,
                "transactionDate": transaction["transactionDate"],
            }
        )

    product_insights: list[dict[str, Any]] = []

    for product in products:
        product_items = items_by_product.get(product["id"], [])

        total_revenue = sum(_to_float(item["lineTotal"]) for item in product_items)
        total_units_sold = sum(int(item["quantity"]) for item in product_items)
        total_orders = len(product_items)
        average_selling_price = (
            total_revenue / total_units_sold if total_units_sold > 0 else 0.0
        )

        latest_activity_date = (
            max(item["transactionDate"] for item in product_items)
            if product_items
            else None
        )

        product_insights.append(
            {
                "id": product["id"],
                "product_name": product["productName"],
                "category": product.get("category") or "Uncategorized",
                "status": product.get("status") or "active",
                "base_price": _to_float(product.get("price")),
                "total_revenue": total_revenue,
                "total_units_sold": total_units_sold,
                "total_orders": total_orders,
                "average_selling_price": average_selling_price,
                "latest_activity_date": to_iso_datetime(latest_activity_date),
            }
        )

    top_product = (
        max(product_insights, key=lambda product: product["total_revenue"])
        if product_insights
        else None
    )
    weakest_product = (
        min(product_insights, key=lambda product: product["total_revenue"])
        if product_insights
        else None
    )

    total_product_revenue = sum(product["total_revenue"] for product in product_insights)

    top_products = sorted(
        product_insights, key=lambda product: product["total_revenue"], reverse=True
    )[:5]

    recent_activity = sorted(
        [product for product in product_insights if product["latest_activity_date"]],
        key=lambda product: product["latest_activity_date"],
        reverse=True,
    )[:5]

    return {
        "summary": {
            "total_products": len(product_insights),
            "top_product_name": top_product["product_name"] if top_product else None,
            "weakest_product_name": (
                weakest_product["product_name"] if weakest_product else None
            ),
            "total_product_revenue": total_product_revenue,
        },
        "top_products": top_products,
        "recent_activity": recent_activity,
        "products": product_insights,
    }


def get_customer_insights(db: Session) -> dict[str, Any]:
    dataset = _load_dataset(db)

    customers = dataset["customers"]
    transactions = dataset["transactions"]
    branches = dataset["branches"]

    transactions_by_customer = _group_transactions_by_customer(transactions)
    branch_by_id = {branch["id"]: branch for branch in branches}
    today = datetime.now()

    customer_insights = _build_customer_insight_list(
        customers=customers,
        transactions_by_customer=transactions_by_customer,
        branch_by_id=branch_by_id,
        today=today,
    )

    total_customers = len(customer_insights)
    active_customers = [customer for customer in customer_insights if customer["is_active_customer"]]
    repeat_customers = [
        customer for customer in customer_insights if customer["is_repeat_customer"]
    ]
    inactive_customers = [
        customer for customer in customer_insights if customer["is_inactive_customer"]
    ]
    loyalty_members = [customer for customer in customer_insights if customer["loyalty_member"]]

    total_customer_spending = sum(
        customer["total_spending"] for customer in customer_insights
    )
    average_customer_spending = (
        total_customer_spending / total_customers if total_customers > 0 else 0.0
    )
    repeat_customer_rate = (
        (len(repeat_customers) / total_customers) * 100 if total_customers > 0 else 0.0
    )

    segment_counts = {segment: 0 for segment in CUSTOMER_SEGMENTS}
    for customer in customer_insights:
        segment_counts[customer["segment"]] += 1

    segment_summary = [
        {"segment": segment, "count": count}
        for segment, count in segment_counts.items()
    ]

    churn_counts = {status: 0 for status in CHURN_STATUSES}
    for customer in customer_insights:
        churn_counts[customer["churn_status"]] += 1

    churn_summary = [{"status": status, "count": count} for status, count in churn_counts.items()]

    top_customers = sorted(
        customer_insights,
        key=lambda customer: customer["total_spending"],
        reverse=True,
    )[:5]

    churn_priority_customers = sorted(
        [
            customer
            for customer in customer_insights
            if customer["churn_status"] in {"At Risk", "Churned"}
        ],
        key=lambda customer: customer["days_since_last_purchase"]
        if customer["days_since_last_purchase"] is not None
        else -1,
        reverse=True,
    )[:5]

    recent_activity = sorted(
        [
            customer
            for customer in customer_insights
            if customer["latest_transaction_date"] is not None
        ],
        key=lambda customer: customer["latest_transaction_date"],
        reverse=True,
    )[:5]

    return {
        "summary": {
            "total_customers": total_customers,
            "active_customers": len(active_customers),
            "repeat_customers": len(repeat_customers),
            "inactive_customers": len(inactive_customers),
            "loyalty_members": len(loyalty_members),
            "total_customer_spending": total_customer_spending,
            "average_customer_spending": average_customer_spending,
            "repeat_customer_rate": repeat_customer_rate,
        },
        "segment_summary": segment_summary,
        "churn_summary": churn_summary,
        "top_customers": top_customers,
        "churn_priority_customers": churn_priority_customers,
        "recent_activity": recent_activity,
        "customers": customer_insights,
    }


def get_customer_segmentation(db: Session) -> dict[str, Any]:
    customer_insights = get_customer_insights(db)
    return {"segment_summary": customer_insights["segment_summary"]}


def get_churn_detection(db: Session) -> dict[str, Any]:
    customer_insights = get_customer_insights(db)
    return {
        "churn_summary": customer_insights["churn_summary"],
        "priority_customers": customer_insights["churn_priority_customers"],
    }
