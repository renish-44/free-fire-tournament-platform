import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const RegistrationStatus = () => {
    const { registrationId } = useParams();
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                const res = await axios.get(`${baseURL}/public/registrations/${registrationId}`);
                setStatusData(res.data);
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to load registration status.');
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, [registrationId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500 mb-4"></div>
                <p className="text-gray-400 animate-pulse font-bold tracking-widest uppercase">Fetching Status...</p>
            </div>
        );
    }

    if (error || !statusData) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 text-white">
                <div className="bg-gray-900 border border-red-900/50 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">❌</span>
                    </div>
                    <h2 className="text-3xl font-black text-red-500 mb-4 uppercase tracking-wider">Not Found</h2>
                    <p className="text-gray-400 mb-8">{error}</p>
                    <Link to="/" className="block w-full bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold py-3 rounded-xl uppercase tracking-widest transition shadow-lg shadow-yellow-500/20">
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    // Status message resolution
    const pStatus = statusData.payment_status;
    const rStatus = statusData.registration_status;
    
    let alertColor = 'border-gray-700 bg-gray-800 text-gray-300';
    let icon = 'ℹ️';
    let messageTitle = 'Status Unknown';
    let messageBody = 'We could not determine your current registration status.';

    if (rStatus === 'CONFIRMED' || pStatus === 'VERIFIED') {
        alertColor = 'border-green-500/50 bg-green-500/10 text-green-400';
        icon = '✅';
        messageTitle = 'Payment Verified';
        messageBody = 'Payment verified successfully. Your registration is confirmed.';
    } else if (pStatus === 'PENDING' || rStatus === 'pending') {
        alertColor = 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500';
        icon = '⏳';
        messageTitle = 'Payment Pending';
        messageBody = 'Your payment is waiting for admin verification. Please check back later.';
    } else if (pStatus === 'REJECTED' || rStatus === 'PAYMENT_REJECTED') {
        alertColor = 'border-red-500/50 bg-red-500/10 text-red-500';
        icon = '❌';
        messageTitle = 'Payment Rejected';
        messageBody = 'Your payment could not be verified.';
    } else if (pStatus === 'UNPAID') {
        alertColor = 'border-orange-500/50 bg-orange-500/10 text-orange-500';
        icon = '💳';
        messageTitle = 'Awaiting Payment';
        messageBody = 'Your registration requires payment to proceed.';
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans py-12 px-4 selection:bg-yellow-500 selection:text-gray-950">
            <div className="max-w-3xl mx-auto space-y-8">
                
                {/* Header Section */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
                        Registration <span className="text-yellow-500">Status</span>
                    </h1>
                    <p className="text-gray-400 font-mono tracking-widest bg-gray-900 inline-block px-4 py-2 rounded-lg border border-gray-800 shadow-inner">
                        ID: {statusData.registration_id}
                    </p>
                </div>

                {/* Status Alert Banner */}
                <div className={`border-2 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-2xl relative overflow-hidden ${alertColor}`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="text-5xl drop-shadow-lg filter">{icon}</div>
                    <div className="text-center md:text-left z-10">
                        <h3 className="text-2xl font-black uppercase tracking-wider mb-2">{messageTitle}</h3>
                        <p className="opacity-90">{messageBody}</p>
                        {statusData.rejection_reason && (
                            <div className="mt-4 bg-red-950/50 border border-red-500/30 p-3 rounded-lg text-sm text-red-200">
                                <strong className="uppercase block mb-1 text-red-400">Reason for rejection:</strong>
                                {statusData.rejection_reason}
                            </div>
                        )}
                    </div>
                </div>

                {/* Registration Details Card */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
                    <div className="p-6 md:p-8 space-y-8">
                        
                        {/* Meta Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Tournament</p>
                                <p className="text-xl font-bold text-white">{statusData.tournament_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Submission Date</p>
                                <p className="text-lg text-gray-300">
                                    {new Date(statusData.created_at).toLocaleString()}
                                </p>
                            </div>
                            
                            {statusData.team_name && (
                                <div className="sm:col-span-2">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Team Name</p>
                                    <p className="text-2xl font-black text-yellow-500 uppercase">{statusData.team_name}</p>
                                </div>
                            )}
                        </div>

                        <div className="h-px bg-gray-800 w-full my-6"></div>

                        {/* Players Roster */}
                        <div>
                            <h4 className="text-lg font-black uppercase tracking-wider text-gray-400 mb-6 flex items-center gap-2">
                                <span>Roster</span>
                                <span className="bg-gray-800 text-xs px-2 py-1 rounded text-white">{statusData.registration_type}</span>
                            </h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {statusData.players.map((player, index) => (
                                    <div key={index} className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex items-start gap-4 hover:border-gray-700 transition">
                                        <div className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center flex-shrink-0 font-black text-gray-500">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white mb-1 flex items-center gap-2">
                                                {player.full_name}
                                                {index === 0 && (
                                                    <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded uppercase font-black tracking-wider">Captain</span>
                                                )}
                                            </p>
                                            <div className="space-y-1">
                                                <p className="text-sm text-gray-400 font-mono"><span className="text-gray-500">IGN:</span> {player.ign}</p>
                                                <p className="text-sm text-gray-400 font-mono"><span className="text-gray-500">UID:</span> {player.uid}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Action */}
                <div className="text-center pt-8">
                    <Link to="/" className="text-gray-500 hover:text-white font-bold uppercase tracking-widest transition">
                        ← Back to Homepage
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default RegistrationStatus;
