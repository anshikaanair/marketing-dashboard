/**
 * Auth context backed by the FastAPI backend (/auth/login, /auth/signup, /auth/logout).
 * No Firebase SDK or API key required — uses the Firestore marketing-agents DB via the backend.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const TOKEN_KEY = 'ma_session_token';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On mount, restore session from localStorage
    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            setLoading(false);
            return;
        }
        // Verify token is still valid with the backend
        fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.ok) return res.json();
                throw new Error('Session expired');
            })
            .then((userInfo) => {
                setUser(userInfo);
            })
            .catch(() => {
                localStorage.removeItem(TOKEN_KEY);
            })
            .finally(() => setLoading(false));
    }, []);

    const signUp = async ({ email, password, options }) => {
        try {
            const res = await fetch(`${API_BASE}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    full_name: options?.data?.full_name || '',
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Signup failed');
            localStorage.setItem(TOKEN_KEY, data.token);
            setUser(data.user);
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    };

    const signIn = async ({ email, password }) => {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Login failed');
            localStorage.setItem(TOKEN_KEY, data.token);
            setUser(data.user);
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    };

    const signOut = async () => {
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            if (token) {
                await fetch(`${API_BASE}/auth/logout`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
        } catch (_) {
            // ignore network errors on logout
        } finally {
            localStorage.removeItem(TOKEN_KEY);
            setUser(null);
        }
        return { error: null };
    };

    return (
        <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
