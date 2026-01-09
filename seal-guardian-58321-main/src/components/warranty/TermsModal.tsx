import { useState, useRef, useEffect } from "react";
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

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
}

export const TermsModal = ({ isOpen, onClose, onAccept }: TermsModalProps) => {
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [termsChecked, setTermsChecked] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Reset scroll state when modal opens
    useEffect(() => {
        if (isOpen) {
            setHasScrolledToBottom(false);
            setTermsChecked(false);
        }
    }, [isOpen]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
        if (isAtBottom && !hasScrolledToBottom) {
            setHasScrolledToBottom(true);
        }
    };

    const handleAccept = () => {
        onAccept();
        onClose();
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
                        {/* Important Notice */}
                        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded space-y-2">
                            <p className="font-bold">This Warranty Is Only Valid for Products Purchased from Autoform and being used in India Only.</p>
                            <p className="font-semibold">The Artificial Leather (PU/PVC) Used for the Fabrication of Products is Manufactured by Autoform.</p>
                            <p className="font-semibold">The Warranty Period Will Start From the Date of Purchase and Ends After the warranty period.</p>
                            <p>For the Purpose of This Limited Warranty, the Date of Purchase Is the Date Indicated on the Original Bill of Sale or Receipted Invoice of the Product.</p>
                        </div>

                        {/* Terms & Conditions */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-gray-900">Terms & Conditions</h3>
                            <ul className="space-y-2 list-disc pl-6 text-gray-700">
                                <li>The Warranty Shall Apply in the Case of: Stitching Defect, Color Bleeding, Rubbing Fastness.</li>
                                <li>If Any Manufacturing Defect Is Observed During the Warranty Period, the Manufacturer Holds the Obligation to Repair or Replace Free of Charge.</li>
                                <li>Manufacturer Undertakes No Liability in the Matter of Any Consequential Loss/damage.</li>
                                <li>Warranty Repair/replacement Will Be Carried Out Only at the Workshop of the Authorized Dealer or Service Center of Autoform.</li>
                                <li>Autoform Reserves the Right either to Repair or Replace a Defective Product after satisfactory inspection.</li>
                                <li>This warranty is non-transferrable and valid for original purchaser only.</li>
                            </ul>
                        </div>

                        {/* Exclusions */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-gray-900">Warranty Exclusions</h3>
                            <ul className="space-y-2 list-disc pl-6 text-gray-700">
                                <li>Mishandling such as tears from sharp objects</li>
                                <li>Scuffing, scratches, cuts, material fatigue</li>
                                <li>Oil or Chemical Spills</li>
                                <li>Excessive Dirt, Food Stains or dye transfer from clothing</li>
                                <li>Fading due to sun exposure or chemical use</li>
                                <li>Cleaning with prohibited substances</li>
                                <li>Commercial or fleet vehicle use</li>
                                <li>Damage from fire, flood, severe weather, natural disasters</li>
                                <li>Products altered, modified, or repaired after sale</li>
                            </ul>
                        </div>

                        {/* Customer Responsibilities */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-gray-900">Customer Responsibilities</h3>
                            <ul className="space-y-2 list-disc pl-6 text-gray-700">
                                <li>Maintain the product using damp cloth only</li>
                                <li>Avoid alcohol, silicone, solvents, or abrasive cleaners</li>
                                <li>Retain all purchase documentation for warranty validation</li>
                                <li>Ensure proper packaging and labelling for returns</li>
                            </ul>
                        </div>

                        {/* Privacy Notice */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-gray-900">Data Collection Notice</h3>
                            <p className="text-gray-700">
                                When submitting warranty details, you may be asked to enter your name, email address, mailing address,
                                phone number or other details required by us. This information is used to process your warranty registration
                                and provide customer service.
                            </p>
                        </div>

                        {/* Final Notice */}
                        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                            <p className="font-bold text-gray-900">
                                An online warranty registration must be completed within 30 days from the date of purchase.
                                Any information found to be incorrect or incomplete will deem the warranty null and void.
                            </p>
                        </div>

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
                            "Accept Terms"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TermsModal;
