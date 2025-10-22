"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  DollarSign,
  Calendar,
  Building2,
  User,
  Globe,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import InvoiceEditModal from "@/components/InvoiceEditModal";
import { clientConfig } from "@/config/client";

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  total_amount: string;
  subtotal: string;
  tax_amount: string;
  customer_id?: string;
  salesperson_id?: string;
  order_status: number;
  payment_status: string;
  uploaded_by_user_id?: string;
  original_filename?: string;
  created_at: string;
  line_item_count?: number;
}

interface InvoiceUser {
  id: string;
  name: string | null;
  email: string;
}

interface InvoicesResponse {
  invoices: Invoice[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  is_admin: boolean;
  current_user_id: string;
}

const statusLabels: Record<number, { label: string; color: string }> = {
  1: { label: "In Process", color: "bg-blue-100 text-blue-800" },
  2: { label: "Approved", color: "bg-green-100 text-green-800" },
  3: { label: "Backordered", color: "bg-yellow-100 text-yellow-800" },
  4: { label: "Rejected", color: "bg-red-100 text-red-800" },
  5: { label: "Shipped", color: "bg-purple-100 text-purple-800" },
  6: { label: "Cancelled", color: "bg-gray-100 text-gray-800" },
};

const paymentStatusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  unpaid: "bg-yellow-100 text-yellow-800",
  partial: "bg-blue-100 text-blue-800",
  overdue: "bg-red-100 text-red-800",
};

export default function InvoicesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0,
    has_next: false,
    has_prev: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewAll, setViewAll] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<InvoiceUser[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

  const fetchAllUsers = async () => {
    try {
      const response = await fetch(
        `${clientConfig.baseUrl}/admin/users?per_page=1000`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchInvoices = async (page: number = 1) => {
    try {
      setIsLoading(true);

      const url = new URL(`${clientConfig.baseUrl}/invoices/`);
      url.searchParams.append("page", page.toString());
      url.searchParams.append("per_page", pagination.per_page.toString());

      if (isAdmin && viewAll) {
        url.searchParams.append("view_all", "true");
      }

      if (isAdmin && selectedUserIds.length > 0) {
        url.searchParams.append("user_ids", selectedUserIds.join(","));
      }

      const response = await fetch(url.toString(), {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }

      const data: InvoicesResponse = await response.json();
      setInvoices(data.invoices);
      setPagination(data.pagination);
      setIsAdmin(data.is_admin);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchInvoices();
    }
  }, [isAuthenticated, authLoading, viewAll, selectedUserIds]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers();
    }
  }, [isAdmin]);

  const handlePageChange = (newPage: number) => {
    fetchInvoices(newPage);
  };

  const handleViewAllToggle = () => {
    setViewAll(!viewAll);
    setSelectedUserIds([]);
  };

  const handleUserSelectionChange = (userId: string) => {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
    setViewAll(false);
  };

  const handleClearUserSelection = () => {
    setSelectedUserIds([]);
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <FileText className="h-8 w-8" />
              Invoices
            </h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin && viewAll
                ? "All invoices from all users"
                : isAdmin && selectedUserIds.length > 0
                  ? `Invoices from ${selectedUserIds.length} selected user${selectedUserIds.length > 1 ? "s" : ""}`
                  : "Your uploaded invoices"}
            </p>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  showFilters
                    ? "bg-foreground text-background"
                    : "bg-card border border-border text-foreground hover:bg-accent"
                )}
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>
          )}
        </div>

        {/* Admin Filters */}
        {isAdmin && showFilters && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Admin Filters
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">
                  View Mode
                </label>
                <button
                  onClick={handleViewAllToggle}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    viewAll
                      ? "bg-blue-600 text-white"
                      : "bg-card border border-border text-foreground hover:bg-accent"
                  )}
                >
                  <Globe className="h-4 w-4" />
                  {viewAll ? "Viewing All Invoices" : "View All Invoices"}
                </button>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Filter by User (Multi-Select)
                </label>
                <div className="space-y-2">
                  <div className="max-h-60 overflow-y-auto border border-border rounded-lg bg-background">
                    {allUsers.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">
                        No users found
                      </div>
                    ) : (
                      allUsers.map((u) => (
                        <label
                          key={u.id}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-accent cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(u.id)}
                            onChange={() => handleUserSelectionChange(u.id)}
                            className="w-4 h-4 text-blue-600 border-border rounded focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {u.name || "Unnamed User"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {u.email}
                            </p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  {selectedUserIds.length > 0 && (
                    <button
                      onClick={handleClearUserSelection}
                      className="w-full px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Clear Selection ({selectedUserIds.length})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Total Invoices
            </h3>
            <p className="text-2xl font-bold text-foreground">
              {pagination.total}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Current Page
            </h3>
            <p className="text-2xl font-bold text-foreground">
              {pagination.page} of {pagination.pages || 1}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Per Page
            </h3>
            <p className="text-2xl font-bold text-foreground">
              {pagination.per_page}
            </p>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground font-medium">No invoices found</p>
              <p className="text-muted-foreground text-sm mt-1">
                Upload some invoices to get started
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Invoice #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoices.map((invoice) => {
                      const statusInfo = statusLabels[invoice.order_status] || {
                        label: "Unknown",
                        color: "bg-gray-100 text-gray-800",
                      };

                      return (
                        <tr
                          key={invoice.id}
                          className="hover:bg-accent transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {invoice.invoice_number}
                                </p>
                                {invoice.original_filename && (
                                  <p className="text-xs text-muted-foreground">
                                    {invoice.original_filename}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm text-foreground">
                                  {formatDate(invoice.invoice_date)}
                                </p>
                                {invoice.due_date && (
                                  <p className="text-xs text-muted-foreground">
                                    Due: {formatDate(invoice.due_date)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  {formatCurrency(invoice.total_amount)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Subtotal: {formatCurrency(invoice.subtotal)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={cn(
                                "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
                                statusInfo.color
                              )}
                            >
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={cn(
                                "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
                                paymentStatusColors[invoice.payment_status] ||
                                  "bg-gray-100 text-gray-800"
                              )}
                            >
                              {invoice.payment_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {invoice.line_item_count || 0} items
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => setEditingInvoiceId(invoice.id)}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-muted px-6 py-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-foreground">
                    Showing{" "}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.per_page + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        pagination.page * pagination.per_page,
                        pagination.total
                      )}
                    </span>{" "}
                    of <span className="font-medium">{pagination.total}</span>{" "}
                    invoices
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.has_prev}
                      className="flex items-center gap-1 px-3 py-2 border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-foreground"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.has_next}
                      className="flex items-center gap-1 px-3 py-2 border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-foreground"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingInvoiceId && (
        <InvoiceEditModal
          invoiceId={editingInvoiceId}
          isOpen={!!editingInvoiceId}
          onClose={() => setEditingInvoiceId(null)}
          onSave={() => {
            setEditingInvoiceId(null);
            fetchInvoices(pagination.page);
          }}
        />
      )}
    </div>
  );
}
