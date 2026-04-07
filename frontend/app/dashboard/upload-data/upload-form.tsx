// frontend/app/dashboard/upload-data/upload-form.tsx

"use client";

import { useState } from "react";

type ValidationIssue = {
  row: number | "header" | "file";
  field: string;
  message: string;
};

type FileValidationResult = {
  label: string;
  fileName: string;
  totalRows: number;
  isValid: boolean;
  missingColumns: string[];
  issues: ValidationIssue[];
};

type SaveSummary = {
  branchesSaved: number;
  productsSaved: number;
  customersSaved: number;
  transactionsSaved: number;
  transactionItemsSaved: number;
};

export default function UploadForm() {
  const [transactionsFile, setTransactionsFile] = useState<File | null>(null);
  const [customersFile, setCustomersFile] = useState<File | null>(null);
  const [productsFile, setProductsFile] = useState<File | null>(null);
  const [branchesFile, setBranchesFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [allValid, setAllValid] = useState<boolean | null>(null);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [results, setResults] = useState<FileValidationResult[]>([]);
  const [saveSummary, setSaveSummary] = useState<SaveSummary | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setIsError(false);
    setAllValid(null);
    setSaved(null);
    setResults([]);
    setSaveSummary(null);

    setLoading(true);

    try {
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

      const response = await fetch("/api/upload-csv", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setIsError(true);
        setMessage(data.message || "Upload failed.");
        return;
      }

      setIsError(false);
      setMessage(data.message || "Process completed.");
      setAllValid(data.allValid ?? null);
      setSaved(data.saved ?? null);
      setResults(data.results || []);
      setSaveSummary(data.saveSummary || null);
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while uploading and saving."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
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
            {transactionsFile && (
              <p className="mt-2 text-sm text-gray-700">
                Selected: {transactionsFile.name}
              </p>
            )}
          </div>

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
            {customersFile && (
              <p className="mt-2 text-sm text-gray-700">
                Selected: {customersFile.name}
              </p>
            )}
          </div>

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
            {productsFile && (
              <p className="mt-2 text-sm text-gray-700">
                Selected: {productsFile.name}
              </p>
            )}
          </div>

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
            {branchesFile && (
              <p className="mt-2 text-sm text-gray-700">
                Selected: {branchesFile.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Validating and Saving..." : "Validate and Save CSV Files"}
          </button>

          <p className="text-xs text-gray-500">
            Only clean files will be saved to the database.
          </p>
        </div>
      </form>

      {message && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            isError
              ? "border-red-200 bg-red-50 text-red-700"
              : saved
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-yellow-200 bg-yellow-50 text-yellow-700"
          }`}
        >
          {message}
        </div>
      )}

      {saveSummary && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Database Save Summary</h2>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-gray-500">Branches Saved</p>
              <p className="mt-1 text-lg font-semibold">{saveSummary.branchesSaved}</p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-xs text-gray-500">Products Saved</p>
              <p className="mt-1 text-lg font-semibold">{saveSummary.productsSaved}</p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-xs text-gray-500">Customers Saved</p>
              <p className="mt-1 text-lg font-semibold">{saveSummary.customersSaved}</p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-xs text-gray-500">Transactions Saved</p>
              <p className="mt-1 text-lg font-semibold">{saveSummary.transactionsSaved}</p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-xs text-gray-500">Transaction Items Saved</p>
              <p className="mt-1 text-lg font-semibold">
                {saveSummary.transactionItemsSaved}
              </p>
            </div>
          </div>
        </div>
      )}

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