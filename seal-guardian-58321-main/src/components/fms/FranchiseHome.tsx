import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Product } from '@/lib/catalogService';
import { Notification } from "@/contexts/NotificationContext";
import {
    Activity,
    ShieldCheck,
    Clock,
    Users,
    ArrowUpRight,
    Star,
    Sparkles,
    ChevronRight,
    ChevronLeft,
    Play,
    Megaphone,
    AlertTriangle,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FranchiseHomeProps {
    stats: any;
    recentActivity?: any[];
    onNavigate: (module: any) => void;
    newProducts?: Product[];
    latestUpdates?: Notification[];
}

const StatCard = ({ title, value, icon: Icon, type, description }: any) => {
    const isRed = type === 'red';
    const isBlue = type === 'blue';
    const isPurple = type === 'purple';

    return (
        <div className={cn(
            "relative group flex flex-col p-6 rounded-[32px] border transition-all duration-500 hover:shadow-2xl overflow-hidden",
            isRed ? "border-red-50 bg-gradient-to-br from-red-50 to-white" :
                isBlue ? "border-blue-50 bg-gradient-to-br from-blue-50 to-white" :
                    isPurple ? "border-purple-50 bg-gradient-to-br from-purple-50 to-white" :
                        "border-slate-100 bg-gradient-to-br from-slate-50 to-white"
        )}>
            <div className="flex items-center justify-between mb-4">
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110",
                    isRed ? "bg-red-500 text-white" :
                        isBlue ? "bg-blue-500 text-white" :
                            isPurple ? "bg-purple-500 text-white" :
                                "bg-slate-700 text-white"
                )}>
                    <Icon className="h-6 w-6" />
                </div>
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-slate-100 text-slate-400 group-hover:text-orange-500 transition-colors">
                    <ArrowUpRight className="h-4 w-4" />
                </div>
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{title}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{value}</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase leading-tight opacity-70">{description}</p>
            </div>
        </div>
    );
};

const BANNERS = [
    {
        id: 1,
        title: "Elevate Every Installation.",
        subtitle: "Premium Partner Workspace",
        description: "Manage your seat cover installations, floor mats, and accessories with precision. Scale your business with our premium tools.",
        image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200",
        cta: "Explore Catalogue",
        accent: "orange"
    },
    {
        id: 2,
        title: "7D Diamond Flooring.",
        subtitle: "New Arrival Spotlight",
        description: "Discover our latest all-weather custom fit mats. Engineered for luxury, designed for durability. Exclusive franchise discounts available.",
        image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=1200",
        cta: "Order Now",
        accent: "blue"
    },
    {
        id: 3,
        title: "Micro-Perforated Nappa.",
        subtitle: "Design Studio Update",
        description: "The next generation of breathable seat covers is here. Update your sample kits and show your customers the premium difference.",
        image: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&q=80&w=1200",
        cta: "View Collection",
        accent: "purple"
    }
];

export const FranchiseHome = ({ stats, recentActivity = [], onNavigate, newProducts = [], latestUpdates = [] }: FranchiseHomeProps) => {
    const [currentBanner, setCurrentBanner] = useState(0);
    const [currentProductIndex, setCurrentProductIndex] = useState(0);

    // Auto-play carousels
    useEffect(() => {
        const bannerTimer = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % BANNERS.length);
        }, 6000);

        const productTimer = setInterval(() => {
            if (newProducts.length > 0) {
                setCurrentProductIndex((prev) => (prev + 1) % newProducts.length);
            }
        }, 2000);

        return () => {
            clearInterval(bannerTimer);
            clearInterval(productTimer);
        };
    }, [newProducts.length]);

    const nextBanner = () => setCurrentBanner((prev) => (prev + 1) % BANNERS.length);
    const prevBanner = () => setCurrentBanner((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">

            {/* Hero Carousel Section - Light Theme */}
            <section className="relative w-full rounded-[48px] overflow-hidden group min-h-[500px] md:min-h-[600px] bg-white border border-orange-100 shadow-sm">
                {/* Background Grid & Effects (Shared) */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />
                </div>

                {/* Carousel Content */}
                {BANNERS.map((banner, index) => (
                    <div
                        key={banner.id}
                        className={cn(
                            "absolute inset-0 transition-all duration-1000 ease-in-out flex flex-col md:flex-row items-center px-6 md:px-10 py-10 md:py-24 gap-8 md:gap-12",
                            index === currentBanner ? "opacity-100 translate-x-0 z-10" : "opacity-0 translate-x-20 z-0 pointer-events-none"
                        )}
                    >
                        {/* Dynamic Background Glow */}
                        <div className={cn(
                            "absolute top-0 right-0 w-[600px] h-[600px] blur-[120px] rounded-full -mr-48 -mt-48 transition-all duration-1000",
                            banner.accent === 'orange' ? "bg-orange-500/10" :
                                banner.accent === 'blue' ? "bg-blue-500/10" : "bg-purple-500/10"
                        )} />

                        <div className="flex-1 space-y-8 text-center md:text-left relative z-10">
                            <div className={cn(
                                "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-all duration-700 delay-300",
                                banner.accent === 'orange' ? "bg-orange-500/10 border-orange-500/20 text-orange-600" :
                                    banner.accent === 'blue' ? "bg-blue-500/10 border-blue-500/20 text-blue-600" :
                                        "bg-purple-500/10 border-purple-500/20 text-purple-600",
                                index === currentBanner ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
                            )}>
                                <Sparkles className="h-4 w-4" />
                                {banner.subtitle}
                            </div>

                            <h1 className={cn(
                                "text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] transition-all duration-700 delay-500",
                                index === currentBanner ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                            )}>
                                {banner.title.split('.').map((part, i) => (
                                    <React.Fragment key={i}>
                                        {part}
                                        {i === 0 && <br />}
                                    </React.Fragment>
                                ))}
                            </h1>

                            <p className={cn(
                                "text-sm md:text-lg text-slate-500 font-medium max-w-xl leading-relaxed transition-all duration-700 delay-700",
                                index === currentBanner ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                            )}>
                                {banner.description}
                            </p>

                            <div className={cn(
                                "flex flex-col items-stretch md:flex-row md:items-center justify-center md:justify-start gap-3 pt-4 transition-all duration-700 delay-[900ms] w-full max-w-[300px] mx-auto md:mx-0 md:max-w-none",
                                index === currentBanner ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                            )}>
                                <Button
                                    onClick={() => onNavigate('catalogue')}
                                    className={cn(
                                        "h-11 md:h-14 px-5 md:px-8 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl group transition-all duration-300 text-[10px] md:text-xs w-full md:w-auto",
                                        banner.accent === 'orange' ? "bg-orange-600 hover:bg-orange-700 shadow-orange-600/20" :
                                            banner.accent === 'blue' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20" :
                                                "bg-purple-600 hover:bg-purple-700 shadow-purple-600/20"
                                    )}
                                >
                                    <span className="flex-1 text-center md:flex-none">{banner.cta}</span>
                                    <ChevronRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                <Button variant="outline" className="h-11 md:h-14 px-5 md:px-8 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-black uppercase tracking-widest shadow-sm text-[10px] md:text-xs w-full md:w-auto">
                                    <span className="flex-1 text-center md:flex-none">Watch Tutorial</span>
                                    <Play className="ml-2 h-3 w-3 md:h-4 md:w-4 fill-slate-700" />
                                </Button>
                            </div>
                        </div>

                        <div className={cn(
                            "flex-1 relative transition-all duration-1000 delay-500 w-full md:w-auto",
                            index === currentBanner ? "opacity-100 scale-100" : "opacity-0 scale-90"
                        )}>
                            <div className="relative w-full aspect-[4/3] md:aspect-video rounded-[24px] md:rounded-[32px] overflow-hidden border border-slate-100 shadow-2xl group/img bg-slate-50">
                                <img
                                    src={banner.image}
                                    alt={banner.title}
                                    className="w-full h-full object-cover transition-transform duration-[2s] group-hover/img:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />

                                <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/80 backdrop-blur-xl border border-white flex items-center gap-3 md:gap-4 shadow-xl">
                                    <div className={cn(
                                        "h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg",
                                        banner.accent === 'orange' ? "bg-orange-500" :
                                            banner.accent === 'blue' ? "bg-blue-500" : "bg-purple-500"
                                    )}>
                                        <Star className="h-5 w-5 md:h-6 md:w-6 fill-white" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Premium Selection</p>
                                        <p className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-tight">Luxury Collections</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Carousel Controls - Repositioned for mobile */}
                <div className="absolute bottom-8 right-6 md:right-20 z-20 flex items-center gap-4 md:gap-6">
                    <div className="hidden sm:flex gap-2">
                        {BANNERS.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentBanner(i)}
                                className={cn(
                                    "h-1.5 transition-all duration-500 rounded-full",
                                    i === currentBanner ? "w-8 bg-orange-500" : "w-1.5 bg-slate-200 hover:bg-slate-300"
                                )}
                            />
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={prevBanner}
                            className="h-8 w-8 md:h-9 md:w-9 rounded-full border-white/40 bg-white/40 backdrop-blur-md hover:bg-white/60 text-slate-800 shadow-lg transition-all active:scale-95"
                        >
                            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={nextBanner}
                            className="h-8 w-8 md:h-9 md:w-9 rounded-full border-white/40 bg-white/40 backdrop-blur-md hover:bg-white/60 text-slate-800 shadow-lg transition-all active:scale-95"
                        >
                            <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                        </Button>
                    </div>
                </div>
            </section>

            {/* Quick Stats Banner */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Applications"
                    value={stats.total || "0"}
                    icon={Activity}
                    description="Successfully processed warranties"
                />
                <StatCard
                    title="Active Approvals"
                    value={stats.approved || "0"}
                    icon={ShieldCheck}
                    type="red"
                    description="Secured premium installations"
                />
                <StatCard
                    title="Pending Review"
                    value={stats.pending || "0"}
                    icon={Clock}
                    type="blue"
                    description="Awaiting your verification"
                />
                <StatCard
                    title="Team Size"
                    value={stats.manpower || "0"}
                    icon={Users}
                    type="purple"
                    description="Trained field applicators"
                />
            </div>

            {/* New Product Spotlight Row */}
            <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
                <section className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">New Arrivals</h2>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Latest from our design studio</p>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => onNavigate('catalogue')}
                            className="text-xs font-black text-orange-600 uppercase tracking-widest hover:bg-orange-50"
                        >
                            View All
                        </Button>
                    </div>

                    <div className="relative h-[340px] rounded-[40px] bg-gradient-to-br from-slate-50 to-orange-50/30 border border-orange-100 overflow-hidden group">
                        {newProducts.length > 0 ? (
                            <>
                                {/* Swinging NEW Tag */}
                                <div className="hanging-tag z-20">
                                    <div className="hanging-tag-body"></div>
                                </div>

                                {newProducts.map((product, index) => (
                                    <div
                                        key={product.id}
                                        className={cn(
                                            "absolute inset-0 transition-all duration-700 ease-in-out flex items-center",
                                            index === currentProductIndex ? "opacity-100 translate-x-0 z-10" : "opacity-0 translate-x-10 z-0 pointer-events-none"
                                        )}
                                    >
                                        <div className="absolute inset-x-8 bottom-8 top-auto md:inset-0 md:p-8 flex flex-col justify-end z-10 bg-gradient-to-t from-white via-transparent to-transparent">
                                            <div className="inline-flex w-fit px-3 py-1 rounded-full bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest mb-3">New Arrival</div>
                                            <h3 className="text-3xl font-black text-slate-900 mb-2 leading-none uppercase">{product.name}</h3>
                                            <p className="text-xs font-bold text-slate-500 max-w-xs mb-6 uppercase tracking-tight line-clamp-2">
                                                {Array.isArray(product.description) ? product.description[0] : product.description}
                                            </p>
                                            <div className="flex items-baseline gap-2 mb-6 text-brand-orange">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Price</span>
                                                <span className="text-xl font-black">
                                                    ₹{typeof product.price === 'number'
                                                        ? product.price.toLocaleString()
                                                        : (product.price as any).default?.toLocaleString() || (product.price as any).twoRow?.toLocaleString() || '0'}
                                                </span>
                                            </div>
                                            <Button
                                                onClick={() => onNavigate('catalogue')}
                                                className="w-fit h-11 px-6 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px]"
                                            >
                                                Learn More
                                            </Button>
                                        </div>
                                        <div className="absolute right-0 top-0 h-full w-2/3 flex items-center justify-center p-4">
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-700"
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Product Carousel Dots */}
                                <div className="absolute top-8 right-8 z-20 flex gap-1.5 px-3 py-1.5 rounded-full bg-white/50 backdrop-blur-sm border border-white/50">
                                    {newProducts.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentProductIndex(i)}
                                            className={cn(
                                                "h-1 transition-all duration-500 rounded-full",
                                                i === currentProductIndex ? "w-4 bg-orange-500" : "w-1 bg-slate-300 hover:bg-slate-400"
                                            )}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="h-full w-full flex items-center justify-center p-8 bg-slate-50">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No new arrivals found</p>
                            </div>
                        )}
                    </div>
                </section>

                {latestUpdates && latestUpdates.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Platform Updates</h2>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Stay ahead of the curve</p>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={() => onNavigate('news')}
                                className="text-xs font-black text-orange-600 uppercase tracking-widest hover:bg-orange-50"
                            >
                                See News
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {latestUpdates.map((update) => (
                                <Card
                                    key={update.id}
                                    onClick={() => onNavigate('news')}
                                    className="rounded-[32px] border-orange-50 bg-white hover:border-orange-200 transition-all cursor-pointer group shadow-sm"
                                >
                                    <CardContent className="p-6 flex items-center gap-6">
                                        <div className={cn(
                                            "h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform",
                                            update.type === 'product' ? "bg-purple-50 text-purple-600" :
                                                update.type === 'alert' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                                        )}>
                                            {update.type === 'product' ? <Megaphone className="h-8 w-8" /> :
                                                update.type === 'alert' ? <AlertTriangle className="h-8 w-8" /> : <Info className="h-8 w-8" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={cn(
                                                "text-[10px] font-black uppercase tracking-widest mb-1",
                                                update.type === 'product' ? "text-purple-500" :
                                                    update.type === 'alert' ? "text-amber-500" : "text-blue-500"
                                            )}>
                                                {update.type === 'product' ? 'Product Launch' :
                                                    update.type === 'alert' ? 'Important Alert' : 'System Update'}
                                            </p>
                                            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none truncate">{update.title}</h4>
                                            <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-tighter line-clamp-1">{update.message}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};
