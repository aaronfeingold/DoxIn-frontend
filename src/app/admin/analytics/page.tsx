"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart3,
  Users,
  TrendingUp,
  Package,
  DollarSign,
} from "lucide-react";
import { useState, useEffect } from "react";
import AnalyticsSkeleton from "@/components/AnalyticsSkeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ExecutiveDashboard {
  financial_metrics: {
    total_revenue: number;
    total_invoices: number;
    avg_invoice_value: number;
    yoy_growth: number;
  };
  operational_metrics: {
    total_customers: number;
    total_users: number;
    revenue_per_customer: number;
  };
  payment_status: {
    [key: string]: {
      count: number;
      amount: number;
    };
  };
}

interface Customer {
  id: string;
  name: string;
  order_count: number;
  total_revenue: number;
  avg_order_value: number;
  lifetime_days: number;
  first_order: string;
  last_order: string;
}

interface Product {
  id: string;
  name: string;
  total_quantity: number;
  total_revenue: number;
  avg_selling_price: number;
  standard_cost: number;
  profit_margin: number;
}

export default function AdminAnalyticsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ExecutiveDashboard | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not admin
    if (!isLoading && user?.role !== "admin") {
      toast.error("Access denied", {
        description: "You must be an admin to view this page",
      });
      router.push("/dashboard");
      return;
    }

    const fetchAdminAnalytics = async () => {
      if (!user || user.role !== "admin") return;

      try {
        setLoading(true);

        const [dashboardRes, customersRes, productsRes] = await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/reports/analytics/executive-dashboard`,
            { credentials: "include" }
          ),
          fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/reports/analytics/customer-analytics?limit=10`,
            { credentials: "include" }
          ),
          fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/reports/analytics/product-performance?limit=10`,
            { credentials: "include" }
          ),
        ]);

        if (dashboardRes.ok) {
          const data = await dashboardRes.json();
          setDashboard(data);
        } else {
          toast.error("Failed to load executive dashboard");
        }

        if (customersRes.ok) {
          const data = await customersRes.json();
          setCustomers(data.top_customers || []);
        } else {
          toast.error("Failed to load customer analytics");
        }

        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(data.top_products || []);
        } else {
          toast.error("Failed to load product performance");
        }
      } catch (err) {
        console.error("Error fetching admin analytics:", err);
        toast.error("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading) {
      fetchAdminAnalytics();
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="h-8 w-8 text-foreground" />
          <h1 className="text-4xl font-bold text-foreground">
            Executive Dashboard
          </h1>
        </div>

        {loading ? (
          <AnalyticsSkeleton />
        ) : (
          <>
            {/* Executive KPIs */}
            {dashboard && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <h3 className="text-sm font-semibold text-muted-foreground">
                        Total Revenue
                      </h3>
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {formatCurrency(
                        dashboard.financial_metrics.total_revenue
                      )}
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        dashboard.financial_metrics.yoy_growth >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {formatPercent(dashboard.financial_metrics.yoy_growth)}{" "}
                      YoY
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      <h3 className="text-sm font-semibold text-muted-foreground">
                        Total Invoices
                      </h3>
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {dashboard.financial_metrics.total_invoices.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Avg:{" "}
                      {formatCurrency(
                        dashboard.financial_metrics.avg_invoice_value
                      )}
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="h-5 w-5 text-purple-500" />
                      <h3 className="text-sm font-semibold text-muted-foreground">
                        Total Customers
                      </h3>
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {dashboard.operational_metrics.total_customers.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatCurrency(
                        dashboard.operational_metrics.revenue_per_customer
                      )}{" "}
                      per customer
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                      <h3 className="text-sm font-semibold text-muted-foreground">
                        System Users
                      </h3>
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {dashboard.operational_metrics.total_users}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Active accounts
                    </p>
                  </div>
                </div>

                {/* Payment Status */}
                {Object.keys(dashboard.payment_status).length > 0 && (
                  <div className="bg-card border border-border rounded-lg p-6 mb-8">
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                      Payment Status Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(dashboard.payment_status).map(
                        ([status, data]) => (
                          <div
                            key={status}
                            className="border border-border rounded-lg p-4"
                          >
                            <h3 className="text-sm font-semibold text-foreground uppercase mb-2">
                              {status}
                            </h3>
                            <p className="text-2xl font-bold text-foreground">
                              {data.count.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(data.amount)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Top Customers */}
            {customers.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Top 10 Customers by Revenue
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-semibold text-foreground">
                          Customer
                        </th>
                        <th className="text-right p-3 font-semibold text-foreground">
                          Orders
                        </th>
                        <th className="text-right p-3 font-semibold text-foreground">
                          Total Revenue
                        </th>
                        <th className="text-right p-3 font-semibold text-foreground">
                          Avg Order
                        </th>
                        <th className="text-right p-3 font-semibold text-foreground">
                          Lifetime (days)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => (
                        <tr
                          key={customer.id}
                          className="border-b border-border last:border-0 hover:bg-background transition-colors"
                        >
                          <td className="p-3 text-foreground">
                            {customer.name}
                          </td>
                          <td className="p-3 text-right text-foreground">
                            {customer.order_count}
                          </td>
                          <td className="p-3 text-right text-foreground font-semibold">
                            {formatCurrency(customer.total_revenue)}
                          </td>
                          <td className="p-3 text-right text-muted-foreground">
                            {formatCurrency(customer.avg_order_value)}
                          </td>
                          <td className="p-3 text-right text-muted-foreground">
                            {customer.lifetime_days}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Top Products */}
            {products.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Top 10 Products by Revenue
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-semibold text-foreground">
                          Product
                        </th>
                        <th className="text-right p-3 font-semibold text-foreground">
                          Quantity Sold
                        </th>
                        <th className="text-right p-3 font-semibold text-foreground">
                          Total Revenue
                        </th>
                        <th className="text-right p-3 font-semibold text-foreground">
                          Avg Price
                        </th>
                        <th className="text-right p-3 font-semibold text-foreground">
                          Profit Margin
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr
                          key={product.id}
                          className="border-b border-border last:border-0 hover:bg-background transition-colors"
                        >
                          <td className="p-3 text-foreground">
                            {product.name}
                          </td>
                          <td className="p-3 text-right text-foreground">
                            {product.total_quantity.toLocaleString()}
                          </td>
                          <td className="p-3 text-right text-foreground font-semibold">
                            {formatCurrency(product.total_revenue)}
                          </td>
                          <td className="p-3 text-right text-muted-foreground">
                            {formatCurrency(product.avg_selling_price)}
                          </td>
                          <td
                            className={`p-3 text-right font-semibold ${
                              product.profit_margin >= 40
                                ? "text-green-500"
                                : product.profit_margin >= 20
                                  ? "text-yellow-500"
                                  : "text-red-500"
                            }`}
                          >
                            {product.profit_margin.toFixed(1)}%
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
      </div>
    </div>
  );
}
