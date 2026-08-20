import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck, TrendingUp } from "lucide-react";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

interface AdminDashboardChartsProps {
    pieData: Array<{ name: string; value: number; color: string }>;
    monthlyData: Array<{
        month: string;
        total: number;
        approved: number;
        rejected: number;
        pending: number;
    }>;
}

const COLORS = {
    validated: '#2ecc71',
    rejected: '#e74c3c',
    pending: '#f1c40f'
};

const AdminDashboardCharts = ({ pieData, monthlyData }: AdminDashboardChartsProps) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                        <Bar dataKey="rejected" name="Action Required" fill={COLORS.rejected} radius={[4, 4, 0, 0]} stackId="a" />
                        <Bar dataKey="pending" name="Pending" fill={COLORS.pending} radius={[4, 4, 0, 0]} stackId="a" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

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
);

export default AdminDashboardCharts;
