import { Download, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const FLIPBOOK_URL = "https://heyzine.com/flip-book/28b562c673.html";
const PDF_DOWNLOAD_URL = "https://drive.google.com/uc?export=download&id=1wBnJ1pVpjYAXir7VW8mbKc6V2-vzqGRs";

const ECatalogue = () => {
    const handleDownload = () => {
        // Open the flipbook page in a new tab (download link)
        window.open(PDF_DOWNLOAD_URL, "_blank");
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
            <div className="relative rounded-2xl overflow-hidden border border-orange-100 bg-white shadow-xl shadow-orange-50">
                {/* Desktop / Tablet View */}
                <div className="hidden sm:block">
                    <iframe
                        className="w-full border-0"
                        style={{ height: "75vh", minHeight: "500px", maxHeight: "800px" }}
                        src={FLIPBOOK_URL}
                        scrolling="no"
                        allowFullScreen
                        title="Autoform E-Catalogue"
                    />
                </div>
                {/* Mobile View - Slightly shorter */}
                <div className="block sm:hidden">
                    <iframe
                        className="w-full border-0"
                        style={{ height: "60vh", minHeight: "350px" }}
                        src={FLIPBOOK_URL}
                        scrolling="no"
                        allowFullScreen
                        title="Autoform E-Catalogue"
                    />
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
