import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight, Search, Filter, Layout, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ScheduleModal from '../components/ScheduleModal';

const Schedule = () => {
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [socialAccounts, setSocialAccounts] = useState([]);
    const [isPublishing, setIsPublishing] = useState(null);

    useEffect(() => {
        if (user) {
            fetchApprovedCampaigns();
            fetchSocialAccounts();
        }
    }, [user]);

    const fetchSocialAccounts = async () => {
        try {
            const { data } = await supabase.from('social_accounts').select('*').eq('status', 'Connected');
            setSocialAccounts(data || []);
        } catch (error) {
            console.error('Error fetching social accounts:', error);
        }
    };

    const fetchApprovedCampaigns = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .in('status', ['Approved', 'Scheduled'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCampaigns(data || []);
        } catch (error) {
            console.error('Error fetching approved campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (campaign, platform) => {
        setSelectedEntry({ campaign, platform });
        setIsModalOpen(true);
    };

    // Flatten campaigns into platform rows
    const scheduleRows = campaigns.flatMap(campaign => {
        const platforms = campaign.platforms || [];
        return platforms.map(platform => ({
            id: `${campaign.id}-${platform}`,
            campaign,
            platform,
            schedule: campaign.schedules?.[platform] || { scheduled_at: null, status: 'Pending' }
        }));
    });

    const formatScheduleTime = (timeStr) => {
        if (!timeStr) return '--';
        const date = new Date(timeStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const handlePublish = async (e, row) => {
        e.stopPropagation();
        // Try to match the account name with the campaign brand name for better precision
        const account = socialAccounts.find(a =>
            a.platform === row.platform &&
            (row.campaign.brand && a.account_name.toLowerCase().includes(row.campaign.brand.toLowerCase()))
        ) || socialAccounts.find(a => a.platform === row.platform);

        if (!account) {
            alert(`Please connect a ${row.platform} account for "${row.campaign.brand}" in the Social Accounts page first.`);
            return;
        }

        setIsPublishing(row.id);

        try {
            // Get the actual selected variant index for this platform
            const selectedVariantNums = row.campaign.selected_variants?.[row.platform] || [1];
            const variantIdx = selectedVariantNums[0] - 1; // 0-based index

            const adCopy = row.campaign.generated_copy?.[row.platform]?.[variantIdx]?.body || row.campaign.description;

            // Handle both single images and carousels (pick the first image/slide)
            const images = row.campaign.generated_images || {};

            // Case-insensitive lookup for platform keys (handles "Instagram" vs "INSTAGRAM")
            const getPlatformImage = (platform, vIdx) => {
                const keys = Object.keys(images);
                const searchBase = `${platform}-${vIdx}`.toLowerCase();
                const foundKey = keys.find(k => {
                    const lk = k.toLowerCase();
                    return lk === searchBase ||
                        lk === `${searchBase}-slide0` ||
                        lk === `${searchBase}-slide1` ||
                        lk === `${searchBase}-slide2` ||
                        lk === `${searchBase}-slide3`;
                });
                return foundKey ? images[foundKey] : null;
            };

            let imageBase64 = getPlatformImage(row.platform, variantIdx);

            // Fallback: If no platform-specific image found, try any image from the same campaign
            if (!imageBase64 && Object.keys(images).length > 0) {
                console.log("Debug Publishing - Specific image not found, using first available image as fallback");
                imageBase64 = Object.values(images)[0];
            }

            console.log("Debug Publishing - Targeting:", row.platform, "VariantIdx:", variantIdx, "Found image:", imageBase64 ? "YES" : "NO");

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/social/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page_id: account.account_id,
                    access_token: account.access_token,
                    message: adCopy,
                    image_base64: imageBase64,
                    platform: row.platform
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Failed to publish');

            // Update status in campaigns.schedules
            const updatedSchedules = {
                ...row.campaign.schedules,
                [row.platform]: {
                    ...row.campaign.schedules[row.platform],
                    status: 'Posted',
                    post_id: data.post_id
                }
            };

            await supabase
                .from('campaigns')
                .update({ schedules: updatedSchedules })
                .eq('id', row.campaign.id);

            alert(`Successfully posted to ${row.platform}!`);
            fetchApprovedCampaigns();
        } catch (error) {
            console.error("Publish error:", error);

            const updatedSchedules = {
                ...row.campaign.schedules,
                [row.platform]: {
                    ...row.campaign.schedules[row.platform],
                    status: 'Failed',
                    error: error.message
                }
            };
            await supabase.from('campaigns').update({ schedules: updatedSchedules }).eq('id', row.campaign.id);
            alert(`Failed to post: ${error.message}`);
            fetchApprovedCampaigns();
        } finally {
            setIsPublishing(null);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 text-left">
            <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Schedule</h2>
                <p className="text-slate-500 mt-1 font-medium">Manage and monitor your approved campaign publications</p>
            </div>

            <div className="card border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Scheduled Time</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Campaign</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Platform</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-400 font-bold uppercase tracking-widest text-xs">
                                            <div className="w-6 h-6 border-2 border-slate-200 border-t-primary-600 rounded-full animate-spin" />
                                            Loading campaigns...
                                        </div>
                                    </td>
                                </tr>
                            ) : scheduleRows.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-300">
                                            <Calendar className="w-12 h-12" />
                                            <p className="font-bold uppercase tracking-widest text-xs">No approved campaigns to schedule</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                scheduleRows.map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => handleRowClick(row.campaign, row.platform)}
                                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${row.schedule.scheduled_at ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                                <span className={`text-sm font-bold ${row.schedule.scheduled_at ? 'text-slate-900' : 'text-slate-400'}`}>
                                                    {formatScheduleTime(row.schedule.scheduled_at)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-black text-slate-900 group-hover:text-primary-600 transition-colors">
                                                    {row.campaign.product_name} — {row.campaign.brand}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{row.campaign.brand}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${row.platform === 'LinkedIn' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                row.platform === 'Instagram' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                                                    'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                }`}>
                                                {row.platform}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${row.schedule.status === 'Scheduled' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                row.schedule.status === 'Failed' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    'bg-orange-50 text-orange-600 border-orange-100'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${row.schedule.status === 'Posted' ? 'bg-indigo-500' : row.schedule.status === 'Scheduled' ? 'bg-emerald-500' :
                                                    row.schedule.status === 'Failed' ? 'bg-rose-500' :
                                                        'bg-orange-500'
                                                    }`} />
                                                {row.schedule.status}
                                            </span>
                                            {row.schedule.status === 'Scheduled' && (
                                                <button
                                                    onClick={(e) => handlePublish(e, row)}
                                                    disabled={isPublishing === row.id}
                                                    className="ml-3 px-3 py-1 bg-primary-600 text-white rounded text-xs font-bold shadow hover:bg-primary-700 transition flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    {isPublishing === row.id ? 'Sending...' : 'Post Now'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <ScheduleModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    campaign={selectedEntry.campaign}
                    platform={selectedEntry.platform}
                    onSchedule={() => {
                        fetchApprovedCampaigns();
                        setIsModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default Schedule;
