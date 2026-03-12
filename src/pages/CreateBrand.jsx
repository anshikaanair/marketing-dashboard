import React, { useState } from 'react';
import { ArrowLeft, Megaphone, Palette, MessageSquare, ShieldCheck, ChevronRight, Save, Loader2, Sparkles, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const CreateBrand = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const [brandData, setBrandData] = useState({
        name: '',
        industry: '',
        tagline: '',
        description: '',
        logo: null,
        colors: {
            primary: '#7F56D9',
            secondary: '#6941C6',
            background: '#F9F5FF'
        },
        typography: {
            primary: 'Inter',
            secondary: 'Poppins'
        }
    });

    const industries = [
        'Technology', 'SaaS', 'E-commerce', 'Health & Wellness',
        'Sustainability', 'Education', 'Finance', 'Real Estate',
        'Entertainment', 'Food & Beverage', 'Travel', 'Fashion', 'Other'
    ];

    const colorPresets = [
        { label: 'Violet', primary: '#7F56D9', secondary: '#6941C6', background: '#F9F5FF' },
        { label: 'Blue', primary: '#2563EB', secondary: '#1E40AF', background: '#EFF6FF' },
        { label: 'Green', primary: '#10B981', secondary: '#047857', background: '#ECFDF5' },
        { label: 'Rose', primary: '#F43F5E', secondary: '#BE123C', background: '#FFF1F2' },
        { label: 'Orange', primary: '#F59E0B', secondary: '#B45309', background: '#FFFBEB' },
        { label: 'Teal', primary: '#14B8A6', secondary: '#0F766E', background: '#F0FDFA' },
    ];

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('brands')
                .insert([{
                    user_id: user.id,
                    name: brandData.name,
                    industry: brandData.industry,
                    tagline: brandData.tagline,
                    description: brandData.description,
                    colors: brandData.colors,
                    typography: brandData.typography,
                    logo_url: brandData.logo // For now storing as string/placeholder
                }]);

            if (error) throw error;

            alert('Brand identity created successfully!');
            navigate('/brands');
        } catch (error) {
            console.error('Error creating brand:', error);
            alert('Failed to create brand. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBrandData({ ...brandData, logo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const steps = [
        { id: 1, label: 'Brand Identity', icon: Megaphone },
        { id: 2, label: 'Visual Identity', icon: Palette },
        { id: 3, label: 'Brand Voice', icon: MessageSquare },
        { id: 4, label: 'Guidelines', icon: ShieldCheck },
        { id: 5, label: 'Review', icon: Save }
    ];

    const renderStepHeader = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/brands" className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors border border-slate-100">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Link>
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Create New Brand</h2>
                    <p className="text-slate-500 font-medium">Set up your brand identity, visual assets, and voice</p>
                </div>
            </div>

            <div className="flex items-center justify-between px-2 py-4 border-y border-slate-100 bg-white/50 overflow-x-auto no-scrollbar">
                {steps.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className={`flex items-center gap-3 shrink-0 ${step >= s.id ? 'opacity-100' : 'opacity-40'}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${step === s.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 ring-4 ring-primary-50' :
                                step > s.id ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-500'
                                }`}>
                                <s.icon className="w-5 h-5" />
                            </div>
                            <span className={`text-xs font-black uppercase tracking-widest hidden md:block ${step >= s.id ? 'text-slate-900' : 'text-slate-400'
                                }`}>
                                {s.label}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`h-px flex-1 mx-4 max-w-[40px] ${step > s.id ? 'bg-primary-200' : 'bg-slate-100'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );

    const renderBrandIdentity = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                    <Megaphone className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Brand Identity</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {step} of 5</p>
                </div>
            </div>

            <div className="card p-8 border-slate-100 shadow-sm space-y-6 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Brand Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={brandData.name}
                                onChange={(e) => setBrandData({ ...brandData, name: e.target.value })}
                                placeholder="e.g. Acme Corp"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none pl-11"
                            />
                            <Building2 className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Industry <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={brandData.industry}
                            onChange={(e) => setBrandData({ ...brandData, industry: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                        >
                            <option value="">Select industry...</option>
                            {industries.map(i => (
                                <option key={i} value={i}>{i}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tagline</label>
                    <input
                        type="text"
                        value={brandData.tagline}
                        onChange={(e) => setBrandData({ ...brandData, tagline: e.target.value })}
                        placeholder="e.g. Redefining modern workspace"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Description</label>
                    <textarea
                        rows={4}
                        value={brandData.description}
                        onChange={(e) => setBrandData({ ...brandData, description: e.target.value })}
                        placeholder="Tell us about your brand's mission, values, and what makes it unique..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none resize-none"
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={() => setStep(2)}
                    disabled={!brandData.name || !brandData.industry}
                    className="flex items-center gap-2 px-8 py-3.5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all hover:translate-y-[-2px] active:translate-y-[0px] disabled:opacity-50 disabled:translate-y-0 uppercase tracking-widest text-xs"
                >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );

    const renderVisualIdentity = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                    <Palette className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Visual Identity</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {step} of 5</p>
                </div>
            </div>

            <div className="card p-8 border-slate-100 shadow-sm space-y-8 bg-white">
                {/* Logo Section */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Logo</label>
                    <div className="relative group">
                        <input
                            type="file"
                            onChange={handleLogoUpload}
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3 group-hover:border-primary-300 group-hover:bg-primary-50/30 transition-all">
                            {brandData.logo ? (
                                <img src={brandData.logo} alt="Brand Logo" className="h-20 object-contain" />
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-300">
                                        <Palette className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Drop logo here or <span className="text-primary-600">browse</span></p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">PNG, JPG, SVG up to 5MB</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Color Palette Section */}
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Color Palette</label>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Pick a preset or define your own</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {colorPresets.map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => setBrandData({ ...brandData, colors: { primary: preset.primary, secondary: preset.secondary, background: preset.background } })}
                                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-lg hover:border-primary-200 transition-all group"
                            >
                                <div className="flex -space-x-1.5">
                                    <div className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: preset.primary }} />
                                    <div className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: preset.background }} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{preset.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4 pt-2">
                        {['primary', 'secondary', 'background'].map((key) => (
                            <div key={key} className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-lg shadow-sm border border-slate-100" style={{ backgroundColor: brandData.colors[key] }} />
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={brandData.colors[key].toUpperCase()}
                                        onChange={(e) => setBrandData({
                                            ...brandData,
                                            colors: { ...brandData.colors, [key]: e.target.value }
                                        })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none uppercase"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{key}</span>
                                        <input
                                            type="color"
                                            value={brandData.colors[key]}
                                            onChange={(e) => setBrandData({
                                                ...brandData,
                                                colors: { ...brandData.colors, [key]: e.target.value }
                                            })}
                                            className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Typography Section */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Typography</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Primary Font</span>
                            <input
                                type="text"
                                value={brandData.typography.primary}
                                onChange={(e) => setBrandData({ ...brandData, typography: { ...brandData.typography, primary: e.target.value } })}
                                placeholder="e.g. Inter"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Secondary Font</span>
                            <input
                                type="text"
                                value={brandData.typography.secondary}
                                onChange={(e) => setBrandData({ ...brandData, typography: { ...brandData.typography, secondary: e.target.value } })}
                                placeholder="e.g. Poppins"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-8 py-3.5 bg-white border border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                <div className="flex gap-4">
                    <button
                        onClick={handleSubmit}
                        className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-black transition-all hover:translate-y-[-2px] active:translate-y-[0px] uppercase tracking-widest text-xs"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Identity
                    </button>
                    <button
                        onClick={() => setStep(3)}
                        className="flex items-center gap-2 px-8 py-3.5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all hover:translate-y-[-2px] active:translate-y-[0px] uppercase tracking-widest text-xs"
                    >
                        Continue
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-12">
            {renderStepHeader()}

            <div className="max-w-4xl mx-auto">
                {step === 1 && renderBrandIdentity()}
                {step === 2 && renderVisualIdentity()}
                {step > 2 && (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                            <Sparkles className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Coming Soon</h3>
                            <p className="text-sm text-slate-500 font-medium">This step is under development as part of the brand management evolution.</p>
                        </div>
                        <button
                            onClick={() => setStep(step - 1)}
                            className="text-primary-600 font-bold hover:underline"
                        >
                            Back to Previous Step
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateBrand;
