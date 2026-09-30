import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { DataTable, StatusBadge, LoadingState, ErrorState } from '../../components/admin/DashboardWidgets';

const PlayersList = () => {
    const { api } = useAuth();
    const [playersList, setPlayersList] = useState([]);
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

    const fetchPlayers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = { page, limit: 15 };
            if (search) params.search = search;
            if (filters.tournament_id) params.tournament_id = filters.tournament_id;
            if (filters.status) params.status = filters.status;

            const res = await api.get('/admin/players', { params });
            setPlayersList(res.data.data);
            setTotalPages(res.data.total_pages || 1);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to load players");
        } finally {
            setLoading(false);
        }
    }, [api, page, search, filters]);

    useEffect(() => {
        fetchTournaments();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchPlayers();
        }, 300);
        return () => clearTimeout(timeout);
    }, [fetchPlayers]);

    const handleDelete = async (regMongoId, playerIndex) => {
        if (!window.confirm("Are you sure you want to remove this player from the registration? This cannot be fully undone here.")) return;
        
        try {
            await api.delete(`/admin/players/${regMongoId}/player/${playerIndex}`);
            fetchPlayers();
        } catch (err) {
            alert(err.response?.data?.detail || "Failed to delete player");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-wider">Players Management</h2>
                <p className="text-gray-400">View and manage all registered players across all tournaments.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-xl flex flex-wrap gap-4 items-center">
                <input 
                    type="text" 
                    placeholder="Search Name, IGN, UID, Phone..." 
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
                    <option value="">Reg Status</option>
                    <option value="pending">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                </select>
            </div>

            {error ? (
                <ErrorState message={error} onRetry={fetchPlayers} />
            ) : (
                <div className="relative">
                    {loading && (
                        <div className="absolute inset-0 bg-gray-950/50 z-10 flex items-center justify-center rounded-xl">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
                        </div>
                    )}
                    
                    <DataTable 
                        columns={["Name & Role", "IGN & UID", "Contact", "Team / Reg ID", "Tournament", "Reg Status", "Actions"]}
                        data={playersList}
                        keyExtractor={(item) => item._id}
                        emptyMessage="No players found."
                        renderRow={(row) => {
                            const p = row.player;
                            const t = row.tournament || {};
                            const isCaptain = row.player_index === 0;
                            
                            return (
                                <>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white">{p.full_name}</div>
                                        {isCaptain ? (
                                            <span className="bg-yellow-500/20 text-yellow-500 text-[10px] px-2 py-0.5 rounded font-bold uppercase border border-yellow-500/50">Captain</span>
                                        ) : (
                                            <span className="bg-gray-800 text-gray-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase border border-gray-700">Player</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-300 font-medium">{p.ign}</div>
                                        <div className="text-xs text-yellow-500 font-mono">UID: {p.uid}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-300 text-xs">{p.whatsapp || '-'}</div>
                                        <div className="text-gray-500 text-xs truncate max-w-[120px]">{p.email || ''}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {row.team_name ? (
                                            <div className="font-bold text-white uppercase text-xs truncate max-w-[150px]" title={row.team_name}>{row.team_name}</div>
                                        ) : (
                                            <div className="text-gray-500 italic text-xs">No Team Name</div>
                                        )}
                                        <div className="text-xs text-gray-500 font-mono">{row.registration_id}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300 text-sm max-w-[150px] truncate" title={t.name}>{t.name}</td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={row.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <Link to={`/admin/registrations/${row.registration_mongo_id}`} className="text-blue-500 hover:text-blue-400 font-bold px-2 py-1 bg-blue-500/10 rounded transition text-xs">Reg Info</Link>
                                        {!isCaptain && (
                                            <button onClick={() => handleDelete(row.registration_mongo_id, row.player_index)} className="text-red-500 hover:text-red-400 font-bold px-2 py-1 bg-red-500/10 rounded transition text-xs">Remove</button>
                                        )}
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

export default PlayersList;
