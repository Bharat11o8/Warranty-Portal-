import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { NotificationPopover } from "@/components/fms/NotificationPopover";
import { HelpPopover } from "@/components/fms/HelpPopover";

interface AdminModuleLayoutProps {
    title: string;
    description?: string;
    children: ReactNode;
    actions?: ReactNode;
}

export const AdminModuleLayout = ({ title, description, children, actions }: AdminModuleLayoutProps) => {
    return (
        <div className="flex-1 min-h-0 flex flex-col min-w-0 relative bg-[#fffaf5]">
            <main
                className={cn(
                    "flex-1 min-h-0 bg-white border border-orange-100 rounded-[40px] shadow-[0_15px_50px_rgba(0,0,0,0.03)] relative mr-4 md:mr-6 my-4 md:my-6 ml-3 flex flex-col overflow-hidden"
                )}
            >
                <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar flex flex-col">
                    {/* Branding Header Area */}
                    <div className="px-4 md:px-10 pt-6 md:pt-10 flex flex-col items-center md:flex-row md:items-start justify-between gap-4 md:gap-6 shrink-0 transition-all">
                        <div className="flex flex-col gap-3 md:gap-4 items-center md:items-start text-center md:text-left">
                            <h1 className="font-black tracking-tight leading-none text-4xl md:text-5xl">
                                <span className="bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent uppercase">Admin</span>
                                <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent ml-2 md:ml-3 uppercase">Console</span>
                            </h1>
                            <div className="flex gap-3 items-center justify-center md:justify-start">
                                <div className="h-1.5 w-8 md:w-12 bg-black rounded-full shrink-0" />
                                <div className="text-[10px] md:text-xs font-black text-slate-500 tracking-[0.2em] uppercase opacity-70 text-center md:text-left">
                                    <div className="flex flex-col md:hidden leading-tight">
                                        <span>{title}</span>
                                        <span className="opacity-70 text-[9px] mt-0.5">{description || "System Control"}</span>
                                    </div>
                                    <span className="hidden md:inline whitespace-nowrap">
                                        {title} • {description || "System Control"}
                                    </span>
                                </div>
                                <div className="h-1.5 w-8 md:w-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full shrink-0" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-end">
                            {actions}
                            <div className="hidden md:flex h-12 border-l border-slate-100 pl-4 items-center gap-2">
                                {/* Desktop only right-side items if any */}
                            </div>
                        </div>
                    </div>

                    {/* Module Content Area */}
                    <div className="flex-1 p-8 md:p-10 pt-12 md:pt-14">
                        <div className="max-w-[1500px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700">
                            {children}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
