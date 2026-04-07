// frontend/app/api/upload-csv/route.ts

// Import NextResponse so we can send JSON responses back to the frontend
import { NextResponse } from "next/server";

// This handles POST requests sent to /api/upload-csv
export async function POST(request: Request) {
  try {
    // Read the form data coming from the browser
    const formData = await request.formData();

    // Get the uploaded files by their field names
    const transactionsFile = formData.get("transactionsFile") as File | null;
    const customersFile = formData.get("customersFile") as File | null;
    const productsFile = formData.get("productsFile") as File | null;
    const branchesFile = formData.get("branchesFile") as File | null;

    // Put all files into one array so it is easier to check them
    const files = [
      { label: "Transactions CSV", file: transactionsFile },
      { label: "Customers CSV", file: customersFile },
      { label: "Products CSV", file: productsFile },
      { label: "Branches CSV", file: branchesFile },
    ];

    // Check if the user uploaded at least one file
    const uploadedFiles = files.filter((item) => item.file !== null);

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Please upload at least one CSV file.",
        },
        { status: 400 }
      );
    }

    // Check that every uploaded file looks like a CSV
    for (const item of uploadedFiles) {
      const currentFile = item.file;

      // Extra safety check in case something unexpected happens
      if (!currentFile) continue;

      // Check the file name extension
      const isCsvByName = currentFile.name.toLowerCase().endsWith(".csv");

      // Check the file MIME type if available
      const isCsvByType =
        currentFile.type === "text/csv" ||
        currentFile.type === "application/vnd.ms-excel" ||
        currentFile.type === "";

      // If the file does not look like a CSV, return an error
      if (!isCsvByName && !isCsvByType) {
        return NextResponse.json(
          {
            success: false,
            message: `${item.label} must be a CSV file.`,
          },
          { status: 400 }
        );
      }
    }

    // For Step 20, we do not save to the database yet.
    // We only confirm that the files were received successfully.

    // Build a summary of uploaded file names
    const uploadedSummary = uploadedFiles.map((item) => ({
      label: item.label,
      fileName: item.file?.name ?? "Unknown file",
      size: item.file?.size ?? 0,
    }));

    // Return success response
    return NextResponse.json({
      success: true,
      message: "CSV files uploaded successfully.",
      uploadedFiles: uploadedSummary,
    });
  } catch (error) {
    // If something unexpected fails, return a generic server error
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while uploading the CSV files.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}