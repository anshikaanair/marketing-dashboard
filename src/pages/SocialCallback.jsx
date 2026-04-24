import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const SocialCallback = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [status, setStatus] = useState('processing'); // processing, success, error
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (user) {
            handleOAuthCallback();
        }
    }, [user, location]);

    const handleOAuthCallback = async () => {
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const platform = searchParams.get('state'); // 'meta'

        if (error) {
            setStatus('error');
            setErrorMsg(searchParams.get('error_description') || 'Authentication was cancelled or failed.');
            return;
        }

        if (!code) {
            setStatus('error');
            setErrorMsg('No authorization code received.');
            return;
        }

        try {
            // Determine redirect URI dynamically
            const redirectUri = `${window.location.origin}/social-accounts/callback`;

            // Exchange code via backend
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/social/meta/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    redirect_uri: redirectUri,
                    user_id: user.id
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to connect account.');
            }

            // Save accounts to Supabase
            if (data.accounts && data.accounts.length > 0) {
                const accountsToInsert = data.accounts.map(acc => ({
                    user_id: user.id,
                    platform: acc.platform,
                    account_name: acc.account_name,
                    account_id: acc.account_id,
                    access_token: acc.access_token,
                    status: 'Connected'
                }));

                for (const acc of accountsToInsert) {
                    const { data: existing } = await supabase
                        .from('social_accounts')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('account_id', acc.account_id)
                        .single();

                    if (existing) {
                        const { error: dbError } = await supabase
                            .from('social_accounts')
                            .update(acc)
                            .eq('id', existing.id);
                        if (dbError) throw dbError;
                    } else {
                        const { error: dbError } = await supabase
                            .from('social_accounts')
                            .insert(acc);
                        if (dbError) throw dbError;
                    }
                }
            }

            setStatus('success');

            // Redirect after brief delay
            setTimeout(() => {
                navigate('/social-accounts');
            }, 2000);

        } catch (error) {
            console.error('OAuth exchange error:', error);
            setStatus('error');
            setErrorMsg(error.message);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-8 animate-in fade-in zoom-in duration-500">
            <div className="card p-8 border-slate-100 bg-white max-w-md w-full text-center space-y-6 shadow-xl shadow-slate-200/50">
                {status === 'processing' && (
                    <>
                        <div className="relative w-20 h-20 mx-auto">
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-bold text-blue-600">M</span>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Connecting Account</h2>
                            <p className="text-sm text-slate-500 mt-2">Please wait while we securely connect your Meta account...</p>
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 mx-auto bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center animate-bounce-short">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Successfully Connected!</h2>
                            <p className="text-sm text-slate-500 mt-2">Your Meta account has been linked. Redirecting...</p>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-20 h-20 mx-auto bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Connection Failed</h2>
                            <p className="text-sm text-rose-500 mt-2 font-medium">{errorMsg}</p>
                        </div>
                        <button
                            onClick={() => navigate('/social-accounts')}
                            className="w-full py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors"
                        >
                            Back to Social Accounts
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default SocialCallback;
