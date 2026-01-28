import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Shield, Store, UserCircle, Mail, Phone, User, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const Profile = ({ embedded }: { embedded?: boolean }) => {
    const { user, loading, refreshUser } = useAuth();
    const { toast } = useToast();
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
    const [saving, setSaving] = useState(false);


    if (loading) {
        return <div className="p-8 text-center text-slate-500 font-bold">Loading...</div>;
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
                    label: "Verified Customer",
                    badgeVariant: "outline" as const,
                    color: "from-orange-500/20 to-orange-500/10",
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
        <div className={cn("max-w-[1600px] mx-auto", !embedded && "py-6 px-4 md:px-8")}>
            {/* Header Section - Only show if not embedded */}
            {!embedded && (
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
                    <div>
                        <Link to="/dashboard/customer" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-orange-600 transition-colors mb-4">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">
                            My <span className="text-orange-600">Profile</span>
                        </h1>
                        <p className="text-slate-400 text-lg font-bold mt-2">Update your personal information</p>
                    </div>
                </div>
            )}

            <main className={cn("mx-auto", embedded ? "w-full" : "max-w-2xl")}>
                <Card className="rounded-[32px] border-orange-100 shadow-xl shadow-orange-500/5 overflow-hidden">
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
                                        className="pl-11 h-12 rounded-xl"
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
                                        className="pl-11 h-12 rounded-xl"
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
                                        className="pl-11 h-12 rounded-xl"
                                    />
                                </div>
                            </div>

                            {/* Role (Read-only for Admin) */}
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
                                            className="pl-11 h-12 bg-muted cursor-not-allowed rounded-xl"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Role is managed by administrators and cannot be changed
                                    </p>
                                </div>
                            )}

                            <Button type="submit" className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 font-bold" disabled={saving}>
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

            </main>
        </div>
    );
};

export default Profile;
