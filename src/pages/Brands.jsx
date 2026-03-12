import React, { useState, useEffect } from 'react';
import { Plus, Layers, Search, MoreHorizontal, Edit2, Trash2, ExternalLink, Loader2, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const Brands = () => {
    const { user } = useAuth();
    const [brands, setBrands] = useState([]);
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
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBrands(data || []);
        } catch (error) {
            console.error('Error fetching brands:', error);
        } finally {
            setLoading(false);
        }
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Brand List Sidebar */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Brands ({brands.length})</p>
                        <div className="space-y-3">
                            {brands.map(brand => (
                                <div key={brand.id} className="card p-4 border-slate-100 shadow-sm cursor-pointer hover:border-primary-200 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-black text-lg">
                                            {brand.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate group-hover:text-primary-600 transition-colors uppercase tracking-tight">{brand.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{brand.industry}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Selected Brand Detail Placeholder */}
                    <div className="lg:col-span-2">
                        <div className="card border-slate-100 shadow-sm p-8 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/30 h-full min-h-[400px]">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-200 border border-slate-100">
                                <Layers className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Select a Brand</h3>
                                <p className="text-sm text-slate-500 font-medium">Choose a brand from the list to view and manage its identity</p>
                            </div>
                        </div>
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
