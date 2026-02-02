import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Users, ShieldCheck, AlertTriangle, ChevronRight, ImageIcon, Video, X, Send, Check, ChevronsUpDown, Upload, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, optimizeCloudinaryUrl } from "@/lib/utils";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import React from "react";

export const AdminAnnouncements = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [vendors, setVendors] = useState<any[]>([]);
    const [loadingVendors, setLoadingVendors] = useState(false);
    const [uploading, setUploading] = useState<{ image: boolean; video: boolean }>({ image: false, video: false });

    const imageInputRef = React.useRef<HTMLInputElement>(null);
    const videoInputRef = React.useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        message: "",
        type: "system",
        link: "",
        audience: "all", // 'all' or 'specific'
        targetUsers: [] as string[],
        images: [] as string[],
        videos: [] as string[]
    });

    const [mediaInput, setMediaInput] = useState({ image: "", video: "" });

    useEffect(() => {
        if (formData.audience === 'specific') {
            fetchVendors();
        }
    }, [formData.audience]);

    const fetchVendors = async () => {
        setLoadingVendors(true);
        try {
            const res = await api.get('/admin/vendors');
            if (res.data.success) {
                setVendors(res.data.vendors);
            }
        } catch (error) {
            console.error("Failed to fetch vendors:", error);
            toast({
                title: "Error fetching vendors",
                description: "Could not load vendor list. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoadingVendors(false);
        }
    };

    const handleVendorToggle = (vendorId: string) => {
        setFormData(prev => {
            const isSelected = prev.targetUsers.includes(vendorId);
            return {
                ...prev,
                targetUsers: isSelected
                    ? prev.targetUsers.filter(id => id !== vendorId)
                    : [...prev.targetUsers, vendorId]
            };
        });
    };

    const addMedia = (type: 'image' | 'video') => {
        const url = mediaInput[type];
        if (!url) return;

        setFormData(prev => ({
            ...prev,
            [type === 'image' ? 'images' : 'videos']: [...prev[type === 'image' ? 'images' : 'videos'], url]
        }));
        setMediaInput(prev => ({ ...prev, [type]: "" }));
    };

    const removeMedia = (type: 'image' | 'video', index: number) => {
        setFormData(prev => ({
            ...prev,
            [type === 'image' ? 'images' : 'videos']: prev[type === 'image' ? 'images' : 'videos'].filter((_, i) => i !== index)
        }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(prev => ({ ...prev, [type]: true }));
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        try {
            const res = await api.post('/upload', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                if (type === 'image') {
                    setFormData(prev => ({ ...prev, images: [...prev.images, res.data.url] }));
                } else {
                    setFormData(prev => ({ ...prev, videos: [...prev.videos, res.data.url] }));
                }
                toast({ title: "Upload Success", description: `File uploaded successfully.` });
            }
        } catch (error: any) {
            toast({
                title: "Upload Failed",
                description: error.response?.data?.error || "Failed to upload file",
                variant: "destructive"
            });
        } finally {
            setUploading(prev => ({ ...prev, [type]: false }));
            if (e.target) e.target.value = '';
        }
    };

    const handleSend = async () => {
        if (!formData.title || !formData.message) {
            toast({
                title: "Required Fields",
                description: "Title and Message are mandatory for a broadcast.",
                variant: "destructive"
            });
            return;
        }

        if (formData.audience === 'specific' && formData.targetUsers.length === 0) {
            toast({
                title: "No Audience Selected",
                description: "Please select at least one franchise to receive this broadcast.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                targetUsers: formData.audience === 'all' ? [] : formData.targetUsers,
                targetRole: formData.audience === 'all' ? 'vendor' : undefined
            };

            await api.post("/notifications/broadcast", payload);
            toast({
                title: "Broadcast Sent! ✓",
                description: `Your announcement has been delivered to ${formData.audience === 'all' ? 'all franchises' : `${formData.targetUsers.length} specific franchises`} in real-time.`,
            });
            setFormData({
                title: "",
                message: "",
                type: "system",
                link: "",
                audience: "all",
                targetUsers: [],
                images: [],
                videos: []
            });
        } catch (error) {
            console.error("Broadcast failed:", error);
            toast({
                title: "Delivery Failed",
                description: "Failed to send the broadcast. Please check your connection.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-border/40 shadow-xl bg-card/60 backdrop-blur-sm overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-primary" />
            <CardHeader className="space-y-1">
                <div className="flex items-center gap-2 text-primary mb-2">
                    <Megaphone className="h-5 w-5 animate-bounce" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Global Broadcast Engine</span>
                </div>
                <CardTitle className="text-2xl font-black">Send Announcement</CardTitle>
                <CardDescription className="font-medium">
                    Push a real-time notification to connected franchise dashboards manually.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">

                {/* 1. Title & Type */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Announcement Title</label>
                        <Input
                            placeholder="e.g., New Product Series Launched!"
                            className="bg-background/50 border-border/60 focus:ring-primary/20 h-11 font-bold"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Category</label>
                        <Select
                            value={formData.type}
                            onValueChange={(v) => setFormData({ ...formData, type: v })}
                        >
                            <SelectTrigger className="bg-background/50 border-border/60 h-11 font-bold">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="system" className="font-bold">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-primary" />
                                        <span>System & News</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="alert" className="font-bold">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                        <span>Alert / Warning</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="product" className="font-bold">
                                    <div className="flex items-center gap-2">
                                        <Megaphone className="h-4 w-4 text-purple-500" />
                                        <span>Product Launch</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="warranty" className="font-bold">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                                        <span>Warranty Alerts</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* 2. Message */}
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Message Content</label>
                    <Textarea
                        placeholder="Detailed announcement text..."
                        className="min-h-[100px] bg-background/50 border-border/60 resize-none font-medium leading-relaxed"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                </div>

                {/* 3. Media & Link */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-dashed">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Redirect Link (Optional)</label>
                        <Input
                            placeholder="/shop or https://..."
                            className="bg-background/50 border-border/60 h-10 font-medium text-sm"
                            value={formData.link}
                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                    <ImageIcon className="h-3 w-3" /> Image URLs
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="https://example.com/image.jpg"
                                        className="h-9 text-xs"
                                        value={mediaInput.image}
                                        onChange={(e) => setMediaInput({ ...mediaInput, image: e.target.value })}
                                    />
                                    <Button size="sm" variant="secondary" onClick={() => addMedia('image')}>Add</Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => imageInputRef.current?.click()}
                                        disabled={uploading.image}
                                    >
                                        {uploading.image ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    </Button>
                                    <input
                                        type="file"
                                        ref={imageInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, 'image')}
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.images.map((img, i) => (
                                        <div key={i} className="relative group">
                                            <img src={optimizeCloudinaryUrl(img, { width: 80 })} loading="lazy" alt="preview" className="h-10 w-10 object-cover rounded border" />
                                            <button
                                                onClick={() => removeMedia('image', i)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-2 w-2" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                    <Video className="h-3 w-3" /> Video URLs
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="https://example.com/video.mp4"
                                        className="h-9 text-xs"
                                        value={mediaInput.video}
                                        onChange={(e) => setMediaInput({ ...mediaInput, video: e.target.value })}
                                    />
                                    <Button size="sm" variant="secondary" onClick={() => addMedia('video')}>Add</Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => videoInputRef.current?.click()}
                                        disabled={uploading.video}
                                    >
                                        {uploading.video ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    </Button>
                                    <input
                                        type="file"
                                        ref={videoInputRef}
                                        className="hidden"
                                        accept="video/*"
                                        onChange={(e) => handleFileUpload(e, 'video')}
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.videos.map((vid, i) => (
                                        <div key={i} className="relative group bg-black/10 rounded border px-2 py-1 flex items-center">
                                            <span className="text-[10px] max-w-[100px] truncate">{vid}</span>
                                            <button
                                                onClick={() => removeMedia('video', i)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-2 w-2" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Audience Selection */}
                <div className="space-y-4">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Target Audience</Label>
                    <RadioGroup
                        defaultValue="all"
                        value={formData.audience}
                        onValueChange={(v) => setFormData({ ...formData, audience: v })}
                        className="grid grid-cols-2 gap-4"
                    >
                        <div>
                            <RadioGroupItem value="all" id="audience-all" className="peer sr-only" />
                            <Label
                                htmlFor="audience-all"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                <Megaphone className="mb-3 h-6 w-6" />
                                <div>
                                    <div className="font-bold">All Franchises</div>
                                    <div className="text-xs text-muted-foreground mt-1">Broadcast to everyone</div>
                                </div>
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem value="specific" id="audience-specific" className="peer sr-only" />
                            <Label
                                htmlFor="audience-specific"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                <Users className="mb-3 h-6 w-6" />
                                <div>
                                    <div className="font-bold">Select Specific</div>
                                    <div className="text-xs text-muted-foreground mt-1">Choose individual franchises</div>
                                </div>
                            </Label>
                        </div>
                    </RadioGroup>

                    {/* Specific Vendor Selector */}
                    {/* Specific Vendor Selector */}
                    {formData.audience === 'specific' && (
                        <div className="mt-4 animate-in slide-in-from-top-2 fade-in duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold">Select Franchises ({formData.targetUsers.length})</h4>
                                {loadingVendors && <span className="text-xs text-muted-foreground">Loading...</span>}
                            </div>

                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className="w-full justify-between h-12 bg-background/50 border-border/60"
                                    >
                                        {formData.targetUsers.length > 0
                                            ? `${formData.targetUsers.length} franchise${formData.targetUsers.length > 1 ? 's' : ''} selected`
                                            : "Search and select franchises..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search by name or email..." />
                                        <CommandList>
                                            <CommandEmpty>No franchise found.</CommandEmpty>
                                            <CommandGroup className="max-h-[300px] overflow-auto">
                                                {vendors.map((vendor) => (
                                                    <CommandItem
                                                        key={vendor.id}
                                                        value={vendor.store_name + " " + vendor.email} // Allow search by name or email
                                                        onSelect={() => handleVendorToggle(vendor.id)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                formData.targetUsers.includes(vendor.id) ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{vendor.store_name || vendor.contact_name}</span>
                                                            <span className="text-xs text-muted-foreground">{vendor.email}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            {/* Selected Tokens */}
                            {formData.targetUsers.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {formData.targetUsers.map(userId => {
                                        const vendor = vendors.find(v => v.id === userId);
                                        return vendor ? (
                                            <div key={userId} className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-md border border-primary/20">
                                                {vendor.store_name || vendor.email}
                                                <button
                                                    onClick={() => handleVendorToggle(userId)}
                                                    className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 5. Live Preview */}
                <div className="space-y-4 pt-6 border-t border-dashed">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Live Preview (Franchise View)</label>
                        <Badge variant="outline" className="text-[9px] font-bold py-0 h-4 border-primary/20 text-primary uppercase">Draft</Badge>
                    </div>

                    <div className="relative rounded-2xl border bg-background/30 p-5 shadow-inner overflow-hidden group/preview">
                        <div className="absolute top-0 right-0 p-3 opacity-20 capitalize text-[10px] font-bold italic tracking-tighter">
                            {formData.type}
                        </div>

                        <div className="flex gap-4">
                            <div className={cn(
                                "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border shadow-sm bg-white",
                                formData.type === 'product' ? "text-purple-600 border-purple-100" :
                                    formData.type === 'alert' ? "text-amber-600 border-amber-100" :
                                        "text-blue-600 border-blue-100"
                            )}>
                                {formData.type === 'product' ? <Megaphone className="h-6 w-6" /> :
                                    formData.type === 'alert' ? <AlertTriangle className="h-6 w-6" /> :
                                        <ShieldCheck className="h-6 w-6" />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm border-0 bg-transparent font-black truncate text-foreground/90">
                                        {formData.title || "Announcement Heading"}
                                    </h4>
                                    <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">Just Now</span>
                                </div>
                                <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2">
                                    {formData.message || "Enter a message above to see how it will appear on franchise dashboards..."}
                                </p>

                                {(formData.images.length > 0 || formData.videos.length > 0) && (
                                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                        {formData.images.map((img, i) => (
                                            <div key={i} className="h-14 w-14 rounded-lg border bg-muted shrink-0 overflow-hidden shadow-sm transition-transform hover:scale-105 cursor-help">
                                                <img src={optimizeCloudinaryUrl(img, { width: 100 })} loading="lazy" className="h-full w-full object-cover" alt="" />
                                            </div>
                                        ))}
                                        {formData.videos.map((vid, i) => (
                                            <div key={i} className="h-14 w-14 rounded-lg border bg-primary/5 flex flex-col items-center justify-center shrink-0 shadow-sm border-primary/10">
                                                <Video className="h-4 w-4 text-primary mb-1" />
                                                <span className="text-[8px] font-black uppercase text-primary/60">MP4</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {formData.link && (
                                    <div className="mt-3 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-primary opacity-60">
                                        Link Attached <ChevronRight className="h-3 w-3" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <Button
                    className="w-full h-12 text-sm font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 mt-4 group"
                    onClick={handleSend}
                    disabled={loading}
                >
                    {loading ? (
                        "Transmitting Alert..."
                    ) : (
                        <>
                            Fire Broadcast <Send className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
};
