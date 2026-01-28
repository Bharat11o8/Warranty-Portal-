import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { downloadCSV } from "@/lib/utils";
import { Trash2, Plus, Package, Pencil, FolderTree, X, Loader2, Search, Download } from "lucide-react";


interface Category {
    id: string;
    name: string;
    description: string;
    image: string;
    parentId?: string;
}

interface Variation {
    name: string;
    price: number;
    sku?: string;
    stockQuantity?: number;
    description?: string;
    images?: string[];
}

interface Product {
    id: string;
    name: string;
    price: any;
    description: string[] | string;
    images: string[];
    categoryId: string;
    inStock: boolean;
    isFeatured?: boolean;
    isNewArrival?: boolean;
    variations?: Variation[];
    additionalInfo?: any;
}

export function AdminProducts() {
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Category State
    const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [catForm, setCatForm] = useState({ name: "", description: "", image: "", parentId: "" });

    // Product State
    const [isProdDialogOpen, setIsProdDialogOpen] = useState(false);
    const [editingProd, setEditingProd] = useState<Product | null>(null);
    const [prodForm, setProdForm] = useState({
        name: "",
        description: "",
        categoryId: "",
        inStock: true,
        isFeatured: false,
        isNewArrival: false,
        images: [] as string[],
        variations: [] as Variation[],
        additionalInfo: [] as string[],
        colors: "" // Temporary state for comma-separated colors
    });
    const [imageUrlInput, setImageUrlInput] = useState("");

    // Delete confirmation
    const [deleteDialog, setDeleteDialog] = useState<{ type: 'category' | 'product'; id: string; name: string } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, prodRes] = await Promise.all([
                api.get('/catalog/categories'),
                api.get('/catalog/products')
            ]);
            if (catRes.data.success) setCategories(catRes.data.categories);
            if (prodRes.data.success) setProducts(prodRes.data.products);
        } catch (error) {
            console.error("Failed to fetch catalog data", error);
            toast({ title: "Error", description: "Failed to load catalog data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter Logic
    const filteredProducts = products.filter(p => {
        const term = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(term) ||
            (Array.isArray(p.description) && p.description.some(d => d.toLowerCase().includes(term))) ||
            (typeof p.description === 'string' && p.description.toLowerCase().includes(term));
    });

    // Helper functions (Images, Variations, etc.)
    const removeImage = (index: number) => {
        setProdForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    };

    const addImageByUrl = () => {
        if (!imageUrlInput.trim()) return;
        setProdForm(prev => ({ ...prev, images: [...prev.images, imageUrlInput.trim()] }));
        setImageUrlInput("");
    };

    const addVariation = () => {
        setProdForm(prev => ({ ...prev, variations: [...prev.variations, { name: "", price: 0, sku: "", stockQuantity: 10 }] }));
    };

    const updateVariation = (index: number, field: keyof Variation, value: any) => {
        setProdForm(prev => ({
            ...prev,
            variations: prev.variations.map((v, i) => i === index ? { ...v, [field]: value } : v)
        }));
    };

    const removeVariation = (index: number) => {
        setProdForm(prev => ({ ...prev, variations: prev.variations.filter((_, i) => i !== index) }));
    };

    const addVariationImageUrl = (vIndex: number, url: string) => {
        if (!url) return;
        setProdForm(prev => {
            const newVars = [...prev.variations];
            newVars[vIndex].images = [...(newVars[vIndex].images || []), url];
            return { ...prev, variations: newVars };
        });
    };

    const removeVariationImage = (vIndex: number, imgIndex: number) => {
        setProdForm(prev => {
            const newVars = [...prev.variations];
            newVars[vIndex].images = (newVars[vIndex].images || []).filter((_, i) => i !== imgIndex);
            return { ...prev, variations: newVars };
        });
    };

    // CRUD Operations
    const handleSaveCategory = async () => {
        try {
            if (editingCat) {
                await api.put(`/catalog/categories/${editingCat.id}`, catForm);
                toast({ title: "Success", description: "Category updated" });
            } else {
                await api.post('/catalog/categories', catForm);
                toast({ title: "Success", description: "Category added" });
            }
            setIsCatDialogOpen(false);
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save category", variant: "destructive" });
        }
    };

    const handleDeleteCategory = async () => {
        if (!deleteDialog) return;
        try {
            await api.delete(`/catalog/categories/${deleteDialog.id}`);
            toast({ title: "Success", description: "Category deleted" });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
        } finally {
            setDeleteDialog(null);
        }
    };

    const openProdDialog = (prod?: Product) => {
        if (prod) {
            setEditingProd(prod);
            setProdForm({
                name: prod.name,
                description: Array.isArray(prod.description) ? prod.description.join('\n') : (prod.description || ""),
                categoryId: prod.categoryId,
                inStock: prod.inStock,
                isFeatured: prod.isFeatured || false,
                isNewArrival: prod.isNewArrival || false,
                images: prod.images || [],
                variations: (prod.variations || []).map(v => ({
                    ...v,
                    description: (v as any).meta?.description || v.description || ""
                })),
                additionalInfo: prod.additionalInfo || [],
                colors: (prod as any).additionalInfo?.colors?.join(", ") || ""
            });
        } else {
            setEditingProd(null);
            setProdForm({
                name: "",
                description: "",
                categoryId: "",
                inStock: true,
                isFeatured: false,
                isNewArrival: false,
                images: [],
                variations: [],
                additionalInfo: [],
                colors: ""
            });
        }
        setIsProdDialogOpen(true);
    };

    const handleSaveProduct = async () => {
        const payload = {
            name: prodForm.name,
            description: prodForm.description.split('\n').filter(l => l.trim()),
            categoryId: prodForm.categoryId || null,
            inStock: prodForm.inStock,
            isFeatured: prodForm.isFeatured,
            isNewArrival: prodForm.isNewArrival,
            images: prodForm.images,
            variations: prodForm.variations.filter(v => v.name && v.price > 0),
            additionalInfo: {
                ...((editingProd as any)?.additionalInfo || {}),
                colors: prodForm.colors ? prodForm.colors.split(',').map(c => c.trim()).filter(Boolean) : []
            },
            price: (function () {
                const vars = prodForm.variations;
                const twoRow = vars.find(v => v.name.toLowerCase().includes('2 row'));
                const threeRow = vars.find(v => v.name.toLowerCase().includes('3 row'));

                if (twoRow || threeRow) {
                    return { twoRow: twoRow?.price || 0, threeRow: threeRow?.price || 0 };
                }
                if (vars.length > 0) return Math.min(...vars.map(v => v.price));
                return 0;
            })()
        };

        try {
            if (editingProd) {
                await api.put(`/catalog/products/${editingProd.id}`, payload);
                toast({ title: "Success", description: "Product updated" });
            } else {
                await api.post('/catalog/products', payload);
                toast({ title: "Success", description: "Product added" });
            }
            setIsProdDialogOpen(false);
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save product", variant: "destructive" });
        }
    };

    const handleDeleteProduct = async () => {
        if (!deleteDialog) return;
        try {
            await api.delete(`/catalog/products/${deleteDialog.id}`);
            toast({ title: "Success", description: "Product deleted" });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
        } finally {
            setDeleteDialog(null);
        }
    };

    const getDisplayPrice = (product: Product) => {
        if (typeof product.price === 'object') {
            return `₹${product.price.twoRow || product.price.threeRow || 0}`;
        }
        return `₹${product.price || 0}`;
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="products" className="space-y-4">
                <TabsList className="bg-white border text-slate-600">
                    <TabsTrigger value="products" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">Products</TabsTrigger>
                    <TabsTrigger value="categories" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">Categories</TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 border-orange-100 focus:border-orange-200"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => {
                                const exportData = filteredProducts.map(p => {
                                    const catName = categories.find(c => c.id === p.categoryId)?.name || "Uncategorized";
                                    const variationsStr = p.variations?.map(v => `${v.name} (₹${v.price})`).join(", ") || "";
                                    const displayPrice = typeof p.price === 'object' ? `₹${p.price.twoRow || 0} / ₹${p.price.threeRow || 0}` : `₹${p.price || 0}`;

                                    return {
                                        "Product Name": p.name,
                                        "Category": catName,
                                        "Price": displayPrice,
                                        "Stock Status": p.inStock ? "In Stock" : "Out of Stock",
                                        "Variations": variationsStr,
                                        "Featured": p.isFeatured ? "Yes" : "No",
                                        "New Arrival": p.isNewArrival ? "Yes" : "No",
                                        "Description": Array.isArray(p.description) ? p.description.join(" ") : p.description
                                    };
                                });
                                downloadCSV(exportData, `products_${new Date().toISOString().split('T')[0]}.csv`);
                            }} className="gap-2">
                                <Download className="h-4 w-4" /> Export
                            </Button>
                            <Button onClick={() => openProdDialog()} className="bg-orange-600 hover:bg-orange-700">
                                <Plus className="mr-2 h-4 w-4" /> Add Product
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-lg border border-orange-100 bg-white overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-500" /></TableCell></TableRow>
                                ) : filteredProducts.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No products found</TableCell></TableRow>
                                ) : (
                                    filteredProducts.map(product => (
                                        <TableRow key={product.id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                                                        {product.images?.[0] ?
                                                            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" /> :
                                                            <Package className="h-5 w-5 text-slate-400" />
                                                        }
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-800">{product.name}</div>
                                                        {product.variations && product.variations.length > 0 && (
                                                            <div className="text-xs text-slate-500">{product.variations.length} variations</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {categories.find(c => c.id === product.categoryId)?.name || <span className="text-slate-400 italic">Uncategorized</span>}
                                            </TableCell>
                                            <TableCell className="font-mono text-slate-600">{getDisplayPrice(product)}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${product.inStock ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                                                    </span>
                                                    {product.isFeatured && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100">Featured</span>}
                                                    {product.isNewArrival && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">New</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-orange-600 hover:bg-orange-50" onClick={() => openProdDialog(product)}><Pencil className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteDialog({ type: 'product', id: product.id, name: product.name })}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="categories" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => { setEditingCat(null); setCatForm({ name: "", description: "", image: "", parentId: "" }); setIsCatDialogOpen(true); }} className="bg-orange-600 hover:bg-orange-700">
                            <Plus className="mr-2 h-4 w-4" /> Add Category
                        </Button>
                    </div>

                    <div className="rounded-lg border border-orange-100 bg-white overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>Category Name</TableHead>
                                    <TableHead>Parent Category</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map(cat => (
                                    <TableRow key={cat.id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <FolderTree className="h-4 w-4 text-orange-500" />
                                                {cat.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-500">{categories.find(c => c.id === cat.parentId)?.name || '-'}</TableCell>
                                        <TableCell className="text-slate-500 truncate max-w-xs">{cat.description || '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-orange-600 hover:bg-orange-50" onClick={() => { setEditingCat(cat); setCatForm({ name: cat.name, description: cat.description, image: cat.image, parentId: cat.parentId || "" }); setIsCatDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteDialog({ type: 'category', id: cat.id, name: cat.name })}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Category Dialog */}
            <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCat ? 'Edit Category' : 'Add Category'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Category Name *</Label>
                            <Input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} placeholder="e.g., Seat Covers" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} placeholder="Optional description" />
                        </div>
                        <div className="space-y-2">
                            <Label>Parent Category</Label>
                            <Select value={catForm.parentId} onValueChange={v => setCatForm({ ...catForm, parentId: v === "none" ? "" : v })}>
                                <SelectTrigger><SelectValue placeholder="None (Top Level)" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (Top Level)</SelectItem>
                                    {categories.filter(c => c.id !== editingCat?.id).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Image URL</Label>
                            <Input value={catForm.image} onChange={e => setCatForm({ ...catForm, image: e.target.value })} placeholder="https://..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCatDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveCategory} disabled={!catForm.name} className="bg-orange-600 hover:bg-orange-700">Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Product Dialog */}
            <Dialog open={isProdDialogOpen} onOpenChange={setIsProdDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingProd ? 'Edit Product' : 'Add Product'}</DialogTitle>
                    </DialogHeader>
                    {/* Simplified Form for brevity - reusing logic from CatalogManagement but with updated UI style */}
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Product Name *</Label>
                                <Input value={prodForm.name} onChange={e => setProdForm({ ...prodForm, name: e.target.value })} placeholder="Product Name" />
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={prodForm.categoryId} onValueChange={v => setProdForm({ ...prodForm, categoryId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 pt-6">
                                <div className="flex items-center gap-4">
                                    <Label>In Stock</Label>
                                    <Switch checked={prodForm.inStock} onCheckedChange={v => setProdForm({ ...prodForm, inStock: v })} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={prodForm.description} onChange={e => setProdForm({ ...prodForm, description: e.target.value })} rows={3} placeholder="Product description..." />
                        </div>

                        <div className="space-y-2">
                            <Label>Images</Label>
                            <div className="flex gap-2">
                                <Input value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)} placeholder="Image URL" />
                                <Button onClick={addImageByUrl} variant="outline">Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {prodForm.images.map((url, i) => (
                                    <div key={i} className="relative group">
                                        <img src={url} className="w-16 h-16 object-cover rounded border" />
                                        <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="py-2 border-t">
                            <div className="flex justify-between items-center mb-2">
                                <Label>Variations (Prices)</Label>
                                <Button size="sm" variant="outline" onClick={addVariation}><Plus className="h-3 w-3 mr-1" /> Add</Button>
                            </div>
                            {prodForm.variations.map((v, i) => (
                                <div key={i} className="flex gap-2 mb-2 items-start">
                                    <Input value={v.name} onChange={e => updateVariation(i, 'name', e.target.value)} placeholder="Name (e.g. Small)" className="flex-1" />
                                    <Input type="number" value={v.price} onChange={e => updateVariation(i, 'price', Number(e.target.value))} placeholder="Price" className="w-24" />
                                    <Button variant="ghost" size="icon" onClick={() => removeVariation(i)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsProdDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveProduct} className="bg-orange-600 hover:bg-orange-700">Save Product</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <AlertDialogDescription>Are you sure you want to delete this {deleteDialog?.type}? This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteDialog?.type === 'category' ? handleDeleteCategory : handleDeleteProduct} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
