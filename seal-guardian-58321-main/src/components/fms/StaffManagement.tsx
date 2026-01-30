import { useState, useEffect } from "react";
import { formatToIST, cn } from "@/lib/utils";
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
    List,
    RefreshCw
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
    onRefresh?: () => void;
    isRefreshing?: boolean;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;
    };
    pastPagination?: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;
    };
    onPageChange?: (page: number, active: boolean) => void;
    onRowsPerPageChange?: (limit: number) => void;
    onPastRowsPerPageChange?: (limit: number) => void;
}

import { Pagination } from "./Pagination";

export const StaffManagement = ({
    manpowerList,
    pastManpowerList,
    onAdd,
    onEdit,
    onDelete,
    onShowWarranties,
    editingId,
    setEditingId,
    onRefresh,
    isRefreshing = false,
    pagination,
    pastPagination,
    onPageChange,
    onRowsPerPageChange,
    onPastRowsPerPageChange
}: ManpowerManagementProps) => {
    const toTitleCase = (str: string) => {
        if (!str) return str;
        return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    };
    const [newMember, setNewMember] = useState({ name: '', phone: '', type: 'seat_cover', id: '' });
    const [editMember, setEditMember] = useState({ name: '', phone: '', type: 'seat_cover' });
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewType, setViewType] = useState<'grid' | 'list'>('list');

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
                <div className="flex flex-col lg:flex-row justify-evenly items-center gap-6 mb-8 top-0 z-30 bg-white/95 backdrop-blur-md py-4 md:py-6 px-4 md:px-2 -mx-4 md:-mx-2 rounded-2xl md:rounded-3xl border-b md:border border-orange-100 shadow-sm">
                    <TabsList className="bg-white p-1 rounded-xl md:rounded-full h-10 md:h-11 w-full lg:w-auto flex md:inline-flex gap-0.5 shadow-sm border border-orange-100">
                        <TabsTrigger value="current" className="relative z-10 rounded-full px-4 md:px-8 py-2 text-xs md:text-sm font-bold text-slate-500 data-[state=active]:text-orange-600 data-[state=active]:bg-orange-50/50 data-[state=active]:shadow-sm transition-all duration-500 ease-out whitespace-nowrap flex items-center gap-2">
                            <Users className="h-4 w-4" /> Current Team <span className="hidden sm:inline">({manpowerList?.length || 0})</span>
                        </TabsTrigger>
                        <TabsTrigger value="past" className="relative z-10 rounded-full px-4 md:px-8 py-2 text-xs md:text-sm font-bold text-slate-500 data-[state=active]:text-orange-600 data-[state=active]:bg-orange-50/50 data-[state=active]:shadow-sm transition-all duration-500 ease-out whitespace-nowrap flex items-center gap-2">
                            <History className="h-4 w-4" /> Ex-Team <span className="hidden sm:inline">({pastManpowerList?.length || 0})</span>
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex flex-row sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <div className="relative w-full sm:w-64 lg:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                            <input
                                placeholder="Search member..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 rounded-xl md:rounded-2xl border border-slate-100 bg-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500/30 text-xs md:text-sm transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-evenly sm:justify-end">
                            <div className="flex items-center gap-1 bg-white p-1 rounded-full h-10 md:h-11 border border-orange-100 shadow-sm">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewType('grid')}
                                    className={cn(
                                        "rounded-full h-8 md:h-9 px-3 transition-all",
                                        viewType === 'grid' ? "bg-orange-50 text-orange-600 border border-orange-200 shadow-sm" : "text-slate-400 hover:text-orange-600"
                                    )}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewType('list')}
                                    className={cn(
                                        "rounded-full h-8 md:h-9 px-3 transition-all",
                                        viewType === 'list' ? "bg-orange-50 text-orange-600 border border-orange-200 shadow-sm" : "text-slate-400 hover:text-orange-600"
                                    )}
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Refresh Button */}
                            {onRefresh && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onRefresh}
                                    disabled={isRefreshing}
                                    className="h-10 md:h-11 px-4 md:px-6 rounded-full border-orange-100 text-orange-600 font-bold hover:bg-orange-50 transition-all flex items-center gap-2 shadow-sm text-[10px] md:text-xs"
                                >
                                    <RefreshCw className={`h-3.5 w-3.5 md:h-4 md:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    <span className="hidden sm:inline">Refresh</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <TabsContent value="current" className="space-y-8 animate-in fade-in duration-500">
                    <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                        <Card className="border-orange-100 shadow-xl shadow-orange-500/5 bg-white overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none group-hover:bg-orange-500/10 transition-colors duration-700" />

                            <div className="bg-gradient-to-r from-orange-50 via-white to-white px-8 py-5 border-b border-orange-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm">
                                        <UserPlus className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Onboard Talent</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add new member to your fleet</p>
                                    </div>
                                </div>
                            </div>

                            <CardContent className="p-6 md:p-8 relative z-10">
                                <form onSubmit={handleAddSubmit}>
                                    <div className="flex flex-col md:grid md:grid-cols-12 gap-5 md:gap-6 items-end">
                                        <div className="w-full md:col-span-3 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                                            <Input
                                                placeholder="e.g. John Doe"
                                                value={newMember.name}
                                                onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                                                className="rounded-xl h-11 md:h-12 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-slate-700 text-xs md:text-sm"
                                                required
                                            />
                                        </div>
                                        <div className="w-full md:col-span-3 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                                <Input
                                                    placeholder="98765 43210"
                                                    value={newMember.phone}
                                                    onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
                                                    className="pl-11 rounded-xl h-11 md:h-12 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-slate-700 font-mono text-xs md:text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="w-full md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Generated ID</label>
                                            <div className="relative">
                                                <Input
                                                    value={newMember.id}
                                                    readOnly
                                                    className="rounded-xl h-11 md:h-12 border-slate-100 bg-slate-100/50 text-slate-500 font-black text-center tracking-wider text-xs md:text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="w-full md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Specialization</label>
                                            <select
                                                value={newMember.type}
                                                onChange={e => setNewMember({ ...newMember, type: e.target.value })}
                                                className="flex h-11 md:h-12 w-full rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2 text-xs md:text-sm font-bold text-slate-700 focus:bg-white focus:outline-none focus:border-orange-200 focus:ring-4 focus:ring-orange-500/10 transition-all cursor-pointer hover:bg-white"
                                            >
                                                <option value="seat_cover">Seat Cover</option>
                                                <option value="ppf_spf">PPF Specialist</option>
                                            </select>
                                        </div>
                                        <div className="w-full md:col-span-2">
                                            <Button
                                                type="submit"
                                                className="w-full h-11 md:h-12 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all text-[10px]"
                                                disabled={isAdding}
                                            >
                                                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                                Add Member
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {viewType === 'grid' ? (
                        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredCurrent.map((member) => (
                                <Card key={member.id} className="group hover:shadow-2xl transition-all duration-500 border-orange-100 overflow-hidden bg-white relative">
                                    {editingId === member.id ? (
                                        <CardContent className="p-6 space-y-4">
                                            <Input
                                                value={editMember.name}
                                                onChange={e => setEditMember({ ...editMember, name: e.target.value })}
                                                placeholder="Name"
                                                className="rounded-xl border-slate-200"
                                            />
                                            <Input
                                                value={editMember.phone}
                                                onChange={e => setEditMember({ ...editMember, phone: e.target.value })}
                                                placeholder="Phone"
                                                className="rounded-xl border-slate-200"
                                            />
                                            <select
                                                value={editMember.type}
                                                onChange={e => setEditMember({ ...editMember, type: e.target.value })}
                                                className="w-full p-2 border border-slate-200 rounded-xl text-sm"
                                            >
                                                <option value="seat_cover">Seat Cover</option>
                                                <option value="ppf_spf">PPF</option>
                                            </select>
                                            <div className="flex gap-2">
                                                <Button onClick={() => handleSaveEdit(member.id)} className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600" disabled={isSaving}>
                                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />} Save
                                                </Button>
                                                <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1 rounded-xl border-slate-200">
                                                    <X className="h-4 w-4 mr-2" /> Cancel
                                                </Button>
                                            </div>
                                        </CardContent>
                                    ) : (
                                        <div className="flex flex-col h-full">
                                            <div className="p-4 md:p-6 flex-1">
                                                <div className="flex justify-between items-start mb-4 md:mb-6">
                                                    <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-black text-lg md:text-xl shadow-inner relative">
                                                        {(member.name || '').substring(0, 2).toUpperCase()}
                                                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(member)} className="h-8 w-8 rounded-full text-slate-400 hover:bg-orange-50 hover:text-orange-600 transition-all">
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => onDelete(member.id)} className="h-8 w-8 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                                                    <div>
                                                        <h3 className="text-lg md:text-xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors">{toTitleCase(member.name)}</h3>
                                                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {member.manpower_id}</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3 text-xs md:text-sm text-slate-600 font-bold">
                                                            <Phone className="h-3.5 w-3.5 md:h-4 md:w-4 text-slate-400" /> {member.phone_number}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs md:text-sm text-slate-600 font-bold">
                                                            <Briefcase className="h-3.5 w-3.5 md:h-4 md:w-4 text-slate-400" /> {member.applicator_type === 'seat_cover' ? 'Seat Cover Expert' : 'PPF Specialist'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 md:gap-3 border-t border-slate-100 pt-4 md:pt-6">
                                                    <button onClick={() => onShowWarranties(member, 'validated')} className="flex flex-col items-center p-1.5 md:p-2 rounded-xl bg-green-50 hover:bg-green-100 transition-colors border border-green-100">
                                                        <span className="text-base md:text-lg font-black text-green-600">{member.validated_count || 0}</span>
                                                        <span className="text-[8px] md:text-[9px] font-black text-green-700/50 uppercase tracking-widest">Appr.</span>
                                                    </button>
                                                    <button onClick={() => onShowWarranties(member, 'pending')} className="flex flex-col items-center p-1.5 md:p-2 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-100">
                                                        <span className="text-base md:text-lg font-black text-amber-600">{member.pending_count || 0}</span>
                                                        <span className="text-[8px] md:text-[9px] font-black text-amber-700/50 uppercase tracking-widest">Pend.</span>
                                                    </button>
                                                    <button onClick={() => onShowWarranties(member, 'rejected')} className="flex flex-col items-center p-1.5 md:p-2 rounded-xl bg-red-50 hover:bg-red-100 transition-colors border border-red-100">
                                                        <span className="text-base md:text-lg font-black text-red-600">{member.rejected_count || 0}</span>
                                                        <span className="text-[8px] md:text-[9px] font-black text-red-700/50 uppercase tracking-widest">Rej.</span>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 px-4 md:px-6 py-2 md:py-3 flex items-center justify-between border-t border-slate-100">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-orange-500" />
                                                    <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified Pro</span>
                                                </div>
                                                <div className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {member.total_count || 0} Works
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <div className="col-span-3">Member Info</div>
                                <div className="col-span-2">Contact</div>
                                <div className="col-span-2">Expertise</div>
                                <div className="col-span-3 text-center">Performance Stats</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>
                            {filteredCurrent.map((member) => (
                                <Card key={member.id} className="group hover:shadow-lg transition-all duration-300 border-orange-100 overflow-hidden bg-white">
                                    <div className="p-4 md:p-6">
                                        {editingId === member.id ? (
                                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                                                <Input value={editMember.name} onChange={e => setEditMember({ ...editMember, name: e.target.value })} placeholder="Name" className="rounded-xl border-slate-200" />
                                                <Input value={editMember.phone} onChange={e => setEditMember({ ...editMember, phone: e.target.value })} placeholder="Phone" className="rounded-xl border-slate-200" />
                                                <select value={editMember.type} onChange={e => setEditMember({ ...editMember, type: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-white text-sm">
                                                    <option value="seat_cover">Seat Cover</option>
                                                    <option value="ppf_spf">PPF</option>
                                                </select>
                                                <div className="flex gap-2 col-span-2">
                                                    <Button onClick={() => handleSaveEdit(member.id)} className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600" disabled={isSaving}>
                                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                                                    </Button>
                                                    <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1 rounded-xl border-slate-200">Cancel</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
                                                <div className="flex-1 flex items-center gap-4 min-w-0">
                                                    <div className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-black text-base md:text-lg">
                                                        {(member.name || '').substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors truncate">{toTitleCase(member.name)}</h4>
                                                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase truncate">ID: {member.manpower_id}</p>
                                                    </div>
                                                </div>
                                                <div className="w-full md:w-32 lg:w-40 text-xs md:text-sm font-bold text-slate-500 flex items-center gap-2">
                                                    <Phone className="h-3.5 w-3.5 text-slate-400" /> {member.phone_number}
                                                </div>
                                                <div className="w-full md:w-32 lg:w-40">
                                                    <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none font-bold text-[9px] md:text-[10px] uppercase tracking-wider px-3 py-1">
                                                        {member.applicator_type === 'seat_cover' ? 'Seat Cover' : 'PPF Specialist'}
                                                    </Badge>
                                                </div>
                                                <div className="w-full md:w-auto flex justify-between md:justify-center gap-2 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-0 border-slate-50">
                                                    <button onClick={() => onShowWarranties(member, 'validated')} className="flex-1 md:flex-none px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 border border-green-100 flex items-center justify-center gap-2 transition-colors min-w-[70px]">
                                                        <span className="text-[10px] md:text-xs font-black text-green-600">{member.validated_count || 0}</span>
                                                        <span className="text-[8px] md:text-[9px] font-bold text-green-700/50 uppercase">Appr.</span>
                                                    </button>
                                                    <button onClick={() => onShowWarranties(member, 'pending')} className="flex-1 md:flex-none px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-100 flex items-center justify-center gap-2 transition-colors min-w-[70px]">
                                                        <span className="text-[10px] md:text-xs font-black text-amber-600">{member.pending_count || 0}</span>
                                                        <span className="text-[8px] md:text-[9px] font-bold text-amber-700/50 uppercase">Pend.</span>
                                                    </button>
                                                </div>
                                                <div className="w-full md:w-auto flex justify-end items-center gap-2 mt-2 md:mt-0">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(member)} className="h-9 w-9 md:h-10 md:w-10 rounded-xl text-slate-400 hover:bg-orange-50 hover:text-orange-600">
                                                        <Edit2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => onDelete(member.id)} className="h-9 w-9 md:h-10 md:w-10 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600">
                                                        <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                    {filteredCurrent.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/50 mt-6">
                            <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No team members found</p>
                        </div>
                    )}

                    {pagination && onPageChange && (
                        <div className="mt-12 flex justify-end">
                            <Pagination
                                currentPage={pagination.currentPage}
                                totalPages={pagination.totalPages}
                                onPageChange={(p) => onPageChange(p, true)}
                                rowsPerPage={pagination.limit}
                                onRowsPerPageChange={onRowsPerPageChange}
                            />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="past" className="animate-in fade-in duration-500">
                    {viewType === 'grid' ? (
                        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredPast.map((member) => (
                                <Card key={member.id} className="bg-slate-50 border-orange-50 opacity-75 hover:opacity-100 transition-all duration-300 overflow-hidden group hover:bg-white hover:shadow-lg ">
                                    <div className="p-6 md:p-8">
                                        <div className="flex justify-between items-start mb-4 md:mb-6">
                                            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-slate-100 border flex items-center justify-center text-slate-400 font-black text-base md:text-lg">
                                                {(member.name || '').substring(0, 1).toUpperCase()}
                                            </div>
                                            <Badge variant="outline" className="text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-slate-100 border-slate-200 px-3 py-1 rounded-full text-slate-500">Inactive</Badge>
                                        </div>
                                        <h3 className="font-black text-xl md:text-2xl text-slate-700 tracking-tight mb-1 truncate">{toTitleCase(member.name)}</h3>
                                        <p className="text-[10px] md:text-xs font-bold text-slate-400 mb-4 md:mb-6">
                                            Removed on {member.removed_at ? formatToIST(member.removed_at).split(',')[0] : 'N/A'}
                                        </p>

                                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                                            <button
                                                onClick={() => onShowWarranties(member, 'validated')}
                                                className="flex flex-col items-center p-3 md:p-4 rounded-2xl bg-white border border-slate-100 hover:bg-orange-50 hover:border-orange-100 transition-all group/btn shadow-sm"
                                            >
                                                <span className="text-lg md:text-xl font-black text-slate-800 group-hover/btn:text-orange-600 transition-colors">{member.validated_count || 0}</span>
                                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Approved</span>
                                            </button>

                                            {member.removed_reason ? (
                                                <div className="col-span-1 p-3 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-center bg-slate-50">
                                                    <p className="text-[9px] font-bold text-slate-400 italic leading-tight line-clamp-2">Reason: {member.removed_reason}</p>
                                                </div>
                                            ) : (
                                                <div className="col-span-1 p-3 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-center bg-slate-50">
                                                    <p className="text-[9px] font-bold text-slate-400 italic leading-tight">No reason provided</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3 md:space-y-4">
                            {filteredPast.map((member) => (
                                <Card key={member.id} className="group border-orange-50 opacity-75 hover:opacity-100 transition-all duration-300 overflow-hidden bg-white/60 hover:bg-white hover:shadow-md relative">
                                    <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-slate-100 border flex items-center justify-center text-slate-400 font-black text-base md:text-lg shrink-0">
                                                {(member.name || '').substring(0, 1).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-base md:text-lg font-black text-slate-700 tracking-tight truncate">{toTitleCase(member.name)}</h4>
                                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase truncate">
                                                    Removed: {member.removed_at ? formatToIST(member.removed_at).split(',')[0] : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-row items-center justify-between md:justify-end gap-4 md:gap-6 pt-3 md:pt-0 border-t md:border-0 border-slate-50">
                                            <div className="flex flex-col items-center px-4 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                                                <span className="text-xs md:text-sm font-black text-slate-700">{member.validated_count || 0}</span>
                                                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">Approved</span>
                                            </div>
                                            {member.removed_reason && (
                                                <div className="hidden sm:block px-4 py-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 max-w-[200px]">
                                                    <p className="text-[9px] font-bold text-slate-400 italic leading-tight text-center truncate">Reason: {member.removed_reason}</p>
                                                </div>
                                            )}
                                            <Badge variant="outline" className="text-[8px] md:text-[9px] font-black uppercase tracking-widest bg-slate-100 border-slate-200 text-slate-400 h-fit px-3 py-1">Inactive</Badge>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                    {filteredPast.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/50 mt-6">
                            <History className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No past team records available</p>
                        </div>
                    )}

                    {pastPagination && onPageChange && (
                        <div className="mt-12 flex justify-end">
                            <Pagination
                                currentPage={pastPagination.currentPage}
                                totalPages={pastPagination.totalPages}
                                onPageChange={(p) => onPageChange(p, false)}
                                rowsPerPage={pastPagination.limit}
                                onRowsPerPageChange={onPastRowsPerPageChange}
                            />
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};
