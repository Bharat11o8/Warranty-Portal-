import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";

export const AdminAdmins = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    const [admins, setAdmins] = useState<any[]>([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [addingAdmin, setAddingAdmin] = useState(false);
    const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '', phone: '' });

    useEffect(() => {
        fetchAdmins();
    }, []);

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

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Add New Admin Card */}
                <Card className="border-orange-100 shadow-sm">
                    <CardHeader className="bg-orange-50/30 border-b border-orange-50 pb-4">
                        <CardTitle className="text-lg font-bold text-slate-800">Add New Administrator</CardTitle>
                        <CardDescription>
                            Invite a new administrator to the system. They will receive an email with login instructions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Full Name</label>
                            <input
                                type="text"
                                className="w-full p-2.5 rounded-md border border-input bg-background focus:ring-1 focus:ring-orange-200 focus:border-orange-200 transition-colors"
                                placeholder="John Doe"
                                value={newAdminForm.name}
                                onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Email Address</label>
                            <input
                                type="email"
                                className="w-full p-2.5 rounded-md border border-input bg-background focus:ring-1 focus:ring-orange-200 focus:border-orange-200 transition-colors"
                                placeholder="admin@example.com"
                                value={newAdminForm.email}
                                onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Phone Number</label>
                            <input
                                type="tel"
                                className="w-full p-2.5 rounded-md border border-input bg-background focus:ring-1 focus:ring-orange-200 focus:border-orange-200 transition-colors"
                                placeholder="9876543210"
                                value={newAdminForm.phone}
                                onChange={(e) => setNewAdminForm({ ...newAdminForm, phone: e.target.value })}
                            />
                        </div>
                        <Button
                            className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={handleCreateAdmin}
                            disabled={addingAdmin}
                        >
                            {addingAdmin ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending Invitation...
                                </>
                            ) : 'Send Invitation'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Existing Admins List Card */}
                <Card className="border-orange-100 shadow-sm h-fit">
                    <CardHeader className="bg-orange-50/30 border-b border-orange-50 pb-4">
                        <CardTitle className="text-lg font-bold text-slate-800">Current Administrators</CardTitle>
                        <CardDescription>
                            List of all administrators with access to this portal
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {loadingAdmins ? (
                            <div className="text-center py-8">
                                <Loader2 className="h-8 w-8 text-orange-400 animate-spin mx-auto mb-2" />
                                <p className="text-sm text-slate-500">Loading admins...</p>
                            </div>
                        ) : admins.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No admins found.</div>
                        ) : (
                            <div className="space-y-3">
                                {admins.map((admin: any) => (
                                    <div key={admin.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-orange-100 text-orange-600 font-bold shadow-sm">
                                                {admin.name?.charAt(0)?.toUpperCase() || 'A'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-slate-800">{admin.name}</p>
                                                <p className="text-xs text-slate-500">{admin.email}</p>
                                                <p className="text-[10px] text-slate-400">{admin.phone_number}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            Active
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-amber-50/50 border-amber-100">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4 text-sm text-amber-900/80">
                        <AlertCircle className="h-5 w-5 mt-0.5 text-amber-600 shrink-0" />
                        <div>
                            <p className="font-bold text-amber-900 mb-1">Admin Policy</p>
                            <p>Administrators cannot be edited or deleted by other administrators directly. Only new admins can be added here. Contact the system owner for sensitive account modifications or revocations.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
