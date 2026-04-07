// frontend/app/api/upload-csv/route.ts

// Import NextResponse so we can return JSON back to the frontend
import { NextResponse } from "next/server";

// This type describes a validation issue found in a file
type ValidationIssue = {
  row: number | "header" | "file";
  field: string;
  message: string;
};

// This type describes the validation result for one uploaded file
type FileValidationResult = {
  label: string;
  fileName: string;
  totalRows: number;
  isValid: boolean;
  missingColumns: string[];
  issues: ValidationIssue[];
};

// This describes the validation rules for one CSV file type
type FileRule = {
  label: string;
  requiredColumns: string[];
  idField?: string;
  requiredRowFields: string[];
  nonNegativeNumberFields?: string[];
  dateFields?: string[];
};

// Validation rules for each file input
const FILE_RULES: Record<string, FileRule> = {
  transactionsFile: {
    label: "Transactions CSV",
    requiredColumns: [
      "transaction_id",
      "customer_id",
      "branch_id",
      "product_id",
      "quantity",
      "price",
      "total_amount",
      "transaction_date",
    ],
    idField: "transaction_id",
    requiredRowFields: [
      "transaction_id",
      "branch_id",
      "product_id",
      "quantity",
      "price",
      "total_amount",
      "transaction_date",
    ],
    nonNegativeNumberFields: ["quantity", "price", "total_amount"],
    dateFields: ["transaction_date"],
  },
  customersFile: {
    label: "Customers CSV",
    requiredColumns: ["customer_id", "customer_name", "email", "phone"],
    idField: "customer_id",
    requiredRowFields: ["customer_id", "customer_name", "email", "phone"],
  },
  productsFile: {
    label: "Products CSV",
    requiredColumns: ["product_id", "product_name", "category", "price"],
    idField: "product_id",
    requiredRowFields: ["product_id", "product_name", "category", "price"],
    nonNegativeNumberFields: ["price"],
  },
  branchesFile: {
    label: "Branches CSV",
    requiredColumns: ["branch_id", "branch_name", "location"],
    idField: "branch_id",
    requiredRowFields: ["branch_id", "branch_name", "location"],
  },
};

// This removes quotes and extra spaces from a CSV value
function cleanCellValue(value: string): string {
  return value.trim().replace(/^"|"$/g, "").trim();
}

// This splits one CSV line into cells.
// It supports simple quoted values with commas inside quotes.
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      // Toggle quote mode
      insideQuotes = !insideQuotes;
      current += char;
      continue;
    }

    if (char === "," && !insideQuotes) {
      // Comma outside quotes means a new cell starts
      cells.push(cleanCellValue(current));
      current = "";
      continue;
    }

    current += char;
  }

  // Push the last cell after the loop ends
  cells.push(cleanCellValue(current));

  return cells;
}

// This parses CSV text into headers and row objects
function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  // Remove empty lines and trim line spacing
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // If no lines exist, return empty result
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // First line is treated as the header row
  const headers = splitCsvLine(lines[0]).map((header) => header.trim());

  // Convert each next line into an object using the headers
  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const rowObject: Record<string, string> = {};

    headers.forEach((header, index) => {
      rowObject[header] = values[index] ?? "";
    });

    return rowObject;
  });

  return { headers, rows };
}

// This checks whether a string looks like a valid date
function isValidDate(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

// This validates one parsed CSV file against its rules
function validateRows(
  rows: Record<string, string>[],
  rule: FileRule
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenIds = new Set<string>();

  rows.forEach((row, index) => {
    // Add 2 because CSV row numbers include header row as row 1
    const rowNumber = index + 2;

    // Check required fields are not blank
    rule.requiredRowFields.forEach((field) => {
      const value = cleanCellValue(row[field] ?? "");

      if (!value) {
        issues.push({
          row: rowNumber,
          field,
          message: `${field} is required.`,
        });
      }
    });

    // Check duplicate IDs if this file type has an ID field
    if (rule.idField) {
      const idValue = cleanCellValue(row[rule.idField] ?? "");

      if (idValue) {
        if (seenIds.has(idValue)) {
          issues.push({
            row: rowNumber,
            field: rule.idField,
            message: `Duplicate ${rule.idField} found: ${idValue}`,
          });
        } else {
          seenIds.add(idValue);
        }
      }
    }

    // Check number fields are valid and not negative
    (rule.nonNegativeNumberFields ?? []).forEach((field) => {
      const rawValue = cleanCellValue(row[field] ?? "");

      if (!rawValue) return;

      const numericValue = Number(rawValue);

      if (Number.isNaN(numericValue)) {
        issues.push({
          row: rowNumber,
          field,
          message: `${field} must be a valid number.`,
        });
        return;
      }

      if (numericValue < 0) {
        issues.push({
          row: rowNumber,
          field,
          message: `${field} cannot be negative.`,
        });
      }
    });

    // Check date fields have valid date values
    (rule.dateFields ?? []).forEach((field) => {
      const rawValue = cleanCellValue(row[field] ?? "");

      if (!rawValue) return;

      if (!isValidDate(rawValue)) {
        issues.push({
          row: rowNumber,
          field,
          message: `${field} must be a valid date.`,
        });
      }
    });
  });

  return issues;
}

// This validates one uploaded file
async function validateUploadedFile(
  file: File,
  fieldName: string
): Promise<FileValidationResult> {
  const rule = FILE_RULES[fieldName];

  // Read file text
  const text = await file.text();

  // If file is empty or only whitespace, fail early
  if (!text.trim()) {
    return {
      label: rule.label,
      fileName: file.name,
      totalRows: 0,
      isValid: false,
      missingColumns: [],
      issues: [
        {
          row: "file",
          field: "file",
          message: "The uploaded file is empty.",
        },
      ],
    };
  }

  // Parse CSV text
  const { headers, rows } = parseCsv(text);

  // If no headers were found, report it
  if (headers.length === 0) {
    return {
      label: rule.label,
      fileName: file.name,
      totalRows: 0,
      isValid: false,
      missingColumns: [],
      issues: [
        {
          row: "header",
          field: "header",
          message: "The CSV file does not contain a valid header row.",
        },
      ],
    };
  }

  // Check required columns
  const missingColumns = rule.requiredColumns.filter(
    (column) => !headers.includes(column)
  );

  // If columns are missing, stop row validation
  if (missingColumns.length > 0) {
    return {
      label: rule.label,
      fileName: file.name,
      totalRows: rows.length,
      isValid: false,
      missingColumns,
      issues: [
        {
          row: "header",
          field: "header",
          message: `Missing required columns: ${missingColumns.join(", ")}`,
        },
      ],
    };
  }

  // Validate each row
  const issues = validateRows(rows, rule);

  return {
    label: rule.label,
    fileName: file.name,
    totalRows: rows.length,
    isValid: issues.length === 0,
    missingColumns: [],
    issues,
  };
}

// This handles POST requests sent to /api/upload-csv
export async function POST(request: Request) {
  try {
    // Read form data from the browser
    const formData = await request.formData();

    // Get uploaded files from form data
    const fileEntries = [
      {
        fieldName: "transactionsFile",
        file: formData.get("transactionsFile") as File | null,
      },
      {
        fieldName: "customersFile",
        file: formData.get("customersFile") as File | null,
      },
      {
        fieldName: "productsFile",
        file: formData.get("productsFile") as File | null,
      },
      {
        fieldName: "branchesFile",
        file: formData.get("branchesFile") as File | null,
      },
    ];

    // Keep only uploaded files
    const uploadedFiles = fileEntries.filter((entry) => entry.file !== null);

    // Require at least one file
    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Please upload at least one CSV file.",
        },
        { status: 400 }
      );
    }

    // Basic file type checks before validation
    for (const entry of uploadedFiles) {
      const currentFile = entry.file;

      if (!currentFile) continue;

      const isCsvByName = currentFile.name.toLowerCase().endsWith(".csv");
      const isCsvByType =
        currentFile.type === "text/csv" ||
        currentFile.type === "application/vnd.ms-excel" ||
        currentFile.type === "";

      if (!isCsvByName && !isCsvByType) {
        return NextResponse.json(
          {
            success: false,
            message: `${FILE_RULES[entry.fieldName].label} must be a CSV file.`,
          },
          { status: 400 }
        );
      }
    }

    // Validate every uploaded file
    const validationResults = await Promise.all(
      uploadedFiles.map(async (entry) => {
        return validateUploadedFile(entry.file as File, entry.fieldName);
      })
    );

    // Check if all uploaded files passed validation
    const allValid = validationResults.every((result) => result.isValid);

    // Return structured validation report
    return NextResponse.json({
      success: true,
      message: allValid
        ? "All uploaded CSV files passed validation."
        : "Some uploaded CSV files have validation issues.",
      allValid,
      results: validationResults,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while validating the CSV files.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}