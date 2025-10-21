"use client";

/**
 * Admin Access Requests Dashboard
 *
 * Allows admins to:
 * - View all access requests (pending, approved, rejected)
 * - Filter by status
 * - Search by email or name
 * - Approve/reject individual requests
 * - Batch approve multiple requests
 * - Send invitation emails with access codes
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface AccessRequest {
  id: string;
  email: string;
  name: string;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  reviewer: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  accessCode: {
    id: string;
    code: string;
    isUsed: boolean;
    expiresAt: string;
  } | null;
}

export default function AccessRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(
    new Set()
  );
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [selectedStatus, searchQuery]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== "all") {
        params.append("status", selectedStatus);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/admin/access-requests?${params}`);

      if (!response.ok) {
        if (response.status === 403) {
          toast.error("Access denied. Admin privileges required.");
          router.push("/dashboard");
          return;
        }
        throw new Error("Failed to fetch requests");
      }

      const data = await response.json();
      setRequests(data.requests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load access requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setProcessingAction(true);
      const response = await fetch(
        `/api/admin/access-requests/${requestId}/approve`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve request");
      }

      toast.success("Request approved successfully");
      fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to approve request"
      );
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt("Enter rejection reason (optional):");

    try {
      setProcessingAction(true);
      const response = await fetch(
        `/api/admin/access-requests/${requestId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject request");
      }

      toast.success("Request rejected");
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to reject request"
      );
    } finally {
      setProcessingAction(false);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedRequests.size === 0) {
      toast.error("Please select requests to approve");
      return;
    }

    try {
      setProcessingAction(true);
      const response = await fetch("/api/admin/access-requests/batch-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestIds: Array.from(selectedRequests) }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve requests");
      }

      const data = await response.json();
      toast.success(`Approved ${data.count} request(s)`);
      setSelectedRequests(new Set());
      fetchRequests();
    } catch (error) {
      console.error("Error batch approving:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to approve requests"
      );
    } finally {
      setProcessingAction(false);
    }
  };

  const handleBatchSendInvitations = async () => {
    if (selectedRequests.size === 0) {
      toast.error("Please select approved requests to send invitations");
      return;
    }

    // Filter only approved requests
    const approvedRequestIds = requests
      .filter((r) => r.status === "approved" && selectedRequests.has(r.id))
      .map((r) => r.id);

    if (approvedRequestIds.length === 0) {
      toast.error("Please select approved requests");
      return;
    }

    try {
      setProcessingAction(true);
      const response = await fetch(
        "/api/admin/access-requests/batch-send-invitations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestIds: approvedRequestIds }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send invitations");
      }

      const data = await response.json();
      toast.success(
        `Sent ${data.summary.successful} invitation(s). ${data.summary.failed} failed.`
      );
      setSelectedRequests(new Set());
      fetchRequests();
    } catch (error) {
      console.error("Error sending invitations:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitations"
      );
    } finally {
      setProcessingAction(false);
    }
  };

  const toggleSelectRequest = (requestId: string) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId);
    } else {
      newSelected.add(requestId);
    }
    setSelectedRequests(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRequests.size === requests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(requests.map((r) => r.id)));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Access Requests
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage user access requests and send invitations
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedStatus("all")}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                selectedStatus === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStatus("pending")}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                selectedStatus === "pending"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setSelectedStatus("approved")}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                selectedStatus === "approved"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setSelectedStatus("rejected")}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                selectedStatus === "rejected"
                  ? "bg-red-600 text-white"
                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              Rejected
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>

        <button
          onClick={fetchRequests}
          disabled={loading}
          className="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Batch Actions */}
      {selectedRequests.size > 0 && (
        <div className="mb-4 flex items-center gap-4 rounded-md bg-indigo-50 p-4 dark:bg-indigo-900/20">
          <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
            {selectedRequests.size} selected
          </span>
          <button
            onClick={handleBatchApprove}
            disabled={processingAction}
            className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle className="mr-1 h-4 w-4" />
            Approve Selected
          </button>
          <button
            onClick={handleBatchSendInvitations}
            disabled={processingAction}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Mail className="mr-1 h-4 w-4" />
            Send Invitations
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      requests.length > 0 &&
                      selectedRequests.size === requests.length
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Access Code
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    No access requests found
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr
                    key={request.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRequests.has(request.id)}
                        onChange={() => toggleSelectRequest(request.id)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {request.name}
                      </div>
                      {request.message && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {request.message.substring(0, 50)}
                          {request.message.length > 50 ? "..." : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {request.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(request.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {request.accessCode ? (
                        <div>
                          <span className="font-mono text-xs text-gray-900 dark:text-gray-100">
                            {request.accessCode.code}
                          </span>
                          {request.accessCode.isUsed && (
                            <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                              ✓ Used
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {request.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(request.id)}
                            disabled={processingAction}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={processingAction}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {request.status === "rejected" &&
                        request.rejectionReason && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {request.rejectionReason}
                          </span>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
