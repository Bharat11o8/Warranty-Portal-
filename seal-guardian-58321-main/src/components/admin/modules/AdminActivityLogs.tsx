import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { formatToIST } from "@/lib/utils";

export const AdminActivityLogs = () => {
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
        fetchActivityLogs();
    }, []);

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

    const filteredLogs = filterAndSortLogs(activityLogs);

    return (
        <div className="space-y-6">
            {/* Search & Sort Controls */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between xl:items-center">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by admin, action, target..."
                            className="w-full pl-10 pr-4 py-2 rounded-md border border-orange-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                            value={logSearch}
                            onChange={(e) => setLogSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-orange-100 rounded-md px-2 py-1.5 sm:py-0">
                        <span className="text-xs text-slate-400 whitespace-nowrap">Date:</span>
                        <input
                            type="date"
                            className="text-xs border-none focus:ring-0 text-slate-600 p-0 bg-transparent"
                            value={logDateFrom}
                            onChange={e => setLogDateFrom(e.target.value)}
                        />
                        <span className="text-xs text-slate-400">-</span>
                        <input
                            type="date"
                            className="text-xs border-none focus:ring-0 text-slate-600 p-0 bg-transparent"
                            value={logDateTo}
                            onChange={e => setLogDateTo(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <select
                        className="px-3 py-2 rounded-md border border-orange-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
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
                        className="border-orange-100 hover:bg-orange-50"
                        onClick={() => setLogSortOrder(logSortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                        {logSortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                    </Button>
                </div>
            </div>

            <Card className="border-orange-100 shadow-sm">
                <CardHeader className="bg-orange-50/30 border-b border-orange-50 pb-4">
                    <CardTitle className="text-lg font-bold text-slate-800">System Activity Logs</CardTitle>
                    <CardDescription>
                        Audit trail of all administrative actions performed in the system.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loadingLogs ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-8 w-8 text-orange-400 animate-spin mx-auto mb-2" />
                            <p className="text-sm text-slate-500">Loading activity logs...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">No activity logs found matching your criteria.</div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Date & Time</th>
                                        <th className="px-6 py-4">Admin</th>
                                        <th className="px-6 py-4">Action</th>
                                        <th className="px-6 py-4">Target Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredLogs.map((log: any) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {formatToIST(log.created_at)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{log.admin_name || 'Unknown'}</div>
                                                <div className="text-xs text-slate-400">{log.admin_email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${log.action_type.includes('APPROVED') || log.action_type.includes('CREATED')
                                                        ? 'bg-green-100 text-green-700'
                                                        : log.action_type.includes('REJECTED')
                                                            ? 'bg-red-100 text-red-700'
                                                            : log.action_type.includes('DELETED')
                                                                ? 'bg-gray-100 text-gray-700'
                                                                : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {log.action_type.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-700 font-medium">{log.target_type}</div>
                                                <div className="text-xs text-slate-500 truncate max-w-[200px]">{log.target_name || log.target_id || 'N/A'}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
