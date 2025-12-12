import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Trash2, Plus, Package, Pencil } from "lucide-react";

interface Product {
    id: string;
    name: string;
    type: 'seat_cover' | 'ev_product';
    warranty_years: string;
    updated_at?: string;
}

export function ProductManagement() {
    const { toast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [newProduct, setNewProduct] = useState({
        name: "",
        type: "seat_cover",
        warranty_years: ""
    });

    const fetchProducts = async () => {
        try {
            const response = await api.get('/public/products');
            if (response.data.success) {
                setProducts(response.data.products);
            }
        } catch (error) {
            console.error("Failed to fetch products", error);
            toast({
                title: "Error",
                description: "Failed to load products",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.warranty_years) {
            toast({
                title: "Error",
                description: "Please fill in all fields",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await api.post('/admin/products', newProduct);
            if (response.data.success) {
                toast({
                    title: "Success",
                    description: "Product added successfully",
                });
                setIsAddDialogOpen(false);
                setNewProduct({ name: "", type: "seat_cover", warranty_years: "" });
                fetchProducts();
            }
        } catch (error) {
            console.error("Failed to add product", error);
            toast({
                title: "Error",
                description: "Failed to add product",
                variant: "destructive",
            });
        }
    };

    const handleUpdateProduct = async () => {
        if (!editingProduct || !editingProduct.name || !editingProduct.warranty_years) {
            toast({
                title: "Error",
                description: "Please fill in all fields",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await api.put(`/admin/products/${editingProduct.id}`, editingProduct);
            if (response.data.success) {
                toast({
                    title: "Success",
                    description: "Product updated successfully",
                });
                setIsEditDialogOpen(false);
                setEditingProduct(null);
                fetchProducts();
            }
        } catch (error) {
            console.error("Failed to update product", error);
            toast({
                title: "Error",
                description: "Failed to update product",
                variant: "destructive",
            });
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;

        try {
            const response = await api.delete(`/admin/products/${id}`);
            if (response.data.success) {
                toast({
                    title: "Success",
                    description: "Product deleted successfully",
                });
                fetchProducts();
            }
        } catch (error) {
            console.error("Failed to delete product", error);
            toast({
                title: "Error",
                description: "Failed to delete product",
                variant: "destructive",
            });
        }
    };

    const openEditDialog = (product: Product) => {
        setEditingProduct(product);
        setIsEditDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Product Management</h2>
                    <p className="text-muted-foreground">
                        Manage products and their warranty periods
                    </p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Product
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Product</DialogTitle>
                            <DialogDescription>
                                Add a new product to the catalog.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Product Name</Label>
                                <Input
                                    id="name"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    placeholder="e.g., Premium Leather Seat Cover"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Product Type</Label>
                                <Select
                                    value={newProduct.type}
                                    onValueChange={(value) => setNewProduct({ ...newProduct, type: value as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="seat_cover">Seat Cover</SelectItem>
                                        <SelectItem value="ev_product">EV Product</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="warranty">Warranty Period</Label>
                                <Input
                                    id="warranty"
                                    value={newProduct.warranty_years}
                                    onChange={(e) => setNewProduct({ ...newProduct, warranty_years: e.target.value })}
                                    placeholder="e.g., 1 Year, 1+1 Years"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddProduct}>Add Product</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Product</DialogTitle>
                            <DialogDescription>
                                Update product details.
                            </DialogDescription>
                        </DialogHeader>
                        {editingProduct && (
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name">Product Name</Label>
                                    <Input
                                        id="edit-name"
                                        value={editingProduct.name}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                        placeholder="e.g., Premium Leather Seat Cover"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-type">Product Type</Label>
                                    <Select
                                        value={editingProduct.type}
                                        onValueChange={(value) => setEditingProduct({ ...editingProduct, type: value as any })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="seat_cover">Seat Cover</SelectItem>
                                            <SelectItem value="ev_product">EV Product</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-warranty">Warranty Period</Label>
                                    <Input
                                        id="edit-warranty"
                                        value={editingProduct.warranty_years}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, warranty_years: e.target.value })}
                                        placeholder="e.g., 1 Year, 1+1 Years"
                                    />
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateProduct}>Update Product</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">S.No</TableHead>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Warranty Period</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    Loading products...
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No products found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product, index) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center">
                                            <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                                            {product.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {product.type === 'seat_cover' ? 'Seat Cover' : 'EV Product'}
                                    </TableCell>
                                    <TableCell>{product.warranty_years}</TableCell>
                                    <TableCell>
                                        {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditDialog(product)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive/90"
                                                onClick={() => handleDeleteProduct(product.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
