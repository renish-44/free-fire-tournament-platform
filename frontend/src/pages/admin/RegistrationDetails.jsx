import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { StatusBadge, LoadingState, ErrorState } from '../../components/admin/DashboardWidgets';

const RegistrationDetails = () => {
    const { id } = useParams();
    const { api } = useAuth();
    
    const [reg, setReg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    // Edit state
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState({});

    const fetchRegistration = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/admin/registrations/${id}`);
            setReg(res.data);
            setEditData({
                status: res.data.status,
                team_name: res.data.team_name || '',
                players: res.data.players.map(p => ({ ...p }))
            });
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to load registration details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistration();
    }, [id]);

    const handlePlayerChange = (index, field, value) => {
        const newPlayers = [...editData.players];
        newPlayers[index][field] = value;
        setEditData({ ...editData, players: newPlayers });
    };

    const handleSave = async () => {
        if (!window.confirm("Save changes to this registration?")) return;
        setSaving(true);
        try {
            await api.put(`/admin/registrations/${id}`, editData);
            setEditing(false);
            await fetchRegistration();
        } catch (err) {
            alert(err.response?.data?.detail || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} onRetry={fetchRegistration} />;
    if (!reg) return null;

    const t = reg.tournament || {};
    const p = reg.payment || {};
    const baseURL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:8000';
    const screenshotUrl = p.screenshot_url ? `${baseURL}${p.screenshot_url}` : null;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-6">
                <div>
                    <Link to="/admin/registrations" className="text-yellow-500 hover:text-yellow-400 font-bold uppercase tracking-widest text-sm mb-2 block">
                        ← Back to List
                    </Link>
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-black text-white uppercase tracking-wider">{reg.registration_id}</h2>
                        <StatusBadge status={reg.status} />
                        <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded font-bold uppercase tracking-widest">{reg.registration_type}</span>
                    </div>
                    <p className="text-gray-400 mt-2">Registered on {new Date(reg.created_at).toLocaleString()}</p>
                </div>
                
                <div className="flex gap-3">
                    {editing ? (
                        <>
                            <button onClick={() => setEditing(false)} className="px-4 py-2 text-gray-400 hover:text-white font-bold transition">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-6 rounded shadow uppercase transition">
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setEditing(true)} className="bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold py-2 px-6 rounded shadow uppercase transition">
                            Edit Details
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Details */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Tournament Info */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">Tournament</h3>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xl font-bold text-white">{t.name || 'Unknown Tournament'}</p>
                                <p className="text-gray-400">{t.game_name} • {t.mode}</p>
                            </div>
                            <Link to={`/tournament/${t.slug}`} target="_blank" className="text-yellow-500 text-sm hover:underline">View Public Page</Link>
                        </div>
                    </div>

                    {/* Registration Status (Edit Mode Only) */}
                    {editing && (
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl border-l-4 border-l-yellow-500">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Update Registration Status</h3>
                            <select 
                                value={editData.status} 
                                onChange={(e) => setEditData({...editData, status: e.target.value})}
                                className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-white outline-none focus:border-yellow-500"
                            >
                                <option value="pending">Pending</option>
                                <option value="CONFIRMED">Confirmed (Verified)</option>
                                <option value="PAYMENT_REJECTED">Payment Rejected</option>
                                <option value="rejected">Rejected (Other)</option>
                            </select>
                        </div>
                    )}

                    {/* Team & Players */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">Team & Players</h3>
                        
                        {(reg.team_name || editing) && (
                            <div className="mb-6">
                                <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Team Name</label>
                                {editing ? (
                                    <input 
                                        type="text" 
                                        value={editData.team_name} 
                                        onChange={(e) => setEditData({...editData, team_name: e.target.value})}
                                        className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-white outline-none focus:border-yellow-500"
                                    />
                                ) : (
                                    <p className="text-lg font-bold text-white uppercase">{reg.team_name}</p>
                                )}
                            </div>
                        )}

                        <div className="space-y-6">
                            {(editing ? editData.players : reg.players).map((player, idx) => (
                                <div key={idx} className="bg-gray-950 p-4 rounded-xl border border-gray-800 relative">
                                    <div className="absolute top-0 right-0 bg-gray-800 text-gray-400 text-[10px] uppercase font-bold px-2 py-1 rounded-bl-xl rounded-tr-xl">
                                        {idx === 0 ? 'Captain' : `Player ${idx + 1}`}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Full Name</label>
                                            {editing ? (
                                                <input type="text" value={player.full_name} onChange={(e) => handlePlayerChange(idx, 'full_name', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm outline-none focus:border-yellow-500" />
                                            ) : (
                                                <p className="text-white font-medium">{player.full_name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">In-Game Name</label>
                                            {editing ? (
                                                <input type="text" value={player.ign} onChange={(e) => handlePlayerChange(idx, 'ign', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm outline-none focus:border-yellow-500" />
                                            ) : (
                                                <p className="text-white">{player.ign}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">UID</label>
                                            {editing ? (
                                                <input type="text" value={player.uid} onChange={(e) => handlePlayerChange(idx, 'uid', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm outline-none focus:border-yellow-500" />
                                            ) : (
                                                <p className="text-yellow-500 font-mono font-bold">{player.uid}</p>
                                            )}
                                        </div>
                                        {player.whatsapp !== undefined && (
                                            <div>
                                                <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">WhatsApp</label>
                                                {editing ? (
                                                    <input type="text" value={player.whatsapp} onChange={(e) => handlePlayerChange(idx, 'whatsapp', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm outline-none focus:border-yellow-500" />
                                                ) : (
                                                    <p className="text-white">{player.whatsapp}</p>
                                                )}
                                            </div>
                                        )}
                                        {player.email !== undefined && (
                                            <div className="md:col-span-2">
                                                <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Email</label>
                                                {editing ? (
                                                    <input type="text" value={player.email} onChange={(e) => handlePlayerChange(idx, 'email', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm outline-none focus:border-yellow-500" />
                                                ) : (
                                                    <p className="text-gray-300">{player.email}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Custom Fields */}
                    {reg.custom_fields && Object.keys(reg.custom_fields).length > 0 && (
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">Custom Fields Data</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.entries(reg.custom_fields).map(([key, val]) => (
                                    <div key={key} className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1 truncate">{key}</p>
                                        <p className="text-white font-medium break-words">
                                            {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : (val || '-')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Right Column - Payment & History */}
                <div className="space-y-8">
                    
                    {/* Payment Info */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Payment Details</h3>
                            <StatusBadge status={p.status || 'UNPAID'} />
                        </div>
                        
                        {!p.status ? (
                            <div className="text-center py-6">
                                <p className="text-gray-500">No payment submitted yet.</p>
                                <p className="text-xs text-gray-600 mt-2">Entry Fee: ₹{t.entry_fee}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Amount Paid</p>
                                    <p className="text-2xl font-black text-green-500">₹{p.amount_paid}</p>
                                    {p.amount_paid < t.entry_fee && <p className="text-xs text-red-500">Warning: Less than entry fee (₹{t.entry_fee})</p>}
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">UTR / Reference</p>
                                    <p className="text-white font-mono">{p.utr}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Payer & Method</p>
                                    <p className="text-gray-300">{p.payer_name} via {p.payment_method}</p>
                                </div>
                                
                                {screenshotUrl && (
                                    <div className="pt-2">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Screenshot</p>
                                        <a href={screenshotUrl} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-gray-700 hover:border-yellow-500 transition relative group">
                                            <img src={screenshotUrl} alt="Payment" className="w-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                                <span className="text-white font-bold text-sm bg-gray-900 px-3 py-1 rounded">Open Full Image</span>
                                            </div>
                                        </a>
                                    </div>
                                )}
                                
                                {p.status === 'PENDING' && (
                                    <div className="pt-4 border-t border-gray-800">
                                        <Link to="/admin/payments" className="block text-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded text-sm transition">
                                            Verify in Payments Tab
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Status History */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">Activity History</h3>
                        
                        {reg.status_history?.length === 0 ? (
                            <p className="text-gray-500 text-sm">No activity recorded.</p>
                        ) : (
                            <div className="space-y-4">
                                {reg.status_history?.map((h, i) => (
                                    <div key={h._id} className="relative pl-4 border-l-2 border-gray-800">
                                        <div className="absolute w-2 h-2 bg-yellow-500 rounded-full -left-[5px] top-1.5"></div>
                                        <p className="text-sm text-white">
                                            Status changed to <span className="font-bold text-yellow-500">{h.new_status}</span>
                                        </p>
                                        {h.reason && <p className="text-xs text-red-400 mt-1">Reason: {h.reason}</p>}
                                        <p className="text-[10px] text-gray-500 mt-1">{new Date(h.created_at).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RegistrationDetails;
