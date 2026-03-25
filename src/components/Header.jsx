import React, { useState } from 'react';
import { Bell, HelpCircle, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const { user, signOut } = useAuth();

    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-4 flex-1">
                {/* Brand and Search removed per user request */}
            </div>

            <div className="flex items-center gap-4">
                <button className="w-9 h-9 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors">
                    <HelpCircle className="w-5 h-5" />
                </button>

                <button className="w-9 h-9 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-500 relative transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
                </button>

                <div className="h-6 w-px bg-slate-200 mx-2"></div>

                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showUserMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowUserMenu(false)}
                            ></div>
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl shadow-slate-200/60 border border-slate-100 py-3 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-2 border-b border-slate-50 mb-2">
                                    <p className="text-sm font-bold text-slate-900">{user?.email?.split('@')[0]}</p>
                                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                                </div>

                                <button className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-700 flex items-center gap-3 transition-colors">
                                    <User className="w-4 h-4" />
                                    Profile
                                </button>
                                <button className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-700 flex items-center gap-3 transition-colors">
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </button>
                                <div className="h-px bg-slate-50 my-2"></div>
                                <button
                                    onClick={signOut}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
