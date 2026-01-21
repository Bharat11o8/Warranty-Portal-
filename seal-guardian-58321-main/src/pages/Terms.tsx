import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatToIST } from "@/lib/utils";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">

      <main className="container mx-auto px-4 py-12">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Warranty Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
              <p className="font-bold text-lg">This Warranty Is Only Valid for Products Purchased from Autoform and being used in India Only.</p>
              <p className="font-semibold">The Artificial Leather (PU/PVC) Used for the Fabrication of Products is Manufactured by Autoform.</p>
              <p className="font-semibold">The Warranty Period Will Start From the Date of Purchase and Ends After Two Years.</p>
              <p>For the Purpose of This Limited Warranty, the Date of Purchase Is the Date Indicated on the Original Bill of Sale or Receipted Invoice of the Product.</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Terms & Condition</h2>

            <ul className="space-y-3 list-disc pl-6 text-gray-700">
              <li className="leading-relaxed">The Warranty Shall Apply in the Case of: Stitching Defect, Color Bleeding, Rubbing Fastness.</li>
              <li className="leading-relaxed">If Any Manufacturing Defect Is Observed in the Seat cover During the Warranty Period, the Manufacturer Holds the Obligation/liability to Repair or Replace the Seat cover Free of Charge (After Careful Observation and Review by the Company's Management Team).</li>
              <li className="leading-relaxed">Manufacturer Undertakes No Liability in the Matter of Any Consequential Loss/damage Cause Due to Failure of Seat cover, what so ever.</li>
              <li className="leading-relaxed">Warranty Repair/replacement Will Be Carried Out Only at the Workshop of the Authorized Dealer or Service Center of Autoform This Warranty Is Valid Only for the Original Vehicle on Which the Seat cover Was Installed.</li>
              <li className="leading-relaxed">Autoform Reserves the Right either to Repair or Replace a Defective Seat cover after satisfactory inspection.</li>
              <li className="leading-relaxed">No this warranty is non transferrable and valid for original purchaser.</li>
              <li className="leading-relaxed">The Warranty Shall Not Be Applied in the Case of Mishandling Such as Seat cover Torn Because of the Unsafe Use of Sharp Object, Oil or Chemical Spills Fall on the Cover, Excessive Dirt, Food Stains or any other mishandling found during the inspection done by authorized representative of Autoform.</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">The Warranty Shall Not Be Applied in the Case of –</h3>
            <ul className="space-y-2 list-disc pl-6 text-gray-700">
              <li className="leading-relaxed">Mishandling Such as Seat cover torn because of the unsafe use of sharp object,</li>
              <li className="leading-relaxed">Scuffing scratches, cuts, material fatigue,</li>
              <li className="leading-relaxed">Oil or Chemical Spills Fall on the cover,</li>
              <li className="leading-relaxed">Excessive Dirt, Food Stains or blue dye transfer from clothing.</li>
              <li className="leading-relaxed">Fading due to sun exposure or chemical use.</li>
              <li className="leading-relaxed">Cleaning with prohibited substances such as – Saddle soaps, oils, alcohol based solvent products, silicone conditioners.</li>
              <li className="leading-relaxed">Commercial or fleet vehicle use including car rentals.</li>
              <li className="leading-relaxed">Damage from fire, flood, severe weather, natural disaster, acts of war & acts of God.</li>
              <li className="leading-relaxed">If seat cover has been altered, modified, or repaired after sale.</li>
              <li className="leading-relaxed">Any other mishandling, Found during the inspection done by authorized representative of Autoform.</li>
              <li className="leading-relaxed">In case of any Information found to be incorrect or incomplete will deem the warranty null and void or will be regarded as disqualified without prior notice.</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Autoform India shall not be liable for :</h3>
            <ul className="space-y-2 list-disc pl-6 text-gray-700">
              <li className="leading-relaxed">Labour costs for removal or reinstallation,</li>
              <li className="leading-relaxed">Loss of vehicle use or downtime,</li>
              <li className="leading-relaxed">Incidental or consequential damages</li>
              <li className="leading-relaxed">Any law suits against seat cover solutions.</li>
              <li className="leading-relaxed">This warranty is limited exclusively to repair or replacement of the defective products.</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Customer Responsibilities:</h3>
            <ul className="space-y-2 list-disc pl-6 text-gray-700">
              <li className="leading-relaxed">Maintain the product using damp cloth only.</li>
              <li className="leading-relaxed">Avoid alcohol, silicone, solvents, or abrasive cleaners.</li>
              <li className="leading-relaxed">Retain all purchase documentation for warranty validation.</li>
              <li className="leading-relaxed">Ensure proper packaging and labelling for returns.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Kindly Note</h2>
            <p className="leading-relaxed text-gray-700">Protect Your PU/PVC Seat Cover From Excessive Heat and Dirt, Direct Sunlight, Sharp Object, Oil and Chemical Spills. Vacuuming and Gentle Wipe With a Clamp Cloth Are Sufficient to Keep the PU/PVC Clean.</p>

            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">What personal information do we collect from the people who submit the product warranty details using our website www.autoformindia.com?</h3>
            <p className="leading-relaxed text-gray-700">When submitting the warranty details on our site, as appropriate, you may be asked to enter your name, email address, mailing address, phone number or other details required by us.</p>

            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">When do we collect information?</h3>
            <p className="leading-relaxed text-gray-700">We collect information from you when you submit details to register for warranty on our site, place an order, subscribe to a newsletter or enter information on our site.</p>

            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">How do we use your information?</h3>
            <p className="leading-relaxed text-gray-700 mb-3">We may use the information we collect from you when you register, make a purchase, sign up for our newsletter, respond to a survey or marketing communication, surf the website, or use certain other site features in the following ways:</p>
            <ul className="space-y-2 list-disc pl-6 text-gray-700">
              <li className="leading-relaxed">To personalize your experience and to allow us to deliver the type of content and product offerings in which you are most interested.</li>
              <li className="leading-relaxed">To improve our website in order to better serve you.</li>
              <li className="leading-relaxed">To allow us to better service you in responding to your customer service requests.</li>
              <li className="leading-relaxed">To administer a contest, promotion, survey or other site feature.</li>
              <li className="leading-relaxed">To quickly process your transactions.</li>
              <li className="leading-relaxed">To ask for ratings and reviews of services or products.</li>
              <li className="leading-relaxed">To follow up with them after correspondence (live chat, email or phone inquiries).</li>
            </ul>

            <p className="font-bold text-lg mt-6 text-gray-900">Once again, thank you for trusting us.</p>

            <p className="font-bold leading-relaxed mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">To activate the warranty, an on-line warranty registration must be completed via www.autoformindia.com/warranty within 30 days from the date of the purchase. This is an Auto Generated E-warranty File, any Information found to be incorrect or incomplete will deem the warranty null and void or will be regarded as disqualified without prior notice.</p>

            <p className="text-sm text-muted-foreground mt-8">
              Last updated: {formatToIST(new Date())}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Terms;