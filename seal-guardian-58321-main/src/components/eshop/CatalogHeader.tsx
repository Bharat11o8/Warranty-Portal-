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
import { cn } from "@/lib/utils";

interface CatalogHeaderProps {
    isDashboard?: boolean;
    externalSearchOpen?: boolean;
    setExternalSearchOpen?: (open: boolean) => void;
}

const CatalogHeader: React.FC<CatalogHeaderProps> = ({
    isDashboard = false,
    externalSearchOpen,
    setExternalSearchOpen
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mobileExpandedCategory, setMobileExpandedCategory] = useState<string | null>(null);
    const [mainCategories, setMainCategories] = useState<Category[]>([]);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
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

    // Unified mobile search state management (Controlled vs Uncontrolled)
    const finalMobileSearchOpen = externalSearchOpen !== undefined ? externalSearchOpen : isMobileSearchOpen;

    const setFinalMobileSearchOpen = (open: boolean) => {
        if (setExternalSearchOpen) {
            setExternalSearchOpen(open);
        }
        setIsMobileSearchOpen(open);
    };

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
        setFinalMobileSearchOpen(false); // Close search if menu opens
        setMobileExpandedCategory(null);
    };

    const toggleMobileSearch = () => {
        setFinalMobileSearchOpen(!finalMobileSearchOpen);
        setIsMobileMenuOpen(false); // Close menu if search opens
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
        const [isOpen, setIsOpen] = useState(false);
        const icon = level === 0 ? getCategoryIcon(category.name) : null;
        const dropdownRef = useRef<HTMLDivElement>(null);

        // Close dropdown when clicking outside
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        return (
            <div
                ref={dropdownRef}
                className={`relative ${level === 0 ? 'group' : ''}`}
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
            >
                <div
                    className={`flex items-center justify-between text-sm transition-all duration-200 whitespace-nowrap ${level === 0
                        ? 'text-gray-600 hover:text-brand-orange py-2'
                        : 'p-2 rounded-md hover:bg-gray-50 text-gray-700 hover:text-brand-orange'
                        }`}
                >
                    <Link
                        to={`/category/${category.id}`}
                        className="flex items-center flex-1 pr-1"
                        onClick={() => setIsOpen(false)}
                    >
                        {icon}
                        {category.name}
                    </Link>

                    {children.length > 0 && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsOpen(!isOpen);
                            }}
                            className="p-1 ml-1 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Toggle submenu"
                        >
                            <ChevronDown className={`h-3 w-3 transition-transform ${level > 0 && !isOpen ? '-rotate-90' : ''} ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                    )}
                </div>

                {children.length > 0 && (
                    <div
                        className={`absolute bg-white border rounded-lg shadow-xl py-2 min-w-[200px] transition-all duration-200 ${isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
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
    const MobileNavNode = ({ category, allCats, level = 0, onNavigate }: {
        category: Category;
        allCats: Category[];
        level?: number;
        onNavigate: () => void;
    }) => {
        const children = allCats.filter(c => c.parentId === category.id);
        const icon = level === 0 ? getCategoryIcon(category.name) : null;
        const [isExpanded, setIsExpanded] = useState(false);

        return (
            <div className="border-b border-gray-50 last:border-0">
                {children.length > 0 ? (
                    <>
                        <Link
                            to={`/category/${category.id}`}
                            onClick={onNavigate}
                            className={`flex items-center justify-between w-full text-sm py-2.5 px-3 transition-colors ${isExpanded ? 'bg-gray-50 text-brand-orange' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
                        >
                            <span className="flex items-center">
                                {icon}
                                <span className={level === 0 ? 'font-medium' : ''}>{category.name}</span>
                            </span>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsExpanded(!isExpanded);
                                }}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                        </Link>
                        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            {children.map(child => (
                                <MobileNavNode
                                    key={child.id}
                                    category={child}
                                    allCats={allCats}
                                    level={level + 1}
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
        <div className={cn(
            "bg-white/80 backdrop-blur-xl z-40 sticky top-0",
            !isDashboard && "border-b shadow-sm"
        )}>
            <div className="container mx-auto px-4">
                {/* Desktop Header row (Logo on left, items on right) */}
                <div className={cn(
                    "hidden md:flex items-center justify-between py-2 border-b border-gray-50",
                    isDashboard && "justify-end"
                )}>
                    {!isDashboard && (
                        <Link to="/catalogue" className="flex-shrink-0">
                            <img
                                src="/autoform-logo.png"
                                alt="Autoform Logo"
                                className="h-10 object-contain"
                            />
                        </Link>
                    )}
                </div>

                {/* Desktop: Navigation Bar + Search (Below Logo) */}
                <div className="hidden md:flex items-center justify-between py-1.5 gap-4">
                    <nav className="flex items-center space-x-4 lg:space-x-8">
                        {mainCategories.map((category) => (
                            <NavDropdown key={category.id} category={category} allCats={allCategories} />
                        ))}
                    </nav>

                    {/* Search on right of Nav */}
                    <div className="relative w-56 lg:w-64" ref={searchRef}>
                        <form onSubmit={handleSearch}>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    type="search"
                                    placeholder="Search products..."
                                    className="pl-9 pr-3 h-8 text-xs border-gray-100 bg-gray-50/50 focus:bg-white transition-colors"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => searchTerm.length >= 3 && setShowSearchResults(true)}
                                />
                            </div>
                        </form>
                        {showSearchResults && searchResults.length > 0 && (
                            <div className="absolute top-full right-0 w-full bg-white border rounded-md shadow-lg mt-1 max-h-72 overflow-y-auto z-50">
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
                </div>

                {!isDashboard && (
                    <div className="md:hidden flex items-center justify-between py-2.5 relative">
                        {/* Left: Menu Toggle */}
                        <button onClick={toggleMobileMenu} className="p-2 text-gray-700 hover:text-brand-orange transition-colors relative z-50">
                            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>

                        {/* Center: Logo (Hidden when menu or search is open) */}
                        {!isMobileMenuOpen && !isMobileSearchOpen && (
                            <Link to="/catalogue" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-in fade-in duration-300">
                                <img
                                    src="/autoform-logo.png"
                                    alt="Autoform Logo"
                                    className="h-8 object-contain"
                                />
                            </Link>
                        )}

                        {/* Right: Search Toggle */}
                        <div className="flex items-center relative z-50">
                            <button
                                onClick={toggleMobileSearch}
                                className={cn(
                                    "p-2 transition-all duration-300",
                                    finalMobileSearchOpen ? "text-brand-orange scale-110" : "text-gray-700 hover:text-brand-orange"
                                )}
                            >
                                {finalMobileSearchOpen ? <X className="h-6 w-6" /> : <Search className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Mobile Search Bar Expansion */}
                <div className={cn(
                    "md:hidden overflow-hidden transition-all duration-500 ease-in-out border-t border-gray-50",
                    finalMobileSearchOpen ? "max-h-[500px] opacity-100 py-4" : "max-h-0 opacity-0 py-0"
                )}>
                    <div className="px-4">
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <Input
                                type="search"
                                placeholder="Search premium accessories..."
                                className="pl-12 pr-4 h-12 text-base rounded-2xl bg-gray-50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-brand-orange/20 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus={finalMobileSearchOpen}
                            />
                        </form>

                        {/* Search Results for Mobile */}
                        {searchTerm.length >= 2 && searchResults.length > 0 && (
                            <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Search Results</h4>
                                {searchResults.map((product) => (
                                    <Link
                                        key={product.id}
                                        to={`/product/${product.id}`}
                                        className="flex items-center p-3 hover:bg-gray-50 bg-white border border-gray-100 rounded-2xl transition-all"
                                        onClick={handleSearchResultClick}
                                    >
                                        <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 mr-4">
                                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0 pr-2">
                                            <div className="text-sm font-bold text-gray-900 truncate">{product.name}</div>
                                            <div className="text-xs text-brand-orange font-black mt-0.5">
                                                ₹{typeof product.price === 'number' ? product.price.toLocaleString() : 'Varies'}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                        {searchTerm.length >= 2 && searchResults.length === 0 && (
                            <div className="text-center py-6 text-gray-400 italic text-sm">No results found for "{searchTerm}"</div>
                        )}
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
