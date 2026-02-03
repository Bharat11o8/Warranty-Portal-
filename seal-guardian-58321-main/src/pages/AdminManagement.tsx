import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft } from "lucide-react";
import api from "@/lib/api";

const AdminManagement = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [admins, setAdmins] = useState<any[]>([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [addingAdmin, setAddingAdmin] = useState(false);
    const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '', phone: '' });

    useEffect(() => {
        if (user?.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchAdmins();
    }, [user]);

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

    if (user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            <Header />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold">Admin Management</h1>
                    <p className="text-muted-foreground">Manage administrator accounts</p>
                </div>

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
                                    onChange={(e) => {
                                        const textOnly = e.target.value.replace(/[^A-Za-z\s]/g, '');
                                        setNewAdminForm({ ...newAdminForm, name: textOnly });
                                    }}
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
                                    maxLength={10}
                                    value={newAdminForm.phone}
                                    onChange={(e) => {
                                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setNewAdminForm({ ...newAdminForm, phone: digitsOnly });
                                    }}
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
                                    {admins.map((admin: any) => (
                                        <div key={admin.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
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

                <Card className="mt-6">
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
            </main>
        </div>
    );
};

export default AdminManagement;
