import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, XCircle, MessageSquare, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import CampaignDetailModal from '../components/CampaignDetailModal';

const ADMIN_EMAIL = 'anshika.nair@10xds.com';

const Approvals = () => {
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    useEffect(() => {
        if (user) {
            fetchCampaigns();
        }
    }, [user]);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            let query = supabase.from('campaigns').select('*').order('created_at', { ascending: false });

            // If not admin, only show their own campaigns
            if (user.email !== ADMIN_EMAIL) {
                query = query.eq('user_id', user.id);
            }

            const { data, error } = await query;

            if (error) throw error;
            setCampaigns(data || []);

            // Auto-select first item if available and none selected
            if (data && data.length > 0 && !selectedCampaign) {
                setSelectedCampaign(data[0]);
            }
        } catch (error) {
            console.error('Error fetching campaigns for approval:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!selectedCampaign) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('campaigns')
                .update({ status: newStatus })
                .eq('id', selectedCampaign.id);

            if (error) throw error;

            // Log activity
            await supabase.from('activities').insert([{
                user_id: user.id,
                campaign_id: selectedCampaign.id,
                type: newStatus === 'Approved' ? 'campaign_approved' : 'campaign_changes_requested',
                details: { status: newStatus }
            }]);

            // Update local state
            const updatedCampaigns = campaigns.map(c =>
                c.id === selectedCampaign.id ? { ...c, status: newStatus } : c
            );
            setCampaigns(updatedCampaigns);
            setSelectedCampaign({ ...selectedCampaign, status: newStatus });

        } catch (error) {
            console.error(`Error updating to ${newStatus}:`, error);
            alert(`Failed to update status.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim() || !selectedCampaign) return;
        setIsSubmitting(true);

        try {
            const newComment = {
                id: crypto.randomUUID(),
                user_name: user.email.split('@')[0],
                user_email: user.email,
                text: commentText.trim(),
                created_at: new Date().toISOString()
            };

            const existingComments = selectedCampaign.comments || [];
            const updatedComments = [...existingComments, newComment];

            const { error } = await supabase
                .from('campaigns')
                .update({ comments: updatedComments })
                .eq('id', selectedCampaign.id);

            if (error) throw error;

            // Update local state
            const updatedCampaigns = campaigns.map(c =>
                c.id === selectedCampaign.id ? { ...c, comments: updatedComments } : c
            );
            setCampaigns(updatedCampaigns);
            setSelectedCampaign({ ...selectedCampaign, comments: updatedComments });
            setCommentText('');

        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filtering
    const filteredCampaigns = campaigns.filter(c => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Pending') return c.status === 'Pending Approval';
        if (activeTab === 'Resolved') return c.status !== 'Pending Approval';
        return true;
    });

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Pending Approval': return 'text-amber-600 bg-amber-50';
            case 'Approved': return 'text-emerald-600 bg-emerald-50';
            case 'Changes Requested': return 'text-rose-600 bg-rose-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Approvals</h2>
                        {filteredCampaigns.filter(c => c.status === 'Pending Approval').length > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                {filteredCampaigns.filter(c => c.status === 'Pending Approval').length}
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 mt-1 font-medium">
                        {user.email === ADMIN_EMAIL
                            ? "Review and approve campaigns before publishing"
                            : "Track the approval status of your submitted campaigns"}
                    </p>
                </div>
                {/* Simplified Search/Filter area to match header style if needed */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Column: List */}
                <div className="lg:col-span-5 space-y-4">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200">
                        {['All', 'Pending', 'Resolved'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === tab
                                    ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Campaign List */}
                    <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Loading...</div>
                        ) : filteredCampaigns.length === 0 ? (
                            <div className="py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No campaigns found</div>
                        ) : (
                            filteredCampaigns.map(campaign => (
                                <div
                                    key={campaign.id}
                                    onClick={() => setSelectedCampaign(campaign)}
                                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${selectedCampaign?.id === campaign.id
                                        ? 'border-primary-600 bg-white shadow-md ring-1 ring-primary-600'
                                        : 'border-slate-100 bg-white hover:border-primary-200 shadow-sm'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-900 line-clamp-1 pr-4 text-base">
                                            {campaign.product_name} — {campaign.brand}
                                        </h4>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${getStatusStyles(campaign.status)}`}>
                                            {campaign.status}
                                        </span>
                                    </div>
                                    <div className="space-y-1.5 mt-3 text-xs text-slate-500 font-medium">
                                        <p>Brand: <span className="text-slate-700">{campaign.brand}</span></p>
                                        {/* Fallback to unknown if auth_users fetch failed somehow */}
                                        <p>Submitted by: <span className="text-slate-700">{campaign.auth_users?.email || 'Unknown User'}</span></p>
                                        <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(campaign.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Detail View */}
                <div className="lg:col-span-7 space-y-6">
                    {selectedCampaign ? (
                        <>
                            {/* Header Info Card */}
                            <div className="card p-6 border-slate-200 bg-white">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                                            {selectedCampaign.product_name} — {selectedCampaign.brand}
                                        </h3>
                                        <p className="text-sm text-slate-500 font-medium">
                                            {selectedCampaign.brand} <span className="mx-2">•</span> Submitted by {selectedCampaign.auth_users?.email?.split('@')[0] || 'Unknown'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsDetailModalOpen(true)}
                                        className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors shrink-0"
                                    >
                                        View Campaign
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Objective</p>
                                        <p className="text-sm font-bold text-slate-800">{selectedCampaign.objective}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tone</p>
                                        <p className="text-sm font-bold text-slate-800">{selectedCampaign.tone}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Platforms</p>
                                        <p className="text-sm font-bold text-slate-800">
                                            {Array.isArray(selectedCampaign.platforms) ? selectedCampaign.platforms.join(', ') : 'Not specified'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Comments and Actions Card */}
                            <div className="card border-slate-200 bg-white overflow-hidden flex flex-col h-[500px]">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                    <h4 className="font-bold text-slate-900">Comments</h4>
                                </div>

                                {/* Comments List */}
                                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
                                    {(!selectedCampaign.comments || selectedCampaign.comments.length === 0) ? (
                                        <p className="text-sm text-slate-400 italic text-center mt-10">No comments yet. Start the conversation.</p>
                                    ) : (
                                        selectedCampaign.comments.map(comment => (
                                            <div key={comment.id} className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100 max-w-[85%]">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold">
                                                        {comment.user_name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-900">{comment.user_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600">{comment.text}</p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Action Area */}
                                <div className="p-5 border-t border-slate-100 bg-white space-y-4">
                                    <textarea
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Add a comment or feedback..."
                                        className="w-full h-24 p-3 rounded-xl border-slate-200 text-sm focus:border-primary-500 focus:ring-primary-500 resize-none"
                                        disabled={isSubmitting}
                                    />

                                    <div className="flex flex-wrap items-center gap-3 justify-end">
                                        <button
                                            onClick={handleAddComment}
                                            disabled={isSubmitting || !commentText.trim()}
                                            className="flex items-center gap-2 px-6 py-2 border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            Comment
                                        </button>

                                        {user.email === ADMIN_EMAIL && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusUpdate('Changes Requested')}
                                                    disabled={isSubmitting || selectedCampaign.status === 'Changes Requested'}
                                                    className="flex items-center gap-2 px-6 py-2 border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Request Changes
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate('Approved')}
                                                    disabled={isSubmitting || selectedCampaign.status === 'Approved'}
                                                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Approve
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="card h-[400px] border-slate-100 bg-slate-50 flex items-center justify-center text-slate-400 font-medium text-sm">
                            Select a campaign from the list to view details
                        </div>
                    )}
                </div>
            </div>

            <CampaignDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                campaign={selectedCampaign}
            />
        </div>
    );
};

export default Approvals;
