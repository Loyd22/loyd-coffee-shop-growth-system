// frontend/app/dashboard/upload-data/upload-form.tsx

"use client";

// We use useState to store selected files and UI states
import { useState } from "react";

// Type for the uploaded file summary returned by the API
type UploadedFileSummary = {
  label: string;
  fileName: string;
  size: number;
};

export default function UploadForm() {
  // Store selected files for each CSV type
  const [transactionsFile, setTransactionsFile] = useState<File | null>(null);
  const [customersFile, setCustomersFile] = useState<File | null>(null);
  const [productsFile, setProductsFile] = useState<File | null>(null);
  const [branchesFile, setBranchesFile] = useState<File | null>(null);

  // Store loading state while upload is running
  const [loading, setLoading] = useState(false);

  // Store success or error message
  const [message, setMessage] = useState("");

  // Store whether the message is success or error
  const [isError, setIsError] = useState(false);

  // Store uploaded file summary from the backend
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileSummary[]>([]);

  // This function runs when the user submits the upload form
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Prevent page refresh
    e.preventDefault();

    // Reset old UI messages
    setMessage("");
    setIsError(false);
    setUploadedFiles([]);

    // Show loading
    setLoading(true);

    try {
      // Create a form data object to send files to the API
      const formData = new FormData();

      // Only append files that were actually selected
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

      // Send the files to our API route
      const response = await fetch("/api/upload-csv", {
        method: "POST",
        body: formData,
      });

      // Read the JSON response
      const data = await response.json();

      // If the API says upload failed, show the error
      if (!response.ok || !data.success) {
        setIsError(true);
        setMessage(data.message || "Upload failed.");
        return;
      }

      // If upload succeeded, show success message and file summary
      setIsError(false);
      setMessage(data.message || "Upload successful.");
      setUploadedFiles(data.uploadedFiles || []);
    } catch (error) {
      // Catch network or unexpected frontend errors
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while uploading."
      );
    } finally {
      // Stop loading whether success or failure
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File input cards */}
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
            Upload transaction records from the coffee shop.
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
            Upload customer records or loyalty-related data.
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
            Upload product list and product-related information.
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
            Upload branch information for branch-level analysis.
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
          {loading ? "Uploading..." : "Upload CSV Files"}
        </button>

        <p className="text-xs text-gray-500">
          You can upload one or more CSV files.
        </p>
      </div>

      {/* Success or error message */}
      {message && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            isError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Uploaded file summary */}
      {uploadedFiles.length > 0 && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Uploaded Files</h2>

          <div className="space-y-3">
            {uploadedFiles.map((file) => (
              <div
                key={`${file.label}-${file.fileName}`}
                className="rounded-lg border p-4"
              >
                <p className="text-sm font-medium">{file.label}</p>
                <p className="text-sm text-gray-600">
                  File Name: {file.fileName}
                </p>
                <p className="text-sm text-gray-600">
                  Size: {file.size.toLocaleString()} bytes
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}