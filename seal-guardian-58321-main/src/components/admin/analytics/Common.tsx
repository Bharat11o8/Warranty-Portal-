import { Package, Download, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const ExportButton = ({ onClick, loading }: { onClick: () => void, loading?: boolean }) => (
    <button
        onClick={onClick}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
    >
        <Download className="h-3.5 w-3.5" />
        Export
    </button>
);

export const SyncButton = ({ onClick, loading }: { onClick: () => void, loading?: boolean }) => (
    <button
        onClick={onClick}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-100 disabled:opacity-50 active:scale-95"
    >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        Sync Data
    </button>
);

export const LoadingOverlay = () => (
    <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-[2px] flex items-center justify-center transition-all duration-500 animate-in fade-in">
        <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 border-4 border-slate-900/10 border-t-slate-900 rounded-full animate-spin shadow-lg" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 animate-pulse">Syncing Data...</span>
        </div>
    </div>
);

export const EmptyState = ({ message = "No records found for this period" }) => (
    <div className="flex flex-col items-center justify-center h-[350px] w-full bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200 animate-in fade-in zoom-in duration-700">
        <div className="h-20 w-20 rounded-[30px] bg-white shadow-xl shadow-slate-100 flex items-center justify-center mb-6 border border-slate-50">
            <Package className="h-8 w-8 text-slate-200" />
        </div>
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{message}</h3>
        <p className="text-[11px] font-bold text-slate-400 mt-2 max-w-[200px] text-center leading-relaxed">
            Try expanding your date range or selecting a different year/month.
        </p>
    </div>
);
