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
        if (user) {
            fetchBrands();
        }
    }, [user]);

    const fetchBrands = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('brands')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBrands(data || []);
            if (data && data.length > 0) {
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
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-primary-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-primary-100 uppercase">
                            {selectedBrand.logo_url ? (
                                <img src={selectedBrand.logo_url} className="w-full h-full object-contain rounded-3xl" alt={selectedBrand.name} />
                            ) : (
                                selectedBrand.name.substring(0, 2)
                            )}
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{selectedBrand.name}</h3>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {selectedBrand.industry} • {selectedBrand.tagline || 'No Tagline'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Identity & Voice */}
                    <div className="card p-6 border-slate-100 bg-white space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-primary-600" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Identity & Voice</span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Description</label>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed">{selectedBrand.description || 'No description provided.'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Tone</label>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black bg-primary-50 text-primary-700 uppercase tracking-wider">{selectedBrand.tone || 'Professional'}</span>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">CTA style</label>
                                    <span className="text-xs font-bold text-slate-700">{selectedBrand.cta_style || 'Learn More'}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Target Audience</label>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed italic">{selectedBrand.target_audience || 'Not specified'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Visual Tokens */}
                    <div className="card p-6 border-slate-100 bg-white space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Palette className="w-4 h-4 text-primary-600" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Visual Tokens</span>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-3">Color Palette</label>
                                <div className="flex items-center gap-4">
                                    {selectedBrand.colors && Object.entries(selectedBrand.colors).map(([key, val]) => (
                                        <div key={key} className="space-y-1.5 flex flex-col items-center">
                                            <div className="w-10 h-10 rounded-xl shadow-sm border border-slate-100" style={{ backgroundColor: val }} />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{key}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">Typography</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Primary</p>
                                        <p className="text-sm font-black text-slate-900">{selectedBrand.typography?.primary || 'Inter'}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Secondary</p>
                                        <p className="text-sm font-black text-slate-900">{selectedBrand.typography?.secondary || 'Poppins'}</p>
                                    </div>
                                </div>
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
