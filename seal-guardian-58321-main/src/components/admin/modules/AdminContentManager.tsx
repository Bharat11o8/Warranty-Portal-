import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Save, Eye, Code, Lock, FileText, ShieldCheck, Armchair, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ─── Add a new product type here — nothing else needs to change ───────────────
interface FormTypeConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;               // Tailwind color token e.g. "orange", "blue"
  termsSettingKey: string;     // system_settings key for T&C
  disclaimerSettingKey: string;// system_settings key for Disclaimer
  defaultTerms: string;        // Fallback HTML shown before admin saves anything
  defaultDisclaimer: string;   // Fallback HTML for disclaimer
}

const FORM_TYPES: FormTypeConfig[] = [
  {
    key: 'seat_cover',
    label: 'Seat Cover',
    icon: Armchair,
    color: 'orange',
    termsSettingKey: 'terms_conditions',      // keep existing DB key — no migration needed
    disclaimerSettingKey: 'seat_cover_disclaimer',
    defaultDisclaimer: '',
    defaultTerms: `
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
`.trim(),
  },
  {
    key: 'ppf',
    label: 'Paint Protection Film (PPF)',
    icon: ShieldCheck,
    color: 'blue',
    termsSettingKey: 'ppf_terms_conditions',
    disclaimerSettingKey: 'ppf_disclaimer',
    defaultDisclaimer: `
<div class="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-lg">
  <p class="font-bold text-amber-800 mb-1">Important Notice</p>
  <p class="text-sm text-amber-700 leading-relaxed">PPF warranty terms and disclaimer content will be updated by the Autoform team. Please check back soon.</p>
</div>
`.trim(),
    defaultTerms: `
<div class="space-y-4 p-8 bg-blue-50 border-l-8 border-blue-500 rounded-3xl">
  <p class="font-black text-xl text-blue-700 leading-tight">This PPF Warranty Is Only Valid for Products Purchased from Autoform and being used in India Only.</p>
  <p class="font-semibold">The Paint Protection Film Used for the Installation is Manufactured by / Sourced through Autoform.</p>
  <p class="font-semibold">The Warranty Period Will Start From the Date of Installation.</p>
  <p>For the Purpose of This Limited Warranty, the Date of Installation Is the Date Indicated on the Original Installation Receipt.</p>
</div>

<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Terms &amp; Condition</h2>
<p class="text-gray-600 italic">PPF-specific terms and conditions will be added here by the Autoform team.</p>

<p class="font-bold leading-relaxed mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">To activate the warranty, an on-line warranty registration must be completed via www.autoformindia.com/warranty within 30 days from the date of installation.</p>
`.trim(),
  },
];

// ─── Per-type editor (T&C + Disclaimer sub-tabs) ─────────────────────────────
const FormTypeEditor = ({ config, canWrite }: { config: FormTypeConfig; canWrite: boolean }) => {
  const { toast } = useToast();
  const [termsContent, setTermsContent]       = useState("");
  const [disclaimerContent, setDisclaimerContent] = useState("");
  const [fetching, setFetching]   = useState(true);
  const [savingTerms, setSavingTerms]         = useState(false);
  const [savingDisclaimer, setSavingDisclaimer] = useState(false);

  useEffect(() => {
    setFetching(true);
    const fetchBoth = async () => {
      try {
        const [termsRes, disclaimerRes] = await Promise.allSettled([
          api.get(`/settings/public/${config.termsSettingKey}`),
          api.get(`/settings/public/${config.disclaimerSettingKey}`),
        ]);

        if (termsRes.status === 'fulfilled' && termsRes.value.data.success && termsRes.value.data.value) {
          setTermsContent(termsRes.value.data.value);
        } else {
          setTermsContent(config.defaultTerms);
        }

        if (disclaimerRes.status === 'fulfilled' && disclaimerRes.value.data.success && disclaimerRes.value.data.value) {
          setDisclaimerContent(disclaimerRes.value.data.value);
        } else {
          setDisclaimerContent(config.defaultDisclaimer);
        }
      } catch {
        setTermsContent(config.defaultTerms);
        setDisclaimerContent(config.defaultDisclaimer);
      } finally {
        setFetching(false);
      }
    };
    fetchBoth();
  }, [config.key]);

  const handleSave = async (type: 'terms' | 'disclaimer') => {
    const key     = type === 'terms' ? config.termsSettingKey : config.disclaimerSettingKey;
    const value   = type === 'terms' ? termsContent : disclaimerContent;
    const setLoad = type === 'terms' ? setSavingTerms : setSavingDisclaimer;

    setLoad(true);
    try {
      await api.put(`/settings/admin/${key}`, { value });
      toast({
        title: type === 'terms' ? "Terms Updated" : "Disclaimer Updated",
        description: `${config.label} ${type === 'terms' ? 'terms & conditions' : 'disclaimer'} saved and now live.`,
        className: "bg-green-50 border-green-200 text-green-900",
      });
    } catch {
      toast({ title: "Save Failed", description: "Failed to save changes. Please try again.", variant: "destructive" });
    } finally {
      setLoad(false);
    }
  };

  if (fetching) {
    return <div className="py-16 text-center text-slate-400 text-sm animate-pulse">Loading content...</div>;
  }

  return (
    <Tabs defaultValue="terms" className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-xs mb-6">
        <TabsTrigger value="terms" className="gap-2 text-xs font-bold">
          <FileText className="h-3.5 w-3.5" /> Terms &amp; Conditions
        </TabsTrigger>
        <TabsTrigger value="disclaimer" className="gap-2 text-xs font-bold">
          <AlertTriangle className="h-3.5 w-3.5" /> Disclaimer
        </TabsTrigger>
      </TabsList>

      {/* ── T&C ── */}
      <TabsContent value="terms" className="mt-0 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">HTML content shown to customers before they accept T&amp;C.</p>
          {canWrite ? (
            <Button onClick={() => handleSave('terms')} disabled={savingTerms} size="sm" className="bg-orange-600 hover:bg-orange-700 shrink-0">
              {savingTerms ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Save T&amp;C
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
              <Lock className="h-3 w-3 text-slate-400" /><span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">View Only</span>
            </div>
          )}
        </div>
        <ContentEditor value={termsContent} onChange={setTermsContent} readOnly={!canWrite} placeholder="Enter Terms & Conditions HTML..." />
      </TabsContent>

      {/* ── Disclaimer ── */}
      <TabsContent value="disclaimer" className="mt-0 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Shown below the Warranty Type field in the registration form.</p>
          {canWrite ? (
            <Button onClick={() => handleSave('disclaimer')} disabled={savingDisclaimer} size="sm" className="bg-orange-600 hover:bg-orange-700 shrink-0">
              {savingDisclaimer ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Save Disclaimer
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
              <Lock className="h-3 w-3 text-slate-400" /><span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">View Only</span>
            </div>
          )}
        </div>
        <ContentEditor value={disclaimerContent} onChange={setDisclaimerContent} readOnly={!canWrite} placeholder="Enter disclaimer HTML... (leave blank to hide from form)" />
      </TabsContent>
    </Tabs>
  );
};

// ─── Shared edit/preview editor ───────────────────────────────────────────────
const ContentEditor = ({ value, onChange, readOnly, placeholder }: {
  value: string; onChange: (v: string) => void; readOnly: boolean; placeholder?: string;
}) => (
  <Tabs defaultValue="edit" className="w-full">
    <TabsList className="grid w-full grid-cols-2 max-w-[300px] mb-3">
      <TabsTrigger value="edit" className="gap-1.5 text-xs"><Code className="h-3.5 w-3.5" /> Edit HTML</TabsTrigger>
      <TabsTrigger value="preview" className="gap-1.5 text-xs"><Eye className="h-3.5 w-3.5" /> Preview</TabsTrigger>
    </TabsList>
    <TabsContent value="edit" className="mt-0">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3">
          <CardDescription className="text-xs">Edit the HTML content below. Use the Preview tab to check appearance.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Textarea
            value={value}
            onChange={(e) => !readOnly && onChange(e.target.value)}
            readOnly={readOnly}
            className="min-h-[480px] rounded-none border-0 focus-visible:ring-0 resize-y p-5 font-mono text-sm leading-relaxed"
            placeholder={placeholder}
            style={readOnly ? { cursor: 'default', opacity: 0.7 } : {}}
          />
        </CardContent>
      </Card>
    </TabsContent>
    <TabsContent value="preview" className="mt-0">
      <Card className="border-orange-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-1.5 w-full" />
        <CardContent className="p-6 md:p-10 bg-white">
          {value ? (
            <div className="space-y-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: value }} />
          ) : (
            <p className="text-slate-400 text-sm italic text-center py-12">Nothing to preview — editor is empty.</p>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>
);

// ─── Main export ──────────────────────────────────────────────────────────────
export const AdminContentManager = () => {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('terms', 'write');
  const [activeType, setActiveType] = useState(FORM_TYPES[0].key);

  const activeConfig = FORM_TYPES.find(f => f.key === activeType) || FORM_TYPES[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Form Content Manager</h2>
          <p className="text-slate-500 text-sm mt-0.5">Manage Terms &amp; Conditions and Disclaimers for each warranty form type.</p>
        </div>
        {!canWrite && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-black text-slate-500 uppercase tracking-wide">View Only</span>
          </div>
        )}
      </div>

      {/* Product type selector */}
      <div className="flex flex-wrap gap-2">
        {FORM_TYPES.map(ft => {
          const Icon = ft.icon;
          const isActive = ft.key === activeType;
          return (
            <button
              key={ft.key}
              onClick={() => setActiveType(ft.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-bold transition-all",
                isActive
                  ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-100"
                  : "bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-600"
              )}
            >
              <Icon className="h-4 w-4" />
              {ft.label}
            </button>
          );
        })}
      </div>

      {/* Editor for the selected type */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 md:p-7">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          {(() => { const Icon = activeConfig.icon; return <div className="p-2 bg-orange-50 rounded-xl"><Icon className="h-5 w-5 text-orange-600" /></div>; })()}
          <div>
            <h3 className="font-black text-slate-800 text-base">{activeConfig.label}</h3>
            <p className="text-xs text-slate-400">T&amp;C key: <code className="bg-slate-100 px-1 rounded">{activeConfig.termsSettingKey}</code> &nbsp;·&nbsp; Disclaimer key: <code className="bg-slate-100 px-1 rounded">{activeConfig.disclaimerSettingKey}</code></p>
          </div>
        </div>
        <FormTypeEditor key={activeConfig.key} config={activeConfig} canWrite={canWrite} />
      </div>
    </div>
  );
};
