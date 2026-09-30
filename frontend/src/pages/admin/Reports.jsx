import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { StatCard, LoadingState, ErrorState } from '../../components/admin/DashboardWidgets';

const Reports = () => {
    const { api } = useAuth();
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tournaments, setTournaments] = useState([]);
    
    // Filters
    const [filters, setFilters] = useState({
        tournament_id: '',
        date_start: '',
        date_end: '',
        status: '',
        payment_status: ''
    });

    const fetchTournaments = async () => {
        try {
            const res = await api.get('/admin/tournaments');
            setTournaments(res.data);
        } catch (e) {
            console.error("Failed to fetch tournaments:", e);
        }
    };

    const fetchMetrics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (filters.tournament_id) params.tournament_id = filters.tournament_id;
            if (filters.date_start) params.date_start = filters.date_start;
            if (filters.date_end) params.date_end = filters.date_end;
            if (filters.status) params.status = filters.status;
            if (filters.payment_status) params.payment_status = filters.payment_status;

            const res = await api.get('/admin/reports/metrics', { params });
            setMetrics(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to load report metrics");
        } finally {
            setLoading(false);
        }
    }, [api, filters]);

    useEffect(() => {
        fetchTournaments();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchMetrics();
        }, 300);
        return () => clearTimeout(timeout);
    }, [fetchMetrics]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleExport = (format) => {
        const params = new URLSearchParams();
        params.append('format', format);
        if (filters.tournament_id) params.append('tournament_id', filters.tournament_id);
        if (filters.date_start) params.append('date_start', filters.date_start);
        if (filters.date_end) params.append('date_end', filters.date_end);
        if (filters.status) params.append('status', filters.status);
        if (filters.payment_status) params.append('payment_status', filters.payment_status);

        const token = localStorage.getItem('token');
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        
        // Use fetch to download the blob with auth header
        fetch(`${baseURL}/admin/reports/export?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tournament_report_${new Date().getTime()}.${format}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error exporting file:', error);
            alert('Failed to export data');
        });
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-wider">Reports</h2>
                    <p className="text-gray-400">Generate analytics and export tournament data.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => handleExport('csv')}
                        className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded shadow transition border border-gray-700 flex items-center gap-2"
                    >
                        Export CSV
                    </button>
                    <button 
                        onClick={() => handleExport('xlsx')}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded shadow transition flex items-center gap-2"
                    >
                        Export Excel
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-xl grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Tournament</label>
                    <select 
                        value={filters.tournament_id} 
                        onChange={(e) => handleFilterChange('tournament_id', e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-white outline-none focus:border-yellow-500"
                    >
                        <option value="">All Tournaments</option>
                        {tournaments.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Start Date</label>
                    <input 
                        type="date" 
                        value={filters.date_start}
                        onChange={(e) => handleFilterChange('date_start', e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-white outline-none focus:border-yellow-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">End Date</label>
                    <input 
                        type="date" 
                        value={filters.date_end}
                        onChange={(e) => handleFilterChange('date_end', e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-white outline-none focus:border-yellow-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Reg Status</label>
                    <select 
                        value={filters.status} 
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-white outline-none focus:border-yellow-500"
                    >
                        <option value="">All</option>
                        <option value="pending">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="PAYMENT_REJECTED">Payment Rejected</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Pay Status</label>
                    <select 
                        value={filters.payment_status} 
                        onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-white outline-none focus:border-yellow-500"
                    >
                        <option value="">All</option>
                        <option value="PENDING">Pending</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Metrics Dashboard */}
            {loading && <LoadingState />}
            {error && <ErrorState message={error} onRetry={fetchMetrics} />}
            
            {!loading && !error && metrics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard title="Total Registrations" value={metrics.total_registrations} colorClass="text-gray-300" icon="👥" />
                    <StatCard title="Verified Registrations" value={metrics.verified_registrations} colorClass="text-green-500" icon="✅" />
                    <StatCard title="Available Slots" value={metrics.available_slots} colorClass="text-blue-500" icon="🎮" />
                    
                    <StatCard title="Total Revenue" value={`₹${metrics.total_revenue}`} colorClass="text-yellow-500" icon="💰" />
                    <StatCard title="Pending Payments" value={metrics.pending_payments} colorClass="text-orange-500" icon="⏳" />
                    <StatCard title="Rejected Payments" value={metrics.rejected_payments} colorClass="text-red-500" icon="❌" />
                </div>
            )}
        </div>
    );
};

export default Reports;
