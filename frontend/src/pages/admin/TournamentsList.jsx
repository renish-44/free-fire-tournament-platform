import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const TournamentsList = () => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { api } = useAuth();

    const fetchTournaments = async () => {
        try {
            const res = await api.get('/tournaments');
            setTournaments(res.data);
        } catch (error) {
            console.error("Failed to fetch tournaments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTournaments();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this tournament?')) {
            try {
                await api.delete(`/tournaments/${id}`);
                setTournaments(tournaments.filter(t => t._id !== id));
            } catch (error) {
                alert('Failed to delete tournament');
            }
        }
    };

    const handleAction = async (id, action) => {
        try {
            await api.post(`/tournaments/${id}/${action}`);
            fetchTournaments();
        } catch (error) {
            alert(`Failed to ${action} tournament: ${error.response?.data?.detail || error.message}`);
        }
    };

    const getStatusStyle = (status) => {
        switch(status) {
            case 'DRAFT': return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
            case 'PUBLISHED': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            case 'CLOSED': return 'bg-red-500/10 text-red-400 border border-red-500/20';
            case 'COMPLETED': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
        }
    };

    const [qrModal, setQrModal] = useState({ open: false, tournament: null });

    const handleCopyLink = (slug) => {
        const url = `${window.location.origin}/tournament/${slug}`;
        navigator.clipboard.writeText(url);
        alert('Registration link copied!');
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-2 border-yellow-500/30 border-t-yellow-500 animate-spin"></div>
        </div>
    );

    return (
        <div className="page-enter">
            {/* QR Modal */}
            {qrModal.open && qrModal.tournament && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="glass-card p-8 max-w-sm w-full text-center page-enter">
                        <button onClick={() => setQrModal({ open: false, tournament: null })} className="absolute top-4 right-4 text-gray-500 hover:text-white text-lg">✕</button>
                        <h3 className="text-xl font-extrabold text-white mb-1">Registration QR</h3>
                        <p className="text-gray-500 text-sm mb-6">{qrModal.tournament.name}</p>

                        <div className="bg-white p-4 rounded-2xl inline-block mb-6">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/tournament/' + qrModal.tournament.slug + '/register')}`}
                                alt="Registration QR"
                                className="w-48 h-48 object-contain"
                            />
                        </div>

                        <div className="space-y-2">
                            <a
                                href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(window.location.origin + '/tournament/' + qrModal.tournament.slug + '/register')}`}
                                download={`qr_${qrModal.tournament.slug}.png`}
                                target="_blank"
                                rel="noreferrer"
                                className="block w-full btn-primary text-center text-sm py-2.5"
                            >
                                Download QR
                            </a>
                            <button
                                onClick={() => handleCopyLink(qrModal.tournament.slug)}
                                className="block w-full glass-btn text-sm text-center"
                            >
                                Copy Link
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Tournaments</h2>
                <Link to="/admin/tournaments/create" className="btn-primary text-sm text-center py-2.5 px-5">
                    + New Tournament
                </Link>
            </div>

            {/* Table */}
            <div className="glass-table overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-xs text-gray-500 uppercase tracking-wider">
                            <th className="px-5 py-4 font-semibold">Tournament</th>
                            <th className="px-5 py-4 font-semibold hidden md:table-cell">Date</th>
                            <th className="px-5 py-4 font-semibold hidden sm:table-cell">Mode</th>
                            <th className="px-5 py-4 font-semibold">Status</th>
                            <th className="px-5 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tournaments.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-5 py-12 text-center text-gray-500 text-sm">
                                    No tournaments yet. Create your first one!
                                </td>
                            </tr>
                        ) : (
                            tournaments.map((t) => (
                                <tr key={t._id}>
                                    <td className="px-5 py-4">
                                        <div className="font-semibold text-white text-sm">{t.name}</div>
                                        <div className="text-xs text-gray-600 mt-0.5">/tournament/{t.slug}</div>
                                    </td>
                                    <td className="px-5 py-4 hidden md:table-cell">
                                        <div className="text-sm text-gray-300">{new Date(t.tournament_date).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-600">{t.start_time}</div>
                                    </td>
                                    <td className="px-5 py-4 hidden sm:table-cell">
                                        <span className="badge bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">{t.mode}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`badge ${getStatusStyle(t.status)}`}>{t.status}</span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 flex-wrap">
                                            <button onClick={() => setQrModal({ open: true, tournament: t })} className="text-xs text-yellow-500 hover:text-yellow-400 font-semibold">QR</button>
                                            <Link to={`/admin/registrations?tournament_id=${t._id}`} className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold">Registrations</Link>
                                            {t.status === 'DRAFT' && (
                                                <button onClick={() => handleAction(t._id, 'publish')} className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold">Publish</button>
                                            )}
                                            {t.status === 'PUBLISHED' && (
                                                <button onClick={() => handleAction(t._id, 'close')} className="text-xs text-red-400 hover:text-red-300 font-semibold">Close</button>
                                            )}
                                            <Link to={`/admin/tournaments/${t._id}/form-builder`} className="text-xs text-purple-400 hover:text-purple-300 font-semibold">Form</Link>
                                            <Link to={`/admin/tournaments/${t._id}/edit`} className="text-xs text-blue-400 hover:text-blue-300 font-semibold">Edit</Link>
                                            <button onClick={() => handleDelete(t._id)} className="text-xs text-gray-500 hover:text-gray-400 font-semibold">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TournamentsList;
