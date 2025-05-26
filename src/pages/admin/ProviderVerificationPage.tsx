import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { cn } from "@/lib/utils";
import { useState } from "react";
import ProviderVerificationTable from "@/components/admin/ProviderVerificationTable";

export default function ProviderVerificationPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="relative min-h-screen bg-background">
      <AdminSidebar
        isCollapsed={!isSidebarOpen}
        onCollapse={() => setIsSidebarOpen(false)}
      />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          isSidebarOpen ? "md:pl-64" : "md:pl-20"
        )}
      >
        <AdminHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Provider Verification</h1>
              <p className="text-muted-foreground">
                Verify and manage service provider accounts
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Provider Verification Requests</CardTitle>
                <CardDescription>
                  Review and manage provider verification requests. Verify provider credentials, documents, and service details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProviderVerificationTable />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
} 