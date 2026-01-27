import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Package, Sparkles, RefreshCw } from "lucide-react";
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

export const ProductCatalogue = () => {
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
            if (catRes.data.success) {
                console.log("Fetched categories:", catRes.data.categories);
                setCategories(catRes.data.categories);
            }
            if (prodRes.data.success) {
                console.log("Fetched products count:", prodRes.data.products.length);
                setProducts(prodRes.data.products);
            }
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
            (product.description?.short && product.description.short.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
        if (searchTerm && matchesSearch && matchesCategory) console.log("Product matches:", product.name);
        return matchesSearch && matchesCategory;
    });

    console.log("Rendering filteredProducts count:", filteredProducts.length);

    return (
        <div className="space-y-10 py-2">
            {/* Search Section */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex-1" />
                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-brand-orange transition-colors" />
                        <Input
                            placeholder="Search collection..."
                            className="pl-12 h-12 bg-white/50 border-gray-100 rounded-2xl shadow-sm focus-visible:ring-brand-orange/20 focus-visible:border-brand-orange transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchData}
                        disabled={loading}
                        className="h-12 px-6 rounded-full border-orange-100 text-orange-600 font-bold hover:bg-orange-50 transition-all flex items-center gap-2 shadow-sm shrink-0"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Premium Category Bar */}
            <div className="space-y-4">
                <div className="flex items-baseline justify-between px-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Shop by Category</h3>
                    <Button
                        variant="link"
                        size="sm"
                        onClick={() => setSelectedCategory(null)}
                        className={`text-xs h-auto p-0 ${selectedCategory === null ? 'text-brand-orange font-bold' : 'text-gray-400'}`}
                    >
                        View All
                    </Button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 mask-linear">
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
                <div className="flex items-baseline justify-between px-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                        {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Featured Items'}
                    </h3>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{filteredProducts.length} Results</span>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="glass-card-premium rounded-2xl h-80 animate-pulse opacity-50" />
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50 backdrop-blur-sm">
                        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Package className="h-8 w-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No products found</h3>
                        <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 font-medium">Try adjusting your filters or browse a different collection</p>
                        <Button
                            variant="outline"
                            className="mt-6 border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white rounded-xl text-xs px-6"
                            onClick={() => { setSearchTerm(""); setSelectedCategory(null); }}
                        >
                            Reset
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                .mask-linear {
                    mask-image: linear-gradient(to right, black 90%, transparent 100%);
                }
            `}} />
        </div>
    );
};
