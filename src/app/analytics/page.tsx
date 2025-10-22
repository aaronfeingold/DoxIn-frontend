"use client";

import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, TrendingUp, DollarSign, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import AnalyticsSkeleton from "@/components/AnalyticsSkeleton";
import { toast } from "sonner";
import { clientConfig } from "@/config/client";

interface InvoiceStats {
  status_breakdown: {
    [key: string]: {
      count: number;
      total_amount: number;
      percentage: number;
    };
  };
  totals: {
    total_invoices: number;
    total_amount: number;
    average_invoice_value: number;
  };
}

interface Company {
  id: string;
  name: string;
  invoice_count: number;
  total_revenue: number;
  avg_invoice_value: number;
}

interface TopCompanies {
  top_by_invoice_count: Company[];
  top_by_revenue: Company[];
}

interface MonthlyTrend {
  year: number;
  month: number;
  month_label: string;
  invoice_count: number;
  total_revenue: number;
  avg_invoice_value: number;
}

interface TrendsData {
  monthly_trends: MonthlyTrend[];
  date_range: {
    start_date: string;
    end_date: string;
  };
}

interface AnalyticsSummary {
  invoice_statistics: InvoiceStats;
  top_companies: TopCompanies;
  monthly_trends: TrendsData;
}

export default function AnalyticsPage() {
  const { user, isLoading } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        // Use the comprehensive summary endpoint
        const response = await fetch(
          `${clientConfig.baseUrl}/reports/analytics/summary`,
          { credentials: "include" }
        );

        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error("Failed to load analytics", {
            description: errorData.error || `Error ${response.status}`,
          });
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
        toast.error("Analytics Error", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading) {
      fetchAnalytics();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const invoiceStats = analytics?.invoice_statistics;
  const topCompanies = analytics?.top_companies;
  const trends = analytics?.monthly_trends;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-foreground" />
            <h1 className="text-4xl font-bold text-foreground">Analytics</h1>
          </div>

          {/* Admin: Link to Advanced Analytics */}
          {user?.role === "admin" && (
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-semibold shadow-lg hover:shadow-xl"
            >
              <BarChart3 className="h-5 w-5" />
              Executive Dashboard
            </Link>
          )}
        </div>

        {loading ? (
          <AnalyticsSkeleton />
        ) : (
          <>
            {/* Empty State */}
            {!invoiceStats?.totals?.total_invoices && (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  No Analytics Data Available
                </h2>
                <p className="text-muted-foreground mb-6">
                  Upload some invoices to see analytics and insights.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-semibold"
                >
                  <FileText className="h-5 w-5" />
                  Upload Invoices
                </Link>
              </div>
            )}

            {/* Key Metrics */}
            {invoiceStats?.totals && invoiceStats.totals.total_invoices > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <h3 className="text-lg font-semibold text-foreground">
                        Total Invoices
                      </h3>
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {invoiceStats.totals.total_invoices.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <h3 className="text-lg font-semibold text-foreground">
                        Total Revenue
                      </h3>
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {formatCurrency(invoiceStats.totals.total_amount)}
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                      <h3 className="text-lg font-semibold text-foreground">
                        Avg Invoice Value
                      </h3>
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {formatCurrency(
                        invoiceStats.totals.average_invoice_value
                      )}
                    </p>
                  </div>
                </div>

                {/* Payment Status Breakdown */}
                {invoiceStats.status_breakdown &&
                  Object.keys(invoiceStats.status_breakdown).length > 0 && (
                    <div className="bg-card border border-border rounded-lg p-6 mb-8">
                      <h2 className="text-2xl font-bold text-foreground mb-4">
                        Invoice Payment Status
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(invoiceStats.status_breakdown).map(
                          ([status, data]) => (
                            <div
                              key={status}
                              className="border border-border rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-foreground uppercase">
                                  {status}
                                </h3>
                                <span className="text-xs text-muted-foreground">
                                  {data.percentage.toFixed(1)}%
                                </span>
                              </div>
                              <p className="text-2xl font-bold text-foreground mb-1">
                                {data.count.toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(data.total_amount)}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Top Companies */}
                {topCompanies &&
                  (topCompanies.top_by_invoice_count.length > 0 ||
                    topCompanies.top_by_revenue.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* Top by Invoice Count */}
                      {topCompanies.top_by_invoice_count.length > 0 && (
                        <div className="bg-card border border-border rounded-lg p-6">
                          <h2 className="text-xl font-bold text-foreground mb-4">
                            Top Companies by Invoice Count
                          </h2>
                          <div className="space-y-3">
                            {topCompanies.top_by_invoice_count.map(
                              (company, index) => (
                                <div
                                  key={company.id}
                                  className="flex items-center justify-between p-3 bg-background rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 bg-foreground text-background rounded-full font-bold text-sm">
                                      {index + 1}
                                    </span>
                                    <div>
                                      <p className="font-semibold text-foreground">
                                        {company.name}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {company.invoice_count} invoices
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-foreground">
                                      {formatCurrency(company.total_revenue)}
                                    </p>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Top by Revenue */}
                      {topCompanies.top_by_revenue.length > 0 && (
                        <div className="bg-card border border-border rounded-lg p-6">
                          <h2 className="text-xl font-bold text-foreground mb-4">
                            Top Companies by Revenue
                          </h2>
                          <div className="space-y-3">
                            {topCompanies.top_by_revenue.map(
                              (company, index) => (
                                <div
                                  key={company.id}
                                  className="flex items-center justify-between p-3 bg-background rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full font-bold text-sm">
                                      {index + 1}
                                    </span>
                                    <div>
                                      <p className="font-semibold text-foreground">
                                        {company.name}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {company.invoice_count} invoices
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-foreground">
                                      {formatCurrency(company.total_revenue)}
                                    </p>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                {/* Monthly Trends */}
                {trends?.monthly_trends && trends.monthly_trends.length > 0 && (
                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-foreground">
                        Monthly Trends
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {trends.date_range.start_date} to{" "}
                        {trends.date_range.end_date}
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-3 font-semibold text-foreground">
                              Month
                            </th>
                            <th className="text-right p-3 font-semibold text-foreground">
                              Invoices
                            </th>
                            <th className="text-right p-3 font-semibold text-foreground">
                              Revenue
                            </th>
                            <th className="text-right p-3 font-semibold text-foreground">
                              Avg Value
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {trends.monthly_trends.map((trend) => (
                            <tr
                              key={trend.month_label}
                              className="border-b border-border last:border-0 hover:bg-background transition-colors"
                            >
                              <td className="p-3 text-foreground">
                                {trend.month_label}
                              </td>
                              <td className="p-3 text-right text-foreground">
                                {trend.invoice_count.toLocaleString()}
                              </td>
                              <td className="p-3 text-right text-foreground font-semibold">
                                {formatCurrency(trend.total_revenue)}
                              </td>
                              <td className="p-3 text-right text-muted-foreground">
                                {formatCurrency(trend.avg_invoice_value)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
