import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
    });

    api.interceptors.request.use((config) => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('admin_token');
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    setUser(res.data);
                } catch (error) {
                    console.error("Auth check failed:", error);
                    localStorage.removeItem('admin_token');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        
        const res = await api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        localStorage.setItem('admin_token', res.data.access_token);
        
        const userRes = await api.get('/auth/me');
        setUser(userRes.data);
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch(e) {
            console.error("Logout failed:", e);
        }
        localStorage.removeItem('admin_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, api }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
