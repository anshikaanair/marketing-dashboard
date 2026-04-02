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
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(null);

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

    const handleDelete = async () => {
        if (!selectedBrand || !window.confirm(`Are you sure you want to delete ${selectedBrand.name}?`)) return;

        try {
            const { error } = await supabase
                .from('brands')
                .delete()
                .eq('id', selectedBrand.id);

            if (error) throw error;

            const updatedBrands = brands.filter(b => b.id !== selectedBrand.id);
            setBrands(updatedBrands);
            setSelectedBrand(updatedBrands.length > 0 ? updatedBrands[0] : null);
            localStorage.setItem(`brands_${user.id}`, JSON.stringify(updatedBrands));
        } catch (error) {
            console.error('Error deleting brand:', error);
            alert('Failed to delete brand.');
        }
    };

    const handleEditToggle = () => {
        if (isEditing) {
            setIsEditing(false);
            setEditForm(null);
        } else {
            setIsEditing(true);
            setEditForm({ ...selectedBrand });
        }
    };

    const handleSave = async () => {
        try {
            const { error } = await supabase
                .from('brands')
                .update({
                    name: editForm.name,
                    industry: editForm.industry,
                    colors: editForm.colors,
                    typography: editForm.typography,
                    cta_style: editForm.cta_style,
                    aesthetic: editForm.aesthetic,
                    values: editForm.values,
                    business_overview: editForm.business_overview,
                    tagline: editForm.tagline
                })
                .eq('id', selectedBrand.id);

            if (error) throw error;

            const updatedBrands = brands.map(b => b.id === selectedBrand.id ? editForm : b);
            setBrands(updatedBrands);
            setSelectedBrand(editForm);
            setIsEditing(false);
            setEditForm(null);
            localStorage.setItem(`brands_${user.id}`, JSON.stringify(updatedBrands));
        } catch (error) {
            console.error('Error updating brand:', error);
            alert('Failed to update brand.');
        }
    };

    const renderBrandDetails = () => {
        if (!selectedBrand) return null;

        if (isEditing) {
            return (
                <div className="card p-8 border-primary-100 bg-white space-y-8 shadow-xl ring-1 ring-primary-50">
                    <div className="flex items-start justify-between pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-sm uppercase overflow-hidden">
                                {editForm.logo_url ? (
                                    <img src={editForm.logo_url} className="w-full h-full object-contain" alt="Logo" />
                                ) : (
                                    editForm.name.substring(0, 2)
                                )}
                            </div>
                            <div className="flex-1 space-y-3">
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full text-xl font-bold text-slate-900 bg-slate-50 border-none rounded-lg px-3 py-1 focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                                <input
                                    type="text"
                                    value={editForm.industry}
                                    onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                                    className="w-full text-sm text-slate-500 bg-slate-50 border-none rounded-lg px-3 py-1 focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-slate-500 font-bold text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-primary-600 text-white font-bold text-sm rounded-lg hover:bg-primary-700 transition-all shadow-md shadow-primary-100"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                        <div className="space-y-10">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Color Palette</h4>
                                <div className="space-y-4">
                                    {Object.entries(editForm.colors || {}).map(([key, val]) => (
                                        <div key={key} className="flex items-center gap-4">
                                            <input
                                                type="color"
                                                value={val}
                                                onChange={(e) => setEditForm({
                                                    ...editForm,
                                                    colors: { ...editForm.colors, [key]: e.target.value }
                                                })}
                                                className="w-10 h-10 p-0 border-none rounded-xl cursor-pointer bg-transparent"
                                            />
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{key}</p>
                                                <input
                                                    type="text"
                                                    value={val}
                                                    onChange={(e) => setEditForm({
                                                        ...editForm,
                                                        colors: { ...editForm.colors, [key]: e.target.value }
                                                    })}
                                                    className="text-sm font-black text-slate-900 border-none bg-transparent p-0 focus:ring-0 w-24"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tagline</label>
                                <input
                                    type="text"
                                    value={editForm.tagline || ''}
                                    onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                                    className="w-full text-sm font-bold bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="Brand tagline"
                                />
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand Voice & Style</h4>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500">Visual Aesthetic</label>
                                        <textarea
                                            rows={2}
                                            value={editForm.aesthetic || ''}
                                            onChange={(e) => setEditForm({ ...editForm, aesthetic: e.target.value })}
                                            className="w-full text-sm font-medium bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                                            placeholder="Describe the visual style..."
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500">Primary Font</label>
                                        <input
                                            type="text"
                                            value={editForm.typography?.primary || ''}
                                            onChange={(e) => setEditForm({
                                                ...editForm,
                                                typography: { ...editForm.typography, primary: e.target.value }
                                            })}
                                            className="w-full text-sm font-bold bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500">Default CTA</label>
                                        <select
                                            value={editForm.cta_style || 'Learn More'}
                                            onChange={(e) => setEditForm({ ...editForm, cta_style: e.target.value })}
                                            className="w-full text-sm font-bold bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-primary-500"
                                        >
                                            {['Learn More', 'Get Started', 'Discover More', 'Try for Free', 'Book a Demo', 'Shop Now'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-full space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Overview</label>
                                <textarea
                                    rows={3}
                                    value={editForm.business_overview || ''}
                                    onChange={(e) => setEditForm({ ...editForm, business_overview: e.target.value })}
                                    className="w-full text-sm font-medium bg-slate-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                                    placeholder="Company overview..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="card p-8 border-slate-200 bg-white space-y-8 shadow-sm">
                <div className="flex items-start justify-between pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-sm uppercase overflow-hidden">
                            {selectedBrand.logo_url ? (
                                <img src={selectedBrand.logo_url} className="w-full h-full object-contain" alt={selectedBrand.name} />
                            ) : (
                                selectedBrand.name.substring(0, 2)
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{selectedBrand.name}</h3>
                            <p className="text-sm text-slate-500 font-medium tracking-tight uppercase tracking-wider">
                                {selectedBrand.industry}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 text-rose-600 font-bold text-sm rounded-lg border border-rose-100 hover:bg-rose-50 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                        <button
                            onClick={handleEditToggle}
                            className="flex items-center gap-2 px-4 py-2 text-slate-700 font-bold text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit Brand
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    <div className="space-y-10">
                        {/* Color Palette */}
                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Color Palette</h4>
                            <div className="space-y-4">
                                {selectedBrand.colors && Object.entries(selectedBrand.colors).map(([key, val]) => (
                                    <div key={key} className="flex items-center gap-4">
                                        <div
                                            className="w-10 h-10 rounded-xl shadow-sm border border-slate-100 ring-1 ring-slate-100"
                                            style={{ backgroundColor: val }}
                                        />
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{val}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{key}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tagline */}
                        {selectedBrand.tagline && (
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tagline</h4>
                                <p className="text-lg font-bold text-slate-900 italic">"{selectedBrand.tagline}"</p>
                            </div>
                        )}

                        {/* Logo */}
                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Logo</h4>
                            <div className="border border-slate-100 rounded-2xl h-32 flex items-center justify-center bg-slate-50/50">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl border-2 border-white overflow-hidden">
                                    {selectedBrand.logo_url ? (
                                        <img src={selectedBrand.logo_url} className="w-full h-full object-contain" alt="Logo" />
                                    ) : (
                                        <span className="text-lg font-black text-primary-600 uppercase">{selectedBrand.name.substring(0, 2)}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-10">
                        {/* Aesthetic */}
                        {selectedBrand.aesthetic && (
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Visual Aesthetic</h4>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed">{selectedBrand.aesthetic}</p>
                            </div>
                        )}

                        {/* Typography */}
                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Typography</h4>
                            <div className="space-y-5">
                                <div className="flex items-center gap-4">
                                    <div className="bg-slate-100 text-slate-400 font-medium w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-xs border border-slate-50">
                                        Aa
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-black text-slate-900 tracking-tight">{selectedBrand.typography?.primary || 'Inter'}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Primary</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="bg-slate-100 text-slate-400 font-medium w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-xs border border-slate-50">
                                        Aa
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-black text-slate-900 tracking-tight">{selectedBrand.typography?.secondary || 'Poppins'}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Secondary</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CTA Preset */}
                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">CTA Preset</h4>
                            <div className="flex flex-wrap gap-2.5">
                                {[
                                    selectedBrand.cta_style || 'Learn More',
                                    'Get Started', 'Discover More', 'Try for Free', 'Book a Demo', 'Shop Now'
                                ].map((cta, i) => (
                                    <button
                                        key={i}
                                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${i === 0
                                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                                            : 'bg-white text-slate-500 border border-slate-100 hover:border-slate-200'
                                            }`}
                                    >
                                        {cta}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Business Overview */}
                    {selectedBrand.business_overview && (
                        <div className="col-span-full">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Business Overview</h4>
                            <p className="text-sm font-medium text-slate-600 leading-relaxed border-t border-slate-50 pt-4">{selectedBrand.business_overview}</p>
                        </div>
                    )}
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
