import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
    Users,
    UserPlus,
    Phone,
    Briefcase,
    Trash2,
    Edit2,
    CheckCircle,
    Search,
    Plus,
    X,
    Check,
    Loader2,
    History,
    LayoutGrid,
    List
} from "lucide-react";

interface ManpowerManagementProps {
    manpowerList: any[];
    pastManpowerList: any[];
    onAdd: (data: any) => Promise<boolean>;
    onEdit: (id: string, data: any) => Promise<boolean>;
    onDelete: (id: string) => void;
    onShowWarranties: (member: any, status: 'validated' | 'pending' | 'rejected') => void;
    editingId: string | null;
    setEditingId: (id: string | null) => void;
}

export const StaffManagement = ({
    manpowerList,
    pastManpowerList,
    onAdd,
    onEdit,
    onDelete,
    onShowWarranties,
    editingId,
    setEditingId
}: ManpowerManagementProps) => {
    const [newMember, setNewMember] = useState({ name: '', phone: '', type: 'seat_cover', id: '' });
    const [editMember, setEditMember] = useState({ name: '', phone: '', type: 'seat_cover' });
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewType, setViewType] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        if (newMember.name && newMember.phone) {
            const namePart = newMember.name.slice(0, 3).toUpperCase();
            const phonePart = newMember.phone.slice(-4);
            setNewMember(prev => ({ ...prev, id: `${namePart}${phonePart}` }));
        } else {
            setNewMember(prev => ({ ...prev, id: '' }));
        }
    }, [newMember.name, newMember.phone]);

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdding(true);
        const success = await onAdd(newMember);
        if (success) setNewMember({ name: '', phone: '', type: 'seat_cover', id: '' });
        setIsAdding(false);
    };

    const handleEditClick = (member: any) => {
        setEditingId(member.id);
        setEditMember({ name: member.name, phone: member.phone_number, type: member.applicator_type });
    };

    const handleSaveEdit = async (id: string) => {
        setIsSaving(true);
        await onEdit(id, editMember);
        setIsSaving(false);
    };

    const filterList = (list: any[]) => {
        if (!searchTerm) return list || [];
        const q = searchTerm.toLowerCase();
        return (list || []).filter(m =>
            (m.name && m.name.toLowerCase().includes(q)) ||
            (m.phone_number && m.phone_number.includes(q)) ||
            (m.manpower_id && m.manpower_id.toLowerCase().includes(q))
        );
    };

    const filteredCurrent = filterList(manpowerList);
    const filteredPast = filterList(pastManpowerList);

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <Tabs defaultValue="current" className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <TabsList className="bg-muted/30 p-1 rounded-full border border-border/40 h-11">
                        <TabsTrigger value="current" className="rounded-full px-6 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                            <Users className="h-4 w-4 mr-2" /> Current Team ({manpowerList?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="past" className="rounded-full px-6 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                            <History className="h-4 w-4 mr-2" /> Ex-Team ({pastManpowerList?.length || 0})
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                placeholder="Search team member..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-card border-border/40 pl-11 pr-4 py-3 rounded-full text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex bg-muted/30 p-1 rounded-full border border-border/40 h-11 shrink-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewType('grid')}
                                className={`rounded-full h-9 w-9 transition-all ${viewType === 'grid' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewType('list')}
                                className={`rounded-full h-9 w-9 transition-all ${viewType === 'list' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <TabsContent value="current" className="space-y-8 animate-in fade-in duration-500">
                    <Card className="border-border/40 shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md overflow-hidden">
                        <div className="bg-primary/5 px-6 py-4 border-b border-primary/10 flex items-center gap-3">
                            <UserPlus className="h-5 w-5 text-primary" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-primary">Onboard New Team Member</h3>
                        </div>
                        <CardContent className="p-6">
                            <form onSubmit={handleAddSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    <Input
                                        placeholder="Full Name"
                                        value={newMember.name}
                                        onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                                        className="rounded-xl h-12 border-border/40 focus-visible:ring-primary/20"
                                        required
                                    />
                                    <Input
                                        placeholder="Phone Number"
                                        value={newMember.phone}
                                        onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
                                        className="rounded-xl h-12 border-border/40 focus-visible:ring-primary/20"
                                        required
                                    />
                                    <Input
                                        placeholder="Manpower ID"
                                        value={newMember.id}
                                        readOnly
                                        className="rounded-xl h-12 border-border/40 bg-muted font-mono"
                                    />
                                    <select
                                        value={newMember.type}
                                        onChange={e => setNewMember({ ...newMember, type: e.target.value })}
                                        className="flex h-12 w-full rounded-xl border border-border/40 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium"
                                    >
                                        <option value="seat_cover">Seat Cover Expert</option>
                                        <option value="ppf_spf">PPF Specialist</option>
                                    </select>
                                    <Button type="submit" className="h-12 rounded-xl font-bold uppercase tracking-widest gap-2 shadow-lg shadow-primary/20" disabled={isAdding}>
                                        {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                        Add Member
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {viewType === 'grid' ? (
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {filteredCurrent.map((member) => (
                                <Card key={member.id} className="group hover:shadow-2xl transition-all duration-500 border-border/40 overflow-hidden bg-card/60 backdrop-blur-sm relative">
                                    {editingId === member.id ? (
                                        <CardContent className="p-6 space-y-4">
                                            <Input value={editMember.name} onChange={e => setEditMember({ ...editMember, name: e.target.value })} placeholder="Name" />
                                            <Input value={editMember.phone} onChange={e => setEditMember({ ...editMember, phone: e.target.value })} placeholder="Phone" />
                                            <select value={editMember.type} onChange={e => setEditMember({ ...editMember, type: e.target.value })} className="w-full p-2 border rounded-md">
                                                <option value="seat_cover">Seat Cover</option>
                                                <option value="ppf_spf">PPF</option>
                                            </select>
                                            <div className="flex gap-2">
                                                <Button onClick={() => handleSaveEdit(member.id)} className="flex-1" disabled={isSaving}>
                                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />} Save
                                                </Button>
                                                <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1">
                                                    <X className="h-4 w-4 mr-2" /> Cancel
                                                </Button>
                                            </div>
                                        </CardContent>
                                    ) : (
                                        <div className="flex flex-col h-full">
                                            <div className="p-6 flex-1">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-black text-xl shadow-inner relative">
                                                        {(member.name || '').substring(0, 2).toUpperCase()}
                                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(member)} className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all">
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => onDelete(member.id)} className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 mb-6">
                                                    <div>
                                                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{member.name}</h3>
                                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">ID: {member.manpower_id}</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3 text-sm text-foreground font-semibold">
                                                            <Phone className="h-4 w-4 text-muted-foreground" /> {member.phone_number}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-sm text-foreground font-semibold">
                                                            <Briefcase className="h-4 w-4 text-muted-foreground" /> {member.applicator_type === 'seat_cover' ? 'Seat Cover Expert' : 'PPF Specialist'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3 border-t border-border/40 pt-6">
                                                    <button onClick={() => onShowWarranties(member, 'validated')} className="flex flex-col items-center p-2 rounded-xl bg-green-500/5 hover:bg-green-500/10 transition-colors border border-green-500/10">
                                                        <span className="text-lg font-black text-green-600">{member.validated_count || 0}</span>
                                                        <span className="text-[10px] font-bold text-green-600/70 uppercase">Approved</span>
                                                    </button>
                                                    <button onClick={() => onShowWarranties(member, 'pending')} className="flex flex-col items-center p-2 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 transition-colors border border-amber-500/10">
                                                        <span className="text-lg font-black text-amber-600">{member.pending_count || 0}</span>
                                                        <span className="text-[10px] font-bold text-amber-600/70 uppercase">Pending</span>
                                                    </button>
                                                    <button onClick={() => onShowWarranties(member, 'rejected')} className="flex flex-col items-center p-2 rounded-xl bg-red-500/5 hover:bg-red-500/10 transition-colors border border-red-500/10">
                                                        <span className="text-lg font-black text-red-600">{member.rejected_count || 0}</span>
                                                        <span className="text-[10px] font-bold text-red-600/70 uppercase">Rejected</span>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="bg-muted/30 px-6 py-3 flex items-center justify-between border-t border-border/40">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4 text-primary" />
                                                    <span className="text-xs font-bold text-muted-foreground uppercase">Verified Professional</span>
                                                </div>
                                                <div className="text-xs font-bold text-muted-foreground">
                                                    {member.total_count || 0} Total Works
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-muted/20 border border-border/40 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <div className="col-span-3">Member Info</div>
                                <div className="col-span-2">Contact</div>
                                <div className="col-span-2">Expertise</div>
                                <div className="col-span-3 text-center">Performance Stats</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>
                            {filteredCurrent.map((member) => (
                                <Card key={member.id} className="group hover:shadow-lg transition-all duration-300 border-border/40 overflow-hidden bg-white/50 backdrop-blur-sm">
                                    <div className="p-4 md:p-6">
                                        {editingId === member.id ? (
                                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                                                <Input value={editMember.name} onChange={e => setEditMember({ ...editMember, name: e.target.value })} placeholder="Name" />
                                                <Input value={editMember.phone} onChange={e => setEditMember({ ...editMember, phone: e.target.value })} placeholder="Phone" />
                                                <select value={editMember.type} onChange={e => setEditMember({ ...editMember, type: e.target.value })} className="w-full h-10 px-3 border border-border/40 rounded-xl bg-background text-sm">
                                                    <option value="seat_cover">Seat Cover</option>
                                                    <option value="ppf_spf">PPF</option>
                                                </select>
                                                <div className="flex gap-2 col-span-2">
                                                    <Button onClick={() => handleSaveEdit(member.id)} className="flex-1 rounded-xl" disabled={isSaving}>
                                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                                                    </Button>
                                                    <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1 rounded-xl">Cancel</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                                <div className="col-span-3 flex items-center gap-4">
                                                    <div className="h-12 w-12 shrink-0 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-black text-lg">
                                                        {(member.name || '').substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{member.name}</h4>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{member.manpower_id}</p>
                                                    </div>
                                                </div>
                                                <div className="col-span-2 text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                                    <Phone className="h-3.5 w-3.5" /> {member.phone_number}
                                                </div>
                                                <div className="col-span-2">
                                                    <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-bold text-[10px] uppercase">
                                                        {member.applicator_type === 'seat_cover' ? 'Seat Cover' : 'PPF'}
                                                    </Badge>
                                                </div>
                                                <div className="col-span-3 flex justify-center gap-2">
                                                    <button onClick={() => onShowWarranties(member, 'validated')} className="px-3 py-1.5 rounded-lg bg-green-500/5 hover:bg-green-500/10 border border-green-500/10 flex items-center gap-2 transition-colors">
                                                        <span className="text-xs font-black text-green-600">{member.validated_count || 0}</span>
                                                        <span className="text-[9px] font-bold text-green-600/60 uppercase">Appr.</span>
                                                    </button>
                                                    <button onClick={() => onShowWarranties(member, 'pending')} className="px-3 py-1.5 rounded-lg bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 flex items-center gap-2 transition-colors">
                                                        <span className="text-xs font-black text-amber-600">{member.pending_count || 0}</span>
                                                        <span className="text-[9px] font-bold text-amber-600/60 uppercase">Pend.</span>
                                                    </button>
                                                </div>
                                                <div className="col-span-2 flex justify-end items-center gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(member)} className="h-10 w-10 rounded-xl hover:bg-primary/5 hover:text-primary">
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => onDelete(member.id)} className="h-10 w-10 rounded-xl hover:bg-destructive/5 hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="past" className="animate-in fade-in duration-500">
                    {viewType === 'grid' ? (
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {filteredPast.map((member) => (
                                <Card key={member.id} className="bg-card/40 border-border/30 opacity-75 hover:opacity-100 transition-all duration-300 overflow-hidden group">
                                    <div className="p-8">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="h-12 w-12 rounded-xl bg-muted/50 border flex items-center justify-center text-muted-foreground font-black text-lg">
                                                {(member.name || '').substring(0, 1).toLowerCase()}
                                            </div>
                                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-muted/20 border-border/40 px-3 py-1 rounded-full">Inactive</Badge>
                                        </div>
                                        <h3 className="font-black text-2xl text-foreground/80 tracking-tight mb-1">{(member.name || '').toLowerCase()}</h3>
                                        <p className="text-sm font-bold text-muted-foreground/60 mb-6">
                                            Removed on {member.removed_at ? new Date(member.removed_at).toLocaleDateString() : 'N/A'}
                                        </p>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => onShowWarranties(member, 'validated')}
                                                className="flex flex-col items-center p-4 rounded-2xl bg-muted/30 border border-border/40 hover:bg-primary/5 hover:border-primary/20 transition-all group/btn"
                                            >
                                                <span className="text-xl font-black text-foreground group-hover/btn:text-primary transition-colors">{member.validated_count || 0}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Approved</span>
                                            </button>

                                            {member.removed_reason && (
                                                <div className="col-span-1 p-3 rounded-2xl border border-dashed border-border/40 flex items-center justify-center text-center">
                                                    <p className="text-[9px] font-bold text-muted-foreground italic leading-tight">Reason:<br />{member.removed_reason}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredPast.map((member) => (
                                <Card key={member.id} className="group border-border/30 opacity-75 hover:opacity-100 transition-all duration-300 overflow-hidden bg-card/40 relative">
                                    <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-muted/50 border flex items-center justify-center text-muted-foreground font-black text-lg shrink-0">
                                                {(member.name || '').substring(0, 1).toLowerCase()}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-foreground/80 tracking-tight">{(member.name || '').toLowerCase()}</h4>
                                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                                                    Removed on {member.removed_at ? new Date(member.removed_at).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-center px-4 py-2 rounded-xl bg-muted/20 border border-border/40">
                                                <span className="text-sm font-black text-foreground">{member.validated_count || 0}</span>
                                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Approved</span>
                                            </div>
                                            {member.removed_reason && (
                                                <div className="px-4 py-2 rounded-xl border border-dashed border-border/40 max-w-[200px]">
                                                    <p className="text-[9px] font-bold text-muted-foreground italic leading-tight text-center">Reason: {member.removed_reason}</p>
                                                </div>
                                            )}
                                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-muted/10 border-border/40 h-fit">Inactive Member</Badge>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                    {filteredPast.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/10 mt-6">
                            <History className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                            <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest">No past team records available</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};
