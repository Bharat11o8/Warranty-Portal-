import { Download, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import api from "@/lib/api";

const ECatalogue = () => {
    const [flipbookUrl, setFlipbookUrl] = useState("https://heyzine.com/flip-book/7343bc407b4662d5.html"); // Default fallback
    const [downloadUrl, setDownloadUrl] = useState("https://drive.google.com/uc?export=download&id=1wBnJ1pVpjYAXir7VW8mbKc6V2-vzqGRs"); // Default fallback
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const [flipbookRes, downloadRes] = await Promise.all([
                    api.get('/settings/public/ecatalogue_flipbook_url'),
                    api.get('/settings/public/ecatalogue_download_url')
                ]);

                if (flipbookRes.data.success && flipbookRes.data.value) {
                    setFlipbookUrl(flipbookRes.data.value);
                }
                if (downloadRes.data.success && downloadRes.data.value) {
                    setDownloadUrl(downloadRes.data.value);
                }
            } catch (error) {
                console.error("Failed to fetch e-catalogue links", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleDownload = () => {
        window.open(downloadUrl, '_blank');
    };

    return (
        <div className="space-y-6">
            {/* Header with Download Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">E-Catalogue</h2>
                        <p className="text-xs text-slate-400 font-medium">Browse our complete product catalogue digitally</p>
                    </div>
                </div>
                <Button
                    onClick={handleDownload}
                    className="relative z-10 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-5 h-10 font-bold text-xs uppercase tracking-wider shadow-md shadow-orange-200 transition-all duration-300 hover:shadow-lg hover:shadow-orange-300"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                </Button>
            </div>

            {/* Flipbook Iframe Container */}
            <div className="relative rounded-[32px] overflow-hidden border-2 border-orange-100 bg-white shadow-2xl shadow-orange-100/50 group">
                <div className="flex-1 w-full bg-slate-50 relative group transition-all duration-500" style={{ height: "75vh", minHeight: "600px" }}>
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-md z-10">
                            <div className="flex flex-col items-center gap-6">
                                <div className="relative">
                                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <BookOpen className="h-6 w-6 text-orange-500 animate-pulse" />
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Synchronizing Catalogue</p>
                                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter">Please wait a moment...</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <iframe
                            src={flipbookUrl}
                            className="w-full h-full border-none shadow-inner"
                            allow="fullscreen"
                            title="Autoform E-Catalogue"
                        />
                    )}
                </div>
            </div>

            {/* Footer Hint */}
            <p className="text-center text-[11px] text-slate-400 font-medium">
                Tip: Use the arrows or swipe to flip through pages. Click the fullscreen icon for a better reading experience.
            </p>
        </div>
    );
};

export default ECatalogue;
