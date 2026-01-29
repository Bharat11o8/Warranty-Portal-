import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Users, Store, FileCheck, AlertCircle, TrendingUp } from "lucide-react";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Vibrant "Flat UI" palette - brighter and cleaner
const COLORS = {
    validated: '#2ecc71', // Emerald - Bright & Clean
    rejected: '#e74c3c', // Alizarin - Vibrant Red
    pending: '#f1c40f', // Sunflower - Rich Yellow
    pending_vendor: '#e67e22', // Carrot - Vivid Orange
    customer: '#3498db', // Peter River - Calm Blue
    franchise: '#9b59b6', // Amethyst - Light Purple
    total: '#d35400', // Pumpkin - Deep Orange
    default: '#95a5a6' // Concrete - Neutral
};

export const AdminHome = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get("/admin/stats");
            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch stats", error);
            toast({
                title: "Stats Fetch Failed",
                description: "Failed to fetch statistics",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading Analytics...</p>
            </div>
        );
    }

    if (!stats) return null;

    // Prepare chart data
    const pieData = [
        { name: 'Approved', value: Number(stats.validatedWarranties || 0), color: COLORS.validated },
        { name: 'Rejected', value: Number(stats.rejectedWarranties || 0), color: COLORS.rejected },
        { name: 'Pending (Admin)', value: Number(stats.pendingApprovals || 0), color: COLORS.pending },
        { name: 'Pending (Vendor)', value: Number(stats.pendingVendorApprovals || 0), color: COLORS.pending_vendor },
    ].filter(item => item.value > 0);

    const monthlyData = (stats.monthlyStats || []).map((m: any) => ({
        ...m,
        total: Number(m.total || 0),
        approved: Number(m.approved || 0),
        rejected: Number(m.rejected || 0),
        pending: Number(m.pending_admin || 0) + Number(m.pending_vendor || 0),
    }));

    return (
        <div className="space-y-8">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <Card className="border-orange-100 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Warranties</CardTitle>
                        <FileCheck className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalWarranties}</div>
                        <p className="text-xs text-muted-foreground mt-1">+{(pieData.find(d => d.name === 'Approved')?.value || 0)} approved</p>
                    </CardContent>
                </Card>
                <Card className="border-orange-100 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Actions</CardTitle>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Number(stats.pendingApprovals) + Number(stats.pendingVendorApprovals)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
                    </CardContent>
                </Card>
                <Card className="border-orange-100 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Franchises</CardTitle>
                        <Store className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalVendors}</div>
                        <p className="text-xs text-muted-foreground mt-1">Across all regions</p>
                    </CardContent>
                </Card>
                <Card className="border-orange-100 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                        <p className="text-xs text-muted-foreground mt-1">Registered users</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Warranty Trends */}
                <Card className="border-orange-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-orange-500" />
                            Warranty Trends
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <RechartsTooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                                <Bar dataKey="approved" name="Approved" fill={COLORS.validated} radius={[4, 4, 0, 0]} stackId="a" />
                                <Bar dataKey="rejected" name="Rejected" fill={COLORS.rejected} radius={[4, 4, 0, 0]} stackId="a" />
                                <Bar dataKey="pending" name="Pending" fill={COLORS.pending} radius={[4, 4, 0, 0]} stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Distribution */}
                <Card className="border-orange-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <FileCheck className="h-5 w-5 text-green-500" />
                            Status Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
