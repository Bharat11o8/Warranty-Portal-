import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Package, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ProductCard } from "../catalog/ProductCard";
import { CategoryCard } from "../catalog/CategoryCard";

interface Category {
    id: string;
    name: string;
    description: string;
    image: string;
}

interface Product {
    id: string;
    name: string;
    price: { regular: number; sale: number; twoRow?: number; threeRow?: number };
    description: { short: string; long: string };
    images: string[];
    category_id: string;
    in_stock: boolean;
    rating?: number;
}

export function ProductCatalog() {
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.short?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-10 py-4">
            {/* Hero / Header Section */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-brand-orange animate-pulse" />
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">E-Shop Catalogue</h2>
                    </div>
                    <p className="text-gray-500 font-medium">Discover premium products for your franchise</p>
                </div>
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-brand-orange transition-colors" />
                    <Input
                        placeholder="Search our collection..."
                        className="pl-12 h-14 bg-white border-gray-100 rounded-2xl shadow-sm focus-visible:ring-brand-orange/20 focus-visible:border-brand-orange transition-all text-base"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Premium Category Bar */}
            <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Collections</h3>
                    <Button
                        variant="link"
                        size="sm"
                        onClick={() => setSelectedCategory(null)}
                        className={`text-xs h-auto p-0 ${selectedCategory === null ? 'text-brand-orange font-bold' : 'text-gray-400'}`}
                    >
                        View All
                    </Button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 mask-linear-right">
                    <CategoryCard
                        category={{ id: 'all', name: 'All Products' }}
                        isSelected={selectedCategory === null}
                        onClick={() => setSelectedCategory(null)}
                    />
                    {categories.map(cat => (
                        <CategoryCard
                            key={cat.id}
                            category={cat}
                            isSelected={selectedCategory === cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <div className="space-y-6">
                <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">
                        {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Trending Products'}
                    </h3>
                    <span className="text-xs text-gray-400 font-medium">{filteredProducts.length} items found</span>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="glass-card-premium rounded-2xl h-96 animate-pulse opacity-50" />
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-24 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/30">
                        <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <Package className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">No matches found</h3>
                        <p className="text-gray-500 max-w-xs mx-auto mt-2">Try adjusting your search filters or browse other categories</p>
                        <Button
                            variant="outline"
                            className="mt-8 border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white rounded-xl"
                            onClick={() => { setSearchTerm(""); setSelectedCategory(null); }}
                        >
                            Reset Selection
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                categoryName={categories.find(c => c.id === product.category_id)?.name}
                            />
                        ))}
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .mask-linear-right {
                    mask-image: linear-gradient(to right, black 85%, transparent 100%);
                }
            `}} />
        </div>
    );
}
