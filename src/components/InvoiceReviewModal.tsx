"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Loader2,
  Save,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  ZoomIn,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { clientConfig } from "@/config/client";
import Image from "next/image";
import type { ApiErrorResponse } from "@/types/api";

interface LineItem {
  line_number: number;
  item_number?: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  unit_of_measure?: string;
}

interface ExtractedInvoiceData {
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  ship_date?: string;
  total_amount: string;
  subtotal: string;
  tax_amount: string;
  tax_rate?: string;
  freight?: string;
  shipping_handling?: string;
  other_charges?: string;
  account_number?: string;
  po_number?: string;
  ship_via?: string;
  fob?: string;
  terms?: string;
  notes?: string;
  line_items: LineItem[];
}

interface JobDetails {
  task_id: string;
  status: string;
  progress: number;
  confidence_score?: number;
  result_data?: {
    extraction_result?: {
      structured_data?: ExtractedInvoiceData;
      confidence_score?: number;
    };
    auto_saved?: boolean;
    invoice_id?: string;
    filename?: string;
  };
  file_info?: {
    file_name: string;
    blob_url?: string;
  };
}

interface InvoiceReviewModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (result?: Record<string, unknown>) => void;
}

export default function InvoiceReviewModal({
  taskId,
  isOpen,
  onClose,
  onApprove,
}: InvoiceReviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && taskId) {
      fetchJobDetails();
    }
  }, [isOpen, taskId]);

  const fetchJobDetails = async () => {
    if (!taskId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${clientConfig.baseUrl}/jobs/my-jobs/${taskId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error: ApiErrorResponse = await response.json();
        throw new Error(error.error || "Failed to fetch job details");
      }

      const data = await response.json();
      setJobDetails(data.job);

      // Try to get blob URL from file_info
      if (data.file_info?.blob_url) {
        setBlobUrl(data.file_info.blob_url);
      } else if (data.job?.result_data?.blob_url) {
        setBlobUrl(data.job.result_data.blob_url);
      }
    } catch (error: unknown) {
      console.error("Error fetching job details:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load invoice data";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!taskId) return;

    try {
      setSaving(true);
      const response = await fetch(
        `${clientConfig.baseUrl}/invoices/approve/${taskId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error: ApiErrorResponse = await response.json();
        throw new Error(error.error || "Failed to approve invoice");
      }

      const result = await response.json();
      toast.success("Invoice approved and saved successfully");
      onApprove?.(result);
      onClose();
    } catch (error: unknown) {
      console.error("Error approving invoice:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to approve invoice";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const extractedData =
    jobDetails?.result_data?.extraction_result?.structured_data;
  const confidenceScore =
    jobDetails?.result_data?.extraction_result?.confidence_score ||
    jobDetails?.confidence_score ||
    0;
  const alreadySaved = jobDetails?.result_data?.auto_saved;
  const invoiceId = jobDetails?.result_data?.invoice_id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Review Extracted Invoice
              </h2>
              {jobDetails?.file_info?.file_name && (
                <p className="text-sm text-gray-500">
                  {jobDetails.file_info.file_name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : !extractedData ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No extraction data available</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Invoice Data */}
              <div className="space-y-6">
                {/* Confidence Score */}
                <div
                  className={`rounded-lg p-4 ${
                    confidenceScore >= 0.8
                      ? "bg-green-50 border border-green-200"
                      : confidenceScore >= 0.6
                        ? "bg-yellow-50 border border-yellow-200"
                        : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Extraction Confidence
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        confidenceScore >= 0.8
                          ? "text-green-700"
                          : confidenceScore >= 0.6
                            ? "text-yellow-700"
                            : "text-red-700"
                      }`}
                    >
                      {(confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Already Saved Notice */}
                {alreadySaved && invoiceId && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      This invoice has already been saved to the database
                    </span>
                  </div>
                )}

                {/* Invoice Header Fields */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Invoice Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600">
                        Invoice Number
                      </label>
                      <p className="text-sm font-medium text-gray-900">
                        {extractedData.invoice_number || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">PO Number</label>
                      <p className="text-sm font-medium text-gray-900">
                        {extractedData.po_number || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">
                        Invoice Date
                      </label>
                      <p className="text-sm font-medium text-gray-900">
                        {extractedData.invoice_date || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Due Date</label>
                      <p className="text-sm font-medium text-gray-900">
                        {extractedData.due_date || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Financial Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subtotal</span>
                      <span className="text-sm font-medium text-gray-900">
                        ${extractedData.subtotal || "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tax</span>
                      <span className="text-sm font-medium text-gray-900">
                        ${extractedData.tax_amount || "0.00"}
                      </span>
                    </div>
                    {extractedData.freight && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Freight</span>
                        <span className="text-sm font-medium text-gray-900">
                          ${extractedData.freight}
                        </span>
                      </div>
                    )}
                    {extractedData.shipping_handling && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Shipping & Handling
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          ${extractedData.shipping_handling}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-300">
                      <span className="text-sm font-semibold text-gray-900">
                        Total Amount
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        ${extractedData.total_amount || "0.00"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                {extractedData.line_items &&
                  extractedData.line_items.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Line Items ({extractedData.line_items.length})
                      </h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {extractedData.line_items.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-gray-200 rounded p-3"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {item.description}
                                </p>
                                {item.item_number && (
                                  <p className="text-xs text-gray-500">
                                    Item: {item.item_number}
                                  </p>
                                )}
                              </div>
                              <span className="text-sm font-semibold text-gray-900 ml-2">
                                ${item.line_total?.toFixed(2) || "0.00"}
                              </span>
                            </div>
                            <div className="flex gap-4 text-xs text-gray-600">
                              <span>Qty: {item.quantity}</span>
                              <span>
                                @ ${item.unit_price?.toFixed(2) || "0.00"}
                              </span>
                              {item.unit_of_measure && (
                                <span>{item.unit_of_measure}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Additional Details */}
                {(extractedData.terms || extractedData.notes) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Additional Details
                    </h3>
                    {extractedData.terms && (
                      <div className="mb-2">
                        <label className="text-xs text-gray-600">Terms</label>
                        <p className="text-sm text-gray-900">
                          {extractedData.terms}
                        </p>
                      </div>
                    )}
                    {extractedData.notes && (
                      <div>
                        <label className="text-xs text-gray-600">Notes</label>
                        <p className="text-sm text-gray-900">
                          {extractedData.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Invoice Image Preview */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Original Document
                    </h3>
                    {blobUrl && (
                      <button
                        onClick={() => setImageExpanded(!imageExpanded)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                      >
                        <ZoomIn className="h-3 w-3" />
                        {imageExpanded ? "Collapse" : "Expand"}
                      </button>
                    )}
                  </div>
                  {blobUrl ? (
                    <div
                      className={`relative bg-white border border-gray-200 rounded overflow-hidden ${
                        imageExpanded ? "h-[600px]" : "h-96"
                      }`}
                    >
                      {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                      )}
                      <Image
                        src={blobUrl}
                        alt="Invoice preview"
                        width={400}
                        height={400}
                        className="w-full h-full object-contain"
                        onLoad={() => setImageLoading(false)}
                        onError={() => {
                          setImageLoading(false);
                          toast.error("Failed to load invoice image");
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-96 bg-white border border-gray-200 rounded flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          No image available
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {alreadySaved ? (
              <span className="text-green-600">Invoice already saved</span>
            ) : (
              <span>Review the extracted data before approving</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
            {!alreadySaved && (
              <button
                onClick={handleApprove}
                disabled={saving || !extractedData}
                className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Approve & Save
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
