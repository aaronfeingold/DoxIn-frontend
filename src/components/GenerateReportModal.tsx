"use client";

import { useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { clientConfig } from "@/config/client";

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReportJob {
  report_id: string;
  status: string;
  message: string;
}

export default function GenerateReportModal({
  isOpen,
  onClose,
}: GenerateReportModalProps) {
  const [reportType, setReportType] = useState<"financial" | "sales">(
    "financial"
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportJob, setReportJob] = useState<ReportJob | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  if (!isOpen) return null;

  const handleClose = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    setReportType("financial");
    setTitle("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setReportJob(null);
    setIsGenerating(false);
    onClose();
  };

  const checkReportStatus = async (reportId: string) => {
    try {
      const response = await fetch(
        `${clientConfig.apiUrl}/api/v1/reports/${reportId}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReportJob({
          report_id: reportId,
          status: data.report.status,
          message: "",
        });

        if (data.report.status === "completed") {
          setIsGenerating(false);
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          toast.success("Report generated successfully!");
        } else if (data.report.status === "failed") {
          setIsGenerating(false);
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          toast.error(data.report.error_message || "Failed to generate report");
        }
      }
    } catch (error) {
      console.error("Error checking report status:", error);
    }
  };

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a report title");
      return;
    }

    setIsGenerating(true);

    try {
      const params: any = {};

      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      const response = await fetch(
        `${clientConfig.apiUrl}/api/v1/reports/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            report_type: reportType,
            title,
            description,
            parameters: params,
            file_format: "png",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReportJob({
          report_id: data.report_id,
          status: data.status,
          message: data.message,
        });

        toast.success("Report generation started!");

        // Start polling for status
        const interval = setInterval(() => {
          checkReportStatus(data.report_id);
        }, 2000);
        setPollingInterval(interval);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to generate report");
        setIsGenerating(false);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!reportJob || reportJob.status !== "completed") return;

    try {
      const response = await fetch(
        `${clientConfig.apiUrl}/api/v1/reports/${reportJob.report_id}/download`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title.replace(/\s+/g, "_")}_report.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Report downloaded!");
      } else {
        toast.error("Failed to download report");
      }
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Failed to download report");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">
            Generate Custom Report
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-background rounded-lg transition-colors"
            disabled={isGenerating}
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Report Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setReportType("financial")}
                disabled={isGenerating || reportJob !== null}
                className={`p-4 rounded-lg border-2 transition-all ${
                  reportType === "financial"
                    ? "border-foreground bg-foreground/10"
                    : "border-border hover:border-foreground/50"
                }`}
              >
                <h3 className="font-semibold text-foreground mb-1">
                  Financial Report
                </h3>
                <p className="text-sm text-muted-foreground">
                  Profit margins, cost vs price, break-even analysis
                </p>
              </button>

              <button
                onClick={() => setReportType("sales")}
                disabled={isGenerating || reportJob !== null}
                className={`p-4 rounded-lg border-2 transition-all ${
                  reportType === "sales"
                    ? "border-foreground bg-foreground/10"
                    : "border-border hover:border-foreground/50"
                }`}
              >
                <h3 className="font-semibold text-foreground mb-1">
                  Sales Report
                </h3>
                <p className="text-sm text-muted-foreground">
                  Territory performance, top salespeople, trends
                </p>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Report Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isGenerating || reportJob !== null}
              placeholder="e.g., Q4 2024 Financial Analysis"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground disabled:opacity-50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isGenerating || reportJob !== null}
              placeholder="Add any notes about this report..."
              rows={3}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground disabled:opacity-50"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Start Date (Optional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isGenerating || reportJob !== null}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isGenerating || reportJob !== null}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground disabled:opacity-50"
              />
            </div>
          </div>

          {/* Status Display */}
          {reportJob && (
            <div className="p-4 bg-background rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">Report Status</h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    reportJob.status === "completed"
                      ? "bg-green-500/10 text-green-500"
                      : reportJob.status === "failed"
                        ? "bg-red-500/10 text-red-500"
                        : reportJob.status === "processing"
                          ? "bg-blue-500/10 text-blue-500"
                          : "bg-yellow-500/10 text-yellow-500"
                  }`}
                >
                  {reportJob.status.toUpperCase()}
                </span>
              </div>

              {reportJob.status === "processing" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating your report...</span>
                </div>
              )}

              {reportJob.status === "completed" && (
                <button
                  onClick={handleDownload}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-medium"
                >
                  <Download className="h-4 w-4" />
                  Download Report
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="px-6 py-2 border border-border rounded-lg text-foreground hover:bg-background transition-colors disabled:opacity-50"
          >
            {reportJob?.status === "completed" ? "Close" : "Cancel"}
          </button>

          {!reportJob && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !title.trim()}
              className="px-6 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Report"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
