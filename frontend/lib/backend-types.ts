export type DashboardSummaryResponse = {
  summary: {
    total_orders: number;
    total_revenue: number;
    average_order_value: number;
    repeat_customer_rate: number;
    inactive_customer_count: number;
  };
  top_products: {
    product_id: string;
    product_name: string;
    total_sales: number;
    total_units: number;
  }[];
  top_branches: {
    branch_id: string;
    branch_name: string;
    total_revenue: number;
    total_orders: number;
  }[];
  revenue_trend: {
    date: string;
    label: string;
    revenue: number;
  }[];
  recent_transactions: {
    transaction_id: string;
    transaction_code: string;
    branch_name: string;
    transaction_date: string;
    total_amount: number;
  }[];
};

export type BranchInsight = {
  id: string;
  branch_name: string;
  branch_code: string;
  city: string;
  address: string;
  status: string;
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  unique_customer_count: number;
  repeat_customer_rate: number;
  latest_transaction_date: string | null;
};

export type BranchInsightsResponse = {
  summary: {
    total_branches: number;
    top_branch_name: string | null;
    weakest_branch_name: string | null;
    total_branch_revenue: number;
  };
  top_branches: BranchInsight[];
  recent_activity: BranchInsight[];
  branches: BranchInsight[];
};

export type ProductInsight = {
  id: string;
  product_name: string;
  category: string;
  status: string;
  base_price: number;
  total_revenue: number;
  total_units_sold: number;
  total_orders: number;
  average_selling_price: number;
  latest_activity_date: string | null;
};

export type ProductInsightsResponse = {
  summary: {
    total_products: number;
    top_product_name: string | null;
    weakest_product_name: string | null;
    total_product_revenue: number;
  };
  top_products: ProductInsight[];
  recent_activity: ProductInsight[];
  products: ProductInsight[];
};

export type SegmentSummaryItem = {
  segment: string;
  count: number;
};

export type ChurnSummaryItem = {
  status: string;
  count: number;
};

export type CustomerInsight = {
  id: string;
  customer_code: string;
  full_name: string;
  email: string;
  phone_number: string;
  gender: string;
  loyalty_member: boolean;
  total_visits: number;
  total_spending: number;
  average_order_value: number;
  latest_transaction_date: string | null;
  latest_branch_name: string | null;
  is_repeat_customer: boolean;
  is_active_customer: boolean;
  is_inactive_customer: boolean;
  segment: string;
  churn_status: string;
  days_since_last_purchase: number | null;
};

export type CustomerInsightsResponse = {
  summary: {
    total_customers: number;
    active_customers: number;
    repeat_customers: number;
    inactive_customers: number;
    loyalty_members: number;
    total_customer_spending: number;
    average_customer_spending: number;
    repeat_customer_rate: number;
  };
  segment_summary: SegmentSummaryItem[];
  churn_summary: ChurnSummaryItem[];
  top_customers: CustomerInsight[];
  churn_priority_customers: CustomerInsight[];
  recent_activity: CustomerInsight[];
  customers: CustomerInsight[];
};

export type CustomerSegmentationResponse = {
  segment_summary: SegmentSummaryItem[];
};

export type ChurnDetectionResponse = {
  churn_summary: ChurnSummaryItem[];
  priority_customers: CustomerInsight[];
};

export type RecommendationItem = {
  id: string;
  category: "Customer" | "Branch" | "Product";
  priority: "High" | "Medium" | "Low";
  title: string;
  reason: string;
  action: string;
};

export type NextBestActionPriority = "High" | "Medium" | "Low";
export type NextBestActionCategory = "Customer" | "Branch" | "Product" | "Overall";

export type BranchPerformanceMetric = {
  branch_name: string;
  total_revenue: number;
  repeat_customer_rate: number;
};

export type ProductPerformanceMetric = {
  product_name: string;
  total_revenue: number;
};

export type RecommendationSummaryMetric = {
  total_recommendations: number;
  high_priority_count: number;
  medium_priority_count: number;
  low_priority_count: number;
};

export type NextBestActionMetrics = {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  repeat_customer_rate: number;
  inactive_customers: number;
  churned_customers: number;
  at_risk_customers: number;
  loyal_customers: number;
  top_branch: BranchPerformanceMetric;
  weakest_branch: BranchPerformanceMetric;
  top_product: ProductPerformanceMetric;
  weakest_product: ProductPerformanceMetric;
  recommendation_summary: RecommendationSummaryMetric;
};

export type NextBestActionsRequest = {
  metrics: NextBestActionMetrics;
  max_actions?: number;
  notes?: string;
};

export type NextBestActionItem = {
  title: string;
  summary: string;
  reasons: string[];
  recommended_action: string;
  priority: NextBestActionPriority;
  category: NextBestActionCategory;
};

export type NextBestActionsResponse = {
  actions: NextBestActionItem[];
  used_fallback: boolean;
};

export type RecommendationsResponse = {
  summary: {
    total_recommendations: number;
    high_priority_count: number;
    medium_priority_count: number;
    low_priority_count: number;
  };
  recommendations: RecommendationItem[];
  customer_recommendations: RecommendationItem[];
  branch_recommendations: RecommendationItem[];
  product_recommendations: RecommendationItem[];
  ai_summary: AISummaryResponse;
  next_best_actions: NextBestActionItem[];
  next_best_actions_used_fallback: boolean;
};

export type CsvValidationIssue = {
  row: number | "header" | "file" | string;
  field: string;
  message: string;
};

export type CsvFileValidationResult = {
  label: string;
  file_name: string;
  total_rows: number;
  is_valid: boolean;
  missing_columns: string[];
  issues: CsvValidationIssue[];
};

export type CsvProcessResponse = {
  success: boolean;
  message: string;
  all_valid: boolean | null;
  saved: boolean | null;
  results: CsvFileValidationResult[];
  save_summary: {
    branches_saved: number;
    products_saved: number;
    customers_saved: number;
    transactions_saved: number;
    transaction_items_saved: number;
  } | null;
};

export type SummaryType = "dashboard" | "branch" | "customer" | "product";

export type AISummaryRequest = {
  summary_type: SummaryType;
  metrics: Record<string, unknown>;
  notes?: string;
};

export type AISummaryResponse = {
  title: string;
  summary: string;
  highlights: string[];
  risks: string[];
  focus_area: string;
};
