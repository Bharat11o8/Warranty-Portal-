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
                            <p className="font-bold text-lg">This Warranty Is Only Valid for Products Purchased from Autoform and being used in India Only.</p>
                            <p className="font-semibold">The Artificial Leather (PU/PVC) Used for the Fabrication of Products is Manufactured by Autoform.</p>
                            <p className="font-semibold">The Warranty Period Will Start From the Date of Purchase and Ends After Two Years.</p>
                            <p>For the Purpose of This Limited Warranty, the Date of Purchase Is the Date Indicated on the Original Bill of Sale or Receipted Invoice of the Product.</p>
                        </div>

                        {/* Terms & Conditions */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-gray-900">Terms & Condition</h3>
                            <ul className="space-y-2 list-disc pl-6 text-gray-700">
                                <li>The Warranty Shall Apply in the Case of: Stitching Defect, Color Bleeding, Rubbing Fastness.</li>
                                <li>If Any Manufacturing Defect Is Observed in the Seat cover During the Warranty Period, the Manufacturer Holds the Obligation/liability to Repair or Replace the Seat cover Free of Charge (After Careful Observation and Review by the Company's Management Team).</li>
                                <li>Manufacturer Undertakes No Liability in the Matter of Any Consequential Loss/damage Cause Due to Failure of Seat cover, what so ever.</li>
                                <li>Warranty Repair/replacement Will Be Carried Out Only at the Workshop of the Authorized Dealer or Service Center of Autoform This Warranty Is Valid Only for the Original Vehicle on Which the Seat cover Was Installed.</li>
                                <li>Autoform Reserves the Right either to Repair or Replace a Defective Seat cover after satisfactory inspection.</li>
                                <li>No this warranty is non transferrable and valid for original purchaser.</li>
                                <li>The Warranty Shall Not Be Applied in the Case of Mishandling Such as Seat cover Torn Because of the Unsafe Use of Sharp Object, Oil or Chemical Spills Fall on the Cover, Excessive Dirt, Food Stains or any other mishandling found during the inspection done by authorized representative of Autoform.</li>
                            </ul>
                        </div>

                        {/* Exclusions */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-gray-900">The Warranty Shall Not Be Applied in the Case of –</h3>
                            <ul className="space-y-2 list-disc pl-6 text-gray-700">
                                <li>Mishandling Such as Seat cover torn because of the unsafe use of sharp object,</li>
                                <li>Scuffing scratches, cuts, material fatigue,</li>
                                <li>Oil or Chemical Spills Fall on the cover,</li>
                                <li>Excessive Dirt, Food Stains or blue dye transfer from clothing.</li>
                                <li>Fading due to sun exposure or chemical use.</li>
                                <li>Cleaning with prohibited substances such as – Saddle soaps, oils, alcohol based solvent products, silicone conditioners.</li>
                                <li>Commercial or fleet vehicle use including car rentals.</li>
                                <li>Damage from fire, flood, severe weather, natural disaster, acts of war & acts of God.</li>
                                <li>If seat cover has been altered, modified, or repaired after sale.</li>
                                <li>Any other mishandling, Found during the inspection done by authorized representative of Autoform.</li>
                                <li>In case of any Information found to be incorrect or incomplete will deem the warranty null and void or will be regarded as disqualified without prior notice.</li>
                            </ul>
                        </div>

                        {/* Liability */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-gray-900">Autoform India shall not be liable for:</h3>
                            <ul className="space-y-2 list-disc pl-6 text-gray-700">
                                <li>Labour costs for removal or reinstallation,</li>
                                <li>Loss of vehicle use or downtime,</li>
                                <li>Incidental or consequential damages</li>
                                <li>Any law suits against seat cover solutions.</li>
                                <li>This warranty is limited exclusively to repair or replacement of the defective products.</li>
                            </ul>
                        </div>

                        {/* Customer Responsibilities */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-gray-900">Customer Responsibilities:</h3>
                            <ul className="space-y-2 list-disc pl-6 text-gray-700">
                                <li>Maintain the product using damp cloth only.</li>
                                <li>Avoid alcohol, silicone, solvents, or abrasive cleaners.</li>
                                <li>Retain all purchase documentation for warranty validation.</li>
                                <li>Ensure proper packaging and labelling for returns.</li>
                            </ul>
                        </div>

                        {/* Care Note */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-gray-900">Kindly Note</h3>
                            <p className="text-gray-700">Protect Your PU/PVC Seat Cover From Excessive Heat and Dirt, Direct Sunlight, Sharp Object, Oil and Chemical Spills. Vacuuming and Gentle Wipe With a Clamp Cloth Are Sufficient to Keep the PU/PVC Clean.</p>
                        </div>

                        {/* Privacy - Data Collection */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-gray-900">What personal information do we collect from the people who submit the product warranty details using our website www.autoformindia.com?</h3>
                            <p className="text-gray-700">When submitting the warranty details on our site, as appropriate, you may be asked to enter your name, email address, mailing address, phone number or other details required by us.</p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-gray-900">When do we collect information?</h3>
                            <p className="text-gray-700">We collect information from you when you submit details to register for warranty on our site, place an order, subscribe to a newsletter or enter information on our site.</p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-gray-900">How do we use your information?</h3>
                            <p className="text-gray-700 mb-2">We may use the information we collect from you when you register, make a purchase, sign up for our newsletter, respond to a survey or marketing communication, surf the website, or use certain other site features in the following ways:</p>
                            <ul className="space-y-2 list-disc pl-6 text-gray-700">
                                <li>To personalize your experience and to allow us to deliver the type of content and product offerings in which you are most interested.</li>
                                <li>To improve our website in order to better serve you.</li>
                                <li>To allow us to better service you in responding to your customer service requests.</li>
                                <li>To administer a contest, promotion, survey or other site feature.</li>
                                <li>To quickly process your transactions.</li>
                                <li>To ask for ratings and reviews of services or products.</li>
                                <li>To follow up with them after correspondence (live chat, email or phone inquiries).</li>
                            </ul>
                        </div>

                        <p className="font-bold text-lg text-gray-900">Once again, thank you for trusting us.</p>

                        {/* Final Notice */}
                        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                            <p className="font-bold text-gray-900">
                                To activate the warranty, an on-line warranty registration must be completed via www.autoformindia.com/warranty within 30 days from the date of the purchase. This is an Auto Generated E-warranty File, any Information found to be incorrect or incomplete will deem the warranty null and void or will be regarded as disqualified without prior notice.
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
                            "Accept Terms & Conditions"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TermsModal;
