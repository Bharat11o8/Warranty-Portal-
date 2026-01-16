import { useState, useEffect, useRef } from "react";
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
import { Trash2, Plus, Package, Pencil, FolderTree, X, Loader2 } from "lucide-react";


interface Category {
    id: string;
    name: string;
    description: string;
    image: string;
    parentId?: string;
}

interface Variation {
    id?: string;
    name: string;
    price: number;
    sku?: string;
    stockQuantity?: number;
    attributes?: Record<string, string>;
    description?: string;
    images?: string[];
}

interface Product {
    id: string;
    name: string;
    price: any;
    description: string[];
    images: string[];
    categoryId: string;
    inStock: boolean;
    isFeatured?: boolean;
    isNewArrival?: boolean;
    variations?: Variation[];
    additionalInfo?: string[];
}

export function CatalogManagement() {
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

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

    // URL input state


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

    const removeImage = (index: number) => {
        setProdForm(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const addImageByUrl = () => {
        if (!imageUrlInput.trim()) return;
        setProdForm(prev => ({
            ...prev,
            images: [...prev.images, imageUrlInput.trim()]
        }));
        setImageUrlInput("");
        toast({ title: "Image Added", description: "Image link added successfully" });
    };

    // ===================== VARIATIONS =====================
    const addVariation = () => {
        setProdForm(prev => ({
            ...prev,
            variations: [...prev.variations, { name: "", price: 0, sku: "", stockQuantity: 10 }]
        }));
    };

    const updateVariation = (index: number, field: keyof Variation, value: any) => {
        setProdForm(prev => ({
            ...prev,
            variations: prev.variations.map((v, i) => i === index ? { ...v, [field]: value } : v)
        }));
    };

    const removeVariation = (index: number) => {
        setProdForm(prev => ({
            ...prev,
            variations: prev.variations.filter((_, i) => i !== index)
        }));
    };

    const addVariationImageUrl = (vIndex: number, url: string) => {
        if (!url) return;
        setProdForm(prev => {
            const newVars = [...prev.variations];
            const v = newVars[vIndex];
            v.images = [...(v.images || []), url];
            return { ...prev, variations: newVars };
        });
    };

    const removeVariationImage = (vIndex: number, imgIndex: number) => {
        setProdForm(prev => {
            const newVars = [...prev.variations];
            const v = newVars[vIndex];
            v.images = (v.images || []).filter((_, i) => i !== imgIndex);
            return { ...prev, variations: newVars };
        });
    };

    // ===================== CATEGORY CRUD =====================
    const openCatDialog = (cat?: Category) => {
        if (cat) {
            setEditingCat(cat);
            setCatForm({ name: cat.name, description: cat.description, image: cat.image, parentId: cat.parentId || "" });
        } else {
            setEditingCat(null);
            setCatForm({ name: "", description: "", image: "", parentId: "" });
        }
        setIsCatDialogOpen(true);
    };

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

    // ===================== PRODUCT CRUD =====================
    const openProdDialog = (prod?: Product) => {
        if (prod) {
            setEditingProd(prod);
            setProdForm({
                name: prod.name,
                description: Array.isArray(prod.description) ? prod.description.join('\n') : prod.description,
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
        setImageUrlInput("");
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
                const colors = prodForm.colors ? prodForm.colors.split(',').map(c => c.trim()).filter(Boolean) : [];
                const vars = prodForm.variations;

                // If it looks like seat covers (2 Row/3 Row)
                const twoRow = vars.find(v => v.name.toLowerCase().includes('2 row'));
                const threeRow = vars.find(v => v.name.toLowerCase().includes('3 row'));

                if (twoRow || threeRow) {
                    return { twoRow: twoRow?.price || 0, threeRow: threeRow?.price || 0 };
                }

                // Otherwise return min price if variations exist, else 0 (or a designated field if we add one)
                if (vars.length > 0) {
                    return Math.min(...vars.map(v => v.price));
                }

                return 0; // Default if no variations and no price input
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

    // ===================== RENDER =====================
    const getDisplayPrice = (product: Product) => {
        if (typeof product.price === 'object') {
            return `₹${product.price.twoRow || product.price.threeRow || 0}`;
        }
        return `₹${product.price || 0}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">E-Shop CMS</h2>
                    <p className="text-muted-foreground">Manage store categories and products</p>
                </div>
            </div>

            <Tabs defaultValue="products" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
                    <TabsTrigger value="categories">Categories ({categories.length})</TabsTrigger>
                </TabsList>

                {/* Products Tab */}
                <TabsContent value="products" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => openProdDialog()}>
                            <Plus className="mr-2 h-4 w-4" /> Add Product
                        </Button>
                    </div>

                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
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
                                    <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                                ) : products.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-8">No products yet</TableCell></TableRow>
                                ) : (
                                    products.map(product => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {product.images?.[0] ? <img src={product.images[0]} className="w-10 h-10 rounded object-cover" /> : <Package className="w-10 h-10 text-muted p-2 bg-muted rounded" />}
                                                    <div>
                                                        <div>{product.name}</div>
                                                        {product.variations && product.variations.length > 0 && (
                                                            <div className="text-xs text-muted-foreground">{product.variations.length} variation(s)</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{categories.find(c => c.id === product.categoryId)?.name || 'Uncategorized'}</TableCell>
                                            <TableCell>{getDisplayPrice(product)}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className={`px-2 py-1 rounded-full text-xs w-fit ${product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                                                    </span>
                                                    {product.isFeatured && (
                                                        <span className="px-2 py-1 rounded-full text-xs w-fit bg-amber-100 text-amber-800">
                                                            Featured
                                                        </span>
                                                    )}
                                                    {product.isNewArrival && (
                                                        <span className="px-2 py-1 rounded-full text-xs w-fit bg-blue-100 text-blue-800">
                                                            New Arrival
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => openProdDialog(product)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteDialog({ type: 'product', id: product.id, name: product.name })}><Trash2 className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {/* Categories Tab */}
                <TabsContent value="categories" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => openCatDialog()}>
                            <Plus className="mr-2 h-4 w-4" /> Add Category
                        </Button>
                    </div>

                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Parent</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                                ) : categories.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8">No categories yet</TableCell></TableRow>
                                ) : (
                                    categories.map(cat => (
                                        <TableRow key={cat.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FolderTree className="w-4 h-4 text-muted-foreground" />
                                                    {cat.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>{categories.find(c => c.id === cat.parentId)?.name || '-'}</TableCell>
                                            <TableCell className="text-muted-foreground truncate max-w-xs">{cat.description || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => openCatDialog(cat)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteDialog({ type: 'category', id: cat.id, name: cat.name })}><Trash2 className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
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
                            <Textarea value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} placeholder="Optional category description" />
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
                        <Button onClick={handleSaveCategory} disabled={!catForm.name}>Save Category</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Product Dialog */}
            <Dialog open={isProdDialogOpen} onOpenChange={setIsProdDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingProd ? 'Edit Product' : 'Add Product'}</DialogTitle>
                        <DialogDescription>Fill in the product details below</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Product Name *</Label>
                                <Input value={prodForm.name} onChange={e => setProdForm({ ...prodForm, name: e.target.value })} placeholder="e.g., U-Sports Premium Seat Cover" />
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
                            <div className="space-y-2 flex flex-col gap-4 pt-4">
                                <div className="flex items-center gap-4">
                                    <Label className="w-24">In Stock</Label>
                                    <Switch checked={prodForm.inStock} onCheckedChange={v => setProdForm({ ...prodForm, inStock: v })} />
                                </div>
                                <div className="flex items-center gap-4">
                                    <Label className="w-24">Featured</Label>
                                    <Switch checked={prodForm.isFeatured} onCheckedChange={v => setProdForm({ ...prodForm, isFeatured: v })} />
                                </div>
                                <div className="flex items-center gap-4">
                                    <Label className="w-24">New Arrival</Label>
                                    <Switch checked={prodForm.isNewArrival} onCheckedChange={v => setProdForm({ ...prodForm, isNewArrival: v })} />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label>Description (one feature per line)</Label>
                            <Textarea
                                value={prodForm.description}
                                onChange={e => setProdForm({ ...prodForm, description: e.target.value })}
                                placeholder="Premium quality leather&#10;Easy installation&#10;5-year warranty"
                                rows={4}
                            />
                        </div>

                        {/* Images */}
                        <div className="space-y-2">
                            <Label>Product Images</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {prodForm.images.map((url, i) => (
                                    <div key={i} className="relative group">
                                        <img src={url} className="w-20 h-20 rounded object-cover border" />
                                        <button
                                            onClick={() => removeImage(i)}
                                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Paste image URL (from WordPress/External)"
                                    value={imageUrlInput}
                                    onChange={(e) => setImageUrlInput(e.target.value)}
                                />
                                <Button variant="secondary" onClick={addImageByUrl} disabled={!imageUrlInput}>
                                    Add Link
                                </Button>
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="space-y-2">
                            <Label>Available Colors (Comma separated)</Label>
                            <Input
                                placeholder="Red, Blue, Green, Carbon Fiber..."
                                value={(prodForm as any).colors}
                                onChange={e => setProdForm({ ...prodForm, colors: e.target.value } as any)}
                            />
                            <p className="text-xs text-muted-foreground">These will be shown below the description on the product page.</p>
                        </div>

                        {/* Variations */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>Price Variations</Label>
                                <Button variant="outline" size="sm" onClick={addVariation}>
                                    <Plus className="mr-1 h-3 w-3" /> Add Variation
                                </Button>
                            </div>
                            {prodForm.variations.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No variations. Click "Add Variation" for products with multiple prices (e.g., 2-Row, 3-Row).</p>
                            ) : (
                                <div className="space-y-2">
                                    {prodForm.variations.map((v, i) => (
                                        <div key={i} className="p-4 border rounded space-y-3 bg-muted/30">
                                            <div className="flex gap-2 items-center">
                                                <Input
                                                    placeholder="Variation Name (e.g., Lavender)"
                                                    value={v.name}
                                                    onChange={e => updateVariation(i, 'name', e.target.value)}
                                                    className="flex-1"
                                                />
                                                <Input
                                                    placeholder="Price"
                                                    type="number"
                                                    value={v.price}
                                                    onChange={e => updateVariation(i, 'price', Number(e.target.value))}
                                                    className="w-24"
                                                />
                                                <Input
                                                    placeholder="SKU"
                                                    value={v.sku || ''}
                                                    onChange={e => updateVariation(i, 'sku', e.target.value)}
                                                    className="w-24"
                                                />
                                                <Button variant="ghost" size="icon" onClick={() => removeVariation(i)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs">Variation Description</Label>
                                                <Textarea
                                                    placeholder="Specific description for this variation..."
                                                    value={v.description || ""}
                                                    onChange={e => updateVariation(i, 'description', e.target.value)}
                                                    rows={2}
                                                    className="text-sm"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs">Variation Images</Label>
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {(v.images || []).map((img, imgIdx) => (
                                                        <div key={imgIdx} className="relative group">
                                                            <img src={img} className="w-12 h-12 rounded object-cover border" />
                                                            <button
                                                                onClick={() => removeVariationImage(i, imgIdx)}
                                                                className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="h-2 w-2" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Variation Image URL"
                                                        className="h-8 text-xs"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                addVariationImageUrl(i, (e.target as HTMLInputElement).value);
                                                                (e.target as HTMLInputElement).value = '';
                                                            }
                                                        }}
                                                    />
                                                    <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={(e) => {
                                                        const input = (e.currentTarget.previousSibling as HTMLInputElement);
                                                        addVariationImageUrl(i, input.value);
                                                        input.value = '';
                                                    }}>Add</Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsProdDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveProduct} disabled={!prodForm.name}>Save Product</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {deleteDialog?.type}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deleteDialog?.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={deleteDialog?.type === 'category' ? handleDeleteCategory : handleDeleteProduct}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
