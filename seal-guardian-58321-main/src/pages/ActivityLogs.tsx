import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";
import api from "@/lib/api";
import { formatToIST } from "@/lib/utils";

const ActivityLogs = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Search & Sort State
    const [logSearch, setLogSearch] = useState('');
    const [logSortField, setLogSortField] = useState<'created_at' | 'action_type' | 'admin_name'>('created_at');
    const [logSortOrder, setLogSortOrder] = useState<'asc' | 'desc'>('desc');
    const [logDateFrom, setLogDateFrom] = useState('');
    const [logDateTo, setLogDateTo] = useState('');

    useEffect(() => {
        if (user?.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchActivityLogs();
    }, [user]);

    const fetchActivityLogs = async () => {
        setLoadingLogs(true);
        try {
            const response = await api.get("/admin/activity-logs?limit=100");
            if (response.data.success) {
                setActivityLogs(response.data.logs);
            }
        } catch (error) {
            console.error("Failed to fetch activity logs:", error);
            toast({
                title: "Error",
                description: "Failed to fetch activity logs",
                variant: "destructive"
            });
        } finally {
            setLoadingLogs(false);
        }
    };

    // Format date/time in IST (Indian Standard Time)


    // Filter and Sort Helper
    const filterAndSortLogs = (logs: any[]) => {
        return logs
            .filter((log: any) => {
                // Date range filter
                if (logDateFrom || logDateTo) {
                    const logDate = new Date(log.created_at);
                    logDate.setHours(0, 0, 0, 0);
                    if (logDateFrom) {
                        const fromDate = new Date(logDateFrom);
                        fromDate.setHours(0, 0, 0, 0);
                        if (logDate < fromDate) return false;
                    }
                    if (logDateTo) {
                        const toDate = new Date(logDateTo);
                        toDate.setHours(23, 59, 59, 999);
                        if (logDate > toDate) return false;
                    }
                }

                if (!logSearch) return true;
                const search = logSearch.toLowerCase();
                return (
                    log.admin_name?.toLowerCase().includes(search) ||
                    log.admin_email?.toLowerCase().includes(search) ||
                    log.action_type?.toLowerCase().includes(search) ||
                    log.target_type?.toLowerCase().includes(search) ||
                    log.target_name?.toLowerCase().includes(search)
                );
            })
            .sort((a: any, b: any) => {
                let aVal = a[logSortField];
                let bVal = b[logSortField];
                if (logSortField === 'created_at') {
                    aVal = new Date(aVal).getTime();
                    bVal = new Date(bVal).getTime();
                } else {
                    aVal = (aVal || '').toString().toLowerCase();
                    bVal = (bVal || '').toString().toLowerCase();
                }
                return logSortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
            });
    };

    if (user?.role !== 'admin') {
        return null;
    }

    const filteredLogs = filterAndSortLogs(activityLogs);

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            <Header />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold">Activity Logs</h1>
                    <p className="text-muted-foreground">Track all administrative actions performed in the system</p>
                </div>

                {/* Search & Sort Controls */}
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search by admin, action, target..."
                                className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm"
                                value={logSearch}
                                onChange={(e) => setLogSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                            value={logSortField}
                            onChange={(e) => setLogSortField(e.target.value as any)}
                        >
                            <option value="created_at">Sort by Date</option>
                            <option value="action_type">Sort by Action</option>
                            <option value="admin_name">Sort by Admin</option>
                        </select>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLogSortOrder(logSortOrder === 'asc' ? 'desc' : 'asc')}
                        >
                            {logSortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                        </Button>
                        {logSearch && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setLogSearch('')}
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Date Range Filter */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">From:</span>
                        <input
                            type="date"
                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                            value={logDateFrom}
                            onChange={(e) => setLogDateFrom(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">To:</span>
                        <input
                            type="date"
                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                            value={logDateTo}
                            onChange={(e) => setLogDateTo(e.target.value)}
                        />
                    </div>
                    {(logDateFrom || logDateTo) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setLogDateFrom(''); setLogDateTo(''); }}
                        >
                            Clear Dates
                        </Button>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity ({filteredLogs.length})</CardTitle>
                        <CardDescription>
                            All admin actions are logged here for audit purposes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingLogs ? (
                            <div className="text-center py-8">Loading activity logs...</div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No activity logs found.</div>
                        ) : (
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date & Time</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Admin</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Action</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Target</th>

                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {filteredLogs.map((log: any) => (
                                            <tr key={log.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle">
                                                    <div className="text-sm">{formatToIST(log.created_at)}</div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <div className="font-medium">{log.admin_name || 'Unknown'}</div>
                                                    <div className="text-xs text-muted-foreground">{log.admin_email}</div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${log.action_type.includes('APPROVED') || log.action_type.includes('CREATED')
                                                        ? 'bg-green-100 text-green-800'
                                                        : log.action_type.includes('REJECTED')
                                                            ? 'bg-red-100 text-red-800'
                                                            : log.action_type.includes('DELETED')
                                                                ? 'bg-gray-100 text-gray-800'
                                                                : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {log.action_type.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <div className="text-sm">{log.target_type}</div>
                                                    <div className="text-xs text-muted-foreground">{log.target_name || log.target_id || 'N/A'}</div>
                                                </td>

                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default ActivityLogs;
