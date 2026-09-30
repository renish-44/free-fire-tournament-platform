import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { DataTable, StatusBadge, LoadingState, ErrorState } from '../../components/admin/DashboardWidgets';

const TeamsList = () => {
    const { api } = useAuth();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tournaments, setTournaments] = useState([]);
    
    // Pagination & Filters
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        tournament_id: '',
        status: ''
    });

    const fetchTournaments = async () => {
        try {
            const res = await api.get('/admin/tournaments');
            setTournaments(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchTeams = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = { page, limit: 15 };
            if (search) params.search = search;
            if (filters.tournament_id) params.tournament_id = filters.tournament_id;
            if (filters.status) params.status = filters.status;

            const res = await api.get('/admin/teams', { params });
            setTeams(res.data.data);
            setTotalPages(res.data.total_pages || 1);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to load teams");
        } finally {
            setLoading(false);
        }
    }, [api, page, search, filters]);

    useEffect(() => {
        fetchTournaments();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchTeams();
        }, 300);
        return () => clearTimeout(timeout);
    }, [fetchTeams]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-wider">Teams Management</h2>
                <p className="text-gray-400">View and manage all registered teams (Duos & Squads).</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-xl flex flex-wrap gap-4 items-center">
                <input 
                    type="text" 
                    placeholder="Search Team Name, Reg ID, Captain..." 
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="flex-1 min-w-[200px] bg-gray-950 border border-gray-700 rounded p-2 text-white outline-none focus:border-yellow-500"
                />
                
                <select 
                    value={filters.tournament_id} 
                    onChange={(e) => { setFilters({...filters, tournament_id: e.target.value}); setPage(1); }}
                    className="bg-gray-950 border border-gray-700 rounded p-2 text-white outline-none focus:border-yellow-500"
                >
                    <option value="">All Tournaments</option>
                    {tournaments.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>

                <select 
                    value={filters.status} 
                    onChange={(e) => { setFilters({...filters, status: e.target.value}); setPage(1); }}
                    className="bg-gray-950 border border-gray-700 rounded p-2 text-white outline-none focus:border-yellow-500"
                >
                    <option value="">Status</option>
                    <option value="pending">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PAYMENT_REJECTED">Rejected</option>
                </select>
            </div>

            {error ? (
                <ErrorState message={error} onRetry={fetchTeams} />
            ) : (
                <div className="relative">
                    {loading && (
                        <div className="absolute inset-0 bg-gray-950/50 z-10 flex items-center justify-center rounded-xl">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
                        </div>
                    )}
                    
                    <DataTable 
                        columns={["Team Name", "Captain", "Roster Size", "Tournament", "Status", "Actions"]}
                        data={teams}
                        keyExtractor={(item) => item._id}
                        emptyMessage="No teams found."
                        renderRow={(r) => {
                            const captain = r.players && r.players.length > 0 ? r.players[0] : {};
                            const t = r.tournament || {};
                            const activePlayers = r.players?.filter(p => !p.deleted).length || 0;
                            
                            return (
                                <>
                                    <td className="px-6 py-4">
                                        <div className="font-black text-white text-lg uppercase">{r.team_name || 'Unnamed Team'}</div>
                                        <div className="text-xs text-gray-500">{r.registration_id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-300">{captain.full_name}</div>
                                        <div className="text-xs text-yellow-500 font-mono">UID: {captain.uid}</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-400">
                                        {activePlayers} / {r.registration_type === 'SQUAD' ? 4 : r.registration_type === 'DUO' ? 2 : 1}
                                    </td>
                                    <td className="px-6 py-4 text-gray-300 max-w-[150px] truncate" title={t.name}>{t.name}</td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={r.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link to={`/admin/registrations/${r._id}`} className="text-yellow-500 hover:text-yellow-400 font-bold px-3 py-1 bg-yellow-500/10 rounded transition">Details</Link>
                                    </td>
                                </>
                            );
                        }}
                    />

                    {/* Pagination */}
                    <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
                        <div>Page {page} of {totalPages}</div>
                        <div className="flex gap-2">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-gray-900 border border-gray-800 rounded hover:bg-gray-800 disabled:opacity-50 transition">Prev</button>
                            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-gray-900 border border-gray-800 rounded hover:bg-gray-800 disabled:opacity-50 transition">Next</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamsList;
