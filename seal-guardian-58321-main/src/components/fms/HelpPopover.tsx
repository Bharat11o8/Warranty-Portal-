import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export const HelpPopover = () => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full h-9 w-9 text-muted-foreground hover:bg-orange-50 transition-all group"
                >
                    <img
                        src="/images/help-icon-collapsed.png"
                        alt="Get Help"
                        className="h-6 w-6 object-contain mix-blend-multiply opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0 border-none shadow-2xl bg-transparent" align="end" sideOffset={10}>
                <div className="group relative rounded-[32px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 overflow-hidden">
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1 space-y-2 pt-1">
                            <p className="text-[14px] font-black text-[#f46617] uppercase tracking-tight">
                                Need Help?
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                                We’ve got you covered—day or night. hassle-free support anytime.
                            </p>
                        </div>
                        <div className="relative shrink-0 pt-1">
                            <img
                                src="/images/help-character.png"
                                alt="Help"
                                className="h-16 w-auto object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                            />
                        </div>
                    </div>

                    <Button
                        className="w-full h-11 bg-[#f46617] hover:bg-[#d85512] text-white rounded-2xl text-xs font-bold shadow-lg shadow-orange-500/10 transition-all active:scale-95 focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 outline-none"
                        onClick={() => window.open('https://wa.me/917217014601?text=Hi,%20I%20need%20assistance%20with%20FMS.', '_blank')}
                    >
                        Get Assistance
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};
