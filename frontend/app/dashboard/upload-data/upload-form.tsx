// frontend/app/dashboard/upload-data/upload-form.tsx

"use client";

// We use useState for selected files and validation results
import { useState } from "react";

// This type matches one issue returned by the API
type ValidationIssue = {
  row: number | "header" | "file";
  field: string;
  message: string;
};

// This type matches one file validation result returned by the API
type FileValidationResult = {
  label: string;
  fileName: string;
  totalRows: number;
  isValid: boolean;
  missingColumns: string[];
  issues: ValidationIssue[];
};

export default function UploadForm() {
  // Store selected files
  const [transactionsFile, setTransactionsFile] = useState<File | null>(null);
  const [customersFile, setCustomersFile] = useState<File | null>(null);
  const [productsFile, setProductsFile] = useState<File | null>(null);
  const [branchesFile, setBranchesFile] = useState<File | null>(null);

  // Store loading state
  const [loading, setLoading] = useState(false);

  // Store top-level success or error message
  const [message, setMessage] = useState("");

  // Store whether the top message is an error
  const [isError, setIsError] = useState(false);

  // Store whether all files are valid
  const [allValid, setAllValid] = useState<boolean | null>(null);

  // Store per-file validation results
  const [results, setResults] = useState<FileValidationResult[]>([]);

  // This handles form submit
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Reset previous UI state
    setMessage("");
    setIsError(false);
    setAllValid(null);
    setResults([]);

    setLoading(true);

    try {
      // Build the form data for file upload
      const formData = new FormData();

      if (transactionsFile) {
        formData.append("transactionsFile", transactionsFile);
      }

      if (customersFile) {
        formData.append("customersFile", customersFile);
      }

      if (productsFile) {
        formData.append("productsFile", productsFile);
      }

      if (branchesFile) {
        formData.append("branchesFile", branchesFile);
      }

      // Send files to validation API
      const response = await fetch("/api/upload-csv", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      // Handle server-side failure
      if (!response.ok || !data.success) {
        setIsError(true);
        setMessage(data.message || "Validation failed.");
        return;
      }

      // Show validation results
      setIsError(false);
      setMessage(data.message || "Validation completed.");
      setAllValid(data.allValid ?? null);
      setResults(data.results || []);
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while validating the files."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Transactions CSV */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <label className="mb-2 block text-sm font-semibold">
              Transactions CSV
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setTransactionsFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
            <p className="mt-2 text-xs text-gray-500">
              Example required fields: transaction_id, branch_id, product_id,
              quantity, price, total_amount, transaction_date
            </p>
            {transactionsFile && (
              <p className="mt-2 text-sm text-gray-700">
                Selected: {transactionsFile.name}
              </p>
            )}
          </div>

          {/* Customers CSV */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <label className="mb-2 block text-sm font-semibold">
              Customers CSV
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCustomersFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
            <p className="mt-2 text-xs text-gray-500">
              Example required fields: customer_id, customer_name, email, phone
            </p>
            {customersFile && (
              <p className="mt-2 text-sm text-gray-700">
                Selected: {customersFile.name}
              </p>
            )}
          </div>

          {/* Products CSV */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <label className="mb-2 block text-sm font-semibold">
              Products CSV
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setProductsFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
            <p className="mt-2 text-xs text-gray-500">
              Example required fields: product_id, product_name, category, price
            </p>
            {productsFile && (
              <p className="mt-2 text-sm text-gray-700">
                Selected: {productsFile.name}
              </p>
            )}
          </div>

          {/* Branches CSV */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <label className="mb-2 block text-sm font-semibold">
              Branches CSV
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setBranchesFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
            <p className="mt-2 text-xs text-gray-500">
              Example required fields: branch_id, branch_name, location
            </p>
            {branchesFile && (
              <p className="mt-2 text-sm text-gray-700">
                Selected: {branchesFile.name}
              </p>
            )}
          </div>
        </div>

        {/* Submit button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Validating..." : "Validate CSV Files"}
          </button>

          <p className="text-xs text-gray-500">
            The system will check file structure, columns, and basic row quality.
          </p>
        </div>
      </form>

      {/* Top-level message */}
      {message && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            isError
              ? "border-red-200 bg-red-50 text-red-700"
              : allValid
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-yellow-200 bg-yellow-50 text-yellow-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Validation results */}
      {results.length > 0 && (
        <div className="space-y-6">
          {results.map((result) => (
            <div
              key={`${result.label}-${result.fileName}`}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{result.label}</h2>
                  <p className="text-sm text-gray-600">{result.fileName}</p>
                </div>

                <div
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    result.isValid
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {result.isValid ? "Valid" : "Has Issues"}
                </div>
              </div>

              <div className="mb-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-gray-500">Total Rows Checked</p>
                  <p className="mt-1 text-lg font-semibold">{result.totalRows}</p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-xs text-gray-500">Missing Columns</p>
                  <p className="mt-1 text-lg font-semibold">
                    {result.missingColumns.length}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-xs text-gray-500">Issues Found</p>
                  <p className="mt-1 text-lg font-semibold">{result.issues.length}</p>
                </div>
              </div>

              {/* Missing columns */}
              {result.missingColumns.length > 0 && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-red-700">
                    Missing Required Columns
                  </h3>
                  <ul className="list-inside list-disc text-sm text-red-700">
                    {result.missingColumns.map((column) => (
                      <li key={column}>{column}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Issue list */}
              {result.issues.length > 0 ? (
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Validation Issues</h3>
                  <div className="space-y-3">
                    {result.issues.map((issue, index) => (
                      <div
                        key={`${result.fileName}-${issue.field}-${issue.row}-${index}`}
                        className="rounded-lg border p-4"
                      >
                        <p className="text-sm font-medium">{issue.message}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          Row: {issue.row} | Field: {issue.field}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  No validation issues found for this file.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}