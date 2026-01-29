import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatToIST } from "@/lib/utils";
import api from "@/lib/api";

const Terms = () => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="relative py-6 px-4 md:py-12 md:px-10">
      <main className="w-full md:container mx-auto relative z-10">
        <Card className="max-w-4xl mx-auto bg-white border border-orange-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] rounded-[40px] overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-600 w-full" />
          <CardHeader className="pt-10 px-8 md:px-12 text-center">
            <CardTitle className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-2">Terms & <span className="text-orange-600">Conditions</span></CardTitle>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Effective and enforceable in India</p>
          </CardHeader>
          <CardContent className="space-y-8 p-8 md:p-12">

            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-40 bg-slate-100 rounded-3xl" />
                <div className="h-8 bg-slate-100 rounded w-1/3" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-full" />
                  <div className="h-4 bg-slate-100 rounded w-full" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                </div>
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: content }} className="space-y-6" />
            )}

            <p className="text-sm text-muted-foreground mt-8 border-t pt-8">
              Last updated: {formatToIST(new Date())}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Terms;