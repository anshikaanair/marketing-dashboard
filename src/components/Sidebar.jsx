import React from 'react';
import {
    BarChart2,
    Megaphone,
    CheckSquare,
    Calendar,
    Layers,
    Users,
    FileText,
    Settings,
    HelpCircle,
    LogOut,
    Layout
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const SidebarItem = ({ icon: Icon, label, href, active, comingSoon = false }) => (
    <Link
        to={href}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all group ${active
            ? 'bg-primary-50 text-primary-600 font-semibold shadow-sm'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
    >
        <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
        <span className="text-sm flex-1 text-left">{label}</span>
        {comingSoon && (
            <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase">Soon</span>
        )}
    </Link>
);

const Sidebar = () => {
    const { signOut, user } = useAuth();
    const location = useLocation();

    return (
        <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-100">
                        <Layout className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-900 leading-none">Marketing</h1>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">Agents AI</p>
                    </div>
                </div>

                <nav className="space-y-1">
                    <SidebarItem
                        icon={BarChart2}
                        label="Dashboard"
                        href="/"
                        active={location.pathname === '/'}
                    />
                    <SidebarItem
                        icon={Megaphone}
                        label="Campaigns"
                        href="/campaigns"
                        active={location.pathname === '/campaigns'}
                    />
                    <SidebarItem icon={CheckSquare} label="Approvals" href="/approvals" active={location.pathname === '/approvals'} />
                    <SidebarItem icon={Calendar} label="Schedule" href="/schedule" active={location.pathname === '/schedule'} />
                    <SidebarItem icon={Layers} label="Brands" href="/brands" active={location.pathname === '/brands'} />
                    <SidebarItem icon={Users} label="Social Accounts" href="/social-accounts" active={location.pathname === '/social-accounts'} />
                    <SidebarItem icon={FileText} label="Audit Logs" href="/audit-logs" active={location.pathname === '/audit-logs'} />
                    <SidebarItem icon={Users} label="Users" href="/users" active={location.pathname === '/users'} />
                    <SidebarItem icon={Settings} label="Settings" href="/settings" active={location.pathname === '/settings'} />
                </nav>
            </div>

            <div className="mt-auto p-4 space-y-4">
                <div className="bg-primary-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-primary-700 mb-1">Need help?</p>
                    <p className="text-[10px] text-primary-600 opacity-80 leading-relaxed">Check our documentation for advanced agent setups.</p>
                    <button className="mt-3 w-full bg-white text-primary-700 text-[10px] font-bold py-1.5 rounded-lg shadow-sm hover:bg-primary-100 transition-colors">
                        View Docs
                    </button>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-tr from-primary-500 to-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{user?.email?.split('@')[0] || 'User'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <button
                        onClick={signOut}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
