import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Layout, Mail, Lock, User, ArrowRight, Github } from 'lucide-react';

const Auth = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { signIn, signUp } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName }
                    }
                });
                if (error) throw error;
                alert('Check your email for the confirmation link!');
            } else {
                const { error } = await signIn({ email, password });
                if (error) throw error;
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full">
                {/* Logo Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-xl mb-4 shadow-lg shadow-primary-200">
                        <Layout className="text-white w-6 h-6" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900">
                        {isSignUp ? 'Create an account' : 'Welcome back'}
                    </h2>
                    <p className="text-slate-500 mt-2">
                        {isSignUp ? 'Start your marketing journey today' : 'Log in to manage your campaigns'}
                    </p>
                </div>

                {/* Auth Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {isSignUp && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="input-field pl-10"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field pl-10"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pl-10"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 italic">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isSignUp ? 'Get Started' : 'Sign In'}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 flex items-center gap-4">
                        <div className="h-px flex-1 bg-slate-100"></div>
                        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Or continue with</span>
                        <div className="h-px flex-1 bg-slate-100"></div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3">
                        <button className="flex items-center justify-center gap-3 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                            <Github className="w-5 h-5" />
                            GitHub
                        </button>
                    </div>
                </div>

                <p className="text-center mt-8 text-sm text-slate-500">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                    >
                        {isSignUp ? 'Sign in' : 'Create an account'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Auth;
