import React, { useState, useEffect } from 'react';
import { Megaphone, Clock, Calendar, AlertCircle, ArrowUpRight, Play, CheckSquare, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import CampaignModal from '../components/CampaignModal';
import CampaignDetailModal from '../components/CampaignDetailModal';

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, trend }) => (
    <div className="card group hover:scale-[1.02] transition-transform duration-200 cursor-pointer">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10 text-xl`}>
                <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
            </div>
            {trend && (
                <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded">
                    <ArrowUpRight className="w-3 h-3" />
                    {trend}
                </span>
            )}
        </div>
        <p className="text-xs font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        <p className="text-[10px] text-slate-400 mt-2">{subtext}</p>
    </div>
);

const ActivityItem = ({ title, time, type, status, onClick }) => (
    <div onClick={onClick} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer rounded-lg border border-transparent hover:border-slate-100 group">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center transition-colors group-hover:bg-white group-hover:shadow-sm">
            {type === 'campaign' ? <Megaphone className="w-5 h-5 text-slate-400 group-hover:text-primary-600" /> : <Play className="w-5 h-5 text-slate-400 group-hover:text-primary-600" />}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate group-hover:text-primary-600 transition-colors">{title}</p>
            <p className="text-xs text-slate-400 font-medium">{time}</p>
        </div>
        <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'
            }`}>
            {status}
        </span>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const userName = user?.email?.split('@')[0] || 'there';

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            console.log("Fetching dashboard data...");
            // Fetch Recent Campaigns
            const { data: campaignsData, error: campaignsError } = await supabase
                .from('campaigns')
                .select('*')
                .order('created_at', { ascending: false });

            if (campaignsError) {
                console.error("Supabase Error (campaigns):", campaignsError);
                throw campaignsError;
            }

            // Fetch Activity Feed
            const { data: activitiesData, error: activitiesError } = await supabase
                .from('activities')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (activitiesError) {
                console.error("Supabase Error (activities):", activitiesError);
                throw activitiesError;
            }

            console.log("Successfully fetched campaigns:", campaignsData?.length);
            setCampaigns(campaignsData || []);
            setActivities(activitiesData || []);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCampaignClick = (campaign) => {
        setSelectedCampaign(campaign);
        setIsDetailModalOpen(true);
    };

    const handleActivityClick = (activity) => {
        const campaign = campaigns.find(c => c.id === activity.campaign_id);
        if (campaign) {
            setSelectedCampaign(campaign);
            setIsDetailModalOpen(true);
        }
    };

    const stats = {
        total: campaigns.length,
        pending: campaigns.filter(c => c.status === 'Pending Approval').length,
        scheduled: 0,
        failed: 0
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 text-left">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard</h2>
                    <p className="text-slate-500 mt-1 font-medium">Good morning, {userName.charAt(0).toUpperCase() + userName.slice(1)}. Here's what's happening.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-100 hover:bg-primary-700 transition-all hover:translate-y-[-1px] active:translate-y-[0px] shadow-primary-200"
                >
                    <Plus className="w-5 h-5" />
                    New Campaign
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Campaigns (30d)"
                    value={stats.total}
                    subtext="+0 from last month"
                    icon={Megaphone}
                    colorClass="bg-primary-600"
                    trend="0%"
                />
                <StatCard
                    title="Pending Approvals"
                    value={stats.pending}
                    subtext="Needs your review"
                    icon={Clock}
                    colorClass="bg-amber-500"
                />
                <StatCard
                    title="Scheduled (7d)"
                    value={stats.scheduled}
                    subtext="Across all platforms"
                    icon={Calendar}
                    colorClass="bg-sky-500"
                />
                <StatCard
                    title="Failed Publishes"
                    value={stats.failed}
                    subtext="Need retry"
                    icon={AlertCircle}
                    colorClass="bg-rose-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 font-black">Recent Campaigns</h3>
                        <button className="text-sm font-bold text-primary-600 hover:text-primary-700 uppercase tracking-widest">View all</button>
                    </div>
                    <div className="card p-0 overflow-hidden divide-y divide-slate-50 min-h-[100px] border-slate-100 shadow-sm">
                        {loading ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 font-black tracking-widest uppercase">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <p className="text-[10px]">Loading Campaigns...</p>
                            </div>
                        ) : campaigns.length > 0 ? (
                            campaigns.slice(0, 3).map(c => (
                                <ActivityItem
                                    key={c.id}
                                    title={`${c.product_name} — ${c.objective}`}
                                    time={`${c.brand} • ${new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
                                    type="campaign"
                                    status={c.status}
                                    onClick={() => handleCampaignClick(c)}
                                />
                            ))
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-300">
                                <Megaphone className="w-12 h-12" />
                                <p className="text-xs font-bold uppercase tracking-widest text-center">
                                    No Recent Campaigns<br />
                                    <span className="text-[10px] lowercase font-normal">Check console for connection issues</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4 text-left">
                    <h3 className="text-lg font-bold text-slate-900 font-black text-left">Activity Feed</h3>
                    <div className="card p-6 space-y-8 min-h-[100px] border-slate-100 shadow-sm">
                        {loading ? (
                            <div className="py-8 flex flex-col items-center gap-3 text-slate-400">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                        ) : activities.length > 0 ? (
                            activities.map(a => (
                                <div key={a.id} className="flex gap-4 group cursor-pointer" onClick={() => handleActivityClick(a)}>
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${a.type === 'campaign_created' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                                        } group-hover:bg-white group-hover:shadow-sm`}>
                                        {a.type === 'campaign_created' ? (
                                            <Megaphone className="w-4 h-4" />
                                        ) : (
                                            <CheckSquare className="w-4 h-4" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] text-slate-800 leading-tight">
                                            <span className="font-bold">{userName}</span>{' '}
                                            {a.type === 'campaign_created' ? 'created' : 'approved'} campaign{' '}
                                            <span className="text-primary-600 font-bold group-hover:underline">
                                                {a.details?.product_name}
                                            </span>
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">
                                            {new Date(a.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No Activity Yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <CampaignModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); fetchDashboardData(); }} />
            <CampaignDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} campaign={selectedCampaign} />
        </div>
    );
};

export default Dashboard;
