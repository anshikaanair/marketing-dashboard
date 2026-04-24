import React, { useState } from 'react';
import { X, Calendar, Clock, Sparkles, CheckCircle2, ChevronRight, Layout, Info, Megaphone, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ScheduleModal = ({ isOpen, onClose, campaign, platform, onSchedule }) => {
    const [scheduledDate, setScheduledDate] = useState('');
    const [timeHour, setTimeHour] = useState('10');
    const [timeMinute, setTimeMinute] = useState('00');
    const [timePeriod, setTimePeriod] = useState('AM');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !campaign) return null;

    const handleSchedule = async () => {
        if (!scheduledDate) {
            alert('Please select a date.');
            return;
        }

        setIsSubmitting(true);
        try {
            let hour24 = parseInt(timeHour, 10);
            if (timePeriod === 'PM' && hour24 !== 12) hour24 += 12;
            if (timePeriod === 'AM' && hour24 === 12) hour24 = 0;
            const timeStr = `${hour24.toString().padStart(2, '0')}:${timeMinute}:00`;
            const scheduledAt = new Date(`${scheduledDate}T${timeStr}`).toISOString();
            const existingSchedules = campaign.schedules || {};

            const updatedSchedules = {
                ...existingSchedules,
                [platform]: {
                    scheduled_at: scheduledAt,
                    status: 'Scheduled'
                }
            };

            const { error } = await supabase
                .from('campaigns')
                .update({
                    schedules: updatedSchedules,
                    // Optionally update global status if all platforms are scheduled, 
                    // but following user requirement: set particular campaign status to "scheduled"
                    status: 'Scheduled'
                })
                .eq('id', campaign.id);

            if (error) throw error;
            onSchedule();
        } catch (error) {
            console.error('Error scheduling campaign:', error);
            alert('Failed to schedule campaign.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-8 pb-4 flex justify-between items-start border-b border-slate-50">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Schedule Publication</h2>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-primary-50 text-primary-600 border border-primary-100">
                                {platform}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-slate-400">
                            {campaign.product_name} — {campaign.brand}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Overview */}
                    <div className="space-y-6">
                        <div className="card p-6 border-slate-100 bg-slate-50/50 space-y-6">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Campaign Overview</h4>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product</p>
                                    <p className="text-sm font-black text-slate-900">{campaign.product_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Objective</p>
                                    <p className="text-sm font-bold text-slate-600 leading-relaxed">{campaign.objective}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</p>
                                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-4">{campaign.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Visual Preview Snippet */}
                        <div className="card p-4 border-slate-100 bg-white">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Content Preview</h4>
                            <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden relative">
                                {campaign.generated_images?.[`${platform}-0`] ? (
                                    <img src={campaign.generated_images[`${platform}-0`]} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <Layout className="w-8 h-8 opacity-20" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Scheduling Controls */}
                    <div className="flex flex-col h-full bg-white">
                        <div className="card p-8 border-primary-100 bg-white ring-1 ring-primary-50 space-y-8 h-full flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-2">
                                <Calendar className="w-8 h-8 text-primary-600" />
                            </div>
                            <div className="text-center space-y-2 mb-4">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Select Time</h3>
                                <p className="text-sm text-slate-400 font-medium">When should this post go live on {platform}?</p>
                            </div>

                            <div className="w-full space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Publish Date</label>
                                    <input
                                        type="date"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Publish Time</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={timeHour}
                                            onChange={(e) => setTimeHour(e.target.value)}
                                            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none appearance-none text-center cursor-pointer"
                                        >
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                                <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                        <span className="flex items-center text-slate-400 font-bold">:</span>
                                        <select
                                            value={timeMinute}
                                            onChange={(e) => setTimeMinute(e.target.value)}
                                            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none appearance-none text-center cursor-pointer"
                                        >
                                            {Array.from({ length: 60 }, (_, i) => i).map(m => (
                                                <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                        <div className="flex bg-slate-50 rounded-2xl p-1 w-full relative h-[52px]">
                                            <div className="flex w-full absolute inset-1 z-10 transition-all font-bold text-sm">
                                                <button
                                                    onClick={() => setTimePeriod('AM')}
                                                    className={`w-1/2 h-full rounded-xl flex items-center justify-center transition-all ${timePeriod === 'AM' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    AM
                                                </button>
                                                <button
                                                    onClick={() => setTimePeriod('PM')}
                                                    className={`w-1/2 h-full rounded-xl flex items-center justify-center transition-all ${timePeriod === 'PM' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    PM
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto w-full pt-8">
                                <button
                                    onClick={handleSchedule}
                                    disabled={isSubmitting || !scheduledDate}
                                    className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-100 hover:bg-primary-700 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Schedule Post
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                                    Updates will be visible in the schedule table
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleModal;
