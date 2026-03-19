import React, { useState, useEffect } from 'react';
import {
    Megaphone,
    Search,
    Filter,
    Plus,
    MoreHorizontal,
    ChevronDown,
    Linkedin,
    Instagram,
    Facebook,
    Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import CampaignModal from '../components/CampaignModal';
import CampaignDetailModal from '../components/CampaignDetailModal';

const Campaigns = () => {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const userName = user?.email?.split('@')[0] || 'User';

    useEffect(() => {
        if (user?.id) {
            // Initializing from cache
            const cached = localStorage.getItem(`campaigns_${user.id}`);
            if (cached) {
                setCampaigns(JSON.parse(cached));
                setLoading(false); // Skip initial loader if we have data
            }
            fetchCampaigns();
        }
    }, [user]);

    const fetchCampaigns = async () => {
        if (!user?.id) return;

        const hasCache = localStorage.getItem(`campaigns_${user.id}`);
        if (!hasCache) setLoading(true);

        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setCampaigns(data || []);
            localStorage.setItem(`campaigns_${user.id}`, JSON.stringify(data || []));
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (campaign) => {
        setSelectedCampaign(campaign);
        setIsDetailModalOpen(true);
    };

    const PlatformBadge = ({ platform }) => {
        const colors = {
            LinkedIn: "bg-blue-50 text-blue-600 border-blue-100",
            Instagram: "bg-rose-50 text-rose-600 border-rose-100",
            Facebook: "bg-indigo-50 text-indigo-600 border-indigo-100"
        };
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colors[platform] || 'bg-slate-50 text-slate-600'}`}>
                {platform}
            </span>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Campaigns</h2>
                    <p className="text-slate-500 mt-2 font-medium">{campaigns.length} campaigns across your brands</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-100 hover:bg-primary-700 transition-all hover:translate-y-[-1px] active:translate-y-[0px] shadow-primary-200"
                >
                    <Plus className="w-5 h-5" />
                    New Campaign
                </button>
            </div>

            <div className="space-y-4">
                {/* Search and Filters */}
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-600 transition-all outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-2 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-semibold">Filter:</span>
                        <div className="flex items-center gap-4 ml-2">
                            <div className="flex items-center gap-1 text-slate-900 font-bold text-sm">
                                All Brands <ChevronDown className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex items-center gap-1 text-slate-900 font-bold text-sm">
                                All Statuses <ChevronDown className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex items-center gap-1 text-slate-900 font-bold text-sm">
                                All Platforms <ChevronDown className="w-4 h-4 text-slate-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="card p-0 overflow-hidden shadow-sm border-slate-100">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Campaign Name</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Brand</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platforms</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Updated</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next Scheduled</th>
                                <th className="px-6 py-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-400 font-black tracking-widest uppercase">
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            <p className="text-[10px]">Loading Campaigns...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : campaigns.length > 0 ? (
                                campaigns.map((c) => (
                                    <tr
                                        key={c.id}
                                        onClick={() => handleRowClick(c)}
                                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-5">
                                            <p className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">
                                                {c.product_name} — {c.objective}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1.5 font-bold uppercase tracking-widest">
                                                by {userName}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                                                <span className="text-sm font-bold text-slate-700 tracking-tight">{c.brand || 'Your Brand'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${c.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                c.status === 'Scheduled' ? 'bg-primary-50 text-primary-600 border-primary-100' :
                                                    'bg-orange-50 text-orange-600 border-orange-100'
                                                }`}>
                                                • {c.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex gap-1.5 flex-wrap">
                                                {(c.platforms || []).map(p => <PlatformBadge key={p} platform={p} />)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm text-slate-500 font-bold uppercase tracking-tight">
                                            {new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-5 text-sm text-slate-300 font-bold uppercase tracking-widest">
                                            {c.publish_plan === 'Schedule For Later' ? 'Pending' : '—'}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="text-slate-300 hover:text-slate-600 transition-colors">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-300 uppercase tracking-widest">
                                            <Megaphone className="w-12 h-12" />
                                            <p className="text-xs font-bold">No Campaigns Found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CampaignModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); fetchCampaigns(); }} />
            <CampaignDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} campaign={selectedCampaign} />
        </div>
    );
};

export default Campaigns;
