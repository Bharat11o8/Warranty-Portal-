import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, Crown, Edit2, Loader2, Plus, Shield, Trash2, UserCheck, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { AdminPermissionMatrix, DEFAULT_PERMISSIONS, ModulePermissions } from "./AdminPermissionMatrix";
import { cn } from "@/lib/utils";

interface AdminUser {
    id: string;
    name: string;
    email: string;
    phone_number: string;
    created_at: string;
    is_super_admin: boolean;
    permissions: ModulePermissions;
}

const countPermissions = (perms: ModulePermissions) => {
    let readCount = 0, writeCount = 0, total = 0;
    Object.values(perms).forEach(p => {
        total++;
        if (p.read) readCount++;
        if (p.write) writeCount++;
    });
    return { readCount, writeCount, total };
};

export const AdminAdmins = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(false);

    // Add Admin form
    const [showAddForm, setShowAddForm] = useState(false);
    const [addingAdmin, setAddingAdmin] = useState(false);
    const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '', phone: '' });
    const [newAdminPerms, setNewAdminPerms] = useState<ModulePermissions>({ ...DEFAULT_PERMISSIONS });

    // Edit permissions dialog
    const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
    const [editPerms, setEditPerms] = useState<ModulePermissions>({});
    const [savingPerms, setSavingPerms] = useState(false);

    // Delete dialog
    const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Expand permission preview
    const [expandedAdmin, setExpandedAdmin] = useState<string | null>(null);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const response = await api.get("/admin/admins");
            if (response.data.success) {
                setAdmins(response.data.admins);
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch admin list", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async () => {
        if (!newAdminForm.name || !newAdminForm.email || !newAdminForm.phone) {
            toast({ title: "Validation Error", description: "Please fill in all fields", variant: "destructive" });
            return;
        }

        setAddingAdmin(true);
        try {
            const response = await api.post("/admin/admins", {
                ...newAdminForm,
                permissions: newAdminPerms
            });
            if (response.data.success) {
                toast({ title: "Admin Created", description: "Invitation email sent successfully" });
                setNewAdminForm({ name: '', email: '', phone: '' });
                setNewAdminPerms({ ...DEFAULT_PERMISSIONS });
                setShowAddForm(false);
                fetchAdmins();
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.error || "Failed to create admin", variant: "destructive" });
        } finally {
            setAddingAdmin(false);
        }
    };

    const openEditDialog = (admin: AdminUser) => {
        setEditTarget(admin);
        setEditPerms({ ...admin.permissions });
    };

    const handleSavePermissions = async () => {
        if (!editTarget) return;
        setSavingPerms(true);
        try {
            const response = await api.patch(`/admin/admins/${editTarget.id}/permissions`, {
                permissions: editPerms
            });
            if (response.data.success) {
                toast({ title: "Permissions Updated", description: `${editTarget.name}'s access has been updated` });
                setEditTarget(null);
                fetchAdmins();
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.error || "Failed to update permissions", variant: "destructive" });
        } finally {
            setSavingPerms(false);
        }
    };

    const handleDeleteAdmin = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const response = await api.delete(`/admin/admins/${deleteTarget.id}`);
            if (response.data.success) {
                toast({ title: "Admin Removed", description: `${deleteTarget.name}'s account has been removed` });
                setDeleteTarget(null);
                fetchAdmins();
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.error || "Failed to remove admin", variant: "destructive" });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">

            {/* Header Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Access Control</h2>
                        <p className="text-[10px] text-slate-400 font-medium">Manage admin accounts and module permissions</p>
                    </div>
                </div>
                <Button
                    id="add-admin-btn"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-2 text-xs font-bold h-9 px-4"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add Admin
                </Button>
            </div>

            {/* Add Admin Form (collapsible) */}
            {showAddForm && (
                <Card className="border-orange-200 shadow-sm ring-1 ring-orange-100">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 pb-4 rounded-t-lg">
                        <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                            <Plus className="h-4 w-4 text-orange-500" />
                            Invite New Administrator
                        </CardTitle>
                        <CardDescription>
                            Set contact details and configure module access before sending the invitation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {/* Contact Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Full Name', key: 'name', type: 'text', placeholder: 'John Doe' },
                                { label: 'Email Address', key: 'email', type: 'email', placeholder: 'admin@example.com' },
                                { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '9876543210' },
                            ].map(field => (
                                <div key={field.key} className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">{field.label}</label>
                                    <input
                                        id={`new-admin-${field.key}`}
                                        type={field.type}
                                        className="w-full p-2.5 rounded-xl border border-input bg-background text-sm focus:ring-1 focus:ring-orange-200 focus:border-orange-300 transition-colors"
                                        placeholder={field.placeholder}
                                        value={(newAdminForm as any)[field.key]}
                                        onChange={e => setNewAdminForm({ ...newAdminForm, [field.key]: e.target.value })}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Permission Matrix */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="h-px flex-1 bg-slate-100" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Module Access</span>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>
                            <AdminPermissionMatrix
                                value={newAdminPerms}
                                onChange={setNewAdminPerms}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                id="send-invitation-btn"
                                onClick={handleCreateAdmin}
                                disabled={addingAdmin}
                                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold"
                            >
                                {addingAdmin ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending Invitation...</>
                                ) : (
                                    <><UserCheck className="mr-2 h-4 w-4" />Send Invitation</>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowAddForm(false)}
                                className="rounded-xl border-slate-200 text-slate-600 font-bold"
                            >
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Admin List */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 text-orange-400 animate-spin" />
                </div>
            ) : (
                <div className="space-y-3">
                    {admins.map((admin) => {
                        const { readCount, writeCount, total } = countPermissions(admin.permissions || {});
                        const isExpanded = expandedAdmin === admin.id;

                        return (
                            <Card
                                key={admin.id}
                                className={cn(
                                    "border transition-all duration-200",
                                    admin.is_super_admin
                                        ? "border-orange-200 bg-gradient-to-r from-orange-50/50 to-amber-50/30"
                                        : "border-slate-100 hover:border-slate-200 bg-white"
                                )}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className={cn(
                                            "flex items-center justify-center w-11 h-11 rounded-2xl shrink-0 text-sm font-black border",
                                            admin.is_super_admin
                                                ? "bg-orange-100 text-orange-700 border-orange-200"
                                                : "bg-slate-100 text-slate-600 border-slate-200"
                                        )}>
                                            {admin.name?.charAt(0)?.toUpperCase() || 'A'}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-black text-sm text-slate-800">{admin.name}</p>
                                                {admin.is_super_admin && (
                                                    <Badge className="bg-orange-500 text-white border-0 text-[9px] px-2 py-0 h-4 gap-1 font-black">
                                                        <Crown className="h-2.5 w-2.5" />
                                                        SUPER ADMIN
                                                    </Badge>
                                                )}
                                                {admin.id === user?.id && (
                                                    <Badge variant="outline" className="text-[9px] px-2 py-0 h-4 bg-slate-50 text-slate-500 border-slate-200 font-bold">
                                                        YOU
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 truncate">{admin.email}</p>
                                            <p className="text-[10px] text-slate-400">{admin.phone_number}</p>
                                        </div>

                                        {/* Permission Summary */}
                                        {!admin.is_super_admin && (
                                            <div className="hidden md:flex items-center gap-3 shrink-0">
                                                <div className="text-right">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                                                        <span className="text-[10px] font-bold text-slate-500">Read: {readCount}/{total}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                                                        <span className="text-[10px] font-bold text-slate-500">Write: {writeCount}/{total}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-0.5 w-16">
                                                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-blue-400 transition-all"
                                                            style={{ width: `${(readCount / total) * 100}%` }}
                                                        />
                                                    </div>
                                                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-orange-400 transition-all"
                                                            style={{ width: `${(writeCount / total) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {admin.is_super_admin && (
                                            <div className="hidden md:flex items-center gap-1.5 text-orange-500 shrink-0">
                                                <CheckCircle2 className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-wide">Full Access</span>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {!admin.is_super_admin && (
                                                <>
                                                    <button
                                                        id={`expand-perms-${admin.id}`}
                                                        onClick={() => setExpandedAdmin(isExpanded ? null : admin.id)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                                        title="View permissions"
                                                    >
                                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </button>
                                                    <button
                                                        id={`edit-admin-${admin.id}`}
                                                        onClick={() => openEditDialog(admin)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                                                        title="Edit permissions"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    {admin.id !== user?.id && (
                                                        <button
                                                            id={`delete-admin-${admin.id}`}
                                                            onClick={() => setDeleteTarget(admin)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                            title="Remove admin"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Permission Preview */}
                                    {isExpanded && !admin.is_super_admin && (
                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <AdminPermissionMatrix
                                                value={admin.permissions || {}}
                                                onChange={() => {}}
                                                disabled={true}
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Edit Permissions Dialog */}
            <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-800">
                            <Edit2 className="h-4 w-4 text-orange-500" />
                            Edit Permissions — {editTarget?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Configure which modules <strong>{editTarget?.name}</strong> can read or write.
                            Write access automatically grants read access.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        <AdminPermissionMatrix
                            value={editPerms}
                            onChange={setEditPerms}
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setEditTarget(null)}
                            className="rounded-xl border-slate-200 font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            id="save-permissions-btn"
                            onClick={handleSavePermissions}
                            disabled={savingPerms}
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold"
                        >
                            {savingPerms ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                            ) : (
                                'Save Permissions'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-800">Remove Admin Account?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}) from the admin panel.
                            They will lose all access immediately. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            id="confirm-delete-admin-btn"
                            onClick={handleDeleteAdmin}
                            disabled={deleting}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold"
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove Admin"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Policy Note */}
            <Card className="bg-amber-50/50 border-amber-100">
                <CardContent className="pt-5 pb-4">
                    <div className="flex items-start gap-3 text-sm text-amber-900/80">
                        <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
                        <div className="text-xs">
                            <p className="font-black text-amber-900 mb-1">Access Control Policy</p>
                            <p className="text-amber-800/70 leading-relaxed">
                                The Super Admin account cannot be edited or deleted. Permissions for regular admins take effect on their next login session.
                                Use <strong>Read</strong> to grant view-only access and <strong>Write</strong> to allow create, edit, and delete actions within a module.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
