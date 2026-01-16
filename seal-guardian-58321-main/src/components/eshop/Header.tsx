import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  Gauge,
  LayoutList,
  Phone,
  Heart,
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
  Radio,
  Volume2,
  Fuel,
  Cog,
  Battery,
  Camera,
  Navigation,
  Truck,
  Lock,
  Key,
  Compass,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getMainCategories, getSubcategories, products } from '@/data/mockData';
import NavWishlist from './NavWishlist';
import logo from '/autologo-removebg-preview.png';

const Header = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileExpandedCategory, setMobileExpandedCategory] = useState(null);
  const searchRef = useRef(null);
  const mainCategories = getMainCategories();

  // Search functionality
  useEffect(() => {
    if (searchTerm.length >= 3) {
      const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(filteredProducts.slice(0, 8)); // Limit to 8 results
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchTerm]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      // Navigate to first result or implement search results page
      window.location.href = `/product/${searchResults[0].id}`;
    }
  };

  const handleSearchResultClick = (productId) => {
    setShowSearchResults(false);
    setSearchTerm('');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setMobileExpandedCategory(null);
  };

  const toggleMobileCategory = (categoryId) => {
    setMobileExpandedCategory(
      mobileExpandedCategory === categoryId ? null : categoryId
    );
  };

  const getCategoryIcon = (name) => {
    const lowerName = name.toLowerCase();

    // Engine & Performance
    if (lowerName.includes('engine') || lowerName.includes('motor')) return <Cog className="h-4 w-4 inline mr-2" />;
    if (lowerName.includes('turbo') || lowerName.includes('supercharger')) return <Zap className="h-4 w-4 inline mr-2" />;
    if (lowerName.includes('exhaust') || lowerName.includes('muffler')) return <Wind className="h-4 w-4 inline mr-2" />;
    if (lowerName.includes('fuel') || lowerName.includes('gas') || lowerName.includes('diesel')) return <Fuel className="h-4 w-4 inline mr-2" />;

    // Body & Exterior
    if (lowerName.includes('body') || lowerName.includes('panel') || lowerName.includes('door')) return <Car className="h-4 w-4 inline mr-2" />;
    if (lowerName.includes('bumper') || lowerName.includes('fender')) return <Shield className="h-4 w-4 inline mr-2" />;
    if (lowerName.includes('light') || lowerName.includes('headlight') || lowerName.includes('taillight')) return <Lightbulb className="h-4 w-4 inline mr-2" />;
    if (lowerName.includes('mirror') || lowerName.includes('window')) return <Eye className="h-4 w-4 inline mr-2" />;

    // Interior & Comfort
    if (lowerName.includes('seat') || lowerName.includes('cushion')) return <Car className="h-4 w-4 inline mr-2" />;
    if (lowerName.includes('steering') || lowerName.includes('wheel')) return <Gauge className="h-4 w-4 inline mr-2" />;
    if (lowerName.includes('dashboard') || lowerName.includes('console')) return <Settings className="h-4 w-4 inline mr-2" />;
    if (lowerName.includes('audio') || lowerName.includes('speaker') || lowerName.includes('radio')) return <Volume2 className="h-4 w-4 inline mr-2" />;
    if (lowerName.includes('navigation') || lowerName.includes('gps')) return <Navigation className="h-4 w-4 inline mr-2" />;

    // Electronics & Accessories
    if (lowerName.includes('battery') || lowerName.includes('alternator')) return <Battery className="h-4 w-4 inline mr-2" />;
    if (lowerName.includes('camera') || lowerName.includes('sensor')) return <Camera className="h-4 w-4 inline mr-2" />;
    if (lowerName.includes('alarm') || lowerName.includes('security')) return <Lock className="h-4 w-4 inline mr-2" />;
    if (lowerName.includes('key') || lowerName.includes('remote')) return <Key className="h-4 w-4 inline mr-2" />;

    // Tools & Maintenance
    if (lowerName.includes('tool') || lowerName.includes('repair') || lowerName.includes('maintenance')) return <Wrench className="h-4 w-4 inline mr-2" />;
    if (lowerName.includes('oil') || lowerName.includes('filter') || lowerName.includes('fluid')) return <Settings className="h-4 w-4 inline mr-2" />;

    // Commercial Vehicles
    if (lowerName.includes('truck') || lowerName.includes('commercial') || lowerName.includes('heavy')) return <Truck className="h-4 w-4 inline mr-2" />;

    // Default fallback
    return <LayoutList className="h-4 w-4 inline mr-2" />;
  };

  return (
    <header className="bg-background border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Autoform Logo" className="h-16 w-auto" />
          </Link>

          {/* Desktop Search bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative" ref={searchRef}>
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-10 pr-4 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => {
                    if (searchTerm.length >= 3) {
                      setShowSearchResults(true);
                    }
                  }}
                />
              </div>
            </form>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-96 overflow-y-auto z-50">
                {searchResults.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    onClick={() => handleSearchResultClick(product.id)}
                  >
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded mr-3 flex-shrink-0"
                    />
                    <div className="flex-grow">
                      <div className="font-medium text-sm text-gray-900 line-clamp-1">
                        {product.name}
                      </div>
                      <div className="text-sm text-brand-orange font-semibold">
                        ₹{product.price.toFixed(2)}
                      </div>
                    </div>
                  </Link>
                ))}
                {searchTerm.length >= 3 && searchResults.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No products found for "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <NavWishlist />
            </div>

            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Desktop Category navigation with hover dropdowns */}
        <nav className="hidden md:block py-2 border-t">
          <div className="flex items-center space-x-8">
            {mainCategories.map((category) => {
              const subcategories = getSubcategories(category.id);
              const icon = getCategoryIcon(category.name);

              if (subcategories.length > 0) {
                return (
                  <div
                    key={category.id}
                    className="relative group"
                    onMouseEnter={() => setHoveredCategory(category.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <Link
                      to={`/category/${category.id}`}
                      className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer py-2"
                    >
                      {icon}
                      {category.name}
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Link>
                    <div
                      className={`absolute top-full left-0 w-80 bg-background border rounded-md shadow-lg transition-all duration-200 ${hoveredCategory === category.id
                        ? 'opacity-100 visible translate-y-0'
                        : 'opacity-0 invisible -translate-y-2'
                        }`}
                      style={{ zIndex: 60 }}
                    >
                      <div className="grid gap-2 p-4">
                        {subcategories.map((subcategory) => (
                          <Link
                            key={subcategory.id}
                            to={`/category/${subcategory.id}`}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">{subcategory.name}</div>
                            {subcategory.description && (
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {subcategory.description}
                              </p>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <Link
                    key={category.id}
                    to={`/category/${category.id}`}
                    className="flex items-center text-sm text-muted-foreground hover:text-primary hover:bg-accent px-3 py-2 rounded-md transition-colors whitespace-nowrap"
                  >
                    {getCategoryIcon(category.name)}
                    {category.name}
                  </Link>
                );
              }
            })}
          </div>
        </nav>

        {/* Mobile Search bar */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t" ref={searchRef}>
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-10 pr-4 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => {
                    if (searchTerm.length >= 3) {
                      setShowSearchResults(true);
                    }
                  }}
                />
              </div>
            </form>

            {/* Mobile Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-md shadow-lg mb-4 max-h-64 overflow-y-auto">
                {searchResults.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    onClick={() => {
                      handleSearchResultClick(product.id);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded mr-3 flex-shrink-0"
                    />
                    <div className="flex-grow">
                      <div className="font-medium text-sm text-gray-900 line-clamp-1">
                        {product.name}
                      </div>
                      <div className="text-sm text-brand-orange font-semibold">
                        ₹{product.price.toFixed(2)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mobile navigation menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden py-4 border-t bg-background">
            <div className="space-y-2">
              {mainCategories.map((category) => {
                const subcategories = getSubcategories(category.id);
                const icon = getCategoryIcon(category.name);

                if (subcategories.length > 0) {
                  return (
                    <div key={category.id} className="space-y-2">
                      <button
                        onClick={() => toggleMobileCategory(category.id)}
                        className="flex items-center justify-between w-full text-left text-sm text-muted-foreground hover:text-primary transition-colors py-2 px-3 rounded-md hover:bg-accent"
                      >
                        <span className="flex items-center gap-2">
                          {icon}
                          {category.name}
                        </span>
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${mobileExpandedCategory === category.id ? 'rotate-180' : ''
                            }`}
                        />
                      </button>

                      {mobileExpandedCategory === category.id && (
                        <div className="pl-4 space-y-1">
                          {subcategories.map((subcategory) => (
                            <Link
                              key={subcategory.id}
                              to={`/category/${subcategory.id}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block text-sm text-muted-foreground hover:text-primary transition-colors py-2 px-3 rounded-md hover:bg-accent"
                            >
                              {subcategory.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <Link
                      key={category.id}
                      to={`/category/${category.id}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-2 px-3 rounded-md hover:bg-accent"
                    >
                      {icon}
                      {category.name}
                    </Link>
                  );
                }
              })}

              {/* Mobile navigation items */}
              <div className="pt-4 border-t space-y-2">
                <div className="px-3 py-2">
                  <NavWishlist />
                </div>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;