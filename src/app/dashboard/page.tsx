"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import UploadInvoicesModal from "@/components/UploadInvoicesModal";
import { clientConfig } from "@/config/client";

interface DashboardStats {
  total_invoices: number;
  processed_today: number;
  pending_review: number;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(
          `${clientConfig.backendUrl}/api/v1/dashboard/stats`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    if (!isLoading) {
      fetchStats();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Sparkles className="h-8 w-8 text-foreground" />
          <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Welcome back, {user?.name || "User"}!
          </h2>
          <p className="text-muted-foreground">
            This is your dashboard. More features coming soon.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Total Invoices
            </h3>
            {statsLoading ? (
              <div className="animate-pulse">
                <div className="h-9 bg-muted rounded w-20"></div>
              </div>
            ) : (
              <p className="text-3xl font-bold text-foreground">
                {stats?.total_invoices ?? 0}
              </p>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Processed Today
            </h3>
            {statsLoading ? (
              <div className="animate-pulse">
                <div className="h-9 bg-muted rounded w-20"></div>
              </div>
            ) : (
              <p className="text-3xl font-bold text-foreground">
                {stats?.processed_today ?? 0}
              </p>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Pending Review
            </h3>
            {statsLoading ? (
              <div className="animate-pulse">
                <div className="h-9 bg-muted rounded w-20"></div>
              </div>
            ) : (
              <p className="text-3xl font-bold text-foreground">
                {stats?.pending_review ?? 0}
              </p>
            )}
          </div>
        </div>

        {/* Upload Button */}
        <div className="flex justify-center">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
          >
            <Upload className="h-6 w-6" />
            Upload Invoices
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadInvoicesModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
