import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Shield, Store, UserCircle, Mail, Phone, User, Trash2, Plus, Users } from "lucide-react";
import api from "@/lib/api";

const Profile = () => {
    const { user, loading, refreshUser } = useAuth();
    const { toast } = useToast();
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
    const [saving, setSaving] = useState(false);

    // Manpower state
    const [manpowerList, setManpowerList] = useState<any[]>([]);
    const [loadingManpower, setLoadingManpower] = useState(false);
    const [newManpowerName, setNewManpowerName] = useState("");
    const [newManpowerPhone, setNewManpowerPhone] = useState("");
    const [newManpowerType, setNewManpowerType] = useState("seat_cover");
    const [newManpowerId, setNewManpowerId] = useState("");
    const [addingManpower, setAddingManpower] = useState(false);

    // Fetch manpower if vendor
    useEffect(() => {
        if (user?.role === "vendor") {
            fetchManpower();
        }
    }, [user]);

    // Auto-generate Manpower ID when name or phone changes
    useEffect(() => {
        const namePart = newManpowerName.slice(0, 3).toUpperCase();
        const phonePart = newManpowerPhone.slice(-4);
        setNewManpowerId((namePart && phonePart) ? `${namePart}${phonePart}` : "");
    }, [newManpowerName, newManpowerPhone]);

    async function fetchManpower() {
        setLoadingManpower(true);
        try {
            const response = await api.get("/vendor/manpower");
            if (response.data.success) {
                setManpowerList(response.data.manpower);
            }
        } catch (error) {
            console.error("Failed to fetch manpower", error);
        } finally {
            setLoadingManpower(false);
        }
    }

    const handleAddManpower = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddingManpower(true);
        try {
            const response = await api.post("/vendor/manpower", {
                name: newManpowerName,
                phoneNumber: newManpowerPhone,
                applicatorType: newManpowerType
            });

            if (response.data.success) {
                toast({
                    title: "Manpower Added",
                    description: "New team member added successfully.",
                });
                setManpowerList([...manpowerList, response.data.manpower]);
                setNewManpowerName("");
                setNewManpowerPhone("");
                setNewManpowerType("seat_cover");
                setNewManpowerId("");
            }
        } catch (error: any) {
            toast({
                title: "Failed to Add",
                description: error.response?.data?.error || "Could not add manpower",
                variant: "destructive",
            });
        } finally {
            setAddingManpower(false);
        }
    };

    const handleDeleteManpower = async (id: string) => {
        try {
            const response = await api.delete(`/vendor/manpower/${id}`);
            if (response.data.success) {
                toast({
                    title: "Manpower Removed",
                    description: "Team member removed successfully.",
                });
                setManpowerList(manpowerList.filter(m => m.id !== id));
            }
        } catch (error: any) {
            toast({
                title: "Failed to Remove",
                description: error.response?.data?.error || "Could not remove manpower",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const getRoleConfig = () => {
        switch (user.role) {
            case "admin":
                return {
                    icon: Shield,
                    label: "Administrator",
                    badgeVariant: "default" as const,
                    color: "from-accent/20 to-accent/10",
                };
            case "vendor":
                return {
                    icon: Store,
                    label: "Franchise",
                    badgeVariant: "secondary" as const,
                    color: "from-secondary/20 to-secondary/10",
                };
            default:
                return {
                    icon: UserCircle,
                    label: "Customer",
                    badgeVariant: "outline" as const,
                    color: "from-primary/20 to-primary/10",
                };
        }
    };

    const roleConfig = getRoleConfig();
    const RoleIcon = roleConfig.icon;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await api.put("/auth/profile", {
                name,
                email,
                phoneNumber,
            });

            if (response.data.success) {
                toast({
                    title: "Profile Updated",
                    description: "Your profile has been updated successfully.",
                });
                await refreshUser();
            }
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.response?.data?.error || error.message || "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            <Header />

            <main className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${roleConfig.color} flex items-center justify-center`}>
                                    <RoleIcon className="h-8 w-8 text-foreground" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">Edit Profile</CardTitle>
                                    <CardDescription>Update your personal information</CardDescription>
                                </div>
                            </div>
                            <Badge variant={roleConfig.badgeVariant} className="w-fit">
                                <RoleIcon className="mr-1 h-3 w-3" />
                                {roleConfig.label}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSave} className="space-y-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="pl-11 h-12"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="pl-11 h-12"
                                        />
                                    </div>
                                </div>

                                {/* Phone Number */}
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            required
                                            className="pl-11 h-12"
                                        />
                                    </div>
                                </div>

                                {/* Role (Read-only) */}
                                {user.role === 'admin' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Account Role</Label>
                                        <div className="relative">
                                            <RoleIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="role"
                                                type="text"
                                                value={roleConfig.label}
                                                disabled
                                                className="pl-11 h-12 bg-muted cursor-not-allowed"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Role is managed by administrators and cannot be changed
                                        </p>
                                    </div>
                                )}

                                <Button type="submit" className="w-full h-12" disabled={saving}>
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Manpower Management Section (Vendor Only) */}
                    {user.role === "vendor" && (
                        <Card className="mt-8">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center">
                                        <Users className="h-6 w-6 text-secondary-foreground" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Manpower Management</CardTitle>
                                        <CardDescription>Manage your team members and applicators</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {/* Add New Manpower Form */}
                                    <form onSubmit={handleAddManpower} className="p-4 border rounded-lg bg-muted/30 space-y-4">
                                        <h3 className="font-medium text-sm">Add New Team Member</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <Input
                                                placeholder="Name"
                                                value={newManpowerName}
                                                onChange={(e) => setNewManpowerName(e.target.value)}
                                                required
                                            />
                                            <Input
                                                placeholder="Phone Number"
                                                value={newManpowerPhone}
                                                onChange={(e) => setNewManpowerPhone(e.target.value)}
                                                required
                                            />
                                            <Input
                                                placeholder="Manpower ID"
                                                value={newManpowerId}
                                                readOnly
                                                className="bg-muted font-mono text-sm"
                                            />
                                            <div className="flex gap-2">
                                                <select
                                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={newManpowerType}
                                                    onChange={(e) => setNewManpowerType(e.target.value)}
                                                >
                                                    <option value="seat_cover">Seat Cover Applicator</option>
                                                    <option value="ppf_spf">PPF/SPF Applicator</option>
                                                    <option value="ev">EV Applicator</option>
                                                </select>
                                                <Button type="submit" size="icon" disabled={addingManpower}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </form>

                                    {/* Manpower List */}
                                    <div className="space-y-4">
                                        <h3 className="font-medium text-sm">Current Team ({manpowerList.length})</h3>
                                        {loadingManpower ? (
                                            <div className="text-center py-4 text-muted-foreground">Loading...</div>
                                        ) : manpowerList.length === 0 ? (
                                            <div className="text-center py-8 border rounded-lg border-dashed text-muted-foreground">
                                                No team members added yet.
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {manpowerList.map((member) => (
                                                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <User className="h-5 w-5 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{member.name}</p>
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <span>{member.phone_number}</span>
                                                                    <span>•</span>
                                                                    <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{member.manpower_id}</span>
                                                                    <span>•</span>
                                                                    <Badge variant="outline" className="text-xs capitalize">
                                                                        {member.applicator_type?.replace('_', ' ')} Applicator
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleDeleteManpower(member.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Profile;
