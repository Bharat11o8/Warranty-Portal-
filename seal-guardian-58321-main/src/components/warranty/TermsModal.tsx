import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import api from "@/lib/api";

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
    settingKey?: string;
}

export const TermsModal = ({ isOpen, onClose, settingKey = 'terms_conditions' }: TermsModalProps) => {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const fetchTerms = async () => {
            try {
                const response = await api.get(`/settings/public/${settingKey}`);
                if (response.data.success && response.data.value) {
                    setContent(response.data.value);
                } else {
                    setContent("");
                }
            } catch (error) {
                console.error("Failed to fetch terms", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTerms();
    }, [settingKey]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                {/* Header with close button */}
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <FileText className="h-5 w-5 text-primary" />
                        Terms and Conditions
                    </DialogTitle>
                    <DialogDescription>
                        Please review the terms and conditions for warranty registration carefully.
                    </DialogDescription>
                </DialogHeader>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto max-h-[65vh] border rounded-lg">
                    <div className="p-4 space-y-6 text-sm">
                        {loading ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-20 bg-slate-100 rounded" />
                                <div className="h-40 bg-slate-100 rounded" />
                                <div className="h-20 bg-slate-100 rounded" />
                            </div>
                        ) : (
                            <div
                                dangerouslySetInnerHTML={{ __html: content }}
                                className="prose prose-sm max-w-none text-slate-700 space-y-4"
                            />
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TermsModal;
