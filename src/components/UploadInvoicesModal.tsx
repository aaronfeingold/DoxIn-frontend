"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Upload,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileText,
  Clock,
  Eye,
} from "lucide-react";
import { useProcessing } from "@/contexts/ProcessingContext";
import { toast } from "sonner";
import InvoiceReviewModal from "./InvoiceReviewModal";

type ModelProvider = "openai" | "anthropic";

interface UploadInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadInvoicesModal({
  isOpen,
  onClose,
}: UploadInvoicesModalProps) {
  const { startBatchProcessing, isConnected, jobs } = useProcessing();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [model, setModel] = useState<ModelProvider>("openai");
  const [confidence, setConfidence] = useState<number>(0.8);
  const [humanInLoop, setHumanInLoop] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingTaskIds, setTrackingTaskIds] = useState<string[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [reviewTaskId, setReviewTaskId] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Debug: log tracked jobs when they change
  useEffect(() => {
    if (trackingTaskIds.length > 0) {
      console.log("Tracking task IDs:", trackingTaskIds);
      console.log(
        "Current jobs:",
        Array.from(jobs.entries()).filter(([id]) =>
          trackingTaskIds.includes(id)
        )
      );
    }
  }, [trackingTaskIds, jobs]);

  const canSubmit = useMemo(
    () => files.length > 0 && !submitting && isConnected,
    [files, submitting, isConnected]
  );

  // Get tracked jobs from the jobs map
  const trackedJobs = useMemo(() => {
    return trackingTaskIds
      .map((id) => jobs.get(id))
      .filter((job) => job !== undefined);
  }, [trackingTaskIds, jobs]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (trackedJobs.length === 0) return 0;
    const total = trackedJobs.reduce(
      (sum, job) => sum + (job?.progress || 0),
      0
    );
    return Math.round(total / trackedJobs.length);
  }, [trackedJobs]);

  // Check if all jobs are complete
  const allJobsComplete = useMemo(() => {
    if (trackedJobs.length === 0) return false;
    return trackedJobs.every(
      (job) => job?.status === "completed" || job?.status === "failed"
    );
  }, [trackedJobs]);

  // Count successful and failed jobs
  const jobStats = useMemo(() => {
    const completed = trackedJobs.filter(
      (job) => job?.status === "completed"
    ).length;
    const failed = trackedJobs.filter((job) => job?.status === "failed").length;
    const processing = trackedJobs.filter(
      (job) => job?.status === "processing"
    ).length;
    return { completed, failed, processing, total: trackedJobs.length };
  }, [trackedJobs]);

  const handleChoose = () => inputRef.current?.click();

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/tiff",
    ];
    const next: File[] = [];
    for (let i = 0; i < incoming.length; i++) {
      const f = incoming.item(i);
      if (!f) continue;
      if (!allowed.includes(f.type)) continue;
      if (f.size > 10 * 1024 * 1024) continue;
      next.push(f);
    }
    setFiles((prev) => [...prev, ...next]);
    setError(null);
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const taskIds = await startBatchProcessing(files, {
        auto_save: !humanInLoop,
        cleanup: true,
        model_provider: model,
        confidence_threshold: confidence,
        human_in_loop: humanInLoop,
      });

      setTrackingTaskIds(taskIds);
      toast.success(
        "Processing started. You can watch the progress below or close this modal."
      );
      setShowProgress(true);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to start processing";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFiles([]);
      setError(null);
      setShowProgress(false);
      setTrackingTaskIds([]);
      setReviewTaskId(null);
      onClose();
    }
  };

  const handleViewResults = (taskId: string) => {
    setReviewTaskId(taskId);
    setShowReviewModal(true);
  };

  const handleReviewModalClose = () => {
    setShowReviewModal(false);
    setReviewTaskId(null);
  };

  const handleApproveSuccess = () => {
    // Refresh or handle successful approval
    toast.success("Invoice saved successfully!");
    handleReviewModalClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Upload Invoices
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="mb-4 flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
            <AlertCircle className="h-4 w-4" />
            <span>Connecting to processing server...</span>
          </div>
        )}

        {/* Content */}
        {!showProgress && (
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.tiff"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        )}

        <div className="flex flex-col gap-4">
          {showProgress ? (
            // Progress View
            <>
              <div className="space-y-4">
                {/* Overall Progress */}
                <div
                  className={`rounded-lg p-4 ${
                    jobStats.failed > 0 && allJobsComplete
                      ? "bg-red-50 border border-red-200"
                      : jobStats.failed > 0
                        ? "bg-yellow-50 border border-yellow-200"
                        : "bg-blue-50 border border-blue-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock
                        className={`h-5 w-5 ${
                          jobStats.failed > 0 && allJobsComplete
                            ? "text-red-600"
                            : jobStats.failed > 0
                              ? "text-yellow-600"
                              : "text-blue-600"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          jobStats.failed > 0 && allJobsComplete
                            ? "text-red-900"
                            : jobStats.failed > 0
                              ? "text-yellow-900"
                              : "text-blue-900"
                        }`}
                      >
                        Processing {trackedJobs.length} file
                        {trackedJobs.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        jobStats.failed > 0 && allJobsComplete
                          ? "text-red-900"
                          : jobStats.failed > 0
                            ? "text-yellow-900"
                            : "text-blue-900"
                      }`}
                    >
                      {overallProgress}%
                    </span>
                  </div>
                  <div
                    className={`w-full rounded-full h-2 ${
                      jobStats.failed > 0 && allJobsComplete
                        ? "bg-red-200"
                        : jobStats.failed > 0
                          ? "bg-yellow-200"
                          : "bg-blue-200"
                    }`}
                  >
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        jobStats.failed > 0 && allJobsComplete
                          ? "bg-red-600"
                          : jobStats.failed > 0
                            ? "bg-yellow-600"
                            : "bg-blue-600"
                      }`}
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>

                {/* Individual Job Status */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {trackedJobs.map((job) => (
                    <div
                      key={job.task_id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate">
                            {job.filename}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {job.status === "completed" && (
                            <>
                              <button
                                onClick={() => handleViewResults(job.task_id)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                <Eye className="h-3 w-3" />
                                View Results
                              </button>
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </>
                          )}
                          {job.status === "failed" && (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          {job.status === "processing" && (
                            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                          )}
                        </div>
                      </div>
                      {job.error && (
                        <div className="mt-2 text-xs text-red-600">
                          Error: {job.error}
                        </div>
                      )}
                      {job.status === "completed" && (
                        <div className="mt-2 text-xs text-green-600">
                          Completed successfully - Click to review
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Completion Message */}
                {allJobsComplete && (
                  <>
                    {jobStats.failed === 0 ? (
                      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>
                          All processing complete! You can close this modal.
                        </span>
                      </div>
                    ) : jobStats.completed > 0 ? (
                      <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>
                          Processing complete with errors: {jobStats.completed}{" "}
                          succeeded, {jobStats.failed} failed. You can close
                          this modal.
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>
                          All files failed to process. Please check the errors
                          above and try again.
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Progress View Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-medium"
                >
                  {allJobsComplete ? "Close" : "Close and Run in Background"}
                </button>
              </div>
            </>
          ) : (
            // Upload Form View
            <>
              {/* File Selection */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-gray-100 rounded-full">
                    <FileText className="h-8 w-8 text-gray-600" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      Select invoice files
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      PDF and images up to 10MB each
                    </div>
                  </div>
                  <button
                    onClick={handleChoose}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-medium text-sm"
                  >
                    <Upload className="h-4 w-4" /> Choose files
                  </button>
                </div>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {files.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <div className="text-sm text-gray-700 truncate">
                          {f.name}
                        </div>
                        <div className="text-xs text-gray-500 flex-shrink-0">
                          {(f.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(idx)}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Processing Options */}
              <div className="border-t border-gray-200 pt-4">
                <div className="text-sm font-medium text-gray-900 mb-3">
                  Processing Options
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">
                      AI Model Provider
                    </label>
                    <select
                      value={model}
                      onChange={(e) =>
                        setModel(e.target.value as ModelProvider)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={submitting}
                    >
                      <option value="openai" className="text-gray-900">
                        OpenAI GPT-4
                      </option>
                      <option
                        value="anthropic"
                        disabled
                        title="Coming soon!"
                        className="text-gray-400"
                      >
                        Anthropic Claude (Coming soon!)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label
                      className={`block text-xs mb-2 ${humanInLoop ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Auto-save Confidence Threshold:{" "}
                      {Math.round(confidence * 100)}%
                    </label>
                    <input
                      type="range"
                      min={0.5}
                      max={0.95}
                      step={0.05}
                      value={confidence}
                      onChange={(e) => setConfidence(Number(e.target.value))}
                      className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={submitting || humanInLoop}
                    />
                    <div
                      className={`text-xs mt-1 ${humanInLoop ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {humanInLoop
                        ? "Disabled when human review is required"
                        : "Results above this threshold will be auto-saved"}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={humanInLoop}
                      onChange={(e) => setHumanInLoop(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={submitting}
                    />
                    <span>Require human review before saving</span>
                  </label>
                  <div className="text-xs text-gray-500 mt-1 ml-6">
                    When enabled, all extractions require manual approval before
                    saving to database
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={!canSubmit}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Start Processing
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <InvoiceReviewModal
        taskId={reviewTaskId}
        isOpen={showReviewModal}
        onClose={handleReviewModalClose}
        onApprove={handleApproveSuccess}
      />
    </div>
  );
}
