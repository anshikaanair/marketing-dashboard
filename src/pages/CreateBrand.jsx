import React, { useState, useEffect } from 'react';
import { ArrowLeft, Megaphone, Palette, MessageSquare, ShieldCheck, ChevronRight, Save, Loader2, Sparkles, Building2, Globe, CheckCircle2, Copy, Layout } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const CreateBrand = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState('INPUT'); // INPUT, GENERATING, RESULTS
    const [isLoading, setIsLoading] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');

    const [brandDNA, setBrandDNA] = useState(null);

    const handleDNAChange = (field, value) => {
        setBrandDNA(prev => ({ ...prev, [field]: value }));
    };

    const handleGenerateDNA = async () => {
        if (!companyName || !websiteUrl) return;

        setStep('GENERATING');
        setIsLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/analyze-brand`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company_name: companyName, url: websiteUrl })
            });

            if (!response.ok) throw new Error('Failed to analyze brand');

            const data = await response.json();
            setBrandDNA(data);
            setStep('RESULTS');
        } catch (error) {
            console.error('Error generating Brand DNA:', error);
            alert('Failed to generate Brand DNA. Please try again or check the URL.');
            setStep('INPUT');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveBrand = async () => {
        if (!brandDNA) return;
        setIsLoading(true);

        try {
            const { error } = await supabase
                .from('brands')
                .insert([{
                    user_id: user.id,
                    name: brandDNA.name,
                    industry: brandDNA.industry,
                    tagline: brandDNA.tagline,
                    description: brandDNA.business_overview,
                    business_overview: brandDNA.business_overview,
                    website_url: websiteUrl,
                    colors: brandDNA.colors,
                    typography: brandDNA.typography,
                    tone: brandDNA.tone,
                    aesthetic: brandDNA.aesthetic,
                    values: brandDNA.values,
                    logo_url: brandDNA.logo_url,
                    layout_pattern: brandDNA.layout_pattern,
                    target_audience: brandDNA.target_audience,
                    cta_style: brandDNA.cta_style
                }]);

            if (error) {
                console.error('Supabase save error:', error);
                if (error.message.includes('column') && error.message.includes('does not exist')) {
                    alert("Database schema mismatch. Please ensure you have run the latest SQL migration in your Supabase SQL Editor (add layout_pattern and tagline columns).");
                } else {
                    alert("Failed to save brand identity: " + error.message);
                }
                return;
            }
            navigate('/brands');
        } catch (error) {
            console.error('Error saving brand:', error);
            alert('Failed to save brand identity.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderInput = () => (
        <div className="max-w-xl mx-auto space-y-10 py-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-6">
                <div className="inline-flex p-5 bg-[#F5F1FF] rounded-[24px] text-[#A855F7] mb-2 shadow-sm">
                    <Sparkles className="w-10 h-10" />
                </div>
                <h1 className="text-5xl font-black text-[#0F172A] tracking-tight">Create your Brand DNA</h1>
                <p className="text-slate-500 font-medium text-xl max-w-md mx-auto leading-relaxed">
                    Enter your details and let our agent build your complete brand identity.
                </p>
            </div>

            <div className="bg-white p-10 rounded-[48px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50 space-y-8">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] ml-1">Company Name</label>
                    <div className="relative group">
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g. Acme Corp"
                            className="w-full px-6 py-5 bg-[#F8FAFC] border border-transparent rounded-[24px] text-base font-bold text-[#334155] focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-500/5 transition-all outline-none pl-14 placeholder:text-slate-300"
                        />
                        <Building2 className="w-6 h-6 text-[#94A3B8] absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-purple-400 transition-colors" />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] ml-1">Website URL</label>
                    <div className="relative group">
                        <input
                            type="text"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            placeholder="e.g. https://acme.com"
                            className="w-full px-6 py-5 bg-[#F8FAFC] border border-transparent rounded-[24px] text-base font-bold text-[#334155] focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-500/5 transition-all outline-none pl-14 placeholder:text-slate-300"
                        />
                        <Globe className="w-6 h-6 text-[#94A3B8] absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-purple-400 transition-colors" />
                    </div>
                </div>

                <button
                    onClick={handleGenerateDNA}
                    disabled={!companyName || !websiteUrl || isLoading}
                    className="w-full flex items-center justify-center gap-3 px-8 py-5.5 bg-[#B392FF] text-white font-black rounded-[24px] shadow-lg shadow-purple-200 hover:bg-[#A17FFF] transition-all hover:translate-y-[-2px] active:translate-y-[0px] disabled:opacity-50 disabled:translate-y-0 uppercase tracking-[0.15em] text-sm"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    Build Brand Identity
                </button>
            </div>

            <div className="flex justify-center pt-4">
                <Link to="/brands" className="text-[#94A3B8] font-bold text-xs uppercase tracking-[0.2em] hover:text-purple-500 transition-colors">
                    Cancel and go back
                </Link>
            </div>
        </div>
    );

    const renderGenerating = () => (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-8 text-center overscroll-none">
            <div className="absolute top-8 left-8">
                <button onClick={() => setStep('INPUT')} className="flex items-center gap-2 px-6 py-3 bg-slate-50 border border-slate-100 text-slate-400 font-bold rounded-2xl hover:bg-slate-100 transition-all">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
            </div>

            <div className="space-y-12 max-w-2xl animate-in zoom-in-95 duration-1000">
                <div className="space-y-6">
                    <div className="inline-flex p-6 bg-[#F5F1FF] rounded-[32px] text-[#A855F7] mb-4 shadow-sm animate-bounce">
                        <Sparkles className="w-12 h-12" />
                    </div>
                    <h2 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight">
                        Generating your <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600">Business DNA</span>
                    </h2>
                    <p className="text-slate-400 text-xl font-medium max-w-md mx-auto leading-relaxed">
                        We're researching and analyzing your business. This will take a moment.
                    </p>
                </div>

                <div className="space-y-6 py-8">
                    <div className="inline-flex items-center gap-4 px-8 py-4 bg-slate-50 border border-slate-100 rounded-full text-slate-600 font-bold shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                        Analyzing {websiteUrl}
                    </div>
                </div>

                <div className="flex items-center justify-center gap-3 text-slate-300 font-black uppercase tracking-[0.2em] text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting to Agent
                </div>
            </div>

            {/* Ambient Background Light */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-100/30 rounded-full blur-[160px] -z-10" />
        </div>
    );

    const renderResults = () => {
        if (!brandDNA) return null;

        // Data normalization for safety
        const safeColors = typeof brandDNA.colors === 'object' && brandDNA.colors !== null ? brandDNA.colors : {};
        const safeValues = Array.isArray(brandDNA.values) ? brandDNA.values : [];
        const safeName = brandDNA.name || 'Your Brand';

        return (
            <div className="max-w-5xl mx-auto space-y-10 py-16 animate-in fade-in duration-1000 px-4">
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl gap-8">
                    <div className="flex items-center gap-8 w-full md:w-auto">
                        <div className="w-24 h-24 bg-[#F5F1FF] rounded-[32px] flex items-center justify-center text-purple-600 font-black text-3xl shadow-sm overflow-hidden border border-purple-50 shrink-0">
                            {brandDNA.logo_url ? (
                                <img src={brandDNA.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                safeName[0] || '?'
                            )}
                        </div>
                        <div className="space-y-2 flex-grow">
                            <input
                                type="text"
                                value={brandDNA.name || ''}
                                onChange={(e) => handleDNAChange('name', e.target.value)}
                                className="text-3xl font-black text-slate-900 tracking-tight bg-transparent border-b border-dashed border-slate-200 focus:border-purple-400 outline-none w-full"
                            />
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={brandDNA.industry || ''}
                                    onChange={(e) => handleDNAChange('industry', e.target.value)}
                                    className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest outline-none border-none"
                                />
                                <span className="text-slate-300 font-bold">•</span>
                                <span className="text-slate-400 font-bold text-xs">{websiteUrl}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <button onClick={() => setStep('INPUT')} className="flex-1 md:flex-none px-8 py-4 bg-slate-50 text-slate-500 font-bold rounded-[24px] border border-slate-100 hover:bg-slate-100 transition-all">
                            Discard
                        </button>
                        <button onClick={handleSaveBrand} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-10 py-4 bg-[#B392FF] text-white font-black rounded-[24px] shadow-lg shadow-purple-100 hover:bg-[#A17FFF] transition-all uppercase tracking-widest text-sm">
                            Save Identity
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Colors Card */}
                    <div className="col-span-1 md:col-span-2 bg-white border border-slate-100 p-10 rounded-[40px] space-y-8 shadow-sm">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Color Palette</label>
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                        </div>
                        <div className="flex flex-wrap gap-8">
                            {Object.entries(safeColors).map(([key, val]) => (
                                <div key={key} className="space-y-4 text-center">
                                    <div className="w-20 h-20 rounded-[24px] border-4 border-slate-50 shadow-inner" style={{ backgroundColor: val }} />
                                    <input
                                        type="text"
                                        value={val}
                                        onChange={(e) => setBrandDNA(prev => ({ ...prev, colors: { ...prev.colors, [key]: e.target.value } }))}
                                        className="text-sm font-black text-slate-900 uppercase bg-transparent border-b border-slate-100 focus:border-purple-400 outline-none w-20 text-center"
                                    />
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">{key}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tagline Card */}
                    <div className="bg-white border border-slate-100 p-10 rounded-[40px] space-y-6 shadow-sm flex flex-col justify-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tagline</label>
                        <textarea
                            value={brandDNA.tagline || ''}
                            onChange={(e) => handleDNAChange('tagline', e.target.value)}
                            className="text-2xl font-black text-slate-900 leading-tight italic bg-transparent border-none outline-none resize-none w-full"
                            rows="2"
                        />
                    </div>

                    {/* Brand Values Card */}
                    <div className="bg-white border border-slate-100 p-10 rounded-[40px] space-y-8 shadow-sm">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Brand Values</label>
                        <div className="space-y-4">
                            {safeValues.map((v, i) => (
                                <div key={i} className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center font-black text-xs shrink-0">
                                        0{i + 1}
                                    </div>
                                    <input
                                        type="text"
                                        value={v}
                                        onChange={(e) => {
                                            const newValues = [...brandDNA.values];
                                            newValues[i] = e.target.value;
                                            handleDNAChange('values', newValues);
                                        }}
                                        className="text-base font-bold text-slate-600 bg-transparent border-b border-transparent focus:border-slate-200 outline-none w-full"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tone & Aesthetic Card */}
                    <div className="col-span-1 md:col-span-2 bg-white border border-slate-100 p-10 rounded-[40px] grid grid-cols-1 md:grid-cols-2 gap-12 shadow-sm">
                        <div className="space-y-6">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tone of Voice</label>
                            <select
                                value={brandDNA.tone || 'Professional'}
                                onChange={(e) => handleDNAChange('tone', e.target.value)}
                                className="w-full px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest border border-indigo-100 outline-none"
                            >
                                {['Professional', 'Innovative', 'Casual', 'Inspiring', 'Friendly', 'Authoritative', 'Playful', 'Bold'].map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-6 border-l border-slate-50 pl-12">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Visual Aesthetic</label>
                            <textarea
                                value={brandDNA.aesthetic || ''}
                                onChange={(e) => handleDNAChange('aesthetic', e.target.value)}
                                className="text-base font-medium text-slate-500 leading-relaxed italic bg-transparent border-none outline-none resize-none w-full"
                                rows="3"
                            />
                        </div>
                    </div>

                    {/* Business Overview Card */}
                    <div className="col-span-full bg-slate-900 p-12 rounded-[48px] space-y-8 shadow-2xl relative overflow-hidden">
                        <div className="flex items-center gap-4 relative z-10">
                            <Building2 className="w-6 h-6 text-purple-400" />
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Business Overview</label>
                        </div>
                        <textarea
                            value={brandDNA.business_overview || ''}
                            onChange={(e) => handleDNAChange('business_overview', e.target.value)}
                            className="text-2xl font-medium text-white/90 leading-relaxed max-w-4xl relative z-10 bg-transparent border-none outline-none resize-none w-full"
                            rows="3"
                        />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />
                    </div>

                    <div className="p-10 bg-slate-50 rounded-[40px] border border-slate-100 flex flex-col gap-6 relative overflow-hidden">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                                <Layout className="w-4 h-4 text-white" />
                            </div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ad Layout Pattern</label>
                        </div>
                        <textarea
                            value={brandDNA.layout_pattern || ''}
                            onChange={(e) => handleDNAChange('layout_pattern', e.target.value)}
                            className="text-base font-medium text-slate-800 leading-relaxed max-w-4xl relative z-10 bg-transparent border-none outline-none resize-none w-full"
                            rows="4"
                        />
                    </div>
                </div>

                <div className="pt-10 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-slate-100">
                    <p className="text-slate-400 text-base font-bold italic">Ready to transform this DNA into campaigns?</p>
                    <button onClick={handleSaveBrand} className="w-full md:w-auto flex items-center justify-center gap-4 px-12 py-6 bg-[#0F172A] text-white font-black rounded-[32px] hover:bg-black transition-all shadow-xl hover:translate-y-[-4px]">
                        Save Final Identity
                        <CheckCircle2 className="w-6 h-6 text-purple-400" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {step === 'INPUT' && renderInput()}
            {step === 'GENERATING' && renderGenerating()}
            {step === 'RESULTS' && renderResults()}
        </div>
    );
};

export default CreateBrand;
