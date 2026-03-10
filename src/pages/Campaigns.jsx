import React, { useState } from 'react';
import {
    Megaphone,
    Search,
    Filter,
    Plus,
    MoreHorizontal,
    ChevronDown,
    Linkedin,
    Instagram,
    Facebook
} from 'lucide-react';
import CampaignModal from '../components/CampaignModal';

const Campaigns = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const campaigns = [
        {
            id: 1,
            name: "Q1 Product Launch — DataSync Pro",
            author: "Emily Rodriguez",
            brand: "Acme Corp",
            brandColor: "bg-primary-600",
            status: "Pending Approval",
            statusColor: "text-orange-600 bg-orange-50 border-orange-100",
            platforms: ["LinkedIn", "Facebook"],
            lastUpdated: "Mar 4, 2025",
            nextScheduled: "—"
        },
        {
            id: 2,
            name: "Spring Brand Awareness — TechFlow AI",
            author: "James Wilson",
            brand: "TechFlow",
            brandColor: "bg-sky-500",
            status: "Approved",
            statusColor: "text-emerald-600 bg-emerald-50 border-emerald-100",
            platforms: ["LinkedIn", "Instagram"],
            lastUpdated: "Mar 1, 2025",
            nextScheduled: "Mar 6"
        },
        {
            id: 3,
            name: "Customer Retention Drive — March 2025",
            author: "Sarah Johnson",
            brand: "Acme Corp",
            brandColor: "bg-primary-600",
            status: "Scheduled",
            statusColor: "text-primary-600 bg-primary-50 border-primary-100",
            platforms: ["LinkedIn", "Facebook"],
            lastUpdated: "Feb 28, 2025",
            nextScheduled: "Mar 7"
        }
    ];

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
                    <p className="text-slate-500 mt-2 font-medium">6 campaigns across 3 brands</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
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
                            {campaigns.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <p className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{c.name}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium underline underline-offset-2 decoration-slate-200">by {c.author}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${c.brandColor}`} />
                                            <span className="text-sm font-bold text-slate-700">{c.brand}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${c.statusColor}`}>
                                            • {c.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex gap-1.5 flex-wrap">
                                            {c.platforms.map(p => <PlatformBadge key={p} platform={p} />)}
                                            <span className="w-4 h-4 rounded bg-slate-100 text-[10px] flex items-center justify-center font-bold text-slate-400 hover:bg-slate-200 cursor-pointer">X</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-sm text-slate-500 font-medium">{c.lastUpdated}</td>
                                    <td className="px-6 py-5 text-sm text-slate-400 font-medium">{c.nextScheduled}</td>
                                    <td className="px-6 py-5 text-right">
                                        <button className="text-slate-300 hover:text-slate-600 transition-colors">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <CampaignModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

export default Campaigns;
