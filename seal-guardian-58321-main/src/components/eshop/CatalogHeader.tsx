import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Car,
    Gauge,
    LayoutList,
    Search,
    ChevronDown,
    Menu,
    X,
    Settings,
    Wrench,
    Zap,
    Shield,
    Wind,
    Eye,
    Lightbulb,
    Volume2,
    Fuel,
    Cog,
    Battery,
    Camera,
    Navigation,
    Truck,
    Lock,
    Key,
    Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { fetchCategories, fetchProducts, Product, Category } from '@/lib/catalogService';

const CatalogHeader = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mobileExpandedCategory, setMobileExpandedCategory] = useState<string | null>(null);
    const [mainCategories, setMainCategories] = useState<Category[]>([]);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [cats, prods] = await Promise.all([
                    fetchCategories(),
                    fetchProducts()
                ]);
                setAllCategories(cats);

                // Priority sorting for main categories
                const priority = ["seat cover", "accessories", "mat"];
                const mainCats = cats.filter(c => !c.parentId).sort((a, b) => {
                    const aName = a.name.toLowerCase();
                    const bName = b.name.toLowerCase();

                    const aIndex = priority.findIndex(p => aName.includes(p));
                    const bIndex = priority.findIndex(p => bName.includes(p));

                    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                    if (aIndex !== -1) return -1;
                    if (bIndex !== -1) return 1;
                    return aName.localeCompare(bName);
                });

                setMainCategories(mainCats);
                setAllProducts(prods);
            } catch (error) {
                console.error("Error loading header data:", error);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        if (searchTerm.length >= 2) {
            const filteredProducts = allProducts.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setSearchResults(filteredProducts.slice(0, 8));
            setShowSearchResults(true);
        } else {
            setSearchResults([]);
            setShowSearchResults(false);
        }
    }, [searchTerm, allProducts]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchResults.length > 0) {
            window.location.href = `/product/${searchResults[0].id}`;
        }
    };

    const handleSearchResultClick = () => {
        setShowSearchResults(false);
        setSearchTerm('');
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
        setMobileExpandedCategory(null);
    };

    const toggleMobileCategory = (categoryId: string) => {
        setMobileExpandedCategory(mobileExpandedCategory === categoryId ? null : categoryId);
    };

    const getCategoryIcon = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('seat')) return <Car className="h-4 w-4 inline mr-1.5" />;
        if (lowerName.includes('accessori')) return <Settings className="h-4 w-4 inline mr-1.5" />;
        if (lowerName.includes('mat')) return <LayoutList className="h-4 w-4 inline mr-1.5" />;
        if (lowerName.includes('light')) return <Lightbulb className="h-4 w-4 inline mr-1.5" />;
        if (lowerName.includes('audio') || lowerName.includes('security')) return <Volume2 className="h-4 w-4 inline mr-1.5" />;
        if (lowerName.includes('care') || lowerName.includes('fragrance')) return <Wind className="h-4 w-4 inline mr-1.5" />;
        return <LayoutList className="h-4 w-4 inline mr-1.5" />;
    };

    // Recursive component for multilevel dropdowns
    const NavDropdown = ({ category, allCats, level = 0 }: { category: Category, allCats: Category[], level?: number }) => {
        const children = allCats.filter(c => c.parentId === category.id);
        const [isHovered, setIsHovered] = useState(false);
        const icon = level === 0 ? getCategoryIcon(category.name) : null;

        return (
            <div
                className={`relative ${level === 0 ? 'group' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <Link
                    to={`/category/${category.id}`}
                    className={`flex items-center text-sm transition-all duration-200 ${level === 0
                        ? 'text-gray-600 hover:text-brand-orange py-2'
                        : 'p-2 rounded-md hover:bg-gray-50 text-gray-700 hover:text-brand-orange justify-between'
                        }`}
                >
                    <span className="flex items-center">
                        {icon}
                        {category.name}
                    </span>
                    {children.length > 0 && (
                        <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${level > 0 ? '-rotate-90' : ''}`} />
                    )}
                </Link>

                {children.length > 0 && (
                    <div
                        className={`absolute bg-white border rounded-lg shadow-xl py-2 min-w-[200px] transition-all duration-200 ${isHovered ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
                            } ${level === 0 ? 'top-full left-0 mt-1' : 'left-full top-0 ml-1'}`}
                        style={{ zIndex: 70 + level }}
                    >
                        {children.map(child => (
                            <NavDropdown key={child.id} category={child} allCats={allCats} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Recursive component for mobile multilevel menu
    const MobileNavNode = ({ category, allCats, level = 0, isExpanded, onToggle, onNavigate }: {
        category: Category;
        allCats: Category[];
        level?: number;
        isExpanded: boolean;
        onToggle: (id: string) => void;
        onNavigate: () => void;
    }) => {
        const children = allCats.filter(c => c.parentId === category.id);
        const icon = level === 0 ? getCategoryIcon(category.name) : null;

        return (
            <div className="border-b border-gray-50 last:border-0">
                {children.length > 0 ? (
                    <>
                        <button
                            onClick={() => onToggle(category.id)}
                            className={`flex items-center justify-between w-full text-sm py-2.5 px-3 transition-colors ${isExpanded ? 'bg-gray-50 text-brand-orange' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
                        >
                            <span className="flex items-center">
                                {icon}
                                <span className={level === 0 ? 'font-medium' : ''}>{category.name}</span>
                            </span>
                            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            {children.map(child => (
                                <MobileNavNode
                                    key={child.id}
                                    category={child}
                                    allCats={allCats}
                                    level={level + 1}
                                    isExpanded={mobileExpandedCategory === child.id}
                                    onToggle={onToggle}
                                    onNavigate={onNavigate}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <Link
                        to={`/category/${category.id}`}
                        onClick={onNavigate}
                        className="flex items-center text-sm text-gray-600 py-2.5 px-3 hover:bg-gray-50 transition-colors"
                        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
                    >
                        {icon}
                        <span>{category.name}</span>
                    </Link>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white border-b">
            <div className="container mx-auto px-4">
                {/* Desktop: Categories left, Search right - single row */}
                <nav className="hidden md:flex items-center justify-between py-2">
                    <div className="flex items-center space-x-6">
                        {mainCategories.map((category) => (
                            <NavDropdown key={category.id} category={category} allCats={allCategories} />
                        ))}
                    </div>

                    {/* Search on right */}
                    <div className="relative w-56" ref={searchRef}>
                        <form onSubmit={handleSearch}>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    type="search"
                                    placeholder="Search products..."
                                    className="pl-9 pr-3 h-9 text-sm border-gray-200"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => searchTerm.length >= 3 && setShowSearchResults(true)}
                                />
                            </div>
                        </form>
                        {showSearchResults && searchResults.length > 0 && (
                            <div className="absolute top-full right-0 w-72 bg-white border rounded-md shadow-lg mt-1 max-h-72 overflow-y-auto z-50">
                                {searchResults.map((product) => (
                                    <Link
                                        key={product.id}
                                        to={`/product/${product.id}`}
                                        className="flex items-center p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                        onClick={handleSearchResultClick}
                                    >
                                        <img src={product.images[0]} alt={product.name} className="w-10 h-10 object-cover rounded mr-2" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</div>
                                            <div className="text-xs text-brand-orange font-semibold">
                                                ₹{typeof product.price === 'number' ? product.price.toLocaleString() : 'Varies'}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </nav>

                {/* Mobile: hamburger + search */}
                <div className="md:hidden flex items-center justify-between py-2">
                    <button onClick={toggleMobileMenu} className="p-2 text-gray-500">
                        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                    <div className="relative w-40">
                        <form onSubmit={handleSearch}>
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                type="search"
                                placeholder="Search..."
                                className="pl-7 h-8 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </form>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMobileMenuOpen && (
                    <nav className="md:hidden py-1 border-t bg-white">
                        {mainCategories.map((category) => (
                            <MobileNavNode
                                key={category.id}
                                category={category}
                                allCats={allCategories}
                                isExpanded={mobileExpandedCategory === category.id}
                                onToggle={toggleMobileCategory}
                                onNavigate={() => setIsMobileMenuOpen(false)}
                            />
                        ))}
                    </nav>
                )}
            </div>
        </div>
    );
};

export default CatalogHeader;
