import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { NotificationPopover } from "./NotificationPopover";
import { HelpPopover } from "./HelpPopover";

interface ModuleLayoutProps {
    title: string;
    description?: string;
    children: ReactNode;
    actions?: ReactNode;
    isCollapsed?: boolean;
}

export const ModuleLayout = ({ title, description, children, actions, isCollapsed }: ModuleLayoutProps) => {
    return (
        <div className="flex-1 min-h-0 flex flex-col min-w-0 relative bg-[#fffaf5]">
            <main
                className={cn(
                    "flex-1 min-h-0 bg-white border border-orange-100 rounded-[40px] shadow-[0_15px_50px_rgba(0,0,0,0.03)] relative mr-4 md:mr-6 my-4 md:my-6 ml-3 flex flex-col overflow-hidden"
                )}
            >
                <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar flex flex-col">
                    {/* Branding Header Area - Exactly like Customer Side */}
                    <div className="px-8 md:px-10 pt-10 flex flex-col md:flex-row md:items-start justify-between gap-6 shrink-0">
                        <div className="flex flex-col gap-4">
                            <h1 className="font-black tracking-tight leading-none" style={{ fontSize: '3rem' }}>
                                <span className="bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent uppercase">Partner</span>
                                <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent ml-3 uppercase">Portal</span>
                            </h1>
                            <div className="flex gap-3 items-center">
                                <div className="h-1.5 w-12 bg-black rounded-full" />
                                <p className="text-xs font-black text-slate-500 tracking-[0.2em] uppercase opacity-70">
                                    {title} • {description || "Management Suite"}
                                </p>
                                <div className="h-1.5 w-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {actions}
                            <div className="h-12 border-l border-slate-100 pl-4 flex items-center gap-2">
                                <NotificationPopover />
                                <HelpPopover />
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
