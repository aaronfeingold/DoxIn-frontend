"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Loader2,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  ZoomIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { clientConfig } from "@/config/client";

interface LineItem {
  id?: string;
  line_number: number;
  item_number?: string;
  description: string;
  quantity: number;
  unit_price: number;
  unit_price_discount?: number;
  line_total: number;
  unit_of_measure?: string;
}

interface InvoiceData {
  id: string;
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
  order_status: number;
  payment_status: string;
  customer_id?: string;
  salesperson_id?: string;
  territory_id?: string;
  account_number?: string;
  po_number?: string;
  ship_via?: string;
  fob?: string;
  terms?: string;
  special_instructions?: string;
  notes?: string;
  line_items: LineItem[];
  blob_url?: string;
}

interface InvoiceEditModalProps {
  invoiceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const statusOptions = [
  { value: 1, label: "In Process" },
  { value: 2, label: "Approved" },
  { value: 3, label: "Backordered" },
  { value: 4, label: "Rejected" },
  { value: 5, label: "Shipped" },
  { value: 6, label: "Cancelled" },
];

const paymentStatusOptions = ["paid", "unpaid", "partial", "overdue"];

export default function InvoiceEditModal({
  invoiceId,
  isOpen,
  onClose,
  onSave,
}: InvoiceEditModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    if (isOpen && invoiceId) {
      fetchInvoice();
    }
  }, [isOpen, invoiceId]);

  const formatDateForInput = (
    dateString: string | undefined | null
  ): string => {
    if (!dateString) return "";
    try {
      // Handle various date formats from backend
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      // Return in YYYY-MM-DD format for date inputs
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${clientConfig.backendUrl}/api/v1/invoices/${invoiceId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch invoice");
      }

      const data = await response.json();

      // Convert date fields to YYYY-MM-DD format for date inputs
      if (data.invoice_date) {
        data.invoice_date = formatDateForInput(data.invoice_date);
      }
      if (data.due_date) {
        data.due_date = formatDateForInput(data.due_date);
      }
      if (data.ship_date) {
        data.ship_date = formatDateForInput(data.ship_date);
      }

      setInvoice(data);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!invoice) return;

    try {
      setSaving(true);
      const response = await fetch(
        `${clientConfig.backendUrl}/api/v1/invoices/${invoiceId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(invoice),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update invoice");
      }

      toast.success("Invoice updated successfully");
      onSave?.();
      onClose();
    } catch (error: any) {
      console.error("Error saving invoice:", error);
      toast.error(error.message || "Failed to save invoice");
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    if (!invoice) return;
    setInvoice({ ...invoice, [field]: value });
  };

  const handleLineItemChange = (index: number, field: string, value: any) => {
    if (!invoice) return;
    const updatedItems = [...invoice.line_items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalculate line total if quantity or unit price changes
    if (field === "quantity" || field === "unit_price") {
      const item = updatedItems[index];
      const baseTotal = (item.quantity || 0) * (item.unit_price || 0);
      const discount = item.unit_price_discount || 0;
      updatedItems[index].line_total = baseTotal * (1 - discount);
    }

    setInvoice({ ...invoice, line_items: updatedItems });
  };

  const addLineItem = () => {
    if (!invoice) return;
    const newItem: LineItem = {
      line_number: invoice.line_items.length + 1,
      description: "",
      quantity: 1,
      unit_price: 0,
      line_total: 0,
    };
    setInvoice({
      ...invoice,
      line_items: [...invoice.line_items, newItem],
    });
  };

  const removeLineItem = (index: number) => {
    if (!invoice) return;
    const updatedItems = invoice.line_items.filter((_, i) => i !== index);
    // Renumber remaining items
    updatedItems.forEach((item, i) => {
      item.line_number = i + 1;
    });
    setInvoice({ ...invoice, line_items: updatedItems });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-2xl font-bold text-foreground">
              Edit Invoice {invoice?.invoice_number || ""}
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-foreground" />
              </div>
            ) : invoice ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left side - Form */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Invoice Number
                        </label>
                        <input
                          type="text"
                          value={invoice.invoice_number}
                          onChange={(e) =>
                            handleFieldChange("invoice_number", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Invoice Date
                        </label>
                        <input
                          type="date"
                          value={invoice.invoice_date}
                          onChange={(e) =>
                            handleFieldChange("invoice_date", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={invoice.due_date || ""}
                          onChange={(e) =>
                            handleFieldChange("due_date", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Order Status
                        </label>
                        <select
                          value={invoice.order_status}
                          onChange={(e) =>
                            handleFieldChange(
                              "order_status",
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Payment Status
                        </label>
                        <select
                          value={invoice.payment_status}
                          onChange={(e) =>
                            handleFieldChange("payment_status", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        >
                          {paymentStatusOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          PO Number
                        </label>
                        <input
                          type="text"
                          value={invoice.po_number || ""}
                          onChange={(e) =>
                            handleFieldChange("po_number", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Financial Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Subtotal
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={invoice.subtotal}
                          onChange={(e) =>
                            handleFieldChange("subtotal", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Tax Amount
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={invoice.tax_amount}
                          onChange={(e) =>
                            handleFieldChange("tax_amount", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Freight
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={invoice.freight || ""}
                          onChange={(e) =>
                            handleFieldChange("freight", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Total Amount
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={invoice.total_amount}
                          onChange={(e) =>
                            handleFieldChange("total_amount", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        Line Items
                      </h3>
                      <button
                        onClick={addLineItem}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add Item
                      </button>
                    </div>
                    <div className="space-y-3">
                      {invoice.line_items.map((item, index) => (
                        <div
                          key={index}
                          className="border border-border rounded-lg p-3 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <div className="col-span-2">
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                  Description
                                </label>
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) =>
                                    handleLineItemChange(
                                      index,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                  Quantity
                                </label>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleLineItemChange(
                                      index,
                                      "quantity",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                  Unit Price
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.unit_price}
                                  onChange={(e) =>
                                    handleLineItemChange(
                                      index,
                                      "unit_price",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                  Line Total
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.line_total}
                                  readOnly
                                  className="w-full px-2 py-1 text-sm border border-border rounded bg-muted text-foreground"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => removeLineItem(index)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {invoice.line_items.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No line items. Click "Add Item" to add one.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Notes
                    </h3>
                    <textarea
                      value={invoice.notes || ""}
                      onChange={(e) =>
                        handleFieldChange("notes", e.target.value)
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                      placeholder="Add any notes here..."
                    />
                  </div>
                </div>

                {/* Right side - Image */}
                <div className="lg:col-span-1">
                  <div className="bg-card border border-border rounded-lg p-4 sticky top-0">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Invoice Image
                    </h3>
                    {invoice.blob_url ? (
                      <div className="space-y-3">
                        <div
                          className="relative cursor-pointer group border border-border rounded-lg overflow-hidden"
                          onClick={() => setImageExpanded(true)}
                        >
                          <img
                            src={invoice.blob_url}
                            alt="Invoice"
                            className="w-full h-auto"
                            onLoad={() => setImageLoading(false)}
                            onError={() => {
                              setImageLoading(false);
                              toast.error("Failed to load invoice image");
                            }}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="h-8 w-8 text-white" />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Click to expand
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mb-2" />
                        <p className="text-sm">No image available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-foreground">Failed to load invoice</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Image Modal */}
      {imageExpanded && invoice?.blob_url && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setImageExpanded(false)}
        >
          <button
            onClick={() => setImageExpanded(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={invoice.blob_url}
            alt="Invoice (expanded)"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
}
