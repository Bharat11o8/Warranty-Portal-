import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
    LogOut,
    Users,
    FileCheck,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    Filter,
    Download,
    Eye,
    Trash2,
    MoreVertical,
    UserPlus,
    Package,
    Check,
    X,
    FileText,
    User,
    Store,
    TrendingUp,
    Mail,
    Phone,
    MapPin,
    Loader2,
    Megaphone
} from "lucide-react";
import { AdminBroadcast } from "@/components/admin/AdminBroadcast";
import api from "@/lib/api";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { AdminWarrantyList } from "@/components/admin/AdminWarrantyList";
import { OldWarranties } from "@/components/admin/OldWarranties";
import { formatWarrantyForExport, formatVendorForExport, formatCustomerForExport, formatManpowerForExport } from "@/lib/adminExports";
import { downloadCSV, getWarrantyExpiration, cn, formatToIST } from "@/lib/utils";
import Header from "@/components/Header";
import { Pagination } from "@/components/Pagination";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';

const COLORS = {
    validated: '#16a34a', // green-600
    rejected: '#dc2626', // red-600
    pending: '#ca8a04', // yellow-600
    pending_vendor: '#ea580c', // orange-600
    customer: '#2563eb', // blue-600
    franchise: '#9333ea', // purple-600
    total: '#f97316', // orange-500
    default: '#cbd5e1' // slate-300
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        // Check if it's the BarChart (usually has a label/month)
        const isBarChart = !!label;

        return (
            <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[150px]">
                {isBarChart && (
                    <p className="font-semibold mb-2">
                        {/^\d{4}-\d{2}$/.test(label)
                            ? new Date(label + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                            : label}
                    </p>
                )}
                {payload.map((entry: any, index: number) => {
                    const color = entry.color || entry.fill || (entry.payload && entry.payload.color) || (entry.payload && entry.payload.fill) || '#000';
                    return (
                        <div key={index} className="flex justify-between items-center gap-4 mb-1 last:mb-0">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="text-sm font-medium text-muted-foreground">{entry.name}</span>
                            </div>
                            <span className="font-mono font-bold text-foreground">{entry.value}</span>
                        </div>
                    );
                })}
            </div>
        );
    }
    return null;
};


const AdminDashboard = () => {
    const { user, logout, loading } = useAuth();
    const { toast } = useToast();
    const [stats, setStats] = useState({
        totalWarranties: 0,
        totalVendors: 0,
        totalCustomers: 0,
        pendingApprovals: 0,
        pendingVendorApprovals: 0,
        validatedWarranties: 0,
        rejectedWarranties: 0,
        monthlyStats: [] as any[],
        monthlyCustomerStats: [] as any[],
    });
    const [activeTab, setActiveTab] = useState("overview");
    const [overviewView, setOverviewView] = useState<'warranty' | 'franchise' | 'customer'>('warranty');
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [warrantyFilter, setWarrantyFilter] = useState<'all' | 'validated' | 'rejected' | 'pending' | 'pending_vendor'>('all');
    const [vendorFilter, setVendorFilter] = useState<'all' | 'approved' | 'disapproved' | 'pending'>('all');
    const [vendors, setVendors] = useState<any[]>([]);
    const [loadingVendors, setLoadingVendors] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<any>(null);
    const [viewingVendor, setViewingVendor] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [viewingCustomer, setViewingCustomer] = useState(false);
    const [warranties, setWarranties] = useState<any[]>([]);
    const [loadingWarranties, setLoadingWarranties] = useState(false);
    const [processingWarranty, setProcessingWarranty] = useState<string | null>(null);
    const [warrantyPagination, setWarrantyPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0, limit: 30, hasNextPage: false, hasPrevPage: false });
    const [activityLogPagination, setActivityLogPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0, limit: 30, hasNextPage: false, hasPrevPage: false });
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [selectedWarrantyId, setSelectedWarrantyId] = useState<string | null>(null);

    // Vendor Verification State
    const [vendorRejectDialogOpen, setVendorRejectDialogOpen] = useState(false);
    const [vendorRejectReason, setVendorRejectReason] = useState("");
    const [processingVendor, setProcessingVendor] = useState<string | null>(null);
    const [vendorWarrantyFilter, setVendorWarrantyFilter] = useState<'all' | 'validated' | 'rejected' | 'pending'>('all');
    const [vendorDetailTab, setVendorDetailTab] = useState<'warranties' | 'manpower'>('warranties');
    const [customerWarrantyFilter, setCustomerWarrantyFilter] = useState<'all' | 'validated' | 'rejected' | 'pending'>('all');

    // View Details Loading States
    const [loadingVendorDetails, setLoadingVendorDetails] = useState<string | null>(null);
    const [loadingCustomerDetails, setLoadingCustomerDetails] = useState<string | null>(null);

    // Admin Management State
    const [admins, setAdmins] = useState<any[]>([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [addingAdmin, setAddingAdmin] = useState(false);
    const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '', phone: '' });

    // Activity Log State
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Search & Sort State - Warranties
    const [warrantySearch, setWarrantySearch] = useState('');
    const [warrantySortField, setWarrantySortField] = useState<'created_at' | 'customer_name' | 'status' | 'product_type'>('created_at');
    const [warrantySortOrder, setWarrantySortOrder] = useState<'asc' | 'desc'>('desc');
    const [warrantyDateFrom, setWarrantyDateFrom] = useState('');
    const [warrantyDateTo, setWarrantyDateTo] = useState('');

    // Search & Sort State - Vendors
    const [vendorSearch, setVendorSearch] = useState('');
    const [vendorSortField, setVendorSortField] = useState<'created_at' | 'store_name' | 'city'>('created_at');
    const [vendorSortOrder, setVendorSortOrder] = useState<'asc' | 'desc'>('desc');
    const [vendorDateFrom, setVendorDateFrom] = useState('');
    const [vendorDateTo, setVendorDateTo] = useState('');

    // Search & Sort State - Customers
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerSortField, setCustomerSortField] = useState<'created_at' | 'customer_name' | 'warranty_count'>('created_at');
    const [customerSortOrder, setCustomerSortOrder] = useState<'asc' | 'desc'>('desc');
    const [customerDateFrom, setCustomerDateFrom] = useState('');
    const [customerDateTo, setCustomerDateTo] = useState('');

    // --- Vendor Detail View State ---
    // Warranties
    const [vendorDetailWarrantySearch, setVendorDetailWarrantySearch] = useState('');
    const [vendorDetailWarrantySortField, setVendorDetailWarrantySortField] = useState<'created_at' | 'customer_name' | 'status' | 'product_type'>('created_at');
    const [vendorDetailWarrantySortOrder, setVendorDetailWarrantySortOrder] = useState<'asc' | 'desc'>('desc');
    const [vendorDetailWarrantyDateFrom, setVendorDetailWarrantyDateFrom] = useState('');
    const [vendorDetailWarrantyDateTo, setVendorDetailWarrantyDateTo] = useState('');

    // Manpower
    const [vendorDetailManpowerSearch, setVendorDetailManpowerSearch] = useState('');
    const [vendorDetailManpowerSortField, setVendorDetailManpowerSortField] = useState<'name' | 'points' | 'total_applications'>('name');
    const [vendorDetailManpowerSortOrder, setVendorDetailManpowerSortOrder] = useState<'asc' | 'desc'>('asc');

    // Manpower Warranty Details Dialog
    const [manpowerWarrantyDialogOpen, setManpowerWarrantyDialogOpen] = useState(false);
    const [manpowerWarrantyDialogData, setManpowerWarrantyDialogData] = useState<{ member: any; status: 'validated' | 'pending' | 'rejected'; warranties: any[] }>({ member: null, status: 'validated', warranties: [] });

    // Helper to show manpower warranties dialog
    const showManpowerWarranties = (member: any, status: 'validated' | 'pending' | 'rejected') => {
        // Filter warranties for this manpower by status
        const manpowerWarranties = (selectedVendor?.warranties || []).filter((w: any) =>
            w.manpower_id === member.id && w.status === status
        );
        setManpowerWarrantyDialogData({ member, status, warranties: manpowerWarranties });
        setManpowerWarrantyDialogOpen(true);
    };

    // --- Customer Detail View State ---
    // Warranties
    const [customerDetailWarrantySearch, setCustomerDetailWarrantySearch] = useState('');
    const [customerDetailWarrantySortField, setCustomerDetailWarrantySortField] = useState<'created_at' | 'product_type' | 'status'>('created_at');
    const [customerDetailWarrantySortOrder, setCustomerDetailWarrantySortOrder] = useState<'asc' | 'desc'>('desc');
    const [customerDetailWarrantyDateFrom, setCustomerDetailWarrantyDateFrom] = useState('');
    const [customerDetailWarrantyDateTo, setCustomerDetailWarrantyDateTo] = useState('');

    // Export Handlers
    const handleExportWarranties = () => {
        const filteredData = warranties.filter((warranty: any) => {
            // Status filter
            if (warrantyFilter !== 'all' && warranty.status !== warrantyFilter) return false;
            // Date range filter
            if (warrantyDateFrom || warrantyDateTo) {
                const warrantyDate = new Date(warranty.created_at);
                warrantyDate.setHours(0, 0, 0, 0);
                if (warrantyDateFrom) {
                    const fromDate = new Date(warrantyDateFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    if (warrantyDate < fromDate) return false;
                }
                if (warrantyDateTo) {
                    const toDate = new Date(warrantyDateTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (warrantyDate > toDate) return false;
                }
            }
            // Search filter
            if (warrantySearch) {
                const search = warrantySearch.toLowerCase();
                return (
                    warranty.customer_name?.toLowerCase().includes(search) ||
                    warranty.customer_email?.toLowerCase().includes(search) ||
                    warranty.customer_phone?.includes(search) ||
                    warranty.uid?.toLowerCase().includes(search) ||
                    warranty.car_make?.toLowerCase().includes(search) ||
                    warranty.car_model?.toLowerCase().includes(search) ||
                    warranty.product_type?.toLowerCase().includes(search)
                );
            }
            return true;
        })
            .sort((a: any, b: any) => {
                let aVal = a[warrantySortField];
                let bVal = b[warrantySortField];
                if (warrantySortField === 'created_at') {
                    aVal = new Date(aVal).getTime();
                    bVal = new Date(bVal).getTime();
                } else {
                    aVal = (aVal || '').toString().toLowerCase();
                    bVal = (bVal || '').toString().toLowerCase();
                }
                return warrantySortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
            });

        const exportData = filteredData.map(formatWarrantyForExport);
        downloadCSV(exportData, `warranties_export_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleExportVendors = () => {
        const filteredData = vendors.filter((vendor: any) => {
            // Status filter (logic from render)
            if (vendorFilter === 'approved') {
                if (!vendor.is_verified) return false;
            } else if (vendorFilter === 'disapproved') {
                if (!((!vendor.is_verified) && vendor.verified_at != null)) return false;
            } else if (vendorFilter === 'pending') {
                if (!((!vendor.is_verified) && (vendor.verified_at == null || vendor.verified_at === undefined))) return false;
            }

            // Date range filter
            if (vendorDateFrom || vendorDateTo) {
                const vendorDate = new Date(vendor.created_at);
                vendorDate.setHours(0, 0, 0, 0);
                if (vendorDateFrom) {
                    const fromDate = new Date(vendorDateFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    if (vendorDate < fromDate) return false;
                }
                if (vendorDateTo) {
                    const toDate = new Date(vendorDateTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (vendorDate > toDate) return false;
                }
            }
            // Search filter
            if (vendorSearch) {
                const search = vendorSearch.toLowerCase();
                return (
                    vendor.store_name?.toLowerCase().includes(search) ||
                    vendor.vendor_name?.toLowerCase().includes(search) ||
                    vendor.email?.toLowerCase().includes(search) ||
                    vendor.phone_number?.includes(search) ||
                    vendor.city?.toLowerCase().includes(search) ||
                    vendor.state?.toLowerCase().includes(search)
                );
            }
            return true;
        })
            .sort((a: any, b: any) => {
                let aVal = a[vendorSortField];
                let bVal = b[vendorSortField];
                if (vendorSortField === 'created_at') {
                    aVal = new Date(aVal).getTime();
                    bVal = new Date(bVal).getTime();
                } else {
                    aVal = (aVal || '').toString().toLowerCase();
                    bVal = (bVal || '').toString().toLowerCase();
                }
                return vendorSortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
            });

        const exportData = filteredData.map(formatVendorForExport);
        downloadCSV(exportData, `vendors_export_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleExportCustomers = () => {
        const filteredData = customers.filter((customer: any) => {
            // Date range filter
            if (customerDateFrom || customerDateTo) {
                const customerDate = new Date(customer.created_at);
                customerDate.setHours(0, 0, 0, 0);
                if (customerDateFrom) {
                    const fromDate = new Date(customerDateFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    if (customerDate < fromDate) return false;
                }
                if (customerDateTo) {
                    const toDate = new Date(customerDateTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (customerDate > toDate) return false;
                }
            }

            if (!customerSearch) return true;
            const search = customerSearch.toLowerCase();
            return (
                customer.customer_name?.toLowerCase().includes(search) ||
                customer.customer_email?.toLowerCase().includes(search) ||
                customer.customer_phone?.includes(search)
            );
        })
            .sort((a: any, b: any) => {
                let aVal = a[customerSortField];
                let bVal = b[customerSortField];
                if (customerSortField === 'created_at') {
                    aVal = new Date(aVal).getTime();
                    bVal = new Date(bVal).getTime();
                } else if (customerSortField === 'warranty_count') {
                    aVal = Number(aVal) || 0;
                    bVal = Number(bVal) || 0;
                } else {
                    aVal = (aVal || '').toString().toLowerCase();
                    bVal = (bVal || '').toString().toLowerCase();
                }
                return customerSortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
            });

        const exportData = filteredData.map(formatCustomerForExport);
        downloadCSV(exportData, `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleExportVendorDetailWarranties = (filteredWarranties: any[]) => {
        const exportData = filteredWarranties.map(formatWarrantyForExport);
        downloadCSV(exportData, `vendor_warranties_export_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleExportVendorDetailManpower = (filteredManpower: any[]) => {
        const exportData = filteredManpower.map(formatManpowerForExport);
        downloadCSV(exportData, `vendor_manpower_export_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleExportCustomerDetailWarranties = (filteredWarranties: any[]) => {
        const exportData = filteredWarranties.map(formatWarrantyForExport);
        downloadCSV(exportData, `customer_warranties_export_${new Date().toISOString().split('T')[0]}.csv`);
    };

    useEffect(() => {
        if (user?.role === "admin") {
            fetchStats();
        }
    }, [user]);

    useEffect(() => {
        if (activeTab === "vendors" && !viewingVendor) {
            fetchVendors(vendors.length > 0);
        } else if (activeTab === "customers" && !viewingCustomer) {
            fetchCustomers(customers.length > 0);
        } else if (activeTab === "warranties") {
            fetchWarranties(warrantyPagination.currentPage, warranties.length > 0);
        } else if (activeTab === "admins") {
            fetchAdmins();
        } else if (activeTab === "activity-logs") {
            fetchActivityLogs();
        }
    }, [activeTab, viewingVendor, viewingCustomer]);

    const fetchAdmins = async () => {
        setLoadingAdmins(true);
        try {
            const response = await api.get("/admin/admins");
            if (response.data.success) {
                setAdmins(response.data.admins);
            }
        } catch (error) {
            console.error("Failed to fetch admins:", error);
            toast({
                title: "Error",
                description: "Failed to fetch admin list",
                variant: "destructive"
            });
        } finally {
            setLoadingAdmins(false);
        }
    };

    const handleCreateAdmin = async () => {
        if (!newAdminForm.name || !newAdminForm.email || !newAdminForm.phone) {
            toast({
                title: "Validation Error",
                description: "Please fill in all fields",
                variant: "destructive"
            });
            return;
        }

        setAddingAdmin(true);
        try {
            const response = await api.post("/admin/admins", newAdminForm);
            if (response.data.success) {
                toast({
                    title: "Admin Created",
                    description: "Admin invitation email has been sent successfully"
                });
                setNewAdminForm({ name: '', email: '', phone: '' });
                fetchAdmins();
            }
        } catch (error: any) {
            console.error("Failed to create admin:", error);
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to create admin",
                variant: "destructive"
            });
        } finally {
            setAddingAdmin(false);
        }
    };

    const fetchActivityLogs = async (page = 1) => {
        setLoadingLogs(true);
        try {
            const response = await api.get(`/admin/activity-logs?page=${page}&limit=30`);
            if (response.data.success) {
                setActivityLogs(response.data.logs);
                if (response.data.pagination) {
                    setActivityLogPagination(response.data.pagination);
                }
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

    const fetchStats = async () => {
        try {
            const response = await api.get("/admin/stats");
            if (response.data.success) {
                const s = response.data.stats;
                setStats({
                    totalWarranties: Number(s.totalWarranties || 0),
                    totalVendors: Number(s.totalVendors || 0),
                    totalCustomers: Number(s.totalCustomers || 0),
                    pendingApprovals: Number(s.pendingApprovals || 0),
                    pendingVendorApprovals: Number(s.pendingVendorApprovals || 0),
                    validatedWarranties: Number(s.validatedWarranties || 0),
                    rejectedWarranties: Number(s.rejectedWarranties || 0),
                    monthlyStats: (s.monthlyStats || []).map((m: any) => ({
                        ...m,
                        total: Number(m.total || 0),
                        approved: Number(m.approved || 0),
                        rejected: Number(m.rejected || 0),
                        pending_admin: Number(m.pending_admin || 0),
                        pending_vendor: Number(m.pending_vendor || 0),
                    })),
                    monthlyCustomerStats: (s.monthlyCustomerStats || []).map((m: any) => ({
                        ...m,
                        active_customers: Number(m.active_customers || 0),
                        new_customers: Number(m.new_customers || 0),
                        returning_customers: Number(m.returning_customers || 0),
                    })),
                });
            }
        } catch (error) {
            console.error("Failed to fetch stats", error);
            toast({
                title: "Stats Fetch Failed",
                description: "Failed to fetch statistics",
                variant: "destructive"
            });
        }
    };

    const fetchWarranties = async (page = 1, background = false) => {
        if (!background) setLoadingWarranties(true);
        try {
            const response = await api.get(`/admin/warranties?page=${page}&limit=30`);
            if (response.data.success) {
                setWarranties(response.data.warranties);
                if (response.data.pagination) {
                    setWarrantyPagination(response.data.pagination);
                }
            }
        } catch (error) {
            console.error("Failed to fetch warranties", error);
            toast({
                title: "Warranty Fetch Failed",
                description: "Failed to fetch warranties",
                variant: "destructive"
            });
        } finally {
            if (!background) setLoadingWarranties(false);
        }
    };

    const fetchVendors = async (background = false) => {
        if (!background) setLoadingVendors(true);
        try {
            const response = await api.get("/admin/vendors");
            if (response.data.success) {
                // Ensure manpower_count is a number
                const parsedVendors = response.data.vendors.map((v: any) => ({
                    ...v,
                    manpower_count: Number(v.manpower_count || 0)
                }));
                setVendors(parsedVendors);
            }
        } catch (error) {
            console.error("Failed to fetch vendors:", error);
            toast({
                title: "Franchise Fetch Failed",
                description: "Failed to fetch franchises",
                variant: "destructive"
            });
        } finally {
            if (!background) setLoadingVendors(false);
        }
    };

    const fetchCustomers = async (background = false) => {
        if (!background) setLoadingCustomers(true);
        try {
            const response = await api.get("/admin/customers");
            if (response.data.success) {
                setCustomers(response.data.customers);
            }
        } catch (error) {
            console.error("Failed to fetch customers:", error);
            toast({
                title: "Customer Fetch Failed",
                description: "Failed to fetch customers",
                variant: "destructive"
            });
        } finally {
            if (!background) setLoadingCustomers(false);
        }
    };

    // Update charts data when view changes
    useEffect(() => {
        if (overviewView === 'franchise') {
            fetchVendors();
        } else if (overviewView === 'customer') {
            fetchCustomers();
        }
    }, [overviewView]);

    const handleUpdateStatus = async (warrantyId: string, status: 'validated' | 'rejected', reason?: string) => {
        setProcessingWarranty(warrantyId);
        try {
            const response = await api.put(`/admin/warranties/${warrantyId}/status`, {
                status,
                rejectionReason: reason
            });

            if (response.data.success) {
                toast({
                    title: `Warranty ${status === 'validated' ? 'Approved' : 'Disapproved'}`,
                    description: response.data.message,
                    variant: status === 'validated' ? "default" : "destructive"
                });

                // Update local state for all views
                const updateWarrantyInList = (list: any[]) =>
                    list.map((w: any) =>
                        (w.uid === warrantyId || w.id === warrantyId)
                            ? { ...w, status, rejection_reason: reason }
                            : w
                    );

                // Update main warranties list
                setWarranties(prev => updateWarrantyInList(prev));

                // Update selectedVendor if active
                if (selectedVendor) {
                    setSelectedVendor(prev => ({
                        ...prev,
                        warranties: updateWarrantyInList(prev.warranties)
                    }));
                }

                // Update selectedCustomer if active
                if (selectedCustomer) {
                    setSelectedCustomer(prev => ({
                        ...prev,
                        warranties: updateWarrantyInList(prev.warranties)
                    }));
                }

                // Refresh stats in background
                fetchStats();

                // Refresh main list in background if needed (to ensure consistency)
                if (activeTab === "warranties") {
                    fetchWarranties(warrantyPagination.currentPage, true);
                }

                // Refresh related lists in background
                if (selectedVendor) {
                    fetchVendors(); // This one doesn't have background support yet, but it's less critical as we updated local state
                }
            }
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.response?.data?.error || "Failed to update warranty status",
                variant: "destructive"
            });
        } finally {
            setProcessingWarranty(null);
            setRejectDialogOpen(false);
            setRejectReason("");
            setSelectedWarrantyId(null);
        }
    };

    const handleWarrantyAction = async (warrantyId: string, status: 'validated' | 'rejected', reason?: string) => {
        if (status === 'rejected' && !reason) {
            setSelectedWarrantyId(warrantyId);
            setRejectDialogOpen(true);
            return;
        }
        await handleUpdateStatus(warrantyId, status, reason);
    };

    const handleViewVendor = async (vendorId: string) => {
        setLoadingVendorDetails(vendorId);
        try {
            const response = await api.get(`/admin/vendors/${vendorId}`);
            if (response.data.success) {
                setSelectedVendor({
                    ...response.data.vendor,
                    manpower: response.data.manpower,
                    warranties: response.data.warranties
                });
                setViewingVendor(true);
            }
        } catch (error) {
            console.error("Failed to fetch vendor details:", error);
            toast({
                title: "Franchise Details Fetch Failed",
                description: "Failed to fetch franchise details",
                variant: "destructive"
            });
        } finally {
            setLoadingVendorDetails(null);
        }
    };

    const handleVendorVerification = async (vendorId: string, isVerified: boolean, reason?: string) => {
        setProcessingVendor(vendorId);
        try {
            const response = await api.put(`/admin/vendors/${vendorId}/verification`, {
                is_verified: isVerified,
                rejection_reason: reason
            });

            if (response.data.success) {
                toast({
                    title: isVerified ? "Franchise Approved" : "Franchise Disapproved",
                    description: response.data.message,
                    variant: isVerified ? "default" : "destructive"
                });
                fetchVendors(); // Refresh list
                fetchStats(); // Refresh stats
            }
        } catch (error: any) {
            console.error("Vendor verification error:", error);
            toast({
                title: "Verification Update Failed",
                description: error.response?.data?.error || "Failed to update vendor status",
                variant: "destructive"
            });
        } finally {
            setProcessingVendor(null);
            setVendorRejectDialogOpen(false);
            setVendorRejectReason("");
            setSelectedVendor(null);
        }
    };

    const handleDeleteVendor = async (vendorId: string) => {
        if (!confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await api.delete(`/admin/vendors/${vendorId}`);
            if (response.data.success) {
                toast({
                    title: "Franchise Deleted",
                    description: "Franchise deleted successfully",
                });
                setVendors(vendors.filter(v => v.id !== vendorId));
                fetchStats();
            }
        } catch (error) {
            console.error("Failed to delete vendor:", error);
            toast({
                title: "Deletion Failed",
                description: "Failed to delete vendor",
                variant: "destructive"
            });
        }
    };

    const openRejectDialog = (warrantyId: string) => {
        setSelectedWarrantyId(warrantyId);
        setRejectDialogOpen(true);
    };

    // Detailed Customer View
    if (viewingCustomer && selectedCustomer) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <Button
                        variant="ghost"
                        onClick={() => setViewingCustomer(false)}
                        className="mb-6"
                    >
                        ← Back to Customers
                    </Button>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">{selectedCustomer.customer_name}</h1>
                        <div className="flex gap-4 text-muted-foreground">
                            <div>{selectedCustomer.customer_email}</div>
                            <span>•</span>
                            <div>{selectedCustomer.customer_phone}</div>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Warranty Registrations ({selectedCustomer.warranties?.length || 0})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={customerWarrantyFilter} onValueChange={(value: any) => setCustomerWarrantyFilter(value)} className="mb-4">
                                <TabsList className="grid w-full grid-cols-2 h-auto md:inline-flex md:w-auto md:h-10">
                                    <TabsTrigger value="all">All ({selectedCustomer.warranties?.length || 0})</TabsTrigger>
                                    <TabsTrigger value="validated">Approved ({selectedCustomer.warranties?.filter((w: any) => w.status === 'validated').length || 0})</TabsTrigger>
                                    <TabsTrigger value="rejected">Disapproved ({selectedCustomer.warranties?.filter((w: any) => w.status === 'rejected').length || 0})</TabsTrigger>
                                    <TabsTrigger value="pending">Pending ({selectedCustomer.warranties?.filter((w: any) => w.status === 'pending').length || 0})</TabsTrigger>
                                </TabsList>
                            </Tabs>


                            {/* Controls */}
                            <div className="flex flex-col gap-4 mb-4">
                                {/* Date Range & Export */}
                                <div className="flex flex-wrap items-center gap-4 justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">From:</span>
                                            <input
                                                type="date"
                                                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                                value={customerDetailWarrantyDateFrom}
                                                onChange={(e) => setCustomerDetailWarrantyDateFrom(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">To:</span>
                                            <input
                                                type="date"
                                                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                                value={customerDetailWarrantyDateTo}
                                                onChange={(e) => setCustomerDetailWarrantyDateTo(e.target.value)}
                                            />
                                        </div>
                                        {(customerDetailWarrantyDateFrom || customerDetailWarrantyDateTo) && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => { setCustomerDetailWarrantyDateFrom(''); setCustomerDetailWarrantyDateTo(''); }}
                                            >
                                                Clear Dates
                                            </Button>
                                        )}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleExportCustomerDetailWarranties(
                                            (selectedCustomer.warranties || []).filter((warranty: any) => {
                                                if (customerWarrantyFilter !== 'all' && warranty.status !== customerWarrantyFilter) return false;
                                                if (customerDetailWarrantyDateFrom || customerDetailWarrantyDateTo) {
                                                    const warrantyDate = new Date(warranty.created_at);
                                                    warrantyDate.setHours(0, 0, 0, 0);
                                                    if (customerDetailWarrantyDateFrom) {
                                                        const fromDate = new Date(customerDetailWarrantyDateFrom);
                                                        fromDate.setHours(0, 0, 0, 0);
                                                        if (warrantyDate < fromDate) return false;
                                                    }
                                                    if (customerDetailWarrantyDateTo) {
                                                        const toDate = new Date(customerDetailWarrantyDateTo);
                                                        toDate.setHours(23, 59, 59, 999);
                                                        if (warrantyDate > toDate) return false;
                                                    }
                                                }
                                                if (customerDetailWarrantySearch) {
                                                    const search = customerDetailWarrantySearch.toLowerCase();
                                                    return (
                                                        warranty.product_type?.toLowerCase().includes(search) ||
                                                        warranty.uid?.toLowerCase().includes(search) ||
                                                        (warranty.installer_name?.toLowerCase() || '').includes(search)
                                                    );
                                                }
                                                return true;
                                            })
                                                .sort((a: any, b: any) => {
                                                    let aVal = a[customerDetailWarrantySortField];
                                                    let bVal = b[customerDetailWarrantySortField];
                                                    if (customerDetailWarrantySortField === 'created_at') {
                                                        aVal = new Date(aVal).getTime();
                                                        bVal = new Date(bVal).getTime();
                                                    } else {
                                                        aVal = (aVal || '').toString().toLowerCase();
                                                        bVal = (bVal || '').toString().toLowerCase();
                                                    }
                                                    return customerDetailWarrantySortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
                                                })
                                        )}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export CSV
                                    </Button>
                                </div>

                                {/* Search & Sort */}
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex-1 min-w-[200px] relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="Search warranties..."
                                            className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm"
                                            value={customerDetailWarrantySearch}
                                            onChange={(e) => setCustomerDetailWarrantySearch(e.target.value)}
                                        />
                                    </div>
                                    <select
                                        className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                        value={customerDetailWarrantySortField}
                                        onChange={(e) => setCustomerDetailWarrantySortField(e.target.value as any)}
                                    >
                                        <option value="created_at">Date</option>
                                        <option value="product_type">Product</option>
                                        <option value="status">Status</option>
                                    </select>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCustomerDetailWarrantySortOrder(customerDetailWarrantySortOrder === 'asc' ? 'desc' : 'asc')}
                                    >
                                        {customerDetailWarrantySortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                                    </Button>
                                </div>
                            </div>

                            {(!selectedCustomer.warranties || selectedCustomer.warranties.length === 0) ? (
                                <div className="text-center py-8 text-muted-foreground">No warranties found.</div>
                            ) : (
                                <AdminWarrantyList
                                    key={`${customerWarrantyFilter}-${customerDetailWarrantySearch}-${customerDetailWarrantySortField}-${customerDetailWarrantySortOrder}`}
                                    items={(selectedCustomer.warranties || [])
                                        .filter((warranty: any) => {
                                            if (customerWarrantyFilter !== 'all' && warranty.status !== customerWarrantyFilter) return false;

                                            // Date range filter
                                            if (customerDetailWarrantyDateFrom || customerDetailWarrantyDateTo) {
                                                const warrantyDate = new Date(warranty.created_at);
                                                warrantyDate.setHours(0, 0, 0, 0);
                                                if (customerDetailWarrantyDateFrom) {
                                                    const fromDate = new Date(customerDetailWarrantyDateFrom);
                                                    fromDate.setHours(0, 0, 0, 0);
                                                    if (warrantyDate < fromDate) return false;
                                                }
                                                if (customerDetailWarrantyDateTo) {
                                                    const toDate = new Date(customerDetailWarrantyDateTo);
                                                    toDate.setHours(23, 59, 59, 999);
                                                    if (warrantyDate > toDate) return false;
                                                }
                                            }

                                            // Search filter
                                            if (customerDetailWarrantySearch) {
                                                const search = customerDetailWarrantySearch.toLowerCase();
                                                return (
                                                    warranty.product_type?.toLowerCase().includes(search) ||
                                                    warranty.uid?.toLowerCase().includes(search) ||
                                                    (warranty.installer_name?.toLowerCase() || '').includes(search)
                                                );
                                            }
                                            return true;
                                        })
                                        .sort((a: any, b: any) => {
                                            let aVal = a[customerDetailWarrantySortField];
                                            let bVal = b[customerDetailWarrantySortField];
                                            if (customerDetailWarrantySortField === 'created_at') {
                                                aVal = new Date(aVal).getTime();
                                                bVal = new Date(bVal).getTime();
                                            } else {
                                                aVal = (aVal || '').toString().toLowerCase();
                                                bVal = (bVal || '').toString().toLowerCase();
                                            }
                                            return customerDetailWarrantySortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
                                        })
                                    }
                                    showRejectionReason={customerWarrantyFilter === 'rejected'}
                                    showActions={customerWarrantyFilter === 'validated' || customerWarrantyFilter === 'pending'}
                                    processingWarranty={processingWarranty}
                                    onApprove={(id) => handleUpdateStatus(id, 'validated')}
                                    onReject={(id) => openRejectDialog(id)}
                                />
                            )}
                        </CardContent>
                    </Card>
                </main>

                {/* Rejection Dialog for Customer View */}
                {rejectDialogOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-background p-6 rounded-lg w-full max-w-md shadow-lg">
                            <h3 className="text-lg font-semibold mb-4">Reject Warranty</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Please provide a reason for rejecting this warranty registration.
                            </p>
                            <textarea
                                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Reason for rejection..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                disabled={processingWarranty === selectedWarrantyId}
                            />
                            <div className="flex justify-end gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setRejectDialogOpen(false)}
                                    disabled={processingWarranty === selectedWarrantyId}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => selectedWarrantyId && handleUpdateStatus(selectedWarrantyId, 'rejected', rejectReason)}
                                    disabled={!rejectReason.trim() || processingWarranty === selectedWarrantyId}
                                >
                                    {processingWarranty === selectedWarrantyId ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Rejecting...</>
                                    ) : (
                                        'Reject Warranty'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const handleViewCustomer = async (email: string) => {
        setLoadingCustomerDetails(email);
        try {
            const response = await api.get(`/admin/customers/${encodeURIComponent(email)}`);
            if (response.data.success) {
                setSelectedCustomer({
                    ...response.data.customer,
                    warranties: response.data.warranties
                });
                setViewingCustomer(true);
            }
        } catch (error) {
            console.error("Failed to fetch customer details:", error);
            toast({
                title: "Error",
                description: "Failed to fetch customer details",
                variant: "destructive"
            });
        } finally {
            setLoadingCustomerDetails(null);
        }
    };

    const handleDeleteCustomer = async (email: string) => {
        if (!confirm("Are you sure you want to delete this customer? This will permanently remove all their warranty registrations.")) {
            return;
        }

        try {
            const response = await api.delete(`/admin/customers/${encodeURIComponent(email)}`);
            if (response.data.success) {
                toast({
                    title: "Success",
                    description: "Customer deleted successfully",
                });
                setCustomers(customers.filter(c => c.customer_email !== email));
                fetchStats();
            }
        } catch (error) {
            console.error("Failed to delete customer:", error);
            toast({
                title: "Error",
                description: "Failed to delete customer",
                variant: "destructive"
            });
        }
    };



    // Calculate vendor counts for sub-tabs based on their warranty statuses
    const approvedVendorsCount = vendors.filter(vendor => vendor.is_verified).length;
    const disapprovedVendorsCount = vendors.filter(vendor =>
        !vendor.is_verified && vendor.verified_at != null
    ).length;
    const pendingVendorsCount = vendors.filter(vendor =>
        !vendor.is_verified && (vendor.verified_at == null || vendor.verified_at === undefined)
    ).length;

    // Filter, search, and sort vendors
    const filteredVendors = vendors
        .filter(vendor => {
            // Status filter
            if (vendorFilter === 'approved') {
                if (!vendor.is_verified) return false;
            } else if (vendorFilter === 'disapproved') {
                if (!((!vendor.is_verified) && vendor.verified_at != null)) return false;
            } else if (vendorFilter === 'pending') {
                if (!((!vendor.is_verified) && (vendor.verified_at == null || vendor.verified_at === undefined))) return false;
            }
            // Date range filter
            if (vendorDateFrom || vendorDateTo) {
                const vendorDate = new Date(vendor.created_at);
                vendorDate.setHours(0, 0, 0, 0);
                if (vendorDateFrom) {
                    const fromDate = new Date(vendorDateFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    if (vendorDate < fromDate) return false;
                }
                if (vendorDateTo) {
                    const toDate = new Date(vendorDateTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (vendorDate > toDate) return false;
                }
            }
            // Search filter
            if (vendorSearch) {
                const search = vendorSearch.toLowerCase();
                return (
                    vendor.store_name?.toLowerCase().includes(search) ||
                    vendor.name?.toLowerCase().includes(search) ||
                    vendor.email?.toLowerCase().includes(search) ||
                    vendor.phone_number?.includes(search) ||
                    vendor.city?.toLowerCase().includes(search) ||
                    vendor.state?.toLowerCase().includes(search)
                );
            }
            return true;
        })
        .sort((a: any, b: any) => {
            let aVal = a[vendorSortField];
            let bVal = b[vendorSortField];
            if (vendorSortField === 'created_at') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            } else {
                aVal = (aVal || '').toString().toLowerCase();
                bVal = (bVal || '').toString().toLowerCase();
            }
            return vendorSortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
        });
    if (loading) return <div>Loading...</div>;
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground font-medium animate-pulse">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login?role=admin" replace />;
    if (user.role !== "admin") return <Navigate to="/warranty" replace />;

    // Detailed Vendor View
    if (viewingVendor && selectedVendor) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <Button
                        variant="ghost"
                        onClick={() => setViewingVendor(false)}
                        className="mb-6"
                    >
                        ← Back to Vendors
                    </Button>

                    {/* Enhanced Vendor Header */}
                    <Card className="mb-6 overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-6 text-white">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold mb-1">{selectedVendor.store_name}</h1>
                                    <div className="flex items-center gap-2 text-white/80">
                                        <MapPin className="h-4 w-4" />
                                        <span>{selectedVendor.address}, {selectedVendor.city}, {selectedVendor.state}</span>
                                    </div>
                                </div>
                                <Badge
                                    className={cn(
                                        "text-sm px-3 py-1",
                                        selectedVendor.is_verified
                                            ? "bg-green-500 hover:bg-green-600"
                                            : "bg-yellow-500 hover:bg-yellow-600 text-black"
                                    )}
                                >
                                    {selectedVendor.is_verified ? '✓ Verified Franchise' : 'Pending Verification'}
                                </Badge>
                            </div>
                        </div>
                        <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                        <User className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Contact Person</p>
                                        <p className="font-medium">{selectedVendor.contact_name || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Mail className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="font-medium text-sm truncate max-w-[180px]">{selectedVendor.email || selectedVendor.contact_email || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <Phone className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Phone</p>
                                        <p className="font-medium">{selectedVendor.phone || selectedVendor.contact_phone || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs value={vendorDetailTab} onValueChange={(v) => setVendorDetailTab(v as 'warranties' | 'manpower')} className="space-y-4">
                        <TabsList className="grid w-full grid-cols-2 h-auto">
                            <TabsTrigger value="warranties">Warranties ({selectedVendor.warranties?.length || 0})</TabsTrigger>
                            <TabsTrigger value="manpower">Manpower ({selectedVendor.manpower?.length || 0})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="warranties">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Warranty Registrations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Tabs value={vendorWarrantyFilter} onValueChange={(value: any) => setVendorWarrantyFilter(value)} className="mb-4">
                                        <TabsList className="grid w-full grid-cols-2 h-auto md:inline-flex md:w-auto md:h-10">
                                            <TabsTrigger value="all">All ({selectedVendor.warranties?.length || 0})</TabsTrigger>
                                            <TabsTrigger value="validated">Approved ({selectedVendor.warranties?.filter((w: any) => w.status === 'validated').length || 0})</TabsTrigger>
                                            <TabsTrigger value="rejected">Disapproved ({selectedVendor.warranties?.filter((w: any) => w.status === 'rejected').length || 0})</TabsTrigger>
                                            <TabsTrigger value="pending">Pending ({selectedVendor.warranties?.filter((w: any) => w.status === 'pending').length || 0})</TabsTrigger>
                                        </TabsList>
                                    </Tabs>


                                    {/* Sub-tab Controls */}
                                    <div className="flex flex-col gap-4 mb-4">
                                        {/* Date Range & Export */}
                                        <div className="flex flex-wrap items-center gap-4 justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">From:</span>
                                                    <input
                                                        type="date"
                                                        className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                                        value={vendorDetailWarrantyDateFrom}
                                                        onChange={(e) => setVendorDetailWarrantyDateFrom(e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">To:</span>
                                                    <input
                                                        type="date"
                                                        className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                                        value={vendorDetailWarrantyDateTo}
                                                        onChange={(e) => setVendorDetailWarrantyDateTo(e.target.value)}
                                                    />
                                                </div>
                                                {(vendorDetailWarrantyDateFrom || vendorDetailWarrantyDateTo) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => { setVendorDetailWarrantyDateFrom(''); setVendorDetailWarrantyDateTo(''); }}
                                                    >
                                                        Clear Dates
                                                    </Button>
                                                )}
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleExportVendorDetailWarranties(
                                                    (selectedVendor.warranties || []).filter((warranty: any) => {
                                                        if (vendorWarrantyFilter !== 'all' && warranty.status !== vendorWarrantyFilter) return false;
                                                        if (vendorDetailWarrantyDateFrom || vendorDetailWarrantyDateTo) {
                                                            const warrantyDate = new Date(warranty.created_at);
                                                            warrantyDate.setHours(0, 0, 0, 0);
                                                            if (vendorDetailWarrantyDateFrom) {
                                                                const fromDate = new Date(vendorDetailWarrantyDateFrom);
                                                                fromDate.setHours(0, 0, 0, 0);
                                                                if (warrantyDate < fromDate) return false;
                                                            }
                                                            if (vendorDetailWarrantyDateTo) {
                                                                const toDate = new Date(vendorDetailWarrantyDateTo);
                                                                toDate.setHours(23, 59, 59, 999);
                                                                if (warrantyDate > toDate) return false;
                                                            }
                                                        }
                                                        if (vendorDetailWarrantySearch) {
                                                            const search = vendorDetailWarrantySearch.toLowerCase();
                                                            return (
                                                                warranty.customer_name?.toLowerCase().includes(search) ||
                                                                warranty.customer_phone?.includes(search) ||
                                                                warranty.product_type?.toLowerCase().includes(search) ||
                                                                warranty.uid?.toLowerCase().includes(search)
                                                            );
                                                        }
                                                        return true;
                                                    })
                                                        .sort((a: any, b: any) => {
                                                            let aVal = a[vendorDetailWarrantySortField];
                                                            let bVal = b[vendorDetailWarrantySortField];
                                                            if (vendorDetailWarrantySortField === 'created_at') {
                                                                aVal = new Date(aVal).getTime();
                                                                bVal = new Date(bVal).getTime();
                                                            } else {
                                                                aVal = (aVal || '').toString().toLowerCase();
                                                                bVal = (bVal || '').toString().toLowerCase();
                                                            }
                                                            return vendorDetailWarrantySortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
                                                        })
                                                )}
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Export CSV
                                            </Button>
                                        </div>

                                        {/* Search & Sort */}
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex-1 min-w-[200px] relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <input
                                                    type="text"
                                                    placeholder="Search warranties..."
                                                    className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm"
                                                    value={vendorDetailWarrantySearch}
                                                    onChange={(e) => setVendorDetailWarrantySearch(e.target.value)}
                                                />
                                            </div>
                                            <select
                                                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                                value={vendorDetailWarrantySortField}
                                                onChange={(e) => setVendorDetailWarrantySortField(e.target.value as any)}
                                            >
                                                <option value="created_at">Date</option>
                                                <option value="customer_name">Customer</option>
                                                <option value="product_type">Product</option>
                                                <option value="status">Status</option>
                                            </select>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setVendorDetailWarrantySortOrder(vendorDetailWarrantySortOrder === 'asc' ? 'desc' : 'asc')}
                                            >
                                                {vendorDetailWarrantySortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                                            </Button>
                                        </div>
                                    </div>

                                    {(!selectedVendor.warranties || selectedVendor.warranties.length === 0) ? (
                                        <div className="text-center py-8 text-muted-foreground">No warranties registered yet.</div>
                                    ) : (
                                        <AdminWarrantyList
                                            key={`${vendorWarrantyFilter}-${vendorDetailWarrantySearch}-${vendorDetailWarrantySortField}-${vendorDetailWarrantySortOrder}`}
                                            items={(selectedVendor.warranties || [])
                                                .filter((warranty: any) => {
                                                    if (vendorWarrantyFilter !== 'all' && warranty.status !== vendorWarrantyFilter) return false;

                                                    // Date range filter
                                                    if (vendorDetailWarrantyDateFrom || vendorDetailWarrantyDateTo) {
                                                        const warrantyDate = new Date(warranty.created_at);
                                                        warrantyDate.setHours(0, 0, 0, 0);
                                                        if (vendorDetailWarrantyDateFrom) {
                                                            const fromDate = new Date(vendorDetailWarrantyDateFrom);
                                                            fromDate.setHours(0, 0, 0, 0);
                                                            if (warrantyDate < fromDate) return false;
                                                        }
                                                        if (vendorDetailWarrantyDateTo) {
                                                            const toDate = new Date(vendorDetailWarrantyDateTo);
                                                            toDate.setHours(23, 59, 59, 999);
                                                            if (warrantyDate > toDate) return false;
                                                        }
                                                    }

                                                    // Search filter
                                                    if (vendorDetailWarrantySearch) {
                                                        const search = vendorDetailWarrantySearch.toLowerCase();

                                                        // Parse product details safetly
                                                        const productDetails = typeof warranty.product_details === 'string'
                                                            ? JSON.parse(warranty.product_details || '{}')
                                                            : warranty.product_details || {};
                                                        const rawProductName = productDetails.product || productDetails.productName || warranty.product_type || '';

                                                        // Handle specific search term mappings
                                                        if (search === 'ppf') {
                                                            if (
                                                                rawProductName.toLowerCase().includes('paint-protection') ||
                                                                rawProductName.toLowerCase().includes('paint protection film') ||
                                                                rawProductName.toLowerCase().includes('ppf') ||
                                                                warranty.product_type?.toLowerCase().includes('ppf')
                                                            ) {
                                                                return true;
                                                            }
                                                        }

                                                        return (
                                                            warranty.customer_name?.toLowerCase().includes(search) ||
                                                            warranty.customer_email?.toLowerCase().includes(search) ||
                                                            warranty.customer_phone?.includes(search) ||
                                                            warranty.uid?.toLowerCase().includes(search) ||
                                                            warranty.product_type?.toLowerCase().includes(search) ||
                                                            rawProductName.toLowerCase().includes(search)
                                                        );
                                                    }
                                                    return true;
                                                })
                                                .sort((a: any, b: any) => {
                                                    let aVal = a[vendorDetailWarrantySortField];
                                                    let bVal = b[vendorDetailWarrantySortField];
                                                    if (vendorDetailWarrantySortField === 'created_at') {
                                                        aVal = new Date(aVal).getTime();
                                                        bVal = new Date(bVal).getTime();
                                                    } else {
                                                        aVal = (aVal || '').toString().toLowerCase();
                                                        bVal = (bVal || '').toString().toLowerCase();
                                                    }
                                                    return vendorDetailWarrantySortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
                                                })
                                            }
                                            showRejectionReason={vendorWarrantyFilter === 'rejected'}
                                            showActions={vendorWarrantyFilter === 'validated' || vendorWarrantyFilter === 'pending'}
                                            processingWarranty={processingWarranty}
                                            onApprove={(id) => handleUpdateStatus(id, 'validated')}
                                            onReject={(id) => openRejectDialog(id)}
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="manpower">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Manpower List</CardTitle>
                                </CardHeader>

                                <CardContent>
                                    {/* Manpower Controls */}
                                    <div className="flex flex-wrap items-center gap-4 mb-6 justify-between">
                                        <div className="flex flex-wrap items-center gap-4 flex-1">
                                            <div className="relative min-w-[200px]">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <input
                                                    type="text"
                                                    placeholder="Search manpower..."
                                                    className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm"
                                                    value={vendorDetailManpowerSearch}
                                                    onChange={(e) => setVendorDetailManpowerSearch(e.target.value)}
                                                />
                                            </div>
                                            <select
                                                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                                value={vendorDetailManpowerSortField}
                                                onChange={(e) => setVendorDetailManpowerSortField(e.target.value as any)}
                                            >
                                                <option value="name">Name</option>
                                                <option value="points">Points</option>
                                                <option value="total_applications">Total Applications</option>
                                            </select>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setVendorDetailManpowerSortOrder(vendorDetailManpowerSortOrder === 'asc' ? 'desc' : 'asc')}
                                            >
                                                {vendorDetailManpowerSortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                                            </Button>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleExportVendorDetailManpower(
                                                selectedVendor.manpower
                                                    .filter((m: any) => {
                                                        // Apply search filter regardless of active/inactive tab for export consistency, 
                                                        // OR we could export ALL matching the search.
                                                        // User likely wants what they see, but exporting active+inactive is safer if not specified.
                                                        // Let's filter by search only for the export data generally, or we could pass the currently visible set.
                                                        // To keep it simple and powerful, let's export ALL manpower matching search, 
                                                        // sorted as per selection.
                                                        if (vendorDetailManpowerSearch) {
                                                            const search = vendorDetailManpowerSearch.toLowerCase();
                                                            return (
                                                                m.name?.toLowerCase().includes(search) ||
                                                                m.phone_number?.includes(search) ||
                                                                (m.points?.toString() || '').includes(search)
                                                            );
                                                        }
                                                        return true;
                                                    })
                                                    .sort((a: any, b: any) => {
                                                        let aVal = a[vendorDetailManpowerSortField];
                                                        let bVal = b[vendorDetailManpowerSortField];
                                                        if (typeof aVal === 'string') {
                                                            aVal = aVal.toLowerCase();
                                                            bVal = (bVal || '').toString().toLowerCase();
                                                        }
                                                        return vendorDetailManpowerSortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
                                                    })
                                            )}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Export CSV
                                        </Button>
                                    </div>

                                    <Tabs defaultValue="active" className="space-y-6">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="active">
                                                Current Team (
                                                {selectedVendor.manpower.filter((m: any) => m.is_active).length}
                                                )
                                            </TabsTrigger>

                                            <TabsTrigger value="inactive">
                                                Ex Team (
                                                {selectedVendor.manpower.filter((m: any) => !m.is_active).length}
                                                )
                                            </TabsTrigger>
                                        </TabsList>

                                        {/* CURRENT TEAM */}
                                        <TabsContent value="active">
                                            {selectedVendor.manpower.filter((m: any) => m.is_active).length === 0 ? (
                                                <div className="text-center py-8 text-muted-foreground">No active manpower.</div>
                                            ) : (
                                                <div className="grid gap-4">
                                                    {selectedVendor.manpower
                                                        .filter((m: any) => {
                                                            if (!m.is_active) return false;
                                                            if (vendorDetailManpowerSearch) {
                                                                const search = vendorDetailManpowerSearch.toLowerCase();
                                                                return (
                                                                    m.name?.toLowerCase().includes(search) ||
                                                                    m.phone_number?.includes(search) ||
                                                                    (m.points?.toString() || '').includes(search)
                                                                );
                                                            }
                                                            return true;
                                                        })
                                                        .sort((a: any, b: any) => {
                                                            let aVal = a[vendorDetailManpowerSortField];
                                                            let bVal = b[vendorDetailManpowerSortField];
                                                            if (typeof aVal === 'string') {
                                                                aVal = aVal.toLowerCase();
                                                                bVal = (bVal || '').toString().toLowerCase();
                                                            }
                                                            return vendorDetailManpowerSortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
                                                        })
                                                        .map((member: any) => (
                                                            <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                        <User className="h-5 w-5 text-primary" />
                                                                    </div>

                                                                    <div>
                                                                        <p className="font-medium">{member.name}</p>
                                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                                                                            <span>{member.phone_number}</span>
                                                                            <span>•</span>
                                                                            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{member.manpower_id}</span>
                                                                            <span>•</span>
                                                                            <span className="capitalize">{member.applicator_type.replace('_', ' ')}</span>
                                                                            <span>•</span>

                                                                            <button
                                                                                onClick={() => showManpowerWarranties(member, 'validated')}
                                                                                className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 hover:bg-green-200 cursor-pointer transition-colors"
                                                                            >
                                                                                {member.points || 0} Approved
                                                                            </button>

                                                                            <button
                                                                                onClick={() => showManpowerWarranties(member, 'pending')}
                                                                                className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800 hover:bg-yellow-200 cursor-pointer transition-colors"
                                                                            >
                                                                                {member.pending_points || 0} Pending
                                                                            </button>

                                                                            <button
                                                                                onClick={() => showManpowerWarranties(member, 'rejected')}
                                                                                className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 hover:bg-red-200 cursor-pointer transition-colors"
                                                                            >
                                                                                {member.rejected_points || 0} Disapproved
                                                                            </button>

                                                                            <span>•</span>
                                                                            <span className="font-medium">{member.total_applications || 0} Total</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </TabsContent>

                                        {/* PAST / EX TEAM */}
                                        <TabsContent value="inactive">
                                            {selectedVendor.manpower.filter((m: any) => !m.is_active).length === 0 ? (
                                                <div className="text-center py-8 text-muted-foreground">No ex team members.</div>
                                            ) : (
                                                <div className="grid gap-4">
                                                    {selectedVendor.manpower
                                                        .filter((m: any) => {
                                                            if (m.is_active) return false;
                                                            if (vendorDetailManpowerSearch) {
                                                                const search = vendorDetailManpowerSearch.toLowerCase();
                                                                return (
                                                                    m.name?.toLowerCase().includes(search) ||
                                                                    m.phone_number?.includes(search) ||
                                                                    (m.points?.toString() || '').includes(search)
                                                                );
                                                            }
                                                            return true;
                                                        })
                                                        .sort((a: any, b: any) => {
                                                            let aVal = a[vendorDetailManpowerSortField];
                                                            let bVal = b[vendorDetailManpowerSortField];
                                                            if (typeof aVal === 'string') {
                                                                aVal = aVal.toLowerCase();
                                                                bVal = (bVal || '').toString().toLowerCase();
                                                            }
                                                            return vendorDetailManpowerSortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
                                                        })
                                                        .map((member: any) => (
                                                            <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                                        <User className="h-5 w-5 text-gray-500" />
                                                                    </div>

                                                                    <div>
                                                                        <p className="font-medium text-muted-foreground">{member.name}</p>
                                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                                                                            <span>{member.phone_number}</span>
                                                                            <span>•</span>
                                                                            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{member.manpower_id}</span>
                                                                            <span>•</span>
                                                                            <span className="capitalize">{member.applicator_type.replace('_', ' ')}</span>
                                                                            <span>•</span>

                                                                            <button
                                                                                onClick={() => showManpowerWarranties(member, 'validated')}
                                                                                className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 hover:bg-green-200 cursor-pointer transition-colors"
                                                                            >
                                                                                {member.points || 0} Approved
                                                                            </button>

                                                                            <button
                                                                                onClick={() => showManpowerWarranties(member, 'pending')}
                                                                                className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800 hover:bg-yellow-200 cursor-pointer transition-colors"
                                                                            >
                                                                                {member.pending_points || 0} Pending
                                                                            </button>

                                                                            <button
                                                                                onClick={() => showManpowerWarranties(member, 'rejected')}
                                                                                className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 hover:bg-red-200 cursor-pointer transition-colors"
                                                                            >
                                                                                {member.rejected_points || 0} Disapproved
                                                                            </button>

                                                                            <span>•</span>
                                                                            <span className="font-medium">{member.total_applications || 0} Total</span>

                                                                            {member.removed_at && (
                                                                                <>
                                                                                    <span>•</span>
                                                                                    <span className="text-xs">Removed: {formatToIST(member.removed_at)}</span>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </TabsContent>

                    </Tabs>

                    {/* Rejection Dialog */}
                    {rejectDialogOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-background p-6 rounded-lg w-full max-w-md shadow-lg">
                                <h3 className="text-lg font-semibold mb-4">Reject Warranty</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Please provide a reason for rejecting this warranty registration.
                                </p>
                                <textarea
                                    className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Reason for rejection..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    disabled={processingWarranty === selectedWarrantyId}
                                />
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setRejectDialogOpen(false)}
                                        disabled={processingWarranty === selectedWarrantyId}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => selectedWarrantyId && handleUpdateStatus(selectedWarrantyId, 'rejected', rejectReason)}
                                        disabled={!rejectReason.trim() || processingWarranty === selectedWarrantyId}
                                    >
                                        {processingWarranty === selectedWarrantyId ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Rejecting...</>
                                        ) : (
                                            'Reject Warranty'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Manpower Warranty Details Dialog - inside vendor detail view */}
                    <Dialog open={manpowerWarrantyDialogOpen} onOpenChange={setManpowerWarrantyDialogOpen}>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {manpowerWarrantyDialogData.member?.name} - {manpowerWarrantyDialogData.status === 'validated' ? 'Approved' : manpowerWarrantyDialogData.status === 'rejected' ? 'Disapproved' : 'Pending'} Warranties
                                </DialogTitle>
                                <DialogDescription>
                                    {manpowerWarrantyDialogData.warranties.length} warranty registrations
                                </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4 space-y-3">
                                {manpowerWarrantyDialogData.warranties.length === 0 ? (
                                    <p className="text-center py-8 text-muted-foreground">No warranties found</p>
                                ) : (
                                    manpowerWarrantyDialogData.warranties.map((w: any, index: number) => {
                                        const pd = typeof w.product_details === 'string' ? JSON.parse(w.product_details) : w.product_details || {};
                                        const productNameMapping: Record<string, string> = {
                                            'paint-protection': 'PPF',
                                            'sun-protection': 'Tint',
                                            'seat-cover': 'Seat Cover',
                                            'ev-products': 'EV Product'
                                        };
                                        return (
                                            <div key={w.id || index} className="p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-medium">{w.customer_name}</p>
                                                        <p className="text-xs text-muted-foreground">{w.customer_phone}</p>
                                                    </div>
                                                    <Badge variant={
                                                        w.status === 'validated' ? 'default' :
                                                            w.status === 'rejected' ? 'destructive' : 'secondary'
                                                    } className={w.status === 'validated' ? 'bg-green-600' : ''}>
                                                        {productNameMapping[w.product_type] || w.product_type}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Vehicle</p>
                                                        <p>{w.car_make} {w.car_model}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Product</p>
                                                        <p>{pd.productName || pd.product || w.product_type}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">UID/Lot</p>
                                                        <p className="font-mono text-xs">{w.uid || pd.lotNumber || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Registered</p>
                                                        <p>{formatToIST(w.created_at)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            <Header />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                        System-wide warranty management and user administration
                    </p>
                </div>

                {/* Stats Cards - Dynamic based on active tab */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    {/* Warranties Tab Cards */}
                    {activeTab === 'warranties' && (
                        <>
                            <Card
                                className={`cursor-pointer transition-colors ${warrantyFilter === 'all' ? 'border-blue-400 bg-blue-50' : 'hover:bg-accent/50'}`}
                                onClick={() => setWarrantyFilter('all')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-blue-700">Total Warranties</CardTitle>
                                    <Package className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-700">{stats.totalWarranties}</div>
                                    <p className="text-xs text-blue-600">All registered products</p>
                                </CardContent>
                            </Card>

                            <Card
                                className={`cursor-pointer transition-colors ${warrantyFilter === 'validated' ? 'border-green-500 bg-green-50' : 'hover:bg-accent/50'}`}
                                onClick={() => setWarrantyFilter('validated')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-green-700">Approved</CardTitle>
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-700">{stats.validatedWarranties}</div>
                                    <p className="text-xs text-green-600">Approved warranties</p>
                                </CardContent>
                            </Card>

                            <Card
                                className={`cursor-pointer transition-colors ${warrantyFilter === 'rejected' ? 'border-red-500 bg-red-50' : 'hover:bg-accent/50'}`}
                                onClick={() => setWarrantyFilter('rejected')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-red-700">Disapproved</CardTitle>
                                    <X className="h-4 w-4 text-red-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-700">{stats.rejectedWarranties}</div>
                                    <p className="text-xs text-red-600">Disapproved warranties</p>
                                </CardContent>
                            </Card>

                            <Card
                                className={`cursor-pointer transition-colors ${warrantyFilter === 'pending_vendor' ? 'border-orange-500 bg-orange-50' : 'hover:bg-accent/50'}`}
                                onClick={() => setWarrantyFilter('pending_vendor')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-orange-700">Waiting for Vendor</CardTitle>
                                    <Clock className="h-4 w-4 text-orange-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-orange-700">{stats.pendingVendorApprovals}</div>
                                    <p className="text-xs text-orange-600">Vendor verification pending</p>
                                </CardContent>
                            </Card>

                            <Card
                                className={`cursor-pointer transition-colors ${warrantyFilter === 'pending' ? 'border-yellow-500 bg-yellow-50' : 'hover:bg-accent/50'}`}
                                onClick={() => setWarrantyFilter('pending')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-yellow-700">Pending Admin</CardTitle>
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-yellow-700">{stats.pendingApprovals}</div>
                                    <p className="text-xs text-yellow-600">Admin approval needed</p>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Vendors Tab Cards */}
                    {activeTab === 'vendors' && (
                        <>
                            <Card
                                className={`cursor-pointer transition-colors ${vendorFilter === 'all' ? 'border-blue-400 bg-blue-50' : 'hover:bg-accent/50'}`}
                                onClick={() => setVendorFilter('all')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-blue-700">Total Franchises</CardTitle>
                                    <Store className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-700">{stats.totalVendors}</div>
                                    <p className="text-xs text-blue-600">All registered vendors</p>
                                </CardContent>
                            </Card>

                            <Card
                                className={`cursor-pointer transition-colors ${vendorFilter === 'approved' ? 'border-green-500 bg-green-50' : 'hover:bg-accent/50'}`}
                                onClick={() => setVendorFilter('approved')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-green-700">Approved</CardTitle>
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-700">{approvedVendorsCount}</div>
                                    <p className="text-xs text-green-600">Verified franchises</p>
                                </CardContent>
                            </Card>

                            <Card
                                className={`cursor-pointer transition-colors ${vendorFilter === 'disapproved' ? 'border-red-500 bg-red-50' : 'hover:bg-accent/50'}`}
                                onClick={() => setVendorFilter('disapproved')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-red-700">Disapproved</CardTitle>
                                    <X className="h-4 w-4 text-red-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-700">{disapprovedVendorsCount}</div>
                                    <p className="text-xs text-red-600">Disapproved franchises</p>
                                </CardContent>
                            </Card>

                            <Card
                                className={`cursor-pointer transition-colors ${vendorFilter === 'pending' ? 'border-yellow-500 bg-yellow-50' : 'hover:bg-accent/50'}`}
                                onClick={() => setVendorFilter('pending')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-yellow-700">Pending</CardTitle>
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-yellow-700">{pendingVendorsCount}</div>
                                    <p className="text-xs text-yellow-600">Awaiting approval</p>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Customers Tab Cards */}
                    {activeTab === 'customers' && (
                        <>
                            <Card className="hover:bg-accent/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                                    <p className="text-xs text-muted-foreground">All registered customers</p>
                                </CardContent>
                            </Card>

                            <Card className="hover:bg-accent/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Warranties</CardTitle>
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalWarranties}</div>
                                    <p className="text-xs text-muted-foreground">All customer warranties</p>
                                </CardContent>
                            </Card>

                            <Card className="hover:bg-accent/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-green-700">Approved Warranties</CardTitle>
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-700">{stats.validatedWarranties}</div>
                                    <p className="text-xs text-green-600">Approved warranties</p>
                                </CardContent>
                            </Card>

                            <Card className="hover:bg-accent/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-red-700">Disapproved Warranties</CardTitle>
                                    <X className="h-4 w-4 text-red-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-700">{stats.rejectedWarranties}</div>
                                    <p className="text-xs text-red-600">Disapproved warranties</p>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Overview Tab Cards - Show summary */}
                    {activeTab === 'overview' && (
                        <>
                            <Card
                                className="cursor-pointer hover:bg-accent/50"
                                onClick={() => setActiveTab('warranties')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Warranties</CardTitle>
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalWarranties}</div>
                                    <p className="text-xs text-muted-foreground">Click to view all</p>
                                </CardContent>
                            </Card>

                            <Card
                                className="cursor-pointer hover:bg-accent/50"
                                onClick={() => setActiveTab('vendors')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Franchises</CardTitle>
                                    <Store className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalVendors}</div>
                                    <p className="text-xs text-muted-foreground">Click to manage</p>
                                </CardContent>
                            </Card>

                            <Card
                                className="cursor-pointer hover:bg-accent/50"
                                onClick={() => setActiveTab('customers')}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Customers</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                                    <p className="text-xs text-muted-foreground">Click to view all</p>
                                </CardContent>
                            </Card>

                            <Card className="hover:bg-accent/50" onClick={() => { setActiveTab('warranties'); setWarrantyFilter('pending'); }}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-yellow-700">Pending Approvals</CardTitle>
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-yellow-700">{stats.pendingApprovals}</div>
                                    <p className="text-xs text-yellow-600">Needs attention</p>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="flex flex-wrap md:inline-flex mb-8 h-auto p-1 bg-muted">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="warranties">Warranties</TabsTrigger>
                        <TabsTrigger value="vendors">Franchises</TabsTrigger>
                        <TabsTrigger value="customers">Customers</TabsTrigger>
                        <TabsTrigger value="announcements">
                            <Megaphone className="h-4 w-4 mr-2" />
                            Announcements
                        </TabsTrigger>
                        <TabsTrigger value="admins">Admins</TabsTrigger>
                        <TabsTrigger value="old-warranties">
                            <Package className="h-4 w-4 mr-2" />
                            Old Warranties
                        </TabsTrigger>
                        <TabsTrigger value="activity-logs">Logs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Interactive Chart Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Chart Area */}
                            <Card className="lg:col-span-2 shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Analytics Overview</CardTitle>
                                            <CardDescription>
                                                Visual breakdown of system metrics
                                            </CardDescription>
                                        </div>
                                        {/* View Toggles */}
                                        <div className="flex bg-muted p-1 rounded-lg overflow-x-auto max-w-full">
                                            <div className="flex shrink-0">
                                                <button
                                                    onClick={() => setOverviewView('warranty')}
                                                    className={cn(
                                                        "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                                        overviewView === 'warranty'
                                                            ? "bg-background shadow-sm text-foreground"
                                                            : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    Warranties
                                                </button>
                                                <button
                                                    onClick={() => setOverviewView('franchise')}
                                                    className={cn(
                                                        "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                                        overviewView === 'franchise'
                                                            ? "bg-background shadow-sm text-foreground"
                                                            : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    Franchises
                                                </button>
                                                <button
                                                    onClick={() => setOverviewView('customer')}
                                                    className={cn(
                                                        "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                                        overviewView === 'customer'
                                                            ? "bg-background shadow-sm text-foreground"
                                                            : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    Customers
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 md:p-6 md:pt-0">
                                    <div className="min-h-[400px] md:h-[450px] w-full mt-4">
                                        {overviewView === 'warranty' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                                                <div className="h-[300px] md:h-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart margin={{ top: 20, bottom: 20 }}>
                                                            <Pie
                                                                data={[
                                                                    { name: 'Approved', value: stats.validatedWarranties, color: COLORS.validated },
                                                                    { name: 'Rejected', value: stats.rejectedWarranties, color: COLORS.rejected },
                                                                    { name: 'Pending Admin', value: stats.pendingApprovals, color: COLORS.pending },
                                                                    { name: 'Waiting Vendor', value: stats.pendingVendorApprovals, color: COLORS.pending_vendor },
                                                                ].filter(i => i.value > 0)}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={60}
                                                                outerRadius={100}
                                                                paddingAngle={2}
                                                                dataKey="value"
                                                            >
                                                                {[
                                                                    { name: 'Approved', value: stats.validatedWarranties, color: COLORS.validated },
                                                                    { name: 'Rejected', value: stats.rejectedWarranties, color: COLORS.rejected },
                                                                    { name: 'Pending Admin', value: stats.pendingApprovals, color: COLORS.pending },
                                                                    { name: 'Waiting Vendor', value: stats.pendingVendorApprovals, color: COLORS.pending_vendor },
                                                                ].filter(i => i.value > 0).map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                                                ))}
                                                            </Pie>
                                                            <RechartsTooltip content={<CustomTooltip />} />
                                                            <Legend
                                                                verticalAlign="bottom"
                                                                height={60}
                                                                content={(props) => {
                                                                    const { payload } = props;
                                                                    return (
                                                                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-8 justify-center mx-auto max-w-[300px]">
                                                                            {payload?.map((entry: any, index: number) => (
                                                                                <div key={`legend-item-${index}`} className="flex items-center gap-2">
                                                                                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                                                                                    <span className="text-[10px] sm:text-xs font-medium text-foreground truncate">
                                                                                        {entry.value}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    );
                                                                }}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="h-[300px] md:h-full border-t pt-8 mt-4 md:border-t-0 md:pt-0 md:mt-0 md:border-l md:pl-8">
                                                    <div className="relative flex items-center justify-center mb-4 min-h-[24px]">
                                                        <p className="text-sm font-medium z-10 bg-background px-2">Monthly Trends</p>
                                                        {selectedMonth && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setSelectedMonth(null)}
                                                                className="absolute right-0 h-6 text-xs hover:bg-muted"
                                                            >
                                                                Reset View
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <ResponsiveContainer width="100%" height="90%">
                                                        {stats.monthlyStats && stats.monthlyStats.length > 0 ? (
                                                            <BarChart
                                                                data={stats.monthlyStats}
                                                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                                                barGap={2}
                                                                onClick={(data) => {
                                                                    if (data && data.activePayload && data.activePayload.length > 0) {
                                                                        const clickedMonth = data.activePayload[0].payload.month;
                                                                        setSelectedMonth(prev => prev === clickedMonth ? null : clickedMonth);
                                                                    }
                                                                }}
                                                            >
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                                <XAxis
                                                                    dataKey="month"
                                                                    tickLine={false}
                                                                    tick={({ x, y, payload }) => {
                                                                        const date = new Date(payload.value + '-01');
                                                                        const label = date.toLocaleDateString('en-IN', { month: 'short' });
                                                                        const isSelected = selectedMonth === payload.value;
                                                                        return (
                                                                            <g transform={`translate(${x},${y})`}>
                                                                                <text
                                                                                    x={0}
                                                                                    y={0}
                                                                                    dy={12}
                                                                                    textAnchor="middle"
                                                                                    fill={isSelected ? "#2563eb" : "#666"}
                                                                                    fontWeight={isSelected ? "bold" : "normal"}
                                                                                    fontSize={12}
                                                                                    className="cursor-pointer hover:font-bold"
                                                                                    onClick={() => setSelectedMonth(isSelected ? null : payload.value)}
                                                                                >
                                                                                    {label}
                                                                                </text>
                                                                            </g>
                                                                        );
                                                                    }}
                                                                />
                                                                <YAxis
                                                                    tickLine={false}
                                                                    axisLine={false}
                                                                    tick={{ fontSize: 12 }}
                                                                    domain={[0, (dataMax: number) => {
                                                                        // Guard against NaN/undefined - fixes recharts DecimalError
                                                                        if (dataMax === undefined || dataMax === null || isNaN(dataMax) || dataMax === 0) return 10;
                                                                        const magnitude = Math.pow(10, Math.floor(Math.log10(dataMax)));
                                                                        const normalized = dataMax / magnitude;
                                                                        let multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
                                                                        return Math.ceil(dataMax / (magnitude * multiplier)) * (magnitude * multiplier);
                                                                    }]}
                                                                    allowDataOverflow={false}
                                                                />
                                                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                                                <Bar name="Total" dataKey="total" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                                                <Bar name="Approved" dataKey="approved" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                                            </BarChart>
                                                        ) : (
                                                            <BarChart data={[{ month: '', total: 0, approved: 0 }]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                                <XAxis dataKey="month" />
                                                                <YAxis domain={[0, 10]} />
                                                                <Bar name="Total" dataKey="total" fill="#94a3b8" />
                                                                <Bar name="Approved" dataKey="approved" fill="#16a34a" />
                                                            </BarChart>
                                                        )}
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        )}

                                        {overviewView === 'franchise' && (
                                            <div className="h-[400px] md:h-full w-full p-4">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={[
                                                            { name: 'Total Franchises', value: stats.totalVendors, color: COLORS.franchise },
                                                            { name: 'Manpower / Staff', value: vendors.reduce((acc, v) => acc + (v.manpower_count || 0), 0), color: '#c084fc' }
                                                        ]}
                                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                                        <YAxis
                                                            tickLine={false}
                                                            axisLine={false}
                                                            domain={[0, (dataMax: number) => {
                                                                if (dataMax === undefined || dataMax === null || isNaN(dataMax) || dataMax === 0) return 10;
                                                                const magnitude = Math.pow(10, Math.floor(Math.log10(dataMax)));
                                                                const normalized = dataMax / magnitude;
                                                                let multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
                                                                return Math.ceil(dataMax / (magnitude * multiplier)) * (magnitude * multiplier);
                                                            }]}
                                                            allowDataOverflow={false}
                                                        />
                                                        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                                            {[
                                                                { name: 'Total Franchises', value: stats.totalVendors, color: COLORS.franchise },
                                                                { name: 'Manpower / Staff', value: vendors.reduce((acc, v) => acc + (v.manpower_count || 0), 0), color: '#c084fc' }
                                                            ].map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {overviewView === 'customer' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                                                <div className="h-[300px] md:h-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart margin={{ top: 20, bottom: 40 }}>
                                                            <Pie
                                                                data={[
                                                                    { name: 'Total Customers', value: stats.totalCustomers, color: COLORS.customer },
                                                                    { name: 'Total Warranties', value: stats.totalWarranties, color: COLORS.total },
                                                                    { name: 'Approved', value: stats.validatedWarranties, color: COLORS.validated },
                                                                    { name: 'Rejected', value: stats.rejectedWarranties, color: COLORS.rejected },
                                                                    { name: 'Pending', value: stats.pendingApprovals, color: COLORS.pending },
                                                                ]}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={60}
                                                                outerRadius={100}
                                                                paddingAngle={2}
                                                                dataKey="value"
                                                            >
                                                                {[
                                                                    { name: 'Total Customers', value: stats.totalCustomers, color: COLORS.customer },
                                                                    { name: 'Total Warranties', value: stats.totalWarranties, color: COLORS.total },
                                                                    { name: 'Approved', value: stats.validatedWarranties, color: COLORS.validated },
                                                                    { name: 'Rejected', value: stats.rejectedWarranties, color: COLORS.rejected },
                                                                    { name: 'Pending', value: stats.pendingApprovals, color: COLORS.pending },
                                                                ].map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                                                ))}
                                                            </Pie>
                                                            <RechartsTooltip content={<CustomTooltip />} />
                                                            <Legend
                                                                verticalAlign="bottom"
                                                                height={80}
                                                                content={(props) => {
                                                                    const { payload } = props;
                                                                    return (
                                                                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-8 justify-center mx-auto max-w-[300px]">
                                                                            {payload?.map((entry: any, index: number) => (
                                                                                <div key={`legend-item-${index}`} className="flex items-center gap-2">
                                                                                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                                                                                    <span className="text-[10px] sm:text-xs font-medium text-foreground truncate">
                                                                                        {entry.value}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    );
                                                                }}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="h-[300px] md:h-full border-t pt-8 mt-4 md:border-t-0 md:pt-0 md:mt-0 md:border-l md:pl-8">
                                                    <div className="relative flex items-center justify-center mb-4 min-h-[24px]">
                                                        <p className="text-sm font-medium z-10 bg-background px-2">Customer Growth</p>
                                                        {selectedMonth && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setSelectedMonth(null)}
                                                                className="absolute right-0 h-6 text-xs hover:bg-muted"
                                                            >
                                                                Reset View
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <ResponsiveContainer width="100%" height="90%">
                                                        {stats.monthlyCustomerStats && stats.monthlyCustomerStats.length > 0 ? (
                                                            <BarChart
                                                                data={stats.monthlyCustomerStats}
                                                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                                                barGap={2}
                                                                onClick={(data) => {
                                                                    if (data && data.activePayload && data.activePayload.length > 0) {
                                                                        const clickedMonth = data.activePayload[0].payload.month;
                                                                        setSelectedMonth(prev => prev === clickedMonth ? null : clickedMonth);
                                                                    }
                                                                }}
                                                            >
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                                <XAxis
                                                                    dataKey="month"
                                                                    tickLine={false}
                                                                    tick={({ x, y, payload }) => {
                                                                        const date = new Date(payload.value + '-01');
                                                                        const label = date.toLocaleDateString('en-IN', { month: 'short' });
                                                                        const isSelected = selectedMonth === payload.value;
                                                                        return (
                                                                            <g transform={`translate(${x},${y})`}>
                                                                                <text
                                                                                    x={0}
                                                                                    y={0}
                                                                                    dy={12}
                                                                                    textAnchor="middle"
                                                                                    fill={isSelected ? "#2563eb" : "#666"}
                                                                                    fontWeight={isSelected ? "bold" : "normal"}
                                                                                    fontSize={12}
                                                                                    className="cursor-pointer hover:font-bold"
                                                                                    onClick={() => setSelectedMonth(isSelected ? null : payload.value)}
                                                                                >
                                                                                    {label}
                                                                                </text>
                                                                            </g>
                                                                        );
                                                                    }}
                                                                />
                                                                <YAxis
                                                                    tickLine={false}
                                                                    axisLine={false}
                                                                    tick={{ fontSize: 12 }}
                                                                    domain={[0, (dataMax: number) => {
                                                                        if (dataMax === undefined || dataMax === null || isNaN(dataMax) || dataMax === 0) return 10;
                                                                        const magnitude = Math.pow(10, Math.floor(Math.log10(dataMax)));
                                                                        const normalized = dataMax / magnitude;
                                                                        let multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
                                                                        return Math.ceil(dataMax / (magnitude * multiplier)) * (magnitude * multiplier);
                                                                    }]}
                                                                    allowDataOverflow={false}
                                                                />
                                                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                                                <Bar name="New Customers" dataKey="new_customers" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                                                <Bar name="Returning Customers" dataKey="returning_customers" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                                            </BarChart>
                                                        ) : (
                                                            <BarChart data={[{ month: '', new_customers: 0, returning_customers: 0 }]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                                <XAxis dataKey="month" />
                                                                <YAxis domain={[0, 10]} />
                                                                <Bar name="New Customers" dataKey="new_customers" fill="#16a34a" />
                                                                <Bar name="Returning Customers" dataKey="returning_customers" fill="#2563eb" />
                                                            </BarChart>
                                                        )}
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Detailed Breakdown Side Panel */}
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle>Detailed Breakdown</CardTitle>
                                    <CardDescription>
                                        {overviewView === 'warranty' ? (
                                            selectedMonth ?
                                                `Statistics for ${new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}` :
                                                'Warranty Statistics'
                                        ) :
                                            overviewView === 'franchise' ? 'Franchise Network' : 'User Base'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-auto md:h-[450px] pr-4">
                                        <div className="space-y-6">
                                            {overviewView === 'warranty' && (() => {
                                                // Determine which stats to display (Global or Selected Month)
                                                const currentStats = selectedMonth
                                                    ? stats.monthlyStats.find((m: any) => m.month === selectedMonth) || {
                                                        total: 0,
                                                        approved: 0,
                                                        pending_admin: 0,
                                                        pending_vendor: 0,
                                                        rejected: 0
                                                    }
                                                    : {
                                                        total: stats.totalWarranties,
                                                        approved: stats.validatedWarranties,
                                                        pending_admin: stats.pendingApprovals,
                                                        pending_vendor: stats.pendingVendorApprovals,
                                                        rejected: stats.rejectedWarranties
                                                    };

                                                const total = selectedMonth ? currentStats.total : stats.totalWarranties;

                                                return (
                                                    <>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-2 w-2 rounded-full bg-slate-500" />
                                                                    <span className="text-sm font-medium">Total Warranties</span>
                                                                </div>
                                                                <span className="font-mono text-sm font-bold">{total}</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                                <div className="h-full bg-slate-500 rounded-full" style={{ width: '100%' }} />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-2 w-2 rounded-full bg-green-600" />
                                                                    <span className="text-sm font-medium">Approved</span>
                                                                </div>
                                                                <span className="font-mono text-sm font-bold">{selectedMonth ? currentStats.approved : stats.validatedWarranties}</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                                <div className="h-full bg-green-600 rounded-full" style={{ width: `${((selectedMonth ? currentStats.approved : stats.validatedWarranties) / (total || 1)) * 100}%` }} />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-2 w-2 rounded-full bg-yellow-600" />
                                                                    <span className="text-sm font-medium">Pending Admin</span>
                                                                </div>
                                                                <span className="font-mono text-sm font-bold">{selectedMonth ? currentStats.pending_admin : stats.pendingApprovals}</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                                <div className="h-full bg-yellow-600 rounded-full" style={{ width: `${((selectedMonth ? currentStats.pending_admin : stats.pendingApprovals) / (total || 1)) * 100}%` }} />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-2 w-2 rounded-full bg-orange-600" />
                                                                    <span className="text-sm font-medium">Pending Vendor</span>
                                                                </div>
                                                                <span className="font-mono text-sm font-bold">{selectedMonth ? currentStats.pending_vendor : stats.pendingVendorApprovals}</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                                <div className="h-full bg-orange-600 rounded-full" style={{ width: `${((selectedMonth ? currentStats.pending_vendor : stats.pendingVendorApprovals) / (total || 1)) * 100}%` }} />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-2 w-2 rounded-full bg-red-600" />
                                                                    <span className="text-sm font-medium">Rejected</span>
                                                                </div>
                                                                <span className="font-mono text-sm font-bold">{selectedMonth ? currentStats.rejected : stats.rejectedWarranties}</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                                <div className="h-full bg-red-600 rounded-full" style={{ width: `${((selectedMonth ? currentStats.rejected : stats.rejectedWarranties) / (total || 1)) * 100}%` }} />
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            })()}

                                            {overviewView === 'franchise' && (
                                                <div className="space-y-4">
                                                    <div className="rounded-lg border p-3 flex items-center justify-between bg-muted/30">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground uppercase font-semibold">Total Partners</p>
                                                            <p className="text-2xl font-bold text-primary">{stats.totalVendors}</p>
                                                        </div>
                                                        <Store className="h-8 w-8 text-purple-200" />
                                                    </div>
                                                    <div className="rounded-lg border p-3 flex items-center justify-between bg-muted/30">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground uppercase font-semibold">Total Staff</p>
                                                            <p className="text-2xl font-bold text-primary">
                                                                {vendors.reduce((acc, v) => acc + (v.manpower_count || 0), 0)}
                                                            </p>
                                                        </div>
                                                        <Users className="h-8 w-8 text-blue-200" />
                                                    </div>
                                                </div>
                                            )}

                                            {!viewingVendor && overviewView === 'customer' && (
                                                <div className="space-y-6 animate-in fade-in duration-500">
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground mb-1">User Base</p>
                                                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
                                                            <div>
                                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                                                    {selectedMonth
                                                                        ? `Customers in ${new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`
                                                                        : 'Total Registered'}
                                                                </p>
                                                                <p className="text-3xl font-bold text-blue-600">
                                                                    {selectedMonth
                                                                        ? (stats.monthlyCustomerStats.find((m: any) => m.month === selectedMonth)?.active_customers || 0)
                                                                        : stats.totalCustomers}
                                                                </p>
                                                            </div>
                                                            <div className="h-10 w-10 text-blue-500 bg-blue-100 rounded-full flex items-center justify-center">
                                                                <User className="w-5 h-5" />
                                                            </div>
                                                        </div>

                                                        {/* Detailed New vs Returning Breakdown */}
                                                        {selectedMonth ? (
                                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                                                    <p className="text-xs font-semibold text-green-700 mb-1">New Customers</p>
                                                                    <p className="text-2xl font-bold text-green-800">
                                                                        {stats.monthlyCustomerStats.find((m: any) => m.month === selectedMonth)?.new_customers || 0}
                                                                    </p>
                                                                    <p className="text-[10px] text-green-600 mt-1">First-time buyers</p>
                                                                </div>
                                                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                                    <p className="text-xs font-semibold text-blue-700 mb-1">Returning</p>
                                                                    <p className="text-2xl font-bold text-blue-800">
                                                                        {stats.monthlyCustomerStats.find((m: any) => m.month === selectedMonth)?.returning_customers || 0}
                                                                    </p>
                                                                    <p className="text-[10px] text-blue-600 mt-1">Loyal customers</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground mt-2">
                                                                Platform user distribution shows <span className="font-bold text-foreground">{stats.totalCustomers > 0 ? ((stats.totalCustomers / (stats.totalCustomers + stats.totalVendors)) * 100).toFixed(1) : 0}%</span> are customers.
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>



                    <TabsContent value="warranties" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Warranty Management</CardTitle>
                                        <CardDescription>View and manage all warranty requests</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Filter Tabs */}
                                <Tabs value={warrantyFilter} onValueChange={(value: any) => setWarrantyFilter(value)} className="mb-4">
                                    <TabsList className="grid w-full grid-cols-2 h-auto md:inline-flex md:w-auto md:h-10">
                                        <TabsTrigger value="all">All ({stats.totalWarranties})</TabsTrigger>
                                        <TabsTrigger value="validated">Approved ({stats.validatedWarranties})</TabsTrigger>
                                        <TabsTrigger value="rejected">Disapproved ({stats.rejectedWarranties})</TabsTrigger>
                                        <TabsTrigger value="pending">Pending Admin ({stats.pendingApprovals})</TabsTrigger>
                                        <TabsTrigger value="pending_vendor">Waiting Vendor ({stats.pendingVendorApprovals})</TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                {/* Search & Sort Controls */}
                                <div className="flex flex-wrap gap-4 mb-4">
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <input
                                                type="text"
                                                placeholder="Search by name, email, phone, UID, car..."
                                                className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm"
                                                value={warrantySearch}
                                                onChange={(e) => setWarrantySearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                            value={warrantySortField}
                                            onChange={(e) => setWarrantySortField(e.target.value as any)}
                                        >
                                            <option value="created_at">Sort by Date</option>
                                            <option value="customer_name">Sort by Name</option>
                                            <option value="status">Sort by Status</option>
                                        </select>
                                        <select
                                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                            value={warrantySearch.includes('seat-cover') ? 'seat-cover' : warrantySearch.includes('ppf') ? 'ppf' : 'all'}
                                            onChange={(e) => {
                                                if (e.target.value === 'all') {
                                                    setWarrantySearch('');
                                                } else {
                                                    setWarrantySearch(e.target.value);
                                                }
                                            }}
                                        >
                                            <option value="all">All Products</option>
                                            <option value="seat-cover">Seat Cover</option>
                                            <option value="ppf">PPF</option>
                                        </select>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setWarrantySortOrder(warrantySortOrder === 'asc' ? 'desc' : 'asc')}
                                        >
                                            {warrantySortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                                        </Button>
                                        {warrantySearch && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setWarrantySearch('')}
                                            >
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Date Range Filter */}
                                <div className="flex flex-wrap items-center gap-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">From:</span>
                                        <input
                                            type="date"
                                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                            value={warrantyDateFrom}
                                            onChange={(e) => setWarrantyDateFrom(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">To:</span>
                                        <input
                                            type="date"
                                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                            value={warrantyDateTo}
                                            onChange={(e) => setWarrantyDateTo(e.target.value)}
                                        />
                                    </div>
                                    {(warrantyDateFrom || warrantyDateTo) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { setWarrantyDateFrom(''); setWarrantyDateTo(''); }}
                                        >
                                            Clear Dates
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        className="ml-auto bg-green-600 border-green-600 text-white hover:bg-green-700 hover:text-white transition-colors"
                                        onClick={handleExportWarranties}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export CSV
                                    </Button>
                                </div>

                                {loadingWarranties ? (
                                    <div className="text-center py-8">Loading warranties...</div>
                                ) : warranties.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">No warranties found.</div>
                                ) : (
                                    <AdminWarrantyList
                                        key={warrantyFilter + warrantySearch + warrantySortField + warrantySortOrder}
                                        items={warranties
                                            .filter((warranty: any) => {
                                                // Status filter
                                                if (warrantyFilter !== 'all' && warranty.status !== warrantyFilter) return false;
                                                // Date range filter
                                                if (warrantyDateFrom || warrantyDateTo) {
                                                    const warrantyDate = new Date(warranty.created_at);
                                                    warrantyDate.setHours(0, 0, 0, 0);
                                                    if (warrantyDateFrom) {
                                                        const fromDate = new Date(warrantyDateFrom);
                                                        fromDate.setHours(0, 0, 0, 0);
                                                        if (warrantyDate < fromDate) return false;
                                                    }
                                                    if (warrantyDateTo) {
                                                        const toDate = new Date(warrantyDateTo);
                                                        toDate.setHours(23, 59, 59, 999);
                                                        if (warrantyDate > toDate) return false;
                                                    }
                                                }
                                                // Search filter
                                                if (warrantySearch) {
                                                    const search = warrantySearch.toLowerCase();

                                                    // Parse product details safetly
                                                    const productDetails = typeof warranty.product_details === 'string'
                                                        ? JSON.parse(warranty.product_details || '{}')
                                                        : warranty.product_details || {};
                                                    const rawProductName = productDetails.product || productDetails.productName || warranty.product_type || '';

                                                    // Handle specific search term mappings
                                                    if (search === 'ppf') {
                                                        if (
                                                            rawProductName.toLowerCase().includes('paint-protection') ||
                                                            rawProductName.toLowerCase().includes('paint protection film') ||
                                                            rawProductName.toLowerCase().includes('ppf') ||
                                                            warranty.product_type?.toLowerCase().includes('ppf')
                                                        ) {
                                                            return true;
                                                        }
                                                    }

                                                    return (
                                                        warranty.customer_name?.toLowerCase().includes(search) ||
                                                        warranty.customer_email?.toLowerCase().includes(search) ||
                                                        warranty.customer_phone?.includes(search) ||
                                                        warranty.uid?.toLowerCase().includes(search) ||
                                                        warranty.car_make?.toLowerCase().includes(search) ||
                                                        warranty.car_model?.toLowerCase().includes(search) ||
                                                        warranty.product_type?.toLowerCase().includes(search) ||
                                                        rawProductName.toLowerCase().includes(search)
                                                    );
                                                }
                                                return true;
                                            })
                                            .sort((a: any, b: any) => {
                                                let aVal = a[warrantySortField];
                                                let bVal = b[warrantySortField];
                                                if (warrantySortField === 'created_at') {
                                                    aVal = new Date(aVal).getTime();
                                                    bVal = new Date(bVal).getTime();
                                                } else {
                                                    aVal = (aVal || '').toString().toLowerCase();
                                                    bVal = (bVal || '').toString().toLowerCase();
                                                }
                                                if (aVal === bVal) return 0;
                                                if (warrantySortOrder === 'asc') {
                                                    return aVal > bVal ? 1 : -1;
                                                } else {
                                                    return aVal < bVal ? 1 : -1;
                                                }
                                            })
                                        }
                                        showRejectionReason={warrantyFilter === 'rejected'}
                                        showActions={warrantyFilter === 'validated' || warrantyFilter === 'pending'}
                                        processingWarranty={processingWarranty}
                                        onApprove={(id) => handleUpdateStatus(id, 'validated')}
                                        onReject={(id) => openRejectDialog(id)}
                                    />
                                )}
                            </CardContent >
                        </Card >
                    </TabsContent >

                    <TabsContent value="vendors" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Franchise Management</CardTitle>
                                        <CardDescription>Manage registered franchises and their data</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            <Search className="mr-2 h-4 w-4" />
                                            Search
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Vendor Filter Tabs */}
                                <Tabs value={vendorFilter} onValueChange={(value: any) => setVendorFilter(value)} className="mb-4">
                                    <TabsList className="grid w-full grid-cols-2 h-auto md:inline-flex md:w-auto md:h-10">
                                        <TabsTrigger value="all">All ({vendors.length})</TabsTrigger>
                                        <TabsTrigger value="approved">Approved ({approvedVendorsCount})</TabsTrigger>
                                        <TabsTrigger value="disapproved">Disapproved ({disapprovedVendorsCount})</TabsTrigger>
                                        <TabsTrigger value="pending">Pending ({pendingVendorsCount})</TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                {/* Search & Sort Controls */}
                                <div className="flex flex-wrap gap-4 mb-4">
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <input
                                                type="text"
                                                placeholder="Search by store, vendor, email, phone, city..."
                                                className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm"
                                                value={vendorSearch}
                                                onChange={(e) => setVendorSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                            value={vendorSortField}
                                            onChange={(e) => setVendorSortField(e.target.value as any)}
                                        >
                                            <option value="created_at">Sort by Date</option>
                                            <option value="store_name">Sort by Store</option>
                                            <option value="city">Sort by City</option>
                                        </select>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setVendorSortOrder(vendorSortOrder === 'asc' ? 'desc' : 'asc')}
                                        >
                                            {vendorSortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                                        </Button>
                                        {vendorSearch && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setVendorSearch('')}
                                            >
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Date Range Filter */}
                                <div className="flex flex-wrap items-center gap-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">From:</span>
                                        <input
                                            type="date"
                                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                            value={vendorDateFrom}
                                            onChange={(e) => setVendorDateFrom(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">To:</span>
                                        <input
                                            type="date"
                                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                            value={vendorDateTo}
                                            onChange={(e) => setVendorDateTo(e.target.value)}
                                        />
                                    </div>
                                    {(vendorDateFrom || vendorDateTo) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { setVendorDateFrom(''); setVendorDateTo(''); }}
                                        >
                                            Clear Dates
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="ml-auto"
                                        onClick={handleExportVendors}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export CSV
                                    </Button>
                                </div>

                                {loadingVendors ? (
                                    <div className="text-center py-8">Loading vendors...</div>
                                ) : filteredVendors.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">No vendors found.</div>
                                ) : (
                                    <>
                                        {/* Mobile View - Cards */}
                                        <div className="md:hidden space-y-4">
                                            {filteredVendors.map((vendor) => (
                                                <Card key={vendor.id} className="overflow-hidden">
                                                    <CardContent className="p-4">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <div className="font-semibold text-lg">{vendor.store_name || 'N/A'}</div>
                                                                <div className="text-sm text-muted-foreground">{vendor.contact_name}</div>
                                                            </div>
                                                            {filteredVendors.length > 0 && (
                                                                <div>
                                                                    {vendor.is_verified ? (
                                                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
                                                                    ) : vendor.verified_at ? (
                                                                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Disapproved</Badge>
                                                                    ) : (
                                                                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="grid gap-2 text-sm mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                                <span className="truncate">{vendor.store_email || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                                <span>{vendor.phone_number}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                                <span className="truncate">{vendor.city}, {vendor.state}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                                <span>{vendor.manpower_count} Manpower</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                                                            {vendorFilter === 'pending' ? (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                                                        onClick={() => handleVendorVerification(vendor.id, true)}
                                                                        disabled={processingVendor === vendor.id}
                                                                    >
                                                                        {processingVendor === vendor.id ? (
                                                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                                        ) : (
                                                                            <Check className="h-4 w-4 mr-1" />
                                                                        )}
                                                                        Approve
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        className="flex-1"
                                                                        onClick={() => {
                                                                            setSelectedVendor(vendor);
                                                                            setVendorRejectDialogOpen(true);
                                                                        }}
                                                                        disabled={processingVendor === vendor.id}
                                                                    >
                                                                        {processingVendor === vendor.id ? (
                                                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                                        ) : (
                                                                            <X className="h-4 w-4 mr-1" />
                                                                        )}
                                                                        Reject
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="flex-1"
                                                                        onClick={() => handleViewVendor(vendor.id)}
                                                                        disabled={loadingVendorDetails === vendor.id}
                                                                    >
                                                                        {loadingVendorDetails === vendor.id ? (
                                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                        ) : (
                                                                            <Eye className="h-4 w-4 mr-2" />
                                                                        )}
                                                                        {loadingVendorDetails === vendor.id ? 'Loading...' : 'View Details'}
                                                                    </Button>
                                                                    {vendorFilter === 'disapproved' && (
                                                                        <Button
                                                                            size="sm"
                                                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                                                            onClick={() => handleVendorVerification(vendor.id, true)}
                                                                            disabled={processingVendor === vendor.id}
                                                                        >
                                                                            {processingVendor === vendor.id ? (
                                                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                                            ) : (
                                                                                <Check className="h-4 w-4 mr-1" />
                                                                            )}
                                                                            Re-approve
                                                                        </Button>
                                                                    )}
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                        onClick={() => handleDeleteVendor(vendor.id)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>

                                        {/* Desktop View - Table */}
                                        <div className="hidden md:block relative w-full overflow-auto">
                                            <table className="w-full caption-bottom text-sm">
                                                <thead className="[&_tr]:border-b">
                                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                        {vendorFilter === 'pending' || vendorFilter === 'disapproved' || vendorFilter === 'all' ? (
                                                            <>
                                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">S.No</th>
                                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Store Name</th>
                                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contact Person</th>
                                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Store Email</th>
                                                                {vendorFilter === 'all' && (
                                                                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Status</th>
                                                                )}
                                                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Manpower</th>
                                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Location</th>
                                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Address</th>
                                                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">S.No</th>
                                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Store Name</th>
                                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contact Person</th>
                                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Store Email</th>
                                                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Manpower</th>
                                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Location</th>
                                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Address</th>
                                                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Approved</th>
                                                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Pending</th>
                                                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Disapproved</th>
                                                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Total</th>
                                                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                                            </>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody className="[&_tr:last-child]:border-0">
                                                    {filteredVendors.map((vendor, index) => (
                                                        <tr key={vendor.id} className="border-b transition-colors hover:bg-muted/50">
                                                            {vendorFilter === 'pending' || vendorFilter === 'disapproved' || vendorFilter === 'all' ? (
                                                                <>
                                                                    <td className="p-4 align-middle">{index + 1}</td>
                                                                    <td className="p-4 align-middle font-medium">{vendor.store_name || 'N/A'}</td>
                                                                    <td className="p-4 align-middle">
                                                                        <div>{vendor.contact_name}</div>
                                                                        <div className="text-xs text-muted-foreground">{vendor.phone_number}</div>
                                                                    </td>
                                                                    <td className="p-4 align-middle">{vendor.store_email || 'N/A'}</td>
                                                                    {vendorFilter === 'all' && (
                                                                        <td className="p-4 align-middle text-center">
                                                                            {vendor.is_verified ? (
                                                                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                                                                                    Approved
                                                                                </span>
                                                                            ) : vendor.verified_at ? (
                                                                                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                                                                                    Disapproved
                                                                                </span>
                                                                            ) : (
                                                                                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                                                                                    Pending
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                    )}
                                                                    <td className="p-4 align-middle text-center">
                                                                        <div>{vendor.manpower_count}</div>
                                                                        <div className="text-xs text-muted-foreground">{vendor.manpower_names || 'No manpower'}</div>
                                                                    </td>
                                                                    <td className="p-4 align-middle">
                                                                        <div>{vendor.city}</div>
                                                                        <div className="text-xs text-muted-foreground">{vendor.state}</div>
                                                                    </td>
                                                                    <td className="p-4 align-middle">
                                                                        <div className="max-w-[200px] truncate" title={vendor.full_address}>
                                                                            {vendor.full_address || 'N/A'}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">{vendor.pincode}</div>
                                                                    </td>
                                                                    <td className="p-4 align-middle text-right">
                                                                        <div className="flex justify-end gap-2">
                                                                            {vendorFilter === 'pending' ? (
                                                                                <>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        className="bg-green-600 hover:bg-green-700 h-8 px-2"
                                                                                        onClick={() => handleVendorVerification(vendor.id, true)}
                                                                                        disabled={processingVendor === vendor.id}
                                                                                    >
                                                                                        {processingVendor === vendor.id ? (
                                                                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                                                        ) : (
                                                                                            <Check className="h-4 w-4 mr-1" />
                                                                                        )}
                                                                                        Approve
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="destructive"
                                                                                        className="h-8 px-2"
                                                                                        onClick={() => {
                                                                                            setSelectedVendor(vendor);
                                                                                            setVendorRejectDialogOpen(true);
                                                                                        }}
                                                                                        disabled={processingVendor === vendor.id}
                                                                                    >
                                                                                        {processingVendor === vendor.id ? (
                                                                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                                                        ) : (
                                                                                            <X className="h-4 w-4 mr-1" />
                                                                                        )}
                                                                                        Reject
                                                                                    </Button>
                                                                                </>
                                                                            ) : vendorFilter === 'disapproved' ? (
                                                                                <>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        className="bg-green-600 hover:bg-green-700 h-8 px-2"
                                                                                        onClick={() => handleVendorVerification(vendor.id, true)}
                                                                                        disabled={processingVendor === vendor.id}
                                                                                    >
                                                                                        {processingVendor === vendor.id ? (
                                                                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                                                        ) : (
                                                                                            <Check className="h-4 w-4 mr-1" />
                                                                                        )}
                                                                                        Re-approve
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                                        onClick={() => handleDeleteVendor(vendor.id)}
                                                                                        title="Delete Vendor"
                                                                                    >
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                    </Button>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        onClick={() => handleViewVendor(vendor.id)}
                                                                                        title="View Details"
                                                                                        disabled={loadingVendorDetails === vendor.id}
                                                                                    >
                                                                                        {loadingVendorDetails === vendor.id ? (
                                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                                        ) : (
                                                                                            <Users className="h-4 w-4" />
                                                                                        )}
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                                        onClick={() => handleDeleteVendor(vendor.id)}
                                                                                        title="Delete Vendor"
                                                                                    >
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                    </Button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <td className="p-4 align-middle">{index + 1}</td>
                                                                    <td className="p-4 align-middle font-medium">{vendor.store_name || 'N/A'}</td>
                                                                    <td className="p-4 align-middle">
                                                                        <div>{vendor.contact_name}</div>
                                                                        <div className="text-xs text-muted-foreground">{vendor.phone_number}</div>
                                                                    </td>
                                                                    <td className="p-4 align-middle">{vendor.store_email || 'N/A'}</td>
                                                                    <td className="p-4 align-middle text-center">
                                                                        <div>{vendor.manpower_count}</div>
                                                                        <div className="text-xs text-muted-foreground">{vendor.manpower_names || 'No manpower'}</div>
                                                                    </td>
                                                                    <td className="p-4 align-middle">
                                                                        <div>{vendor.city}</div>
                                                                        <div className="text-xs text-muted-foreground">{vendor.state}</div>
                                                                    </td>
                                                                    <td className="p-4 align-middle">
                                                                        <div className="max-w-[200px] truncate" title={vendor.full_address}>
                                                                            {vendor.full_address || 'N/A'}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">{vendor.pincode}</div>
                                                                    </td>
                                                                    <td className="p-4 align-middle text-center text-green-600 font-medium">{vendor.validated_warranties}</td>
                                                                    <td className="p-4 align-middle text-center text-yellow-600 font-medium">{vendor.pending_warranties}</td>
                                                                    <td className="p-4 align-middle text-center text-red-600 font-medium">{vendor.rejected_warranties || 0}</td>
                                                                    <td className="p-4 align-middle text-center font-bold">{vendor.total_warranties}</td>
                                                                    <td className="p-4 align-middle text-right">
                                                                        <div className="flex justify-end gap-2">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => handleViewVendor(vendor.id)}
                                                                                title="View Details"
                                                                                disabled={loadingVendorDetails === vendor.id}
                                                                            >
                                                                                {loadingVendorDetails === vendor.id ? (
                                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                                ) : (
                                                                                    <Users className="h-4 w-4" />
                                                                                )}
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="destructive"
                                                                                className="h-8 px-2"
                                                                                onClick={() => {
                                                                                    setSelectedVendor(vendor);
                                                                                    setVendorRejectDialogOpen(true);
                                                                                }}
                                                                                disabled={processingVendor === vendor.id}
                                                                                title="Reject Vendor"
                                                                            >
                                                                                {processingVendor === vendor.id ? (
                                                                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                                                ) : (
                                                                                    <X className="h-4 w-4 mr-1" />
                                                                                )}
                                                                                Reject
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                                onClick={() => handleDeleteVendor(vendor.id)}
                                                                                title="Delete Vendor"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </td>
                                                                </>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="customers" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Customer Management</CardTitle>
                                        <CardDescription>
                                            View and manage all customers and their warranty registrations
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Search & Sort Controls */}
                                <div className="flex flex-wrap gap-4 mb-4">
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <input
                                                type="text"
                                                placeholder="Search by name, email, phone..."
                                                className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm"
                                                value={customerSearch}
                                                onChange={(e) => setCustomerSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                            value={customerSortField}
                                            onChange={(e) => setCustomerSortField(e.target.value as any)}
                                        >
                                            <option value="created_at">Sort by Date</option>
                                            <option value="customer_name">Sort by Name</option>
                                            <option value="warranty_count">Sort by Warranties</option>
                                        </select>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCustomerSortOrder(customerSortOrder === 'asc' ? 'desc' : 'asc')}
                                        >
                                            {customerSortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                                        </Button>
                                        {customerSearch && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setCustomerSearch('')}
                                            >
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </div>


                                {/* Date Range Filter */}
                                <div className="flex flex-wrap items-center gap-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">From:</span>
                                        <input
                                            type="date"
                                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                            value={customerDateFrom}
                                            onChange={(e) => setCustomerDateFrom(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">To:</span>
                                        <input
                                            type="date"
                                            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                            value={customerDateTo}
                                            onChange={(e) => setCustomerDateTo(e.target.value)}
                                        />
                                    </div>
                                    {(customerDateFrom || customerDateTo) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { setCustomerDateFrom(''); setCustomerDateTo(''); }}
                                        >
                                            Clear Dates
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="ml-auto"
                                        onClick={handleExportCustomers}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export CSV
                                    </Button>
                                </div>

                                {loadingCustomers ? (
                                    <div className="text-center py-8">Loading customers...</div>
                                ) : customers
                                    .filter((customer: any) => {
                                        if (!customerSearch) return true;
                                        const search = customerSearch.toLowerCase();
                                        return (
                                            customer.customer_name?.toLowerCase().includes(search) ||
                                            customer.customer_email?.toLowerCase().includes(search) ||
                                            customer.customer_phone?.includes(search)
                                        );
                                    })
                                    .sort((a: any, b: any) => {
                                        let aVal = a[customerSortField];
                                        let bVal = b[customerSortField];
                                        if (customerSortField === 'created_at') {
                                            aVal = new Date(aVal).getTime();
                                            bVal = new Date(bVal).getTime();
                                        } else if (customerSortField === 'warranty_count') {
                                            aVal = Number(aVal) || 0;
                                            bVal = Number(bVal) || 0;
                                        } else {
                                            aVal = (aVal || '').toString().toLowerCase();
                                            bVal = (bVal || '').toString().toLowerCase();
                                        }
                                        return customerSortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
                                    }).length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">No customers found.</div>
                                ) : (
                                    <>
                                        {/* Mobile View - Cards */}
                                        <div className="md:hidden space-y-4">
                                            {customers
                                                .filter((customer: any) => {
                                                    if (!customerSearch) return true;
                                                    const search = customerSearch.toLowerCase();
                                                    return (
                                                        customer.customer_name?.toLowerCase().includes(search) ||
                                                        customer.customer_email?.toLowerCase().includes(search) ||
                                                        customer.customer_phone?.includes(search)
                                                    );
                                                })
                                                .sort((a: any, b: any) => {
                                                    let aVal = a[customerSortField];
                                                    let bVal = b[customerSortField];
                                                    if (customerSortField === 'created_at') {
                                                        aVal = new Date(aVal).getTime();
                                                        bVal = new Date(bVal).getTime();
                                                    } else if (customerSortField === 'warranty_count') {
                                                        aVal = Number(aVal) || 0;
                                                        bVal = Number(bVal) || 0;
                                                    } else {
                                                        aVal = (aVal || '').toString().toLowerCase();
                                                        bVal = (bVal || '').toString().toLowerCase();
                                                    }
                                                    return customerSortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
                                                })
                                                .map((customer: any) => (
                                                    <Card key={customer.customer_email} className="overflow-hidden">
                                                        <CardContent className="p-4">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div>
                                                                    <div className="font-semibold text-lg">{customer.customer_name}</div>
                                                                    <div className="text-sm text-muted-foreground">{customer.customer_email}</div>
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {customer.first_warranty_date ? formatToIST(customer.first_warranty_date) : 'N/A'}
                                                                </div>
                                                            </div>

                                                            <div className="grid gap-2 text-sm mb-4">
                                                                <div className="flex items-center gap-2">
                                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                                    <span>{customer.customer_phone}</span>
                                                                </div>

                                                            </div>

                                                            {/* Stats Grid */}
                                                            <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                                                                <div className="bg-green-50 p-1 rounded">
                                                                    <div className="font-bold text-green-700">{customer.validated_warranties || 0}</div>
                                                                    <div className="text-[10px] text-green-800">Appr</div>
                                                                </div>
                                                                <div className="bg-red-50 p-1 rounded">
                                                                    <div className="font-bold text-red-700">{customer.rejected_warranties || 0}</div>
                                                                    <div className="text-[10px] text-red-800">Rej</div>
                                                                </div>
                                                                <div className="bg-yellow-50 p-1 rounded">
                                                                    <div className="font-bold text-yellow-700">{customer.pending_warranties || 0}</div>
                                                                    <div className="text-[10px] text-yellow-800">Pend</div>
                                                                </div>
                                                                <div className="bg-blue-50 p-1 rounded">
                                                                    <div className="font-bold text-blue-700">{customer.total_warranties || 0}</div>
                                                                    <div className="text-[10px] text-blue-800">Tot</div>
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="flex-1"
                                                                    onClick={() => handleViewCustomer(customer.customer_email)}
                                                                    disabled={loadingCustomerDetails === customer.customer_email}
                                                                >
                                                                    {loadingCustomerDetails === customer.customer_email ? (
                                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                    ) : (
                                                                        <Eye className="h-4 w-4 mr-2" />
                                                                    )}
                                                                    {loadingCustomerDetails === customer.customer_email ? 'Loading...' : 'View'}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    className="flex-1"
                                                                    onClick={() => handleDeleteCustomer(customer.customer_email)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                        </div>
                                        <div className="hidden md:block relative w-full overflow-auto">
                                            <table className="w-full caption-bottom text-sm">
                                                <thead className="[&_tr]:border-b">
                                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">S.No</th>
                                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer Name</th>
                                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Phone</th>

                                                        <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Approved</th>
                                                        <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Disapproved</th>
                                                        <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Pending</th>
                                                        <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Total</th>
                                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Registered</th>
                                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="[&_tr:last-child]:border-0">
                                                    {customers
                                                        .filter((customer: any) => {
                                                            if (!customerSearch) return true;
                                                            const search = customerSearch.toLowerCase();
                                                            return (
                                                                customer.customer_name?.toLowerCase().includes(search) ||
                                                                customer.customer_email?.toLowerCase().includes(search) ||
                                                                customer.customer_phone?.includes(search)
                                                            );
                                                        })
                                                        .sort((a: any, b: any) => {
                                                            let aVal = a[customerSortField];
                                                            let bVal = b[customerSortField];
                                                            if (customerSortField === 'created_at') {
                                                                aVal = new Date(aVal).getTime();
                                                                bVal = new Date(bVal).getTime();
                                                            } else if (customerSortField === 'warranty_count') {
                                                                aVal = Number(aVal) || 0;
                                                                bVal = Number(bVal) || 0;
                                                            } else {
                                                                aVal = (aVal || '').toString().toLowerCase();
                                                                bVal = (bVal || '').toString().toLowerCase();
                                                            }
                                                            return customerSortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
                                                        })
                                                        .map((customer: any, index: number) => (
                                                            <tr key={customer.customer_email} className="border-b transition-colors hover:bg-muted/50">
                                                                <td className="p-4 align-middle font-medium">{index + 1}</td>
                                                                <td className="p-4 align-middle">{customer.customer_name}</td>
                                                                <td className="p-4 align-middle">
                                                                    <div className="text-sm">{customer.customer_email}</div>
                                                                </td>
                                                                <td className="p-4 align-middle">{customer.customer_phone}</td>

                                                                <td className="p-4 align-middle text-center">
                                                                    <span className="inline-flex items-center justify-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                                                                        {customer.validated_warranties || 0}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4 align-middle text-center">
                                                                    <span className="inline-flex items-center justify-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                                                                        {customer.rejected_warranties || 0}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4 align-middle text-center">
                                                                    <span className="inline-flex items-center justify-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                                                                        {customer.pending_warranties || 0}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4 align-middle text-center">
                                                                    <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                                                                        {customer.total_warranties || 0}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4 align-middle">
                                                                    <div className="text-sm">
                                                                        {customer.first_warranty_date ? formatToIST(customer.first_warranty_date) : 'N/A'}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {/* Time included above */}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 align-middle text-right">
                                                                    <div className="flex justify-end gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => handleViewCustomer(customer.customer_email)}
                                                                            disabled={loadingCustomerDetails === customer.customer_email}
                                                                        >
                                                                            {loadingCustomerDetails === customer.customer_email ? (
                                                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                                            ) : null}
                                                                            {loadingCustomerDetails === customer.customer_email ? 'Loading...' : 'View'}
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="destructive"
                                                                            onClick={() => handleDeleteCustomer(customer.customer_email)}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Admin Management Tab */}
                    <TabsContent value="admins" className="space-y-4">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Add New Admin Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Add New Administrator</CardTitle>
                                    <CardDescription>
                                        Invite a new administrator to the system. They will receive an email with login instructions.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Full Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 rounded-md border border-input bg-background"
                                            placeholder="John Doe"
                                            value={newAdminForm.name}
                                            onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email Address</label>
                                        <input
                                            type="email"
                                            className="w-full p-2 rounded-md border border-input bg-background"
                                            placeholder="admin@example.com"
                                            value={newAdminForm.email}
                                            onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Phone Number</label>
                                        <input
                                            type="tel"
                                            className="w-full p-2 rounded-md border border-input bg-background"
                                            placeholder="9876543210"
                                            value={newAdminForm.phone}
                                            onChange={(e) => setNewAdminForm({ ...newAdminForm, phone: e.target.value })}
                                        />
                                    </div>
                                    <Button
                                        className="w-full mt-4"
                                        onClick={handleCreateAdmin}
                                        disabled={addingAdmin}
                                    >
                                        {addingAdmin ? 'Sending Invitation...' : 'Send Invitation'}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Existing Admins List Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Current Administrators</CardTitle>
                                    <CardDescription>
                                        List of all administrators with access to this portal
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loadingAdmins ? (
                                        <div className="text-center py-8">Loading admins...</div>
                                    ) : admins.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">No admins found.</div>
                                    ) : (
                                        <div className="space-y-4">
                                            {admins.map((admin: any, index: number) => (
                                                <div key={admin.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border bg-card gap-4 md:gap-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                                                            {admin.name?.charAt(0)?.toUpperCase() || 'A'}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{admin.name}</p>
                                                            <p className="text-sm text-muted-foreground">{admin.email}</p>
                                                            <p className="text-xs text-muted-foreground">{admin.phone_number}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                                        Active
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="mt-4">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                    <AlertCircle className="h-5 w-5 mt-0.5 text-yellow-600" />
                                    <div>
                                        <p className="font-medium text-foreground">Admin Policy</p>
                                        <p>Administrators cannot be edited or deleted by other administrators. Only new admins can be added. Contact the system owner for admin account modifications.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Activity Logs Tab */}
                    <TabsContent value="activity-logs" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Activity Logs</CardTitle>
                                <CardDescription>
                                    Track all administrative actions performed in the system
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingLogs ? (
                                    <div className="text-center py-8">Loading activity logs...</div>
                                ) : activityLogs.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">No activity logs found.</div>
                                ) : (
                                    <>
                                        <div className="md:hidden space-y-4">
                                            {activityLogs.map((log: any) => (
                                                <Card key={log.id} className="overflow-hidden">
                                                    <CardContent className="p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="text-sm font-semibold">{log.admin_name || 'Unknown'}</div>
                                                            <div className="text-xs text-muted-foreground">{formatToIST(log.created_at)}</div>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mb-3">{log.admin_email}</div>

                                                        <div className="flex items-center gap-2 mb-3">
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
                                                        </div>

                                                        <div className="text-sm">
                                                            <span className="font-medium text-muted-foreground">Target: </span>
                                                            <span>{log.target_name || log.target_id || 'N/A'}</span>
                                                        </div>
                                                        <div className="text-sm mt-1">
                                                            <span className="font-medium text-muted-foreground">Details: </span>
                                                            <span className="text-xs text-muted-foreground block mt-1 bg-muted p-2 rounded">
                                                                {log.details && typeof log.details === 'object'
                                                                    ? (log.details.rejection_reason || log.details.product_type || JSON.stringify(log.details))
                                                                    : '-'}
                                                            </span>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                        <div className="hidden md:block relative w-full overflow-auto">
                                            <table className="w-full caption-bottom text-sm">
                                                <thead className="[&_tr]:border-b">
                                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date & Time</th>
                                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Admin</th>
                                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Action</th>
                                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Target</th>
                                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Details</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="[&_tr:last-child]:border-0">
                                                    {activityLogs.map((log: any) => (
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
                                                            <td className="p-4 align-middle">
                                                                {log.details && typeof log.details === 'object' ? (
                                                                    <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                                                                        {log.details.rejection_reason || log.details.product_type || JSON.stringify(log.details)}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted-foreground">-</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="old-warranties" className="space-y-4">
                        <OldWarranties />
                    </TabsContent>

                    <TabsContent value="announcements">
                        <AdminBroadcast />
                    </TabsContent>

                </Tabs>

                {/* Rejection Dialog for Warranties Tab */}
                {
                    rejectDialogOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-background p-6 rounded-lg w-full max-w-md shadow-lg">
                                <h3 className="text-lg font-semibold mb-4">Reject Warranty</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Please provide a reason for rejecting this warranty registration.
                                </p>
                                <textarea
                                    className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Reason for rejection..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    disabled={processingWarranty === selectedWarrantyId}
                                />
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setRejectDialogOpen(false)}
                                        disabled={processingWarranty === selectedWarrantyId}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => selectedWarrantyId && handleWarrantyAction(selectedWarrantyId, 'rejected', rejectReason)}
                                        disabled={!rejectReason.trim() || processingWarranty === selectedWarrantyId}
                                    >
                                        {processingWarranty === selectedWarrantyId ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Rejecting...</>
                                        ) : (
                                            'Reject Warranty'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )
                }
                {/* Rejection Dialog for Vendors Tab */}
                {
                    vendorRejectDialogOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-background p-6 rounded-lg w-full max-w-md shadow-lg">
                                <h3 className="text-lg font-semibold mb-4">Reject Vendor Application</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Please provide a reason for rejecting this vendor application. This will be sent to the vendor via email.
                                </p>
                                <textarea
                                    className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Reason for rejection..."
                                    value={vendorRejectReason}
                                    onChange={(e) => setVendorRejectReason(e.target.value)}
                                    disabled={processingVendor === selectedVendor?.id}
                                />
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setVendorRejectDialogOpen(false)}
                                        disabled={processingVendor === selectedVendor?.id}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => selectedVendor && handleVendorVerification(selectedVendor.id, false, vendorRejectReason)}
                                        disabled={!vendorRejectReason.trim() || processingVendor === selectedVendor?.id}
                                    >
                                        {processingVendor === selectedVendor?.id ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Rejecting...</>
                                        ) : (
                                            'Reject Application'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Manpower Warranty Details Dialog */}
                <Dialog open={manpowerWarrantyDialogOpen} onOpenChange={setManpowerWarrantyDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {manpowerWarrantyDialogData.member?.name} - {manpowerWarrantyDialogData.status === 'validated' ? 'Approved' : manpowerWarrantyDialogData.status === 'rejected' ? 'Disapproved' : 'Pending'} Warranties
                            </DialogTitle>
                            <DialogDescription>
                                {manpowerWarrantyDialogData.warranties.length} warranty registrations
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 space-y-3">
                            {manpowerWarrantyDialogData.warranties.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground">No warranties found</p>
                            ) : (
                                manpowerWarrantyDialogData.warranties.map((w: any, index: number) => {
                                    const pd = typeof w.product_details === 'string' ? JSON.parse(w.product_details) : w.product_details || {};
                                    const productNameMapping: Record<string, string> = {
                                        'paint-protection': 'PPF',
                                        'sun-protection': 'Tint',
                                        'seat-cover': 'Seat Cover',
                                        'ev-products': 'EV Product'
                                    };
                                    return (
                                        <div key={w.id || index} className="p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-medium">{w.customer_name}</p>
                                                    <p className="text-xs text-muted-foreground">{w.customer_phone}</p>
                                                </div>
                                                <Badge variant={
                                                    w.status === 'validated' ? 'default' :
                                                        w.status === 'rejected' ? 'destructive' : 'secondary'
                                                } className={w.status === 'validated' ? 'bg-green-600' : ''}>
                                                    {productNameMapping[w.product_type] || w.product_type}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Vehicle</p>
                                                    <p>{w.car_make} {w.car_model}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Product</p>
                                                    <p>{pd.productName || pd.product || w.product_type}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">UID/Lot</p>
                                                    <p className="font-mono text-xs">{w.uid || pd.lotNumber || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Registered</p>
                                                    <p>{formatToIST(w.created_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </main >
        </div >
    );
};

export default AdminDashboard;
