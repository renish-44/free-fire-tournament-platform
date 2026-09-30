import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// Helper to get a date string in YYYY-MM-DDTHH:MM format for datetime-local inputs
const getDefaultDate = (daysFromNow = 0, hours = 0, minutes = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString().slice(0, 16);
};

const INITIAL_STATE = {
    name: '',
    description: '',
    game_name: 'Free Fire',
    mode: 'SQUAD',
    tournament_date: getDefaultDate(7, 20, 0),       // 1 week from now, 8 PM
    start_time: '8:00 PM',
    registration_start: getDefaultDate(0, 0, 0),      // Today
    registration_deadline: getDefaultDate(6, 23, 59),  // 6 days from now, 11:59 PM
    maximum_slots: 48,
    entry_fee: 0,
    prize_pool: 0,
    first_prize: 0,
    second_prize: 0,
    third_prize: 0,
    organizer_name: '',
    organizer_contact: '',
    whatsapp: '',
    upi_id: '',
    payment_name: '',
    payment_qr_url: '/paymentQR.jpeg',
    rules: '',
    instructions: '',
    poster_url: ''
};

const formatDateForInput = (isoString) => {
    if (!isoString) return '';
    // Convert to YYYY-MM-DDTHH:MM for datetime-local input
    return new Date(isoString).toISOString().slice(0, 16);
};

const TournamentForm = () => {
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { id } = useParams();
    const navigate = useNavigate();
    const { api } = useAuth();
    
    const isEdit = Boolean(id);

    useEffect(() => {
        if (isEdit) {
            const fetchTournament = async () => {
                try {
                    const res = await api.get(`/tournaments/${id}`);
                    const data = res.data;
                    setFormData({
                        ...data,
                        tournament_date: formatDateForInput(data.tournament_date),
                        registration_start: formatDateForInput(data.registration_start),
                        registration_deadline: formatDateForInput(data.registration_deadline),
                    });
                } catch (err) {
                    setError('Failed to load tournament');
                }
            };
            fetchTournament();
        }
    }, [id, api, isEdit]);

    const [uploadingPoster, setUploadingPoster] = useState(false);
    const [uploadingQR, setUploadingQR] = useState(false);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        if (type === 'number') {
            // Parse to number to remove leading zeros, default to 0 if empty
            const num = value === '' ? '' : Number(value);
            setFormData(prev => ({ ...prev, [name]: num }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileUpload = async (e, endpoint, setter) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            alert('File too large. Maximum size is 5MB.');
            return;
        }

        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.type)) {
            alert('Invalid file format. Use JPG, PNG, or WEBP.');
            return;
        }

        const uploadData = new FormData();
        uploadData.append('file', file);
        
        setter(true);
        try {
            const res = await api.post(`/admin/tournaments/${id}/${endpoint}`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Update form data state so it visually refreshes
            if (endpoint === 'upload-poster') {
                setFormData(prev => ({ ...prev, poster_url: res.data.url }));
            } else {
                setFormData(prev => ({ ...prev, payment_qr_url: res.data.url }));
            }
            alert('Upload successful!');
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to upload file');
        } finally {
            setter(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Ensure dates are valid ISO strings
            const payload = {
                ...formData,
                tournament_date: new Date(formData.tournament_date).toISOString(),
                registration_start: new Date(formData.registration_start).toISOString(),
                registration_deadline: new Date(formData.registration_deadline).toISOString(),
            };

            if (isEdit) {
                await api.put(`/tournaments/${id}`, payload);
            } else {
                await api.post('/tournaments', payload);
            }
            navigate('/admin/tournaments');
        } catch (err) {
            setError(err.response?.data?.detail || 'An error occurred while saving.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto page-enter">
            <h2 className="text-2xl font-extrabold text-white mb-6 tracking-tight">
                {isEdit ? 'Edit Tournament' : 'Create Tournament'}
            </h2>
            
            {error && (
                <div className="bg-red-500/8 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 glass-card p-6 md:p-8">
                
                {/* Basic Info */}
                <div>
                    <h3 className="text-base font-bold text-yellow-500 mb-4 border-b border-white/5 pb-2">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5 tracking-wide">Tournament Name *</label>
                            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Game Name</label>
                            <input type="text" name="game_name" value={formData.game_name} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Mode *</label>
                            <select required name="mode" value={formData.mode} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white">
                                <option value="SOLO">SOLO</option>
                                <option value="DUO">DUO</option>
                                <option value="SQUAD">SQUAD</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Maximum Slots *</label>
                            <input required type="number" min="1" name="maximum_slots" value={formData.maximum_slots} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Description</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white h-24"></textarea>
                        </div>
                    </div>
                </div>

                {/* Schedule */}
                <div>
                    <h3 className="text-xl font-bold text-yellow-500 mb-4 border-b border-gray-800 pb-2">Schedule</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Tournament Date & Time *</label>
                            <input required type="datetime-local" name="tournament_date" value={formData.tournament_date} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Start Time (Display String) *</label>
                            <input required type="text" name="start_time" value={formData.start_time} onChange={handleChange} placeholder="e.g., 08:00 PM IST" className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Registration Starts *</label>
                            <input required type="datetime-local" name="registration_start" value={formData.registration_start} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Registration Ends *</label>
                            <input required type="datetime-local" name="registration_deadline" value={formData.registration_deadline} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                        </div>
                    </div>
                </div>

                {/* Prize & Fees */}
                <div>
                    <h3 className="text-xl font-bold text-yellow-500 mb-4 border-b border-gray-800 pb-2">Prize & Fees</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Entry Fee (₹)</label>
                            <input type="number" min="0" name="entry_fee" value={formData.entry_fee} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Total Prize Pool (₹)</label>
                            <input type="number" min="0" name="prize_pool" value={formData.prize_pool} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">1st Prize (₹)</label>
                            <input type="number" min="0" name="first_prize" value={formData.first_prize} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">2nd Prize (₹)</label>
                            <input type="number" min="0" name="second_prize" value={formData.second_prize} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">3rd Prize (₹)</label>
                            <input type="number" min="0" name="third_prize" value={formData.third_prize} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                        </div>
                    </div>
                </div>

                {/* Organizer & Payment */}
                <div>
                    <h3 className="text-xl font-bold text-yellow-500 mb-4 border-b border-gray-800 pb-2">Organizer & Payment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Organizer Name *</label>
                            <input required type="text" name="organizer_name" value={formData.organizer_name} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Organizer Contact (Phone) *</label>
                            <input required type="text" name="organizer_contact" value={formData.organizer_contact} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">WhatsApp Group/Contact Link</label>
                            <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">UPI ID (If paid)</label>
                            <input type="text" name="upi_id" value={formData.upi_id} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Payment Receiver Name</label>
                            <input type="text" name="payment_name" value={formData.payment_name} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Payment QR Image URL</label>
                            <input type="text" name="payment_qr_url" value={formData.payment_qr_url} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Poster Image URL</label>
                            <input type="text" name="poster_url" value={formData.poster_url} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                        </div>
                    </div>
                </div>

                {/* Additional Details */}
                <div>
                    <h3 className="text-xl font-bold text-yellow-500 mb-4 border-b border-gray-800 pb-2">Rules & Instructions</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Tournament Rules</label>
                            <textarea name="rules" value={formData.rules} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white h-32"></textarea>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Instructions for Players</label>
                            <textarea name="instructions" value={formData.instructions} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white h-24"></textarea>
                        </div>
                    </div>
                </div>

                {isEdit && (
                    <div className="mt-8 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
                        <h3 className="text-xl font-bold text-yellow-500 mb-4 border-b border-gray-800 pb-2">Media Uploads</h3>
                        <p className="text-sm text-gray-400 mb-4">You can directly upload a poster or payment QR code here. Allowed formats: JPG, PNG, WEBP (Max 5MB).</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                                <label className="block text-sm text-gray-400 mb-2 font-bold uppercase">Upload Poster</label>
                                <input 
                                    type="file" 
                                    accept=".jpg,.jpeg,.png,.webp"
                                    onChange={(e) => handleFileUpload(e, 'upload-poster', setUploadingPoster)}
                                    disabled={uploadingPoster}
                                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-yellow-500/10 file:text-yellow-500 hover:file:bg-yellow-500/20 transition cursor-pointer"
                                />
                                {uploadingPoster && <p className="text-xs text-yellow-500 mt-2">Uploading...</p>}
                            </div>

                            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                                <label className="block text-sm text-gray-400 mb-2 font-bold uppercase">Upload Payment QR</label>
                                <input 
                                    type="file" 
                                    accept=".jpg,.jpeg,.png,.webp"
                                    onChange={(e) => handleFileUpload(e, 'upload-qr', setUploadingQR)}
                                    disabled={uploadingQR}
                                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-yellow-500/10 file:text-yellow-500 hover:file:bg-yellow-500/20 transition cursor-pointer"
                                />
                                {uploadingQR && <p className="text-xs text-yellow-500 mt-2">Uploading...</p>}
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                    <button type="button" onClick={() => navigate('/admin/tournaments')} className="glass-btn text-sm">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary text-sm disabled:opacity-50">
                        {loading ? 'Saving...' : 'Save Tournament'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TournamentForm;
