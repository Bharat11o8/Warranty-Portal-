import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Armchair, ShieldCheck } from "lucide-react";
import api from "@/lib/api";

/**
 * Claim process shown to franchises under Support.
 *
 * Content is authored per product type in Admin → Form Content Manager and read
 * from system_settings, so it stays editable without a deploy. The two products
 * are tabs rather than separate sidebar entries — one destination, matching how
 * an admin edits them.
 */
const PRODUCTS = [
    { key: 'sam', label: 'SAM', icon: Armchair, settingKey: 'seat_cover_claim_process' },
    { key: 'ev', label: 'EV Products', icon: ShieldCheck, settingKey: 'ppf_claim_process' },
] as const;

const ClaimProcess = () => {
    const [content, setContent] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            // A key that has never been saved 404s, so allSettled keeps one
            // missing document from blanking the other.
            const results = await Promise.allSettled(
                PRODUCTS.map(p => api.get(`/settings/public/${p.settingKey}`))
            );
            const next: Record<string, string> = {};
            results.forEach((r, i) => {
                next[PRODUCTS[i].key] =
                    r.status === 'fulfilled' && r.value.data.success && r.value.data.value
                        ? r.value.data.value
                        : '';
            });
            setContent(next);
            setLoading(false);
        };
        fetchAll();
    }, []);

    return (
        <div className="relative py-6 px-4 md:py-12 md:px-10">
            <main className="w-full md:container mx-auto relative z-10">
                <Card className="max-w-4xl mx-auto bg-white border border-orange-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] rounded-[40px] overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-600 w-full" />
                    <CardHeader className="pt-10 px-8 md:px-12 text-center">
                        <CardTitle className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-2">
                            Claim <span className="text-orange-600">Process</span>
                        </CardTitle>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
                            How to raise and process a warranty claim
                        </p>
                    </CardHeader>

                    <CardContent className="space-y-8 p-8 md:p-12 pt-4">
                        {loading ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-10 bg-slate-100 rounded-2xl w-64 mx-auto" />
                                <div className="h-40 bg-slate-100 rounded-3xl" />
                                <div className="h-8 bg-slate-100 rounded w-1/3" />
                            </div>
                        ) : (
                            <Tabs defaultValue="sam" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto mb-8">
                                    {PRODUCTS.map(p => (
                                        <TabsTrigger key={p.key} value={p.key} className="gap-2 text-xs font-bold">
                                            <p.icon className="h-3.5 w-3.5" /> {p.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                {PRODUCTS.map(p => (
                                    <TabsContent key={p.key} value={p.key} className="mt-0">
                                        {content[p.key] ? (
                                            <div
                                                className="prose prose-slate max-w-none"
                                                dangerouslySetInnerHTML={{ __html: content[p.key] }}
                                            />
                                        ) : (
                                            <div className="text-center py-16">
                                                <p.icon className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                                                <p className="text-sm font-bold text-slate-500">
                                                    The {p.label} claim process is being prepared.
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Please check back shortly, or contact your ASM for help with a claim.
                                                </p>
                                            </div>
                                        )}
                                    </TabsContent>
                                ))}
                            </Tabs>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default ClaimProcess;
