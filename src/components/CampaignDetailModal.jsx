import React, { useState } from 'react';
import { X, Calendar, Clock, CheckCircle2, ChevronRight, Layout, Info, Megaphone, Target, MessageSquare, Download, ExternalLink, Globe, User, History, Sparkles } from 'lucide-react';

const CampaignDetailModal = ({ isOpen, onClose, campaign }) => {
    const [activeTab, setActiveTab] = useState('Overview');

    if (!isOpen || !campaign) return null;

    const tabs = ['Overview', 'Copy Variants', 'Visuals'];

    const renderOverview = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="card p-8 border-slate-100 shadow-sm space-y-8">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        Campaign Brief
                    </h4>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product</p>
                            <p className="text-sm font-bold text-slate-900">{campaign.product_name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Objective</p>
                            <p className="text-sm font-bold text-slate-900">{campaign.objective}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tone</p>
                            <p className="text-sm font-bold text-slate-900">{campaign.tone || 'Professional'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Brand</p>
                            <p className="text-sm font-bold text-slate-900">{campaign.brand || 'Your Brand'}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product Description</p>
                            <p className="text-sm text-slate-600 leading-relaxed">{campaign.description}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Audience</p>
                            <p className="text-sm text-slate-600 leading-relaxed">{campaign.audience || 'General'}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platforms</p>
                        <div className="flex flex-wrap gap-2">
                            {(campaign.platforms || []).map(p => (
                                <span key={p} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${p === 'LinkedIn' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                        p === 'Instagram' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                                            'bg-indigo-50 text-indigo-600 border-indigo-100'
                                    }`}>
                                    {p}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="card p-6 border-slate-100 shadow-sm space-y-6">
                    <h4 className="text-sm font-bold text-slate-900">Timeline</h4>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Created</p>
                                <p className="text-sm font-bold text-slate-900">{new Date(campaign.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-400">
                                <Clock className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Updated</p>
                                <p className="text-sm font-bold text-slate-900">{new Date(campaign.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card p-6 border-slate-100 shadow-sm space-y-6">
                    <h4 className="text-sm font-bold text-slate-900">Quick Actions</h4>
                    <div className="space-y-3">
                        <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-all text-sm font-semibold text-slate-700 bg-white group">
                            Submit for Approval
                            <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-primary-600 transition-colors" />
                        </button>
                        <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-all text-sm font-semibold text-slate-700 bg-white group">
                            Schedule Posts
                            <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-primary-600 transition-colors" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCopyVariants = () => {
        const copy = campaign.generated_copy || {};
        const selected = campaign.selected_variants || {};
        const platforms = Object.keys(selected).filter(p => selected[p]?.length > 0);

        if (platforms.length === 0) {
            return (
                <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <MessageSquare className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Variants Selected</p>
                </div>
            );
        }

        return (
            <div className="space-y-8">
                {platforms.map(platform => (
                    <div key={platform} className="space-y-4 text-left">
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${platform === 'LinkedIn' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    platform === 'Instagram' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                                        'bg-indigo-50 text-indigo-600 border-indigo-100'
                                }`}>
                                {platform}
                            </span>
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selected Copy</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(selected[platform] || []).map(vId => {
                                const variant = copy[platform]?.[vId - 1];
                                if (!variant) return null;
                                return (
                                    <div key={vId} className="card p-6 border-slate-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary-600" />
                                        <div className="space-y-4">
                                            <p className="text-sm font-bold text-slate-900">{variant.title}</p>
                                            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{variant.body}</p>
                                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Variant {vId}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderVisuals = () => {
        const images = campaign.generated_images || {};
        const imageKeys = Object.keys(images);

        if (imageKeys.length === 0) {
            return (
                <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <Sparkles className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Visuals Generated</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {imageKeys.map(key => {
                    const [platform, vIdx] = key.split('-');
                    return (
                        <div key={key} className="space-y-3 text-left">
                            <div className="aspect-square rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden relative group shadow-sm">
                                <img src={images[key]} className="w-full h-full object-cover" alt={`${platform} Visual`} />
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const link = document.createElement('a');
                                            link.href = images[key];
                                            link.download = `${campaign.product_name}-${key}.png`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }}
                                        className="p-2 bg-white/90 backdrop-blur-md rounded-lg shadow-lg text-slate-700 hover:text-primary-600 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-slate-900/60 to-transparent">
                                    <p className="text-[10px] font-bold text-white uppercase tracking-wider">{platform} Variant {parseInt(vIdx) + 1}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white w-full max-w-6xl h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-8 pb-4 flex justify-between items-start">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                {campaign.product_name} — {campaign.objective}
                            </h2>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${campaign.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                                }`}>
                                • {campaign.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-bold">
                            <p className="text-slate-400">Brand: <span className="text-slate-900">{campaign.brand || 'Your Brand'}</span></p>
                            <p className="text-slate-400">By <span className="text-slate-900">User</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-100 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                            <History className="w-4 h-4" />
                            Duplicate
                        </button>
                        <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors">
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="px-8 border-b border-slate-100 bg-white">
                    <div className="flex gap-8">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 text-xs font-black uppercase tracking-widest relative transition-all ${activeTab === tab ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                    <div className="max-w-5xl mx-auto">
                        {activeTab === 'Overview' && renderOverview()}
                        {activeTab === 'Copy Variants' && renderCopyVariants()}
                        {activeTab === 'Visuals' && renderVisuals()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignDetailModal;
