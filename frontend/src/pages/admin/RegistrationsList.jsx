import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { DataTable, StatusBadge, LoadingState, ErrorState } from '../../components/admin/DashboardWidgets';

const RegistrationsList = () => {
    const { api } = useAuth();
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tournaments, setTournaments] = useState([]);
    
    // Pagination & Filters
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [searchParams] = useSearchParams();
    const initialTournamentId = searchParams.get('tournament_id') || '';

    const [filters, setFilters] = useState({
        tournament_id: initialTournamentId,
        payment_status: '',
        status: '',
        mode: ''
    });

    const fetchTournaments = async () => {
        try {
            const res = await api.get('/admin/tournaments');
            setTournaments(res.data);
        } catch (e) {
            console.error("Failed to load tournaments", e);
        }
    };

    const fetchRegistrations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = { page, limit: 10 };
            if (search) params.search = search;
            if (filters.tournament_id) params.tournament_id = filters.tournament_id;
            if (filters.payment_status) params.payment_status = filters.payment_status;
            if (filters.status) params.status = filters.status;
            if (filters.mode) params.mode = filters.mode;

            const res = await api.get('/admin/registrations', { params });
            setRegistrations(res.data.data);
            setTotalPages(res.data.total_pages || 1);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to load registrations");
        } finally {
            setLoading(false);
        }
    }, [api, page, search, filters]);

    useEffect(() => {
        fetchTournaments();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchRegistrations();
        }, 300);
        return () => clearTimeout(timeout);
    }, [fetchRegistrations]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-wider">Registrations</h2>
                    <p className="text-gray-400">Manage all tournament entries.</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-xl flex flex-wrap gap-4 items-center">
                <input 
                    type="text" 
                    placeholder="Search ID, Name, UID, UTR..." 
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="flex-1 min-w-[200px] bg-gray-950 border border-gray-700 rounded p-2 text-white outline-none focus:border-yellow-500"
                />
                
                <select 
                    value={filters.tournament_id} 
                    onChange={(e) => handleFilterChange('tournament_id', e.target.value)}
                    className="bg-gray-950 border border-gray-700 rounded p-2 text-white outline-none focus:border-yellow-500"
                >
                    <option value="">All Tournaments</option>
                    {tournaments.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>

                <select 
                    value={filters.mode} 
                    onChange={(e) => handleFilterChange('mode', e.target.value)}
                    className="bg-gray-950 border border-gray-700 rounded p-2 text-white outline-none focus:border-yellow-500"
                >
                    <option value="">All Modes</option>
                    <option value="SOLO">Solo</option>
                    <option value="DUO">Duo</option>
                    <option value="SQUAD">Squad</option>
                </select>

                <select 
                    value={filters.status} 
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="bg-gray-950 border border-gray-700 rounded p-2 text-white outline-none focus:border-yellow-500"
                >
                    <option value="">Reg Status</option>
                    <option value="pending">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PAYMENT_REJECTED">Rejected</option>
                </select>

                <select 
                    value={filters.payment_status} 
                    onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                    className="bg-gray-950 border border-gray-700 rounded p-2 text-white outline-none focus:border-yellow-500"
                >
                    <option value="">Pay Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            {error && <ErrorState message={error} onRetry={fetchRegistrations} />}

            {!error && (
                <div className="relative">
                    {loading && (
                        <div className="absolute inset-0 bg-gray-950/50 z-10 flex items-center justify-center rounded-xl">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
                        </div>
                    )}
                    
                    <DataTable 
                        columns={["Reg ID", "Player / Team", "Tournament", "Mode", "Payment", "Status", "Date", "Actions"]}
                        data={registrations}
                        keyExtractor={(item) => item._id}
                        renderRow={(r) => {
                            const captain = r.players && r.players.length > 0 ? r.players[0] : {};
                            const p = r.payment || {};
                            const t = r.tournament || {};
                            
                            return (
                                <>
                                    <td className="px-6 py-4 font-black text-yellow-500">{r.registration_id}</td>
                                    <td className="px-6 py-4">
                                        {r.team_name ? (
                                            <>
                                                <div className="font-bold text-white uppercase">{r.team_name}</div>
                                                <div className="text-gray-400 text-xs">{captain.full_name}</div>
                                            </>
                                        ) : (
                                            <div className="font-bold text-white">{captain.full_name}</div>
                                        )}
                                        <div className="text-xs text-gray-500">UID: {captain.uid}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300 max-w-[150px] truncate" title={t.name}>{t.name || 'Unknown'}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded font-bold">{r.registration_type}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={p.status || 'UNPAID'} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={r.status} />
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-xs">
                                        {new Date(r.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link to={`/admin/registrations/${r._id}`} className="text-yellow-500 hover:text-yellow-400 font-bold px-3 py-1 bg-yellow-500/10 rounded transition">View</Link>
                                    </td>
                                </>
                            );
                        }}
                    />

                    {/* Pagination */}
                    <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
                        <div>Page {page} of {totalPages}</div>
                        <div className="flex gap-2">
                            <button 
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1 bg-gray-900 border border-gray-800 rounded hover:bg-gray-800 disabled:opacity-50 transition"
                            >
                                Prev
                            </button>
                            <button 
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1 bg-gray-900 border border-gray-800 rounded hover:bg-gray-800 disabled:opacity-50 transition"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistrationsList;
