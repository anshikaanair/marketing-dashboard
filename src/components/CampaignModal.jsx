import React, { useState } from 'react';
import { X, Plus, ChevronRight, Layout, Info, Check, Linkedin, Instagram, Facebook, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react';

const CampaignModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [formData, setFormData] = useState({
        brand: '',
        productName: '',
        objective: '',
        description: '',
        audience: '',
        tone: '',
        platforms: []
    });

    const [generatedCopy, setGeneratedCopy] = useState(null);
    const [selectedVariants, setSelectedVariants] = useState({}); // { LinkedIn: 1, Instagram: 2 }
    const [activePlatform, setActivePlatform] = useState('');
    const [activeVariant, setActiveVariant] = useState(1);

    // Visual Studio State
    const [selectedTemplate, setSelectedTemplate] = useState('Minimal');
    const [generatedImages, setGeneratedImages] = useState({}); // { LinkedIn: 'base64...' }

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!formData.productName || !formData.description || formData.platforms.length === 0) {
            alert("Please fill in Product Name, Description, and select at least one platform.");
            return;
        }

        setIsLoading(true);
        const apiKey = import.meta.env.VITE_GROQ_API_KEY;
        const results = {};

        try {
            for (const platform of formData.platforms) {
                const prompt = `
                    Generate 2 organic social media post captions for the following product:
                    Brand: ${formData.brand}
                    Product Name: ${formData.productName}
                    Campaign Objective: ${formData.objective}
                    Product Description: ${formData.description}
                    Target Audience: ${formData.audience}
                    Tone: ${formData.tone}
                    Platform: ${platform}

                    Requirements:
                    1. The style must be an organic post type caption (engaging, relatable, value-driven) rather than a formal ad format.
                    2. Provide TWO distinct variants.
                    3. Return ONLY a JSON object with exactly this structure:
                    {"variants": [{"title": "Short catchy hook/headline", "body": "Post caption content", "chars": length_of_body_number}]}
                `;

                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [{ role: "user", content: prompt }],
                        temperature: 0.7,
                        response_format: { type: "json_object" }
                    })
                });

                if (!response.ok) throw new Error(`Groq API error for ${platform}`);

                const data = await response.json();
                const content = JSON.parse(data.choices[0].message.content);
                results[platform] = content.variants;
            }

            setGeneratedCopy(results);
            setActivePlatform(formData.platforms[0]);

            // Don't set default selections anymore
            setSelectedVariants({});
            setActiveVariant(1);

            setStep(2);
        } catch (error) {
            console.error("Generation failed:", error);
            alert("Failed to generate variants. Please check your API key and network.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateVisuals = async () => {
        setIsGeneratingImage(true);
        const newImages = { ...generatedImages };

        try {
            // Only generate visuals for platforms that have a selected variant
            const selectedPlatforms = Object.keys(selectedVariants);

            for (const platform of selectedPlatforms) {
                const variantIdx = selectedVariants[platform] - 1;
                const copy = generatedCopy[platform][variantIdx];

                const response = await fetch('http://localhost:8000/generate-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        product_name: formData.productName,
                        ad_copy: copy.body,
                        brand_name: formData.brand || 'Your Brand',
                        platform: platform,
                        template: selectedTemplate
                    })
                });

                if (!response.ok) throw new Error(`Image API error for ${platform}`);
                const data = await response.json();
                newImages[platform] = `data:${data.mime_type};base64,${data.image}`;
            }
            setGeneratedImages(newImages);
        } catch (error) {
            console.error("Visual generation failed:", error);
            alert("Failed to generate images. Make sure the backend is running at localhost:8000 (cd backend && uvicorn main:app --reload)");
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const steps = [
        { id: 1, name: 'Product Input' },
        { id: 2, name: 'Copy Variants' },
        { id: 3, name: 'Visual Studio' },
        { id: 4, name: 'Review & Submit' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 text-left">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-100">
                            <Plus className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 leading-none">Create Campaign</h2>
                            <p className="text-xs text-slate-400 font-medium mt-1">Step {step} of 4 — {steps[step - 1].name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Multi-step progress bar */}
                <div className="px-8 py-4 border-b border-slate-50">
                    <div className="flex items-center justify-between max-w-3xl mx-auto">
                        {steps.map((s, idx) => (
                            <React.Fragment key={s.id}>
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                        {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= s.id ? 'text-primary-600' : 'text-slate-400'
                                        }`}>{s.name}</span>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className={`flex-1 h-px transition-colors ${step > s.id ? 'bg-primary-600' : 'bg-slate-100'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8">
                    {step === 1 && (
                        <div className="max-w-3xl mx-auto space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2 font-black">Product Input</h3>
                                <p className="text-sm text-slate-500">Tell our AI about your product. The more detail you provide, the better the output.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Brand *</label>
                                    <select
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-600 transition-all outline-none"
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    >
                                        <option value="">Select a Brand</option>
                                        <option value="Acme Corp">Acme Corp · Technology</option>
                                        <option value="ToolFlow AI">ToolFlow AI · SaaS</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Product Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. DataSync Pro"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-600 transition-all outline-none"
                                        value={formData.productName}
                                        onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Campaign Objective *</label>
                                    <select
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-600 transition-all outline-none"
                                        value={formData.objective}
                                        onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                                    >
                                        <option value="">Select Objective</option>
                                        <option value="Brand Awareness">Brand Awareness</option>
                                        <option value="Lead Generation">Lead Generation</option>
                                        <option value="Customer Retention">Customer Retention</option>
                                    </select>
                                </div>

                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Product Description *</label>
                                    <textarea
                                        rows="3"
                                        placeholder="What makes your product special?"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-600 transition-all outline-none resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Target Audience</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Marketing Managers"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-600 transition-all outline-none"
                                        value={formData.audience}
                                        onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tone</label>
                                    <select
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-600 transition-all outline-none"
                                        value={formData.tone}
                                        onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                                    >
                                        <option value="">Select Tone</option>
                                        <option value="Professional">Professional</option>
                                        <option value="Creative">Creative</option>
                                        <option value="Casual">Casual</option>
                                    </select>
                                </div>

                                <div className="col-span-2 space-y-3">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Platforms</label>
                                    <div className="flex gap-4">
                                        {['LinkedIn', 'Instagram', 'Facebook'].map(p => (
                                            <label key={p} className="flex items-center gap-2 cursor-pointer group">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData.platforms.includes(p)
                                                    ? 'bg-primary-600 border-primary-600 text-white'
                                                    : 'border-slate-300 bg-white group-hover:border-primary-400'
                                                    }`}>
                                                    {formData.platforms.includes(p) && <Check className="w-3 h-3" />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={formData.platforms.includes(p)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setFormData({ ...formData, platforms: [...formData.platforms, p] });
                                                        else setFormData({ ...formData, platforms: formData.platforms.filter(x => x !== p) });
                                                    }}
                                                />
                                                <span className="text-sm text-slate-700">{p}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && generatedCopy && (
                        <div className="max-w-5xl mx-auto space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-1 font-black">Organic Post Variants</h3>
                                    <p className="text-sm text-slate-500">Pick the best caption to proceed to the Visual Studio.</p>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl">
                                    <Sparkles className="w-4 h-4 text-indigo-600" />
                                    <span className="text-xs font-bold text-indigo-700">Selection required for each platform</span>
                                </div>
                            </div>

                            {/* Platform Tabs */}
                            <div className="flex items-center gap-6 border-b border-slate-100">
                                {Object.keys(generatedCopy).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => { setActivePlatform(p); setActiveVariant(selectedVariants[p] || 1); }}
                                        className={`flex items-center gap-2 px-1 py-3 text-sm font-semibold transition-all relative ${activePlatform === p ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        {p === 'LinkedIn' && <Linkedin className="w-4 h-4" />}
                                        {p === 'Instagram' && <Instagram className="w-4 h-4" />}
                                        {p === 'Facebook' && <Facebook className="w-4 h-4" />}
                                        {p}
                                        {selectedVariants[p] && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full ml-1" />}
                                        {activePlatform === p && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />}
                                    </button>
                                ))}
                            </div>

                            {/* Variant Selection Tabs */}
                            <div className="flex items-center gap-2">
                                {[1, 2].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => {
                                            setActiveVariant(v);
                                            setSelectedVariants({ ...selectedVariants, [activePlatform]: v });
                                        }}
                                        className={`px-6 py-2 text-sm font-bold rounded-xl transition-all border ${selectedVariants[activePlatform] === v
                                            ? 'bg-primary-50 border-primary-600 text-primary-600 shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-primary-400'
                                            }`}
                                    >
                                        Variant {v}
                                        {selectedVariants[activePlatform] === v && <Check className="w-3 h-3 inline ml-2" />}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{activePlatform} Caption {activeVariant}</label>
                                            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                                                {generatedCopy[activePlatform][activeVariant - 1]?.chars || 0} / 3,000 chars
                                            </span>
                                        </div>
                                        <div className="card p-6 min-h-[200px] border-slate-200 relative group transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <p className="text-sm font-bold text-slate-900">{generatedCopy[activePlatform][activeVariant - 1]?.title}</p>
                                                <button
                                                    onClick={() => {
                                                        const currentSelection = selectedVariants[activePlatform];
                                                        if (currentSelection === activeVariant) {
                                                            const newSelections = { ...selectedVariants };
                                                            delete newSelections[activePlatform];
                                                            setSelectedVariants(newSelections);
                                                        } else {
                                                            setSelectedVariants({ ...selectedVariants, [activePlatform]: activeVariant });
                                                        }
                                                    }}
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedVariants[activePlatform] === activeVariant
                                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                                                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    <Check className={`w-6 h-6 ${selectedVariants[activePlatform] === activeVariant ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
                                                </button>
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{generatedCopy[activePlatform][activeVariant - 1]?.body}</p>

                                            {selectedVariants[activePlatform] === activeVariant && (
                                                <div className="absolute top-0 left-0 w-1 h-full bg-primary-600 rounded-l-xl" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Preview</label>
                                    <div className="card p-4 border-slate-200 shadow-sm overflow-hidden flex flex-col gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary-600" />
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">{formData.brand || 'Your Brand'}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{activePlatform}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-xs text-slate-800 line-clamp-3 font-semibold">{generatedCopy[activePlatform][activeVariant - 1]?.title}</p>
                                            <p className="text-[11px] text-slate-600 line-clamp-4 leading-relaxed">{generatedCopy[activePlatform][activeVariant - 1]?.body}</p>
                                        </div>
                                        <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden relative group">
                                            <div className="absolute inset-0 bg-primary-600/5 group-hover:bg-transparent transition-colors" />
                                            <span className="text-[10px] font-bold text-primary-200 uppercase tracking-widest z-10">Image Placeholder</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="max-w-5xl mx-auto space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1 font-black">Visual Studio</h3>
                                <p className="text-sm text-slate-500">Configure branded visual assets using your brand's design system.</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                {/* Configuration Sidebar */}
                                <div className="lg:col-span-4 space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Template</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['Minimal', 'Bold', 'Gradient'].map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setSelectedTemplate(t)}
                                                    className={`aspect-[4/5] rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${selectedTemplate === t
                                                        ? 'bg-primary-50 border-primary-600 ring-4 ring-primary-50'
                                                        : 'bg-white border-slate-100 hover:border-slate-300'
                                                        }`}
                                                >
                                                    <div className={`w-8 h-10 rounded shadow-sm ${t === 'Minimal' ? 'bg-white' :
                                                        t === 'Bold' ? 'bg-primary-600' : 'bg-gradient-to-br from-primary-500 to-indigo-600'
                                                        }`} />
                                                    <span className={`text-[10px] font-bold ${selectedTemplate === t ? 'text-primary-700' : 'text-slate-500'}`}>{t}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Selected Platform</label>
                                        <select
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-100"
                                            value={activePlatform}
                                            onChange={(e) => setActivePlatform(e.target.value)}
                                        >
                                            {Object.keys(selectedVariants).map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>

                                    <button
                                        onClick={handleGenerateVisuals}
                                        disabled={isGeneratingImage || Object.keys(selectedVariants).length === 0}
                                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
                                    >
                                        {isGeneratingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                        {isGeneratingImage ? "Designing Artwork..." : Object.keys(selectedVariants).length === 0 ? "Select a Variant First" : "Generate AI Visuals"}
                                    </button>
                                </div>

                                {/* Previews */}
                                <div className="lg:col-span-8 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Asset Previews</label>
                                        <div className="flex gap-2">
                                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">Ready for {activePlatform}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Square Preview */}
                                        <div className="space-y-2">
                                            <div className="aspect-square rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden relative group">
                                                {generatedImages[activePlatform] ? (
                                                    <img src={generatedImages[activePlatform]} className="w-full h-full object-cover" alt="Square Preview" />
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-30">
                                                        <ImageIcon className="w-12 h-12 text-slate-400" />
                                                        <span className="text-xs font-bold text-slate-500 tracking-widest uppercase">Square Asset</span>
                                                    </div>
                                                )}
                                                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white">
                                                    <p className="text-[10px] font-black text-slate-900 leading-tight line-clamp-2">
                                                        {generatedCopy[activePlatform][(selectedVariants[activePlatform] || 1) - 1]?.title}
                                                    </p>
                                                    <button className="mt-2 w-full py-1.5 bg-primary-600 text-white text-[10px] font-bold rounded-lg">Learn More</button>
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">Square (1:1)</p>
                                        </div>

                                        {/* Landscape Preview */}
                                        <div className="space-y-6 flex flex-col justify-between">
                                            <div className="aspect-video rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden relative group">
                                                {generatedImages[activePlatform] ? (
                                                    <img src={generatedImages[activePlatform]} className="w-full h-full object-cover" alt="Landscape Preview" />
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-30">
                                                        <ImageIcon className="w-12 h-12 text-slate-400" />
                                                        <span className="text-xs font-bold text-slate-500 tracking-widest uppercase">Landscape</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/50 to-transparent p-4">
                                                    <p className="text-xs font-bold text-white line-clamp-1">
                                                        {generatedCopy[activePlatform][(selectedVariants[activePlatform] || 1) - 1]?.title}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">Landscape (16:9)</p>

                                            <div className="card p-4 border-slate-100 bg-slate-50/50">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Selected Hook</p>
                                                <p className="text-xs font-bold text-slate-800 italic">"{generatedCopy[activePlatform][(selectedVariants[activePlatform] || 1) - 1]?.title}"</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-white relative z-10">
                    <button
                        onClick={() => step > 1 && setStep(step - 1)}
                        className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all border border-slate-200 ${step === 1 ? 'opacity-50 cursor-not-allowed text-slate-300' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        Back
                    </button>

                    <div className="flex items-center gap-2">
                        {steps.map(s => (
                            <div key={s.id} className={`w-1.5 h-1.5 rounded-full transition-all ${step === s.id ? 'w-4 bg-primary-600' : 'bg-slate-200'}`} />
                        ))}
                    </div>

                    <button
                        disabled={isLoading || isGeneratingImage || (step === 2 && Object.keys(selectedVariants).length === 0)}
                        onClick={() => {
                            if (step === 1) handleGenerate();
                            else if (step === 2) {
                                // Ensure only selected platforms are shown in next step
                                const selected = Object.keys(selectedVariants);
                                if (selected.length > 0) {
                                    setActivePlatform(selected[0]);
                                    setStep(3);
                                }
                            }
                            else if (step < 4) setStep(step + 1);
                        }}
                        className={`flex items-center gap-2 px-8 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all hover:translate-y-[-1px] active:translate-y-[0px] ${isLoading || isGeneratingImage || (step === 2 && Object.keys(selectedVariants).length === 0) ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : isGeneratingImage ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Designing...
                            </>
                        ) : (
                            <>
                                {step === 1 ? 'Generate Variants' : step === 3 ? 'Review Campaign' : 'Continue to Visuals'}
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CampaignModal;
