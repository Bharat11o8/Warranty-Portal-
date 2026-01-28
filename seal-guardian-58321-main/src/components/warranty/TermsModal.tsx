import { useState, useRef, useEffect } from "react";
// Forced HMR Update
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, FileText, AlertCircle } from "lucide-react";
import api from "@/lib/api";

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
}

export const TermsModal = ({ isOpen, onClose, onAccept }: TermsModalProps) => {
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [termsChecked, setTermsChecked] = useState(false);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch terms
    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const response = await api.get('/settings/public/terms_conditions');
                if (response.data.success && response.data.value) {
                    setContent(response.data.value);
                }
            } catch (error) {
                console.error("Failed to fetch terms", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTerms();
    }, []);

    // Reset scroll state when modal opens
    useEffect(() => {
        if (isOpen) {
            setHasScrolledToBottom(false);
            setTermsChecked(false);
            // Re-check scroll on open in case content is short or already loaded
            if (scrollRef.current) {
                const target = scrollRef.current;
                const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
                if (isAtBottom) setHasScrolledToBottom(true);
            }
        }
    }, [isOpen, content]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50; // 50px buffer
        if (isAtBottom) {
            setHasScrolledToBottom(true);
        }
    };

    const handleAccept = () => {
        if (hasScrolledToBottom && termsChecked) {
            onAccept();
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <FileText className="h-5 w-5 text-primary" />
                        Warranty Terms and Conditions
                    </DialogTitle>
                    <DialogDescription>
                        Please read through all terms carefully. Scroll to the bottom to enable the Accept button.
                    </DialogDescription>
                </DialogHeader>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto max-h-[50vh] border rounded-lg"
                    onScroll={handleScroll}
                >
                    <div className="p-4 space-y-6 text-sm">
                        {loading ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-20 bg-slate-100 rounded" />
                                <div className="h-40 bg-slate-100 rounded" />
                                <div className="h-20 bg-slate-100 rounded" />
                            </div>
                        ) : (
                            <div dangerouslySetInnerHTML={{ __html: content }} className="prose prose-sm max-w-none text-slate-700 space-y-4" />
                        )}

                        {/* Scroll indicator and Checkbox section preserved below */}

                        {/* Scroll indicator and Checkbox */}
                        <div className="py-4 border-t mt-4">
                            {hasScrolledToBottom ? (
                                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                    <Checkbox
                                        id="acceptTerms"
                                        checked={termsChecked}
                                        onCheckedChange={(checked) => setTermsChecked(checked as boolean)}
                                        className="mt-0.5"
                                    />
                                    <label htmlFor="acceptTerms" className="text-sm leading-relaxed cursor-pointer">
                                        <span className="font-medium text-green-800">I have read, understood, and agree to the Terms & Conditions</span>
                                        <p className="text-green-700 text-xs mt-1">By checking this box, I confirm that all information provided is accurate.</p>
                                    </label>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 text-amber-600 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                    <AlertCircle className="h-5 w-5" />
                                    <span className="font-medium text-sm">Please scroll down to read all terms before accepting</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAccept}
                        disabled={!hasScrolledToBottom || !termsChecked}
                        className={hasScrolledToBottom && termsChecked ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                        {termsChecked ? (
                            <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Confirm & Accept
                            </>
                        ) : (
                            "Accept Terms & Conditions"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TermsModal;
