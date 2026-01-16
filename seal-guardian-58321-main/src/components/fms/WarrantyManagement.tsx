import {
    Search,
    Plus,
    Download,
    CheckCircle,
    Clock,
    XCircle,
    ShieldCheck,
    FileText,
    Filter,
    ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface WarrantyManagementProps {
    warranties: any[];
    onRegisterNew: (type: 'ev' | 'seat-cover') => void;
    onExport: () => void;
    onSelect: (warranty: any) => void;
    onVerify: (warranty: any) => void;
    onReject: (warranty: any) => void;
    warrantySearch: string;
    setWarrantySearch: (q: string) => void;
}

export const WarrantyManagement = ({
    warranties,
    onRegisterNew,
    onExport,
    onSelect,
    onVerify,
    onReject,
    warrantySearch,
    setWarrantySearch
}: WarrantyManagementProps) => {
    const stats = {
        pending: warranties.filter(w => w.status === 'pending_vendor').length,
        approved: warranties.filter(w => w.status === 'validated').length,
        rejected: warranties.filter(w => w.status === 'rejected').length,
    };

    const filteredItems = (status: string) => {
        return warranties.filter(w => {
            const matchesStatus = status === 'all' ? true :
                status === 'pending' ? w.status === 'pending_vendor' :
                    w.status === status;

            if (!matchesStatus) return false;

            if (!warrantySearch) return true;
            const search = warrantySearch.toLowerCase();
            return (
                w.customer_name?.toLowerCase().includes(search) ||
                w.customer_phone?.includes(search) ||
                w.uid?.toLowerCase().includes(search) ||
                w.car_make?.toLowerCase().includes(search) ||
                w.car_model?.toLowerCase().includes(search)
            );
        });
    };

    const renderList = (status: string) => {
        const items = filteredItems(status);

        if (items.length === 0) {
            return (
                <Card className="border-dashed border-2 py-20 bg-muted/5 rounded-3xl mt-6">
                    <CardContent className="flex flex-col items-center justify-center">
                        <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center mb-6 border border-border/40">
                            <ShieldCheck className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                        <h4 className="text-xl font-black uppercase tracking-widest text-muted-foreground/60">No matching records</h4>
                        <p className="text-sm text-muted-foreground mt-2 font-medium">Try broadening your search or register a new warranty.</p>
                    </CardContent>
                </Card>
            );
        }

        return (
            <div className="grid gap-4 mt-8 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                {items.map((warranty) => (
                    <div key={warranty.id} className="group relative">
                        <Card
                            className={cn(
                                "group hover:shadow-2xl transition-all duration-500 border-border/40 cursor-pointer overflow-hidden bg-card/60 backdrop-blur-md relative z-10",
                                warranty.status === 'pending_vendor' && "rounded-b-none border-b-0 hover:bg-primary/5"
                            )}
                            onClick={() => onSelect(warranty)}
                        >
                            <CardContent className="p-0">
                                <div className="flex items-center p-5 gap-6">
                                    {/* Product Icon */}
                                    <div className={cn(
                                        "h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 border relative shadow-inner overflow-hidden",
                                        warranty.product_type === 'seat-cover' ? "bg-blue-500/5 border-blue-500/10 text-blue-600" : "bg-purple-500/5 border-purple-500/10 text-purple-600"
                                    )}>
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                                        <img
                                            src={warranty.product_type === 'seat-cover' ? "/seat-cover-icon.png" : "/ppf-icon.png"}
                                            alt="Type"
                                            className="w-10 h-10 object-contain opacity-70 group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-black text-lg tracking-tight truncate group-hover:text-primary transition-colors">
                                                {warranty.car_make} {warranty.car_model}
                                            </h4>
                                            <Badge variant="outline" className="font-bold border-0 bg-primary/10 text-primary text-[10px] uppercase tracking-widest px-2 py-0.5">
                                                {warranty.product_type?.replace('-', ' ')}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-6 mt-1.5 overflow-hidden">
                                            <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                                                <FileText className="h-3.5 w-3.5" />
                                                <span className="text-xs font-mono font-bold tracking-tighter truncate max-w-[120px]">{warranty.uid}</span>
                                            </div>
                                            <div className="h-1 w-1 bg-muted-foreground/30 rounded-full shrink-0" />
                                            <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                                                <span className="text-xs font-bold uppercase tracking-widest truncate">{warranty.customer_name}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status & Action Indicator */}
                                    <div className="flex items-center gap-10 pr-4">
                                        <div className="hidden lg:block text-right">
                                            <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mb-1">Live Status</p>
                                            <div className="flex items-center justify-end gap-2">
                                                <span className={cn(
                                                    "text-xs font-black uppercase tracking-widest",
                                                    warranty.status === 'validated' ? "text-green-600" :
                                                        warranty.status === 'pending_vendor' ? "text-blue-600" :
                                                            warranty.status === 'pending' ? "text-amber-500" : "text-red-500"
                                                )}>
                                                    {warranty.status === 'pending_vendor' ? 'Verify Now' :
                                                        warranty.status === 'pending' ? 'Head Office Review' :
                                                            warranty.status === 'validated' ? 'Approved' : 'Rejected'}
                                                </span>
                                                <div className={cn(
                                                    "h-2 w-2 rounded-full",
                                                    warranty.status === 'validated' ? "bg-green-500 animate-pulse" :
                                                        warranty.status === 'pending_vendor' ? "bg-blue-500" : "bg-amber-500"
                                                )} />
                                            </div>
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/20 hover:text-primary">
                                            <ArrowUpRight className="h-5 w-5" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Verification Panel for Pending Vendor Status */}
                        {warranty.status === 'pending_vendor' && (
                            <div className="relative mx-1.5 px-6 py-4 bg-primary/5 rounded-b-3xl border border-t-0 border-primary/20 flex items-center justify-between animate-in slide-in-from-top-4 z-0">
                                <div className="flex items-center gap-4">
                                    <Clock className="h-5 w-5 text-primary animate-spin-[20s] linear" />
                                    <p className="text-sm font-bold text-primary/80 uppercase tracking-widest">Awaiting Identity Verification</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); onVerify(warranty); }}
                                        className="bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest h-10 px-6 rounded-xl shadow-lg shadow-green-600/20"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" /> Approve
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); onReject(warranty); }}
                                        className="font-black uppercase tracking-widest h-10 px-6 rounded-xl shadow-lg shadow-destructive/20"
                                    >
                                        <XCircle className="h-4 w-4 mr-2" /> Reject
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Search and Action Bar */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-card/60 backdrop-blur-md p-6 rounded-3xl border border-border/40 shadow-xl shadow-primary/5">
                <div className="relative w-full md:w-[450px] group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        value={warrantySearch}
                        onChange={(e) => setWarrantySearch(e.target.value)}
                        placeholder="Find by Customer, Vehicle, or Serial Number..."
                        className="w-full bg-muted/30 border border-border/40 pl-12 pr-4 py-3.5 rounded-2xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                    />
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Button variant="outline" size="lg" onClick={onExport} className="rounded-2xl shadow-sm hover:bg-muted font-bold h-12 border-border/40 gap-2 px-6">
                        <Download className="h-4 w-4" /> Export CSV
                    </Button>
                    <div className="flex items-center bg-primary/10 p-1.5 rounded-2xl shadow-inner ring-1 ring-primary/20 h-12">
                        <Button size="sm" onClick={() => onRegisterNew('ev')} className="rounded-xl h-full px-6 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                            <Plus className="h-4 w-4 mr-2" /> New PPF/SPF
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onRegisterNew('seat-cover')} className="rounded-xl h-full px-6 font-black text-xs uppercase tracking-widest text-primary hover:bg-primary/20">
                            <Plus className="h-4 w-4 mr-2" /> Seat Cover
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabs for Filtering */}
            <Tabs defaultValue="all" className="w-full">
                <TabsList className="bg-muted/30 p-1.5 rounded-2xl h-14 flex gap-2 w-fit border border-border/30">
                    <TabsTrigger value="all" className="rounded-xl px-8 h-full text-xs font-black uppercase tracking-[0.1em] data-[state=active]:bg-card data-[state=active]:shadow-lg transition-all">
                        All Records
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="rounded-xl px-8 h-full text-xs font-black uppercase tracking-[0.1em] text-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all data-[state=active]:shadow-blue-600/20">
                        Action Required ({stats.pending})
                    </TabsTrigger>
                    <TabsTrigger value="validated" className="rounded-xl px-8 h-full text-xs font-black uppercase tracking-[0.1em] text-green-600 data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all data-[state=active]:shadow-green-600/20">
                        Verified ({stats.approved})
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="rounded-xl px-8 h-full text-xs font-black uppercase tracking-[0.1em] text-red-600 data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all data-[state=active]:shadow-red-600/20">
                        Rejected ({stats.rejected})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all">{renderList('all')}</TabsContent>
                <TabsContent value="pending">{renderList('pending')}</TabsContent>
                <TabsContent value="validated">{renderList('validated')}</TabsContent>
                <TabsContent value="rejected">{renderList('rejected')}</TabsContent>
            </Tabs>
        </div>
    );
};
