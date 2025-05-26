import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { serviceRequestService } from "@/services/serviceRequestService";
import { ServiceRequestResponse } from "@/types/serviceRequest";
import { format, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths, getDate } from "date-fns";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface RequestStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-100",
  inProgress: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-100",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-100",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-100",
};

export default function RequestCalendarPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [date, setDate] = useState<Date>(new Date());
  const [monthRequests, setMonthRequests] = useState<ServiceRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDateStats, setSelectedDateStats] = useState<RequestStats | null>(null);

  useEffect(() => {
    fetchMonthRequests();
  }, [date]);

  const fetchMonthRequests = async () => {
    try {
      setLoading(true);
      const startDate = startOfMonth(date);
      const endDate = endOfMonth(date);
      
      const response = await serviceRequestService.getAllRequests(0, 1000);
      
      const monthRequests = response.content.filter(request => {
        const requestDate = new Date(request.createdAt);
        return requestDate >= startDate && requestDate <= endDate;
      });
      
      setMonthRequests(monthRequests);
      setError(null);
    } catch (err) {
      toast.error("Failed to fetch request data");
      setError(err instanceof Error ? err.message : "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const getDateStats = (date: Date): RequestStats => {
    const dayRequests = monthRequests.filter(request => 
      isSameDay(new Date(request.createdAt), date)
    );

    return {
      total: dayRequests.length,
      pending: dayRequests.filter(r => r.status === "OPEN").length,
      inProgress: dayRequests.filter(r => r.status === "ASSIGNED").length,
      completed: dayRequests.filter(r => r.status === "COMPLETED").length,
      cancelled: dayRequests.filter(r => r.status === "CANCELLED").length,
    };
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setSelectedDateStats(getDateStats(date));
    } else {
      setSelectedDateStats(null);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setDate(direction === 'prev' ? subMonths(date, 1) : addMonths(date, 1));
  };

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
              <h1 className="text-3xl font-bold tracking-tight">Request Calendar</h1>
              <p className="text-muted-foreground">
                Monitor and analyze service requests by date
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setDate(new Date())}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-md dark:bg-red-900/50 dark:text-red-100">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-[1fr_350px]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-xl">
                  <span>{format(date, "MMMM yyyy")}</span>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="font-medium">Pending</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="font-medium">In Progress</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="font-medium">Completed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="font-medium">Cancelled</span>
                    </div>
                  </div>
                </CardTitle>
                <CardDescription className="text-base">
                  Click on a date to view detailed request statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    month={date}
                    onMonthChange={setDate}
                    className="rounded-md border"
                    styles={{
                      months: { display: 'flex', flexDirection: 'column' },
                      month: { margin: 0 },
                      caption: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0.5rem', position: 'relative' },
                      caption_label: { fontSize: '1.25rem', fontWeight: '600' },
                      nav: { display: 'flex', gap: '0.25rem' },
                      nav_button: { padding: '0.5rem', borderRadius: '0.375rem' },
                      nav_button_previous: { position: 'absolute', left: '0.5rem' },
                      nav_button_next: { position: 'absolute', right: '0.5rem' },
                      table: { width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' },
                      head_row: { display: 'flex' },
                      head_cell: { 
                        flex: 1,
                        textAlign: 'center',
                        padding: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: 'var(--muted-foreground)'
                      },
                      row: { display: 'flex', width: '100%', marginTop: '0.5rem' },
                      cell: { 
                        flex: 1,
                        position: 'relative',
                        textAlign: 'center',
                        padding: '0',
                        height: '100px',
                        border: '1px solid var(--border)',
                        borderRadius: '0.375rem',
                        margin: '0.125rem'
                      },
                      day: { 
                        height: '100%',
                        width: '100%',
                        padding: '0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      },
                      day_selected: { 
                        backgroundColor: 'var(--primary)',
                        color: 'var(--primary-foreground)'
                      },
                      day_today: { 
                        backgroundColor: 'var(--accent)',
                        color: 'var(--accent-foreground)'
                      },
                      day_outside: { 
                        color: 'var(--muted-foreground)',
                        opacity: 0.5
                      },
                      day_disabled: { 
                        color: 'var(--muted-foreground)',
                        opacity: 0.5
                      }
                    }}
                    components={{
                      DayContent: ({ date }) => {
                        const stats = getDateStats(date);
                        const dayNumber = getDate(date);
                        const isToday = isSameDay(date, new Date());
                        const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;

                        return (
                          <div className={cn(
                            "h-full w-full p-2 flex flex-col",
                            isToday && "bg-accent/50",
                            isSelected && "bg-primary/10",
                            "hover:bg-accent/30 cursor-pointer"
                          )}>
                            <div className={cn(
                              "text-right font-semibold",
                              isToday && "text-primary font-bold"
                            )}>
                              {dayNumber}
                            </div>
                            {stats.total > 0 && (
                              <div className="mt-1 flex-1 flex flex-col justify-center items-center gap-1">
                                <Badge variant="secondary" className="text-xs">
                                  {stats.total}
                                </Badge>
                                <div className="flex flex-wrap gap-0.5 justify-center">
                                  {stats.pending > 0 && (
                                    <div className={cn("px-1 py-0.5 rounded text-[10px]", statusColors.pending)}>
                                      {stats.pending}
                                    </div>
                                  )}
                                  {stats.inProgress > 0 && (
                                    <div className={cn("px-1 py-0.5 rounded text-[10px]", statusColors.inProgress)}>
                                      {stats.inProgress}
                                    </div>
                                  )}
                                  {stats.completed > 0 && (
                                    <div className={cn("px-1 py-0.5 rounded text-[10px]", statusColors.completed)}>
                                      {stats.completed}
                                    </div>
                                  )}
                                  {stats.cancelled > 0 && (
                                    <div className={cn("px-1 py-0.5 rounded text-[10px]", statusColors.cancelled)}>
                                      {stats.cancelled}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Date Statistics</CardTitle>
                <CardDescription className="text-base">
                  {selectedDate 
                    ? `Statistics for ${format(selectedDate, "MMMM d, yyyy")}`
                    : "Select a date to view statistics"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDateStats ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-base font-medium text-muted-foreground">Total Requests</div>
                        <div className="text-3xl font-bold">{selectedDateStats.total}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-base font-medium text-muted-foreground">Pending</div>
                        <div className={cn("text-3xl font-bold", statusColors.pending)}>
                          {selectedDateStats.pending}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-base font-medium text-muted-foreground">In Progress</div>
                        <div className={cn("text-3xl font-bold", statusColors.inProgress)}>
                          {selectedDateStats.inProgress}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-base font-medium text-muted-foreground">Completed</div>
                        <div className={cn("text-3xl font-bold", statusColors.completed)}>
                          {selectedDateStats.completed}
                        </div>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <div className="text-base font-medium text-muted-foreground">Cancelled</div>
                        <div className={cn("text-3xl font-bold", statusColors.cancelled)}>
                          {selectedDateStats.cancelled}
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="text-base font-medium text-muted-foreground mb-3">Status Distribution</div>
                      <div className="space-y-3">
                        {selectedDateStats.total > 0 ? (
                          <>
                            {selectedDateStats.pending > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="flex-1 text-base">
                                  Pending ({Math.round((selectedDateStats.pending / selectedDateStats.total) * 100)}%)
                                </div>
                              </div>
                            )}
                            {selectedDateStats.inProgress > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <div className="flex-1 text-base">
                                  In Progress ({Math.round((selectedDateStats.inProgress / selectedDateStats.total) * 100)}%)
                                </div>
                              </div>
                            )}
                            {selectedDateStats.completed > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <div className="flex-1 text-base">
                                  Completed ({Math.round((selectedDateStats.completed / selectedDateStats.total) * 100)}%)
                                </div>
                              </div>
                            )}
                            {selectedDateStats.cancelled > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="flex-1 text-base">
                                  Cancelled ({Math.round((selectedDateStats.cancelled / selectedDateStats.total) * 100)}%)
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-base text-muted-foreground text-center py-3">
                            No requests for this date
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-base text-muted-foreground text-center py-8">
                    Select a date to view request statistics
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
} 