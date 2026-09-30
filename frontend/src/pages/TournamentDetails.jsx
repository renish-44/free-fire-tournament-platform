import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const TournamentDetails = () => {
    const { slug } = useParams();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTournament = async () => {
            try {
                const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                const res = await axios.get(`${baseURL}/public/tournaments/${slug}`);
                setTournament(res.data);
            } catch (err) {
                setError('Tournament not found or unavailable.');
            } finally {
                setLoading(false);
            }
        };
        fetchTournament();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
            </div>
        );
    }

    if (error || !tournament) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                <div className="text-center text-white">
                    <h2 className="text-3xl font-black text-red-500 mb-2">ERROR</h2>
                    <p className="text-gray-400">{error}</p>
                    <Link to="/" className="mt-6 inline-block text-yellow-500 hover:text-yellow-400 font-bold uppercase tracking-wider">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const isClosed = tournament.status === 'CLOSED' || tournament.status === 'COMPLETED';
    const isFull = tournament.available_slots <= 0;
    const isPastDeadline = new Date() > new Date(tournament.registration_deadline);
    
    const registrationDisabled = isClosed || isFull || isPastDeadline;
    
    let buttonText = "REGISTER NOW";
    if (isClosed) buttonText = "REGISTRATION CLOSED";
    else if (isFull) buttonText = "REGISTRATION FULL";
    else if (isPastDeadline) buttonText = "REGISTRATION CLOSED";

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-yellow-500 selection:text-gray-950">
            {/* Header / Hero Section */}
            <div className="relative overflow-hidden bg-gray-900 border-b border-gray-800">
                {/* Neon Background Accents */}
                <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-yellow-500/20 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-orange-600/20 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 relative z-10">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-stretch">
                        {/* Poster */}
                        <div className="w-full md:w-1/4 max-w-sm flex-shrink-0">
                            {tournament.poster_url ? (
                                <img 
                                    src={tournament.poster_url.startsWith('http') ? tournament.poster_url : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:8000'}${tournament.poster_url}`} 
                                    alt={tournament.name} 
                                    className="w-full h-full rounded-2xl shadow-2xl shadow-yellow-500/10 border border-gray-800 object-cover aspect-[4/5]"
                                />
                            ) : (
                                <div className="w-full h-full aspect-[4/5] bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-800 flex items-center justify-center">
                                    <span className="text-gray-600 font-black text-4xl uppercase tracking-tighter">FREE FIRE</span>
                                </div>
                            )}
                        </div>

                        {/* Title & Primary Info */}
                        <div className="w-full md:w-2/4 space-y-6 text-center md:text-left flex flex-col justify-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-500 text-xs font-bold tracking-widest uppercase self-center md:self-start">
                                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                {tournament.status}
                            </div>
                            
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                {tournament.name}
                            </h1>
                            
                            <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
                                {tournament.description}
                            </p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
                                <div className="bg-gray-900 border border-gray-800 px-4 lg:px-6 py-3 rounded-xl shadow-lg">
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Prize Pool</p>
                                    <p className="text-xl lg:text-2xl font-black text-yellow-500">₹{tournament.prize_pool}</p>
                                </div>
                                <div className="bg-gray-900 border border-gray-800 px-4 lg:px-6 py-3 rounded-xl shadow-lg">
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Entry Fee</p>
                                    <p className="text-xl lg:text-2xl font-black text-white">{tournament.entry_fee > 0 ? `₹${tournament.entry_fee}` : 'FREE'}</p>
                                </div>
                                <div className="bg-gray-900 border border-gray-800 px-4 lg:px-6 py-3 rounded-xl shadow-lg">
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Mode</p>
                                    <p className="text-xl lg:text-2xl font-black text-white uppercase">{tournament.mode}</p>
                                </div>
                            </div>
                        </div>

                        {/* Registration Action Card */}
                        <div className="w-full md:w-1/4 flex-shrink-0">
                            <div className="bg-gray-950/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 shadow-2xl relative overflow-hidden h-full flex flex-col justify-between">
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 pointer-events-none"></div>
                                
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Slots</p>
                                            <p className="text-2xl lg:text-3xl font-black text-white">{tournament.available_slots} <span className="text-sm lg:text-lg text-gray-500">/ {tournament.maximum_slots}</span></p>
                                        </div>
                                        <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full border-4 border-gray-800 flex items-center justify-center flex-shrink-0" style={{
                                            borderColor: tournament.available_slots > 0 ? '#eab308' : '#ef4444',
                                            borderRightColor: 'transparent',
                                            borderBottomColor: 'transparent',
                                            transform: 'rotate(45deg)'
                                        }}>
                                            <div className="w-full h-full rounded-full flex items-center justify-center" style={{transform: 'rotate(-45deg)'}}>
                                                <span className="text-xs lg:text-sm font-bold">{Math.round(((tournament.maximum_slots - tournament.available_slots) / tournament.maximum_slots) * 100)}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {registrationDisabled ? (
                                        <button 
                                            disabled
                                            className="w-full py-4 px-4 rounded-xl font-black text-sm lg:text-base uppercase tracking-widest transition duration-300 transform shadow-xl bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                                        >
                                            {buttonText}
                                        </button>
                                    ) : (
                                        <div>
                                            <Link 
                                                to={`/tournament/${slug}/register`}
                                                className="block text-center w-full py-4 px-4 rounded-xl font-black text-sm lg:text-base uppercase tracking-widest transition duration-300 transform shadow-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-950 hover:from-yellow-400 hover:to-orange-400 hover:-translate-y-1 shadow-yellow-500/30 hover:shadow-yellow-500/50 mb-4"
                                            >
                                                {buttonText}
                                            </Link>
                                            
                                            <div className="text-center pt-4 border-t border-gray-800 hidden lg:block">
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Or Scan to Register</p>
                                                <div className="bg-white p-2 rounded-xl inline-block shadow-inner">
                                                    <img 
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin + '/tournament/' + slug + '/register')}`} 
                                                        alt="Registration QR" 
                                                        className="w-20 h-20 object-contain mx-auto"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-4xl mx-auto px-4 py-12">
                
                <div className="space-y-8">
                    
                    {/* Schedule Card */}
                    <section className="bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-800 shadow-xl relative overflow-hidden group hover:border-gray-700 transition duration-300">
                        <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                        <h3 className="text-2xl font-black uppercase tracking-wider mb-6 text-white flex items-center gap-3">
                            Schedule
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Match Date</p>
                                <p className="text-lg font-bold">{new Date(tournament.tournament_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                <p className="text-yellow-500 font-bold">{tournament.start_time}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Registration Closes</p>
                                <p className="text-lg font-bold text-red-400">{new Date(tournament.registration_deadline).toLocaleString()}</p>
                            </div>
                        </div>
                    </section>

                    {/* Prizes Card */}
                    <section className="bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-800 shadow-xl relative overflow-hidden group hover:border-gray-700 transition duration-300">
                        <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                        <h3 className="text-2xl font-black uppercase tracking-wider mb-6 text-white flex items-center gap-3">
                            Prize Distribution
                        </h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-gray-950 rounded-xl p-4 border border-gray-800 transform hover:-translate-y-1 transition duration-300">
                                <p className="text-3xl font-black text-yellow-500 mb-1">1st</p>
                                <p className="text-lg font-bold">₹{tournament.first_prize}</p>
                            </div>
                            <div className="bg-gray-950 rounded-xl p-4 border border-gray-800 transform hover:-translate-y-1 transition duration-300">
                                <p className="text-3xl font-black text-gray-300 mb-1">2nd</p>
                                <p className="text-lg font-bold">₹{tournament.second_prize}</p>
                            </div>
                            <div className="bg-gray-950 rounded-xl p-4 border border-gray-800 transform hover:-translate-y-1 transition duration-300">
                                <p className="text-3xl font-black text-orange-700 mb-1">3rd</p>
                                <p className="text-lg font-bold">₹{tournament.third_prize}</p>
                            </div>
                        </div>
                    </section>

                    {/* Rules & Instructions */}
                    {(tournament.rules || tournament.instructions) && (
                        <section className="bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-800 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                            {tournament.rules && (
                                <div className="mb-8">
                                    <h3 className="text-2xl font-black uppercase tracking-wider mb-4 text-white">Rules</h3>
                                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{tournament.rules}</p>
                                </div>
                            )}
                            {tournament.instructions && (
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-wider mb-4 text-white">Instructions</h3>
                                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{tournament.instructions}</p>
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TournamentDetails;
