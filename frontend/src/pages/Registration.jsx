import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const Registration = () => {
    const { slug } = useParams();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState(null);

    const [teamName, setTeamName] = useState('');
    const [players, setPlayers] = useState([]);
    const [customFieldsData, setCustomFieldsData] = useState({});

    useEffect(() => {
        const fetchTournament = async () => {
            try {
                const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                const res = await axios.get(`${baseURL}/public/tournaments/${slug}`);
                const t = res.data;
                setTournament(t);
                
                // Initialize players based on mode
                let count = 1;
                if (t.mode === 'DUO') count = 2;
                if (t.mode === 'SQUAD') count = 4;
                
                const initialPlayers = Array(count).fill(null).map(() => ({
                    full_name: '',
                    ign: '',
                    uid: '',
                    whatsapp: '',
                    email: '',
                    age: '',
                    city: ''
                }));
                setPlayers(initialPlayers);

                // Initialize custom fields
                if (t.custom_fields && t.custom_fields.length > 0) {
                    const cfData = {};
                    t.custom_fields.forEach(f => {
                        cfData[f.field_name] = '';
                    });
                    setCustomFieldsData(cfData);
                }
                
            } catch (err) {
                setError('Tournament not found or unavailable.');
            } finally {
                setLoading(false);
            }
        };
        fetchTournament();
    }, [slug]);

    const handlePlayerChange = (index, field, value) => {
        const updated = [...players];
        updated[index] = { ...updated[index], [field]: value };
        setPlayers(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            const payload = {
                team_name: teamName,
                players: players.map(p => {
                    const cleanP = { ...p };
                    if (!cleanP.age) delete cleanP.age;
                    else cleanP.age = Number(cleanP.age);
                    if (!cleanP.whatsapp) delete cleanP.whatsapp;
                    if (!cleanP.email) delete cleanP.email;
                    if (!cleanP.city) delete cleanP.city;
                    return cleanP;
                }),
                custom_fields_data: customFieldsData
            };

            const res = await axios.post(`${baseURL}/public/tournaments/${slug}/register`, payload);
            setSuccessData(res.data);
            window.scrollTo(0, 0);
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Please check your details.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fae29c] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#fbbc04]"></div>
            </div>
        );
    }

    if (error && !tournament) {
        return (
            <div className="min-h-screen bg-[#fae29c] flex items-center justify-center p-4 text-center font-sans">
                <div className="bg-white p-8 rounded-lg shadow-md border-t-8 border-t-[#d93025] max-w-md w-full">
                    <h2 className="text-2xl mb-4 text-[#202124]">Error</h2>
                    <p className="text-[#202124]">{error}</p>
                    <Link to="/" className="mt-6 inline-block text-[#1a73e8] font-medium hover:underline">← Back to Home</Link>
                </div>
            </div>
        );
    }

    if (successData) {
        const tInfo = successData.tournament;
        return (
            <div className="min-h-screen bg-[#fae29c] p-4 md:p-8 flex items-center justify-center font-sans">
                <div className="max-w-2xl w-full bg-white border border-[#dadce0] rounded-lg p-8 shadow-sm relative overflow-hidden border-t-8 border-t-[#fbbc04]">
                    <h2 className="text-[32px] text-[#202124] mb-2">Registration Successful</h2>
                    <p className="text-[14px] text-[#202124] mb-6">Your response has been recorded.</p>
                    
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
                        <p className="text-sm text-gray-600 mb-1">Registration ID</p>
                        <p className="text-xl font-medium text-[#202124]">{successData.registration_id}</p>
                    </div>

                    {tInfo.entry_fee > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-md p-6 mb-6 text-left">
                            <h3 className="text-lg font-medium text-[#202124] mb-2">
                                Payment Required
                            </h3>
                            <p className="text-[#202124] mb-4">Please pay <strong className="font-medium">₹{tInfo.entry_fee}</strong> to confirm your registration.</p>
                            
                            {tInfo.upi_id && (
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-1">UPI ID</p>
                                    <p className="text-base text-[#202124] font-medium">{tInfo.upi_id}</p>
                                </div>
                            )}
                            
                            <Link to={`/payment/${successData.registration_id}`} className="inline-block mt-2 text-[#1a73e8] font-medium hover:underline">
                                Continue to Payment →
                            </Link>
                        </div>
                    )}
                    
                    <div className="mt-6">
                        <Link to={`/tournament/${slug}`} className="text-[#1a73e8] font-medium hover:underline">
                            Submit another response
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const isDuoOrSquad = tournament.mode === 'DUO' || tournament.mode === 'SQUAD';

    const Card = ({ children, className = '' }) => (
        <div className={`bg-white border border-[#dadce0] rounded-lg p-6 shadow-sm mb-4 ${className}`}>
            {children}
        </div>
    );

    const Label = ({ children, required }) => (
        <label className="block text-[16px] text-[#202124] mb-4">
            {children} {required && <span className="text-[#d93025]">*</span>}
        </label>
    );

    const Input = ({ ...props }) => (
        <input 
            {...props} 
            className="w-full md:w-1/2 border-b border-[#dadce0] bg-transparent focus:border-b-2 focus:border-[#fbbc04] focus:outline-none py-1 text-[#202124] transition-colors"
        />
    );

    return (
        <div className="min-h-screen bg-[#fae29c] py-8 px-4 font-sans text-[#202124]">
            <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit}>
                    
                    {/* Banner Image */}
                    {tournament.poster_url && (
                        <div className="mb-3 rounded-lg overflow-hidden h-40 md:h-56 w-full border border-[#dadce0] bg-white">
                            <img 
                                src={tournament.poster_url.startsWith('http') ? tournament.poster_url : tournament.poster_url.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:8000'}${tournament.poster_url}` : tournament.poster_url} 
                                alt="Tournament Banner" 
                                className="w-full h-full object-cover" 
                            />
                        </div>
                    )}

                    {/* Header Card */}
                    <Card className="border-t-8 border-t-[#fbbc04] pt-8">
                        <h1 className="text-[32px] text-[#202124] mb-2">{tournament.name}</h1>
                        <p className="text-[14px] text-[#202124] mb-4 whitespace-pre-wrap">{tournament.description || `${tournament.mode} Tournament Registration`}</p>
                        
                        <div className="border-t border-[#dadce0] my-4 pt-4">
                            <p className="text-[#d93025] text-[14px]">* Indicates required question</p>
                        </div>
                    </Card>

                    {error && (
                        <Card className="border-l-4 border-l-[#d93025]">
                            <p className="text-[#d93025]">{error}</p>
                        </Card>
                    )}

                    {/* Organizer Info */}
                    {tournament.organizer_name && (
                        <Card>
                            <h2 className="text-[22px] text-[#202124] mb-4">Organizer</h2>
                            <div className="space-y-3 text-[14px] text-[#202124]">
                                <p><strong className="font-medium text-gray-700">Name:</strong> {tournament.organizer_name}</p>
                                {tournament.organizer_contact && <p><strong className="font-medium text-gray-700">Contact:</strong> {tournament.organizer_contact}</p>}
                                {tournament.whatsapp && (
                                    <p className="pt-2">
                                        <a href={tournament.whatsapp} target="_blank" rel="noopener noreferrer" className="text-[#1a73e8] hover:underline font-medium">
                                            Join WhatsApp Group ↗
                                        </a>
                                    </p>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Payment Info */}
                    {tournament.entry_fee > 0 && (
                        <Card>
                            <h2 className="text-[22px] text-[#202124] mb-4">Payment Details</h2>
                            <p className="mb-4 text-[#202124] text-[16px]">Entry Fee: <strong className="text-[#1a73e8] text-[20px]">₹{tournament.entry_fee}</strong></p>
                            
                            <div className="bg-gray-50 border border-[#dadce0] p-6 rounded-lg text-[#202124]">
                                {tournament.payment_name && (
                                    <p className="mb-3 text-[15px]"><strong className="font-medium text-gray-700">Pay To:</strong> {tournament.payment_name}</p>
                                )}
                                {tournament.upi_id && (
                                    <p className="mb-4 text-[15px] flex items-center gap-2">
                                        <strong className="font-medium text-gray-700">UPI ID:</strong> 
                                        <span className="font-mono bg-white px-3 py-1.5 border border-[#dadce0] rounded text-[16px] tracking-wider">{tournament.upi_id}</span>
                                    </p>
                                )}
                                {tournament.payment_qr_url && (
                                    <div className="mt-6 border-t border-[#dadce0] pt-6">
                                        <p className="font-medium text-gray-700 mb-3 text-[15px]">Scan QR to Pay</p>
                                        <div className="bg-white p-3 inline-block rounded-xl border border-[#dadce0] shadow-sm">
                                            <img src={tournament.payment_qr_url.startsWith('http') ? tournament.payment_qr_url : tournament.payment_qr_url.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:8000'}${tournament.payment_qr_url}` : tournament.payment_qr_url} alt="Payment QR" className="max-w-[200px] h-auto rounded" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-[13px] text-yellow-800">
                                Please make the payment using the details above. You may be required to enter your Transaction ID or upload a screenshot in the form below.
                            </div>
                        </Card>
                    )}

                    {/* Team Details */}
                    {isDuoOrSquad && (
                        <Card>
                            <Label required>Team Name</Label>
                            <Input 
                                required 
                                type="text" 
                                value={teamName} 
                                onChange={(e) => setTeamName(e.target.value)} 
                                placeholder="Your answer"
                            />
                        </Card>
                    )}

                    {/* Player Details */}
                    {players.map((player, index) => {
                        const isCaptain = index === 0;
                        const roleTitle = tournament.mode === 'SOLO' ? 'Player Details' : (isCaptain ? 'Captain Details' : `Player ${index + 1} Details`);
                        
                        const showWhatsApp = tournament.mode === 'SOLO' || isCaptain;
                        const showEmail = tournament.mode === 'SOLO' || isCaptain;
                        const showAge = tournament.mode === 'SOLO';
                        const showCity = tournament.mode === 'SOLO';

                        return (
                            <div key={index}>
                                <div className="mt-6 mb-2 ml-2">
                                    <h2 className="text-[22px] text-[#202124]">{roleTitle}</h2>
                                </div>

                                <Card>
                                    <Label required>Full Name</Label>
                                    <Input required type="text" value={player.full_name} onChange={(e) => handlePlayerChange(index, 'full_name', e.target.value)} placeholder="Your answer" />
                                </Card>

                                <Card>
                                    <Label required>In-Game Name (IGN)</Label>
                                    <Input required type="text" value={player.ign} onChange={(e) => handlePlayerChange(index, 'ign', e.target.value)} placeholder="Your answer" />
                                </Card>

                                <Card>
                                    <Label required>Free Fire UID</Label>
                                    <Input required type="text" pattern="\d+" title="Must be a numeric UID" value={player.uid} onChange={(e) => handlePlayerChange(index, 'uid', e.target.value)} placeholder="Your answer" />
                                </Card>

                                {showWhatsApp && (
                                    <Card>
                                        <Label required>WhatsApp Number</Label>
                                        <Input required type="tel" value={player.whatsapp} onChange={(e) => handlePlayerChange(index, 'whatsapp', e.target.value)} placeholder="Your answer" />
                                    </Card>
                                )}

                                {showEmail && (
                                    <Card>
                                        <Label required>Email Address</Label>
                                        <Input required type="email" value={player.email} onChange={(e) => handlePlayerChange(index, 'email', e.target.value)} placeholder="Your answer" />
                                    </Card>
                                )}

                                {showAge && (
                                    <Card>
                                        <Label>Age</Label>
                                        <Input type="number" min="1" max="99" value={player.age} onChange={(e) => handlePlayerChange(index, 'age', e.target.value)} placeholder="Your answer" />
                                    </Card>
                                )}

                                {showCity && (
                                    <Card>
                                        <Label>City</Label>
                                        <Input type="text" value={player.city} onChange={(e) => handlePlayerChange(index, 'city', e.target.value)} placeholder="Your answer" />
                                    </Card>
                                )}
                            </div>
                        );
                    })}

                    {/* Custom Fields */}
                    {tournament?.custom_fields?.length > 0 && (
                        <>
                            <div className="mt-6 mb-2 ml-2">
                                <h2 className="text-[22px] text-[#202124]">Additional Information</h2>
                            </div>
                            
                            {tournament.custom_fields.map((field) => {
                                const value = customFieldsData[field.field_name] || '';
                                const handleChange = (e) => {
                                    let val = e.target.value;
                                    if (field.field_type === 'checkbox') {
                                        val = e.target.checked;
                                    }
                                    setCustomFieldsData({...customFieldsData, [field.field_name]: val});
                                };

                                return (
                                    <Card key={field._id}>
                                        <Label required={field.required}>{field.label}</Label>
                                        
                                        {field.description && field.field_type !== 'checkbox' && (
                                            <p className="text-[12px] text-gray-500 mb-4 -mt-3">{field.description}</p>
                                        )}
                                        
                                        {field.field_type === 'textarea' ? (
                                            <textarea 
                                                required={field.required} 
                                                placeholder="Your answer"
                                                value={value} 
                                                onChange={handleChange} 
                                                className="w-full border-b border-[#dadce0] bg-transparent focus:border-b-2 focus:border-[#fbbc04] focus:outline-none py-1 text-[#202124] transition-colors resize-y" 
                                                rows="3"
                                            ></textarea>
                                        ) : field.field_type === 'dropdown' ? (
                                            <div className="relative w-full md:w-1/2">
                                                <select 
                                                    required={field.required} 
                                                    value={value} 
                                                    onChange={handleChange} 
                                                    className="w-full border border-[#dadce0] rounded-md bg-transparent focus:border-2 focus:border-[#fbbc04] focus:outline-none py-3 px-3 text-[#202124] transition-colors appearance-none cursor-pointer"
                                                >
                                                    <option value="" disabled>Choose</option>
                                                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                                </div>
                                            </div>
                                        ) : field.field_type === 'radio' ? (
                                            <div className="flex flex-col gap-4 mt-2">
                                                {field.options?.map(opt => (
                                                    <label key={opt} className="flex items-center gap-3 text-[14px] cursor-pointer">
                                                        <input 
                                                            required={field.required && !value} 
                                                            type="radio" 
                                                            name={field.field_name} 
                                                            value={opt} 
                                                            checked={value === opt} 
                                                            onChange={handleChange} 
                                                            className="w-5 h-5 accent-[#fbbc04] cursor-pointer" 
                                                        />
                                                        {opt}
                                                    </label>
                                                ))}
                                            </div>
                                        ) : field.field_type === 'checkbox' ? (
                                            <div className="flex items-center gap-3 mt-2">
                                                <input 
                                                    required={field.required} 
                                                    type="checkbox" 
                                                    checked={!!value} 
                                                    onChange={handleChange} 
                                                    className="w-5 h-5 accent-[#fbbc04] cursor-pointer rounded-sm" 
                                                />
                                                <span className="text-[14px] cursor-pointer" onClick={() => {
                                                    setCustomFieldsData({...customFieldsData, [field.field_name]: !value});
                                                }}>
                                                    {field.description || field.placeholder || 'Check this box'}
                                                </span>
                                            </div>
                                        ) : (
                                            <Input
                                                required={field.required} 
                                                type={field.field_type === 'number' ? 'number' : field.field_type === 'email' ? 'email' : 'text'} 
                                                placeholder="Your answer"
                                                value={value} 
                                                onChange={handleChange} 
                                            />
                                        )}
                                    </Card>
                                );
                            })}
                        </>
                    )}

                    <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center gap-4">
                            <button 
                                type="submit" 
                                disabled={submitting}
                                className="bg-[#c55e1a] hover:bg-[#a64a13] text-white font-medium py-2 px-6 rounded-md text-[14px] transition-colors disabled:opacity-50 tracking-wide"
                            >
                                {submitting ? 'Submitting...' : 'Submit'}
                            </button>
                            <button type="reset" className="text-[#c55e1a] font-medium text-[14px] hover:bg-black/5 px-4 py-2 rounded-md transition">
                                Clear form
                            </button>
                        </div>
                        
                        <div className="text-[12px] text-gray-500">
                            <span className="font-medium text-gray-600">Free Fire Tournament Forms</span>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Registration;
