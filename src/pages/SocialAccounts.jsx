import React, { useState, useEffect } from 'react';
import { Facebook, Instagram, Linkedin, Plus, RefreshCw, AlertCircle, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const SocialAccounts = () => {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const META_APP_ID = import.meta.env.VITE_META_APP_ID || '';
    const REDIRECT_URI = `${window.location.origin}/social-accounts/callback`;

    useEffect(() => {
        if (user) {
            fetchAccounts();
        }
    }, [user]);

    const fetchAccounts = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('social_accounts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAccounts(data || []);
        } catch (error) {
            console.error('Error fetching social accounts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectMeta = () => {
        if (!META_APP_ID) {
            alert('Meta App ID is not configured in the environment variables.');
            return;
        }

        // Facebook OAuth URL with required scopes
        // pages_manage_posts: to publish to FB Pages
        // pages_read_engagement: needed for page access token
        // instagram_basic, instagram_content_publish: needed for IG publishing
        const scope = 'pages_manage_posts,pages_read_engagement,pages_show_list,instagram_basic,instagram_content_publish';

        const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}&state=meta`;

        // Redirect the user
        window.location.href = oauthUrl;
    };

    const handleDisconnect = async (id) => {
        if (!confirm('Are you sure you want to disconnect this account?')) return;

        try {
            const { error } = await supabase
                .from('social_accounts')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchAccounts();
        } catch (error) {
            console.error('Error disconnecting account:', error);
            alert('Failed to disconnect account');
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 text-left animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Social Accounts</h2>
                <p className="text-slate-500 mt-1 font-medium">Connect your platforms to enable automated publishing.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Meta Connect Card */}
                <div className="card p-6 border-slate-100 shadow-sm flex flex-col items-center text-center space-y-4 hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center -space-x-3 mb-2">
                        <Facebook className="w-8 h-8 text-blue-600 rounded-full bg-white relative z-10" />
                        <Instagram className="w-8 h-8 text-pink-600 rounded-full bg-white relative z-0" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Facebook & Instagram</h3>
                        <p className="text-xs text-slate-500 mt-1">Connect Pages and Professional accounts.</p>
                    </div>
                    <button
                        onClick={handleConnectMeta}
                        className="w-full mt-auto py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Connect Meta
                    </button>
                    <p className="text-[9px] text-slate-400">Requires a Meta Developer App configured.</p>
                </div>

                {/* LinkedIn Connect Card (Coming Soon) */}
                <div className="card p-6 border-slate-100 shadow-sm flex flex-col items-center text-center space-y-4 opacity-70">
                    <div className="w-16 h-16 rounded-2xl bg-[#0A66C2]/10 flex items-center justify-center mb-2">
                        <Linkedin className="w-8 h-8 text-[#0A66C2]" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">LinkedIn</h3>
                        <p className="text-xs text-slate-500 mt-1">Connect Company Pages.</p>
                    </div>
                    <button
                        disabled
                        className="w-full mt-auto py-2.5 bg-slate-100 text-slate-400 text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                        Coming Soon
                    </button>
                </div>
            </div>

            {/* Connected Accounts List */}
            <div className="card border-slate-100 bg-white shadow-sm overflow-hidden mt-8">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-900">Connected Accounts</h3>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                        <RefreshCw className="w-8 h-8 animate-spin mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest">Loading Accounts...</p>
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                        <AlertCircle className="w-10 h-10 mb-3 opacity-50" />
                        <p className="text-sm font-bold mb-1 text-slate-600">No accounts connected yet.</p>
                        <p className="text-xs">Connect an account above to get started.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {accounts.map(account => (
                            <div key={account.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${account.platform === 'Facebook' ? 'bg-blue-50 text-blue-600' :
                                            account.platform === 'Instagram' ? 'bg-pink-50 text-pink-600' :
                                                'bg-slate-50 text-slate-600'
                                        }`}>
                                        {account.platform === 'Facebook' && <Facebook className="w-5 h-5" />}
                                        {account.platform === 'Instagram' && <Instagram className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                            {account.account_name}
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-slate-500 font-medium">{account.platform}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{account.account_id}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100 uppercase tracking-widest">
                                        Active
                                    </span>
                                    <button
                                        onClick={() => handleDisconnect(account.id)}
                                        className="text-slate-400 hover:text-rose-500 transition-colors p-2"
                                        title="Disconnect Account"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SocialAccounts;
