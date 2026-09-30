import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

const PaymentsList = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const { api } = useAuth();

    // Modal state
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [customReason, setCustomReason] = useState('');

    const REJECT_REASONS = [
        "Invalid UTR",
        "Wrong amount",
        "Duplicate payment",
        "Payment not received",
        "Screenshot unclear",
        "Other"
    ];

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (search) params.search = search;
            
            const res = await api.get('/admin/payments', { params });
            setPayments(res.data);
        } catch (error) {
            console.error("Failed to fetch payments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // debounce search
        const timeout = setTimeout(() => fetchPayments(), 300);
        return () => clearTimeout(timeout);
    }, [statusFilter, search]);

    const handleVerify = async (paymentId) => {
        if (!window.confirm("Are you sure you want to VERIFY this payment? This will confirm the registration.")) return;
        
        try {
            await api.post(`/admin/payments/${paymentId}/verify`);
            fetchPayments();
        } catch (error) {
            alert(error.response?.data?.detail || "Failed to verify payment");
        }
    };

    const openRejectModal = (payment) => {
        setSelectedPayment(payment);
        setRejectReason(REJECT_REASONS[0]);
        setCustomReason('');
        setRejectModalOpen(true);
    };

    const handleReject = async () => {
        const finalReason = rejectReason === "Other" ? customReason : rejectReason;
        if (!finalReason) {
            alert("Please provide a reason for rejection.");
            return;
        }

        if (!window.confirm("Are you sure you want to REJECT this payment? This will reject the registration.")) return;

        try {
            await api.post(`/admin/payments/${selectedPayment._id}/reject`, { reason: finalReason });
            setRejectModalOpen(false);
            fetchPayments();
        } catch (error) {
            alert(error.response?.data?.detail || "Failed to reject payment");
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'PENDING': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
            case 'VERIFIED': return 'bg-green-500/20 text-green-500 border-green-500/50';
            case 'REJECTED': return 'bg-red-500/20 text-red-500 border-red-500/50';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-600';
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-3xl font-black text-white uppercase tracking-wider">Payment Verification</h2>
                
                <div className="flex gap-4 w-full md:w-auto">
                    <input 
                        type="text" 
                        placeholder="Search ID, UTR, Name..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-gray-900 border border-gray-700 rounded p-2 text-white outline-none focus:border-yellow-500 w-full md:w-64"
                    />
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-900 border border-gray-700 rounded p-2 text-white outline-none focus:border-yellow-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto shadow-xl">
                <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-gray-950 text-gray-400 uppercase text-xs font-bold">
                        <tr>
                            <th className="px-6 py-4">Reg ID & Tourney</th>
                            <th className="px-6 py-4">Team / Captain</th>
                            <th className="px-6 py-4">Amount & UTR</th>
                            <th className="px-6 py-4">Screenshot</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {loading ? (
                            <tr><td colSpan="7" className="text-center py-8">Loading...</td></tr>
                        ) : payments.length === 0 ? (
                            <tr><td colSpan="7" className="text-center py-8 text-gray-500">No payments found.</td></tr>
                        ) : (
                            payments.map((p) => {
                                const reg = p.registration || {};
                                const tournament = p.tournament || {};
                                const captain = reg.players && reg.players.length > 0 ? reg.players[0] : {};
                                
                                const baseURL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:8000';
                                const screenshotUrl = `${baseURL}${p.screenshot_url}`;

                                return (
                                    <tr key={p._id} className="hover:bg-gray-800/50 transition">
                                        <td className="px-6 py-4">
                                            <div className="font-black text-yellow-500">{p.registration_id}</div>
                                            <div className="text-xs text-gray-400 truncate max-w-[150px]">{tournament.name || 'Unknown'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {reg.team_name && <div className="font-bold text-white uppercase">{reg.team_name}</div>}
                                            <div className="text-gray-300 font-medium">{captain.full_name || p.payer_name}</div>
                                            <div className="text-xs text-gray-500">{captain.uid ? `UID: ${captain.uid}` : ''}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-black text-white text-lg">₹{p.amount_paid}</div>
                                            <div className="text-xs text-gray-400 font-mono tracking-wider">{p.utr}</div>
                                            <div className="text-[10px] text-gray-500 uppercase">{p.payment_method}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <a href={screenshotUrl} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded overflow-hidden border border-gray-700 hover:border-yellow-500 transition">
                                                <img src={screenshotUrl} alt="Screenshot" className="w-full h-full object-cover" />
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-300">{new Date(p.created_at).toLocaleDateString()}</div>
                                            <div className="text-xs text-gray-500">{new Date(p.created_at).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(p.status)}`}>
                                                {p.status}
                                            </span>
                                            {p.status === 'REJECTED' && p.rejection_reason && (
                                                <div className="text-[10px] text-red-400 mt-1 max-w-[120px] truncate" title={p.rejection_reason}>
                                                    {p.rejection_reason}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {p.status === 'PENDING' && (
                                                <>
                                                    <button onClick={() => handleVerify(p._id)} className="bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white px-3 py-1 rounded font-bold transition">Verify</button>
                                                    <button onClick={() => openRejectModal(p)} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1 rounded font-bold transition">Reject</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Reject Modal */}
            {rejectModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-2xl font-black text-white uppercase mb-4 text-red-500">Reject Payment</h3>
                        <p className="text-gray-400 mb-6">Select a reason for rejecting the payment for <strong className="text-white">{selectedPayment?.registration_id}</strong>.</p>
                        
                        <div className="space-y-4 mb-6">
                            <select 
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white outline-none focus:border-red-500"
                            >
                                {REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>

                            {rejectReason === "Other" && (
                                <input 
                                    type="text" 
                                    placeholder="Enter custom reason..." 
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white outline-none focus:border-red-500"
                                />
                            )}
                        </div>

                        <div className="flex justify-end gap-4">
                            <button onClick={() => setRejectModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white font-bold transition">Cancel</button>
                            <button onClick={handleReject} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition">Confirm Rejection</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentsList;
