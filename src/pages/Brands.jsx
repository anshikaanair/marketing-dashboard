import React, { useState, useEffect } from 'react';
import { Plus, Layers, Search, MoreHorizontal, Edit2, Trash2, ExternalLink, Loader2, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const Brands = () => {
    const { user } = useAuth();
    const [brands, setBrands] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            // Initializing from cache
            const cached = localStorage.getItem(`brands_${user.id}`);
            if (cached) {
                const data = JSON.parse(cached);
                setBrands(data);
                if (data.length > 0) {
                    setSelectedBrand(data[0]);
                }
                setLoading(false);
            }
            fetchBrands();
        }
    }, [user]);

    const fetchBrands = async () => {
        if (!user?.id) return;

        const hasCache = localStorage.getItem(`brands_${user.id}`);
        if (!hasCache) setLoading(true);

        try {
            const { data, error } = await supabase
                .from('brands')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setBrands(data || []);
            localStorage.setItem(`brands_${user.id}`, JSON.stringify(data || []));

            if (data && data.length > 0 && !selectedBrand) {
                setSelectedBrand(data[0]);
            }
        } catch (error) {
            console.error('Error fetching brands:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderBrandDetails = () => {
        if (!selectedBrand) return null;

        return (
            <div className="card p-8 border-slate-200 bg-white space-y-8 shadow-sm">
                <div className="flex items-start justify-between pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-sm uppercase">
                            {selectedBrand.logo_url ? (
                                <img src={selectedBrand.logo_url} className="w-full h-full object-contain rounded-xl" alt={selectedBrand.name} />
                            ) : (
                                selectedBrand.name.substring(0, 2)
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{selectedBrand.name}</h3>
                            <p className="text-sm text-slate-500 font-medium">
                                {selectedBrand.industry}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 text-rose-600 font-medium text-sm rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 text-slate-700 font-medium text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                            <Edit2 className="w-4 h-4" />
                            Edit Brand
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    {/* Left Column: Colors, Logo */}
                    <div className="space-y-10">
                        {/* Color Palette */}
                        <div>
                            <h4 className="text-base font-bold text-slate-900 mb-6 tracking-tight">Color Palette</h4>
                            <div className="space-y-4">
                                {selectedBrand.colors && Object.entries(selectedBrand.colors).map(([key, val]) => (
                                    <div key={key} className="flex items-center gap-4">
                                        <div
                                            className="w-10 h-10 rounded-xl shadow-sm border border-slate-200"
                                            style={{ backgroundColor: val }}
                                        />
                                        <div className="flex gap-3 items-center">
                                            <span className="text-sm font-bold text-slate-900 uppercase">{val}</span>
                                            <span className="text-sm text-slate-500 capitalize">{key}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Logo */}
                        <div>
                            <h4 className="text-base font-bold text-slate-900 mb-6 tracking-tight">Logo</h4>
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl h-32 flex items-center justify-center bg-slate-50">
                                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm uppercase">
                                    {selectedBrand.logo_url ? (
                                        <img src={selectedBrand.logo_url} className="w-full h-full object-contain rounded-full" alt="Logo" />
                                    ) : (
                                        selectedBrand.name.substring(0, 2)
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Typography, CTA Preset */}
                    <div className="space-y-10">
                        {/* Typography */}
                        <div>
                            <h4 className="text-base font-bold text-slate-900 mb-6 tracking-tight">Typography</h4>
                            <div className="space-y-5">
                                <div className="flex items-center gap-4">
                                    <div className="bg-slate-100 text-slate-800 font-serif font-medium w-8 h-8 rounded shrink-0 flex items-center justify-center text-sm">
                                        Aa
                                    </div>
                                    <div className="flex gap-3 items-center">
                                        <span className="text-sm font-semibold text-slate-900">{selectedBrand.typography?.primary || 'Inter'}</span>
                                        <span className="text-sm text-slate-500">Primary</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="bg-slate-100 text-slate-800 font-sans font-medium w-8 h-8 rounded shrink-0 flex items-center justify-center text-sm">
                                        Aa
                                    </div>
                                    <div className="flex gap-3 items-center">
                                        <span className="text-sm font-semibold text-slate-900">{selectedBrand.typography?.secondary || 'Poppins'}</span>
                                        <span className="text-sm text-slate-500">Secondary</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CTA Preset */}
                        <div>
                            <h4 className="text-base font-bold text-slate-900 mb-6 tracking-tight">CTA Preset</h4>
                            <div className="flex flex-wrap gap-2.5">
                                {[
                                    selectedBrand.cta_style || 'Learn More',
                                    'Get Started', 'Discover More', 'Try for Free', 'Book a Demo', 'Shop Now'
                                ].map((cta, i) => (
                                    <span
                                        key={i}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium ${i === 0
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-slate-50 text-slate-600 border border-slate-200'
                                            }`}
                                    >
                                        {cta}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 text-left">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Brand Management</h2>
                    <p className="text-slate-500 mt-1 font-medium">Configure brand identities, design tokens, and content presets</p>
                </div>
                <Link
                    to="/brands/new"
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-100 hover:bg-primary-700 transition-all hover:translate-y-[-1px] active:translate-y-[0px] shadow-primary-200"
                >
                    <Plus className="w-5 h-5" />
                    New Brand
                </Link>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 font-black tracking-widest uppercase">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <p className="text-[10px]">Loading Brands...</p>
                </div>
            ) : brands.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Brand List Sidebar */}
                    <div className="lg:col-span-4 space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Brands ({brands.length})</p>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                            {brands.map(brand => (
                                <div
                                    key={brand.id}
                                    onClick={() => setSelectedBrand(brand)}
                                    className={`card p-4 border transition-all group cursor-pointer ${selectedBrand?.id === brand.id
                                        ? 'border-primary-600 bg-primary-50/10 ring-1 ring-primary-600 shadow-lg shadow-primary-50'
                                        : 'border-slate-100 hover:border-primary-200 bg-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg transition-all ${selectedBrand?.id === brand.id ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-600'
                                            }`}>
                                            {brand.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-black transition-colors uppercase tracking-tight truncate ${selectedBrand?.id === brand.id ? 'text-primary-700' : 'text-slate-900 group-hover:text-primary-600'
                                                }`}>{brand.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{brand.industry}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Selected Brand Detail */}
                    <div className="lg:col-span-8 sticky top-8">
                        {renderBrandDetails()}
                    </div>
                </div>
            ) : (
                <div className="card p-20 border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-6 bg-white max-w-2xl mx-auto">
                    <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-300">
                        <Layers className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Setup Your First Brand</h3>
                        <p className="text-sm text-slate-500 font-medium max-w-sm">
                            Create a brand identity to maintain consistency across all your AI-generated marketing campaigns.
                        </p>
                    </div>
                    <Link
                        to="/brands/new"
                        className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 hover:bg-black transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
                    >
                        <PlusCircle className="w-5 h-5 text-primary-400" />
                        Create Identity
                    </Link>
                </div>
            )}
        </div>
    );
};

export default Brands;
