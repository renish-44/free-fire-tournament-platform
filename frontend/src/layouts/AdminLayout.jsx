import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/tournaments', label: 'Tournaments', icon: '🏆' },
    { path: '/admin/registrations', label: 'Registrations', icon: '📋' },
    { path: '/admin/teams', label: 'Teams', icon: '👥' },
    { path: '/admin/players', label: 'Players', icon: '🎮' },
    { path: '/admin/payments', label: 'Payments', icon: '💳' },
    { path: '/admin/reports', label: 'Reports', icon: '📈' },
];

const AdminLayout = () => {
    const { user, loading, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-yellow-500/30 border-t-yellow-500 animate-spin"></div>
                    <p className="text-gray-500 text-sm font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/admin/login" replace />;
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col relative">
            {/* Ambient background glows */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-300px] right-[-200px] w-[600px] h-[600px] bg-yellow-500/[0.03] rounded-full blur-[150px]"></div>
                <div className="absolute bottom-[-300px] left-[-200px] w-[600px] h-[600px] bg-orange-500/[0.03] rounded-full blur-[150px]"></div>
            </div>

            {/* Glass Navbar */}
            <header className="glass-nav sticky top-0 z-50 px-4 md:px-6 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo + hamburger */}
                    <div className="flex items-center gap-3">
                        <Link to="/admin" className="flex items-center gap-2.5 group">
                            <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center font-black text-gray-900 text-sm shadow-lg shadow-yellow-500/20 group-hover:shadow-yellow-500/40 transition-shadow">
                                FF
                            </div>
                            <span className="text-white font-bold text-base tracking-tight hidden sm:block">
                                Admin <span className="text-yellow-500">Panel</span>
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {navItems.map(item => {
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                                        isActive
                                            ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right section */}
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-3 mr-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-xs font-bold text-gray-900">
                                {user.name?.[0]?.toUpperCase() || 'A'}
                            </div>
                            <div className="text-xs">
                                <p className="font-semibold text-gray-200 leading-tight">{user.name}</p>
                                <p className="text-gray-500 capitalize">{user.role?.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="glass-btn text-xs text-red-400 hover:text-red-300 hover:border-red-500/30 hover:bg-red-500/10 py-2 px-3"
                        >
                            Logout
                        </button>
                        <button
                            className="lg:hidden glass-btn p-2"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-40 pt-16">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
                    <div className="relative z-50 mx-4 mt-2 glass-card p-4 flex flex-col gap-1 page-enter">
                        {navItems.map(item => {
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                        isActive
                                            ? 'bg-yellow-500/10 text-yellow-500'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <span>{item.icon}</span>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 relative z-10 p-4 md:p-6 lg:p-8 page-enter">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
