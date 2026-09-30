import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/admin');
        } catch (err) {
            console.error(err);
            setError('Invalid credentials or insufficient permissions.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-yellow-500/[0.04] rounded-full blur-[150px] animate-pulse"></div>
                <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-orange-500/[0.04] rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1.5s'}}></div>
                <div className="absolute top-[60%] left-[60%] w-[300px] h-[300px] bg-purple-500/[0.02] rounded-full blur-[100px] animate-pulse" style={{animationDelay: '3s'}}></div>
            </div>

            <div className="w-full max-w-[400px] relative z-10 page-enter">
                {/* Glass Card */}
                <div className="glass-card p-8 md:p-10">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-lg shadow-yellow-500/25 mb-5">
                            <span className="text-2xl font-black text-gray-900">FF</span>
                        </div>
                        <h2 className="text-2xl font-extrabold text-white mb-1.5 tracking-tight">Welcome back</h2>
                        <p className="text-gray-500 text-sm font-medium">Sign in to your admin account</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/8 border border-red-500/20 text-red-400 rounded-xl p-3.5 mb-6 text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-2 tracking-wider uppercase">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                                autoComplete="off"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-2 tracking-wider uppercase">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-primary py-3.5 text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin"></span>
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-600 text-xs mt-6 font-medium">
                    Free Fire Tournament Management System
                </p>
            </div>
        </div>
    );
};

export default Login;
