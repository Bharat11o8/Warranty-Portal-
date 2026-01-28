import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, FileText, CheckCircle2, Eye, Code } from "lucide-react";
import api from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEFAULT_TERMS = `
<div class="space-y-4 p-8 bg-orange-50 border-l-8 border-orange-500 rounded-3xl">
  <p class="font-black text-xl text-orange-700 leading-tight">This Warranty Is Only Valid for Products Purchased from Autoform and being used in India Only.</p>
  <p class="font-semibold">The Artificial Leather (PU/PVC) Used for the Fabrication of Products is Manufactured by Autoform.</p>
  <p class="font-semibold">The Warranty Period Will Start From the Date of Purchase and Ends After Two Years.</p>
  <p>For the Purpose of This Limited Warranty, the Date of Purchase Is the Date Indicated on the Original Bill of Sale or Receipted Invoice of the Product.</p>
</div>

<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Terms & Condition</h2>

<ul class="space-y-3 list-disc pl-6 text-gray-700">
  <li class="leading-relaxed">The Warranty Shall Apply in the Case of: Stitching Defect, Color Bleeding, Rubbing Fastness.</li>
  <li class="leading-relaxed">If Any Manufacturing Defect Is Observed in the Seat cover During the Warranty Period, the Manufacturer Holds the Obligation/liability to Repair or Replace the Seat cover Free of Charge (After Careful Observation and Review by the Company's Management Team).</li>
  <li class="leading-relaxed">Manufacturer Undertakes No Liability in the Matter of Any Consequential Loss/damage Cause Due to Failure of Seat cover, what so ever.</li>
  <li class="leading-relaxed">Warranty Repair/replacement Will Be Carried Out Only at the Workshop of the Authorized Dealer or Service Center of Autoform This Warranty Is Valid Only for the Original Vehicle on Which the Seat cover Was Installed.</li>
  <li class="leading-relaxed">Autoform Reserves the Right either to Repair or Replace a Defective Seat cover after satisfactory inspection.</li>
  <li class="leading-relaxed">No this warranty is non transferrable and valid for original purchaser.</li>
  <li class="leading-relaxed">The Warranty Shall Not Be Applied in the Case of Mishandling Such as Seat cover Torn Because of the Unsafe Use of Sharp Object, Oil or Chemical Spills Fall on the Cover, Excessive Dirt, Food Stains or any other mishandling found during the inspection done by authorized representative of Autoform.</li>
</ul>

<h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">The Warranty Shall Not Be Applied in the Case of –</h3>
<ul class="space-y-2 list-disc pl-6 text-gray-700">
  <li class="leading-relaxed">Mishandling Such as Seat cover torn because of the unsafe use of sharp object,</li>
  <li class="leading-relaxed">Scuffing scratches, cuts, material fatigue,</li>
  <li class="leading-relaxed">Oil or Chemical Spills Fall on the cover,</li>
  <li class="leading-relaxed">Excessive Dirt, Food Stains or blue dye transfer from clothing.</li>
  <li class="leading-relaxed">Fading due to sun exposure or chemical use.</li>
  <li class="leading-relaxed">Cleaning with prohibited substances such as – Saddle soaps, oils, alcohol based solvent products, silicone conditioners.</li>
  <li class="leading-relaxed">Commercial or fleet vehicle use including car rentals.</li>
  <li class="leading-relaxed">Damage from fire, flood, severe weather, natural disaster, acts of war & acts of God.</li>
  <li class="leading-relaxed">If seat cover has been altered, modified, or repaired after sale.</li>
  <li class="leading-relaxed">Any other mishandling, Found during the inspection done by authorized representative of Autoform.</li>
  <li class="leading-relaxed">In case of any Information found to be incorrect or incomplete will deem the warranty null and void or will be regarded as disqualified without prior notice.</li>
</ul>

<h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">Autoform India shall not be liable for :</h3>
<ul class="space-y-2 list-disc pl-6 text-gray-700">
  <li class="leading-relaxed">Labour costs for removal or reinstallation,</li>
  <li class="leading-relaxed">Loss of vehicle use or downtime,</li>
  <li class="leading-relaxed">Incidental or consequential damages</li>
  <li class="leading-relaxed">Any law suits against seat cover solutions.</li>
  <li class="leading-relaxed">This warranty is limited exclusively to repair or replacement of the defective products.</li>
</ul>

<h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">Customer Responsibilities:</h3>
<ul class="space-y-2 list-disc pl-6 text-gray-700">
  <li class="leading-relaxed">Maintain the product using damp cloth only.</li>
  <li class="leading-relaxed">Avoid alcohol, silicone, solvents, or abrasive cleaners.</li>
  <li class="leading-relaxed">Retain all purchase documentation for warranty validation.</li>
  <li class="leading-relaxed">Ensure proper packaging and labelling for returns.</li>
</ul>

<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Kindly Note</h2>
<p class="leading-relaxed text-gray-700">Protect Your PU/PVC Seat Cover From Excessive Heat and Dirt, Direct Sunlight, Sharp Object, Oil and Chemical Spills. Vacuuming and Gentle Wipe With a Clamp Cloth Are Sufficient to Keep the PU/PVC Clean.</p>

<h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">What personal information do we collect from the people who submit the product warranty details using our website www.autoformindia.com?</h3>
<p class="leading-relaxed text-gray-700">When submitting the warranty details on our site, as appropriate, you may be asked to enter your name, email address, mailing address, phone number or other details required by us.</p>

<h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">When do we collect information?</h3>
<p class="leading-relaxed text-gray-700">We collect information from you when you submit details to register for warranty on our site, place an order, subscribe to a newsletter or enter information on our site.</p>

<h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">How do we use your information?</h3>
<p class="leading-relaxed text-gray-700 mb-3">We may use the information we collect from you when you register, make a purchase, sign up for our newsletter, respond to a survey or marketing communication, surf the website, or use certain other site features in the following ways:</p>
<ul class="space-y-2 list-disc pl-6 text-gray-700">
  <li class="leading-relaxed">To personalize your experience and to allow us to deliver the type of content and product offerings in which you are most interested.</li>
  <li class="leading-relaxed">To improve our website in order to better serve you.</li>
  <li class="leading-relaxed">To allow us to better service you in responding to your customer service requests.</li>
  <li class="leading-relaxed">To administer a contest, promotion, survey or other site feature.</li>
  <li class="leading-relaxed">To quickly process your transactions.</li>
  <li class="leading-relaxed">To ask for ratings and reviews of services or products.</li>
  <li class="leading-relaxed">To follow up with them after correspondence (live chat, email or phone inquiries).</li>
</ul>

<p class="font-bold text-lg mt-6 text-gray-900">Once again, thank you for trusting us.</p>

<p class="font-bold leading-relaxed mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">To activate the warranty, an on-line warranty registration must be completed via www.autoformindia.com/warranty within 30 days from the date of the purchase. This is an Auto Generated E-warranty File, any Information found to be incorrect or incomplete will deem the warranty null and void or will be regarded as disqualified without prior notice.</p>
`.trim();

export const AdminTerms = () => {
    const { toast } = useToast();
    const [termsContent, setTermsContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const response = await api.get('/settings/public/terms_conditions');
                if (response.data.success && response.data.value) {
                    setTermsContent(response.data.value);
                } else {
                    setTermsContent(DEFAULT_TERMS);
                }
            } catch (error) {
                console.error("Failed to fetch terms", error);
                setTermsContent(DEFAULT_TERMS);
            } finally {
                setFetching(false);
            }
        };
        fetchTerms();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.put('/settings/admin/terms_conditions', { value: termsContent });
            toast({
                title: "Terms Updated",
                description: "The terms and conditions have been successfully updated and are live.",
                className: "bg-green-50 border-green-200 text-green-900",
            });
        } catch (error) {
            console.error("Failed to save terms", error);
            toast({
                title: "Update Failed",
                description: "Failed to save changes. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return <div className="p-8 text-center text-slate-500">Loading terms...</div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Terms & Conditions</h2>
                    <p className="text-slate-500">Manage the warranty terms displayed to customers.</p>
                </div>
                <Button onClick={handleSave} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                    {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <Tabs defaultValue="edit" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
                    <TabsTrigger value="edit" className="gap-2">
                        <Code className="h-4 w-4" /> Edit Code
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="gap-2">
                        <Eye className="h-4 w-4" /> Live Preview
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="edit" className="mt-0">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                            <CardDescription>
                                Edit the HTML content below. Be careful with tags.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Textarea
                                value={termsContent}
                                onChange={(e) => setTermsContent(e.target.value)}
                                className="min-h-[600px] rounded-none border-0 focus-visible:ring-0 resize-y p-6 font-mono text-sm leading-relaxed"
                                placeholder="Enter terms and conditions HTML..."
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="preview" className="mt-0">
                    <Card className="border-orange-100 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 w-full" />
                        <CardContent className="p-8 md:p-12 bg-white">
                            <div className="space-y-8" dangerouslySetInnerHTML={{ __html: termsContent }} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
