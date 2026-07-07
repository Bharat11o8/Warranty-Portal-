import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Loader2 } from "lucide-react";

interface FranchiseOrdersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    franchise: {
        store_name?: string;
        city?: string;
        state?: string;
    } | null;
    orders: any[];
    loading: boolean;
    onDownloadPdf: (orderId: string) => void | Promise<void>;
}

export const AdminFranchiseOrdersDialog = ({
    open,
    onOpenChange,
    franchise,
    orders,
    loading,
    onDownloadPdf,
}: FranchiseOrdersDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-orange-500" />
                        Franchise Orders
                    </DialogTitle>
                    <DialogDescription>
                        {franchise
                            ? `${franchise.store_name || 'Franchise'} - ${franchise.city || 'N/A'}, ${franchise.state || 'N/A'}`
                            : 'All orders placed by this franchise'}
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-2xl border border-dashed">
                        No orders found for this franchise.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order: any) => {
                            const totalQty = order.items?.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0) || 0;
                            const siblingCount = order.order_group_id
                                ? orders.filter((o: any) => o.order_group_id === order.order_group_id).length
                                : 1;
                            const statusLabel = order.status === 'processing'
                                ? 'Confirmed'
                                : order.status === 'pending'
                                    ? 'Pending'
                                    : order.status === 'cancelled'
                                        ? 'Declined'
                                        : order.status === 'shipped'
                                            ? 'Shipped'
                                            : 'Delivered';

                            const statusClass = order.status === 'processing'
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : order.status === 'pending'
                                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                                    : order.status === 'cancelled'
                                        ? 'bg-red-100 text-red-700 border-red-200'
                                        : order.status === 'shipped'
                                            ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                            : 'bg-emerald-100 text-emerald-700 border-emerald-200';

                            return (
                                <div key={order.id} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono font-black text-slate-800">#{order.id}</span>
                                                <Badge className={statusClass}>{statusLabel}</Badge>
                                                {siblingCount > 1 && (
                                                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                                                        Split Order - {siblingCount} distributors
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500 flex flex-wrap gap-3">
                                                <span>{new Date(order.created_at).toLocaleString()}</span>
                                                <span>•</span>
                                                <span>{order.distributor_name || 'Distributor'}</span>
                                                <span>•</span>
                                                <span>{totalQty} units</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                className="h-9 text-xs font-bold"
                                                onClick={() => onDownloadPdf(order.id)}
                                            >
                                                <Download className="w-3.5 h-3.5 mr-2" />
                                                PDF
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="mt-4 overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead className="text-slate-400 uppercase tracking-wider border-b">
                                                <tr>
                                                    <th className="py-2 pr-4">Product</th>
                                                    <th className="py-2 pr-4">Variation</th>
                                                    <th className="py-2 pr-4">Qty</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {order.items?.map((item: any) => (
                                                    <tr key={item.id} className="border-b last:border-0">
                                                        <td className="py-2 pr-4 font-medium text-slate-700">{item.product_name}</td>
                                                        <td className="py-2 pr-4 text-slate-500">{item.variation_name || 'Default'}</td>
                                                        <td className="py-2 pr-4">{item.quantity}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};


