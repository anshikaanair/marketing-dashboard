import React from 'react';
import { Megaphone, Clock, Calendar, AlertCircle, ArrowUpRight, Play, CheckSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, trend }) => (
    <div className="card group hover:scale-[1.02] transition-transform duration-200 cursor-pointer">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
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
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        <p className="text-[10px] text-slate-400 mt-2">{subtext}</p>
    </div>
);

const ActivityItem = ({ title, time, type }) => (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer rounded-lg border border-transparent hover:border-slate-100">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            {type === 'campaign' ? <Megaphone className="w-5 h-5 text-slate-400" /> : <Play className="w-5 h-5 text-slate-400" />}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
            <p className="text-xs text-slate-400">{time}</p>
        </div>
        <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-1 rounded-full border border-orange-100">Pending Approval</span>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const userName = user?.email?.split('@')[0] || 'there';

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h2>
                <p className="text-slate-500 mt-1">Good morning, {userName.charAt(0).toUpperCase() + userName.slice(1)}. Here's what's happening.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Campaigns (30d)"
                    value="5"
                    subtext="+2 from last month"
                    icon={Megaphone}
                    colorClass="bg-primary-600"
                    trend="40%"
                />
                <StatCard
                    title="Pending Approvals"
                    value="2"
                    subtext="Needs your review"
                    icon={Clock}
                    colorClass="bg-amber-500"
                />
                <StatCard
                    title="Scheduled (7d)"
                    value="5"
                    subtext="Across all platforms"
                    icon={Calendar}
                    colorClass="bg-sky-500"
                />
                <StatCard
                    title="Failed Publishes"
                    value="1"
                    subtext="Need retry"
                    icon={AlertCircle}
                    colorClass="bg-rose-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">Recent Campaigns</h3>
                        <button className="text-sm font-semibold text-primary-600 hover:text-primary-700">View all</button>
                    </div>
                    <div className="card p-0 overflow-hidden divide-y divide-slate-50">
                        <ActivityItem title="Q1 Product Launch — DataSync Pro" time="Acme Corp • Emily Rodriguez • Mar 4" type="campaign" />
                        <ActivityItem title="Spring Brand Awareness — ToolFlow AI" time="Spring 2026 • Alex Chen • Mar 2" type="campaign" />
                        <ActivityItem title="User Testimonials — Social Push" time="General • Sarah Johnson • Feb 28" type="campaign" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Activity Feed</h3>
                    <div className="card p-4 space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                <Megaphone className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-800"><span className="font-bold">Emily Rodriguez</span> campaign created on <span className="text-primary-600 font-semibold cursor-pointer">Q1 Product Launch</span></p>
                                <p className="text-[10px] text-slate-400 mt-1">Feb 28, 03:30 PM</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-800"><span className="font-bold">System</span> approved campaign <span className="text-primary-600 font-semibold cursor-pointer">Global Reach v2</span></p>
                                <p className="text-[10px] text-slate-400 mt-1">Feb 27, 09:12 AM</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
