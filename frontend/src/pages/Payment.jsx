import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const Payment = () => {
    const { id } = useParams(); // registration_id
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Form fields
    const [paymentMethod, setPaymentMethod] = useState('Google Pay');
    const [payerName, setPayerName] = useState('');
    const [amountPaid, setAmountPaid] = useState('');
    const [utr, setUtr] = useState('');
    const [screenshot, setScreenshot] = useState(null);

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                const res = await axios.get(`${baseURL}/registrations/${id}/payment`);
                setInfo(res.data);
                if (res.data.entry_fee) {
                    setAmountPaid(res.data.entry_fee.toString());
                }
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to fetch payment information.');
            } finally {
                setLoading(false);
            }
        };
        fetchInfo();
    }, [id]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setScreenshot(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!screenshot) {
            setError('Please upload a payment screenshot.');
            return;
        }

        setSubmitting(true);
        setError('');

        const formData = new FormData();
        formData.append('registration_id', id);
        formData.append('payment_method', paymentMethod);
        formData.append('payer_name', payerName);
        formData.append('amount_paid', parseFloat(amountPaid));
        formData.append('utr', utr);
        formData.append('screenshot', screenshot);

        try {
            const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            await axios.post(`${baseURL}/payments`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to submit payment.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
            </div>
        );
    }

    if (error && !info) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-red-500 mb-2">ERROR</h2>
                    <p className="text-gray-400">{error}</p>
                    <Link to="/" className="mt-6 inline-block text-yellow-500 font-bold uppercase tracking-wider">← Back to Home</Link>
                </div>
            </div>
        );
    }

    if (success || (info && info.payment_submitted)) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
                    <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase mb-2">Payment Submitted Successfully</h2>
                    <p className="text-gray-400 mb-6">Your payment is pending admin verification. You will be notified once approved.</p>
                    
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 mb-6">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Registration ID</p>
                        <p className="text-xl font-black text-white">{info ? info.registration_id : id}</p>
                    </div>
                    
                    <Link to="/" className="block w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl uppercase tracking-widest transition">
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-2">
                        Complete Payment
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Registration ID: <span className="text-yellow-500 font-bold">{info.registration_id}</span>
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl mb-8 font-bold text-center">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Instructions & Details */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl">
                        <h3 className="text-xl font-black text-white uppercase border-b border-gray-800 pb-4 mb-6">Payment Instructions</h3>
                        
                        <div className="space-y-6">
                            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 text-center">
                                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Entry Fee</p>
                                <p className="text-4xl font-black text-yellow-500">₹{info.entry_fee}</p>
                            </div>

                            {info.payment_name && (
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Pay To</p>
                                    <p className="text-white font-bold text-lg">{info.payment_name}</p>
                                </div>
                            )}
                            
                            {info.upi_id && (
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">UPI ID</p>
                                    <p className="text-white font-mono bg-gray-950 p-3 rounded-lg border border-gray-800 text-lg font-bold select-all">{info.upi_id}</p>
                                </div>
                            )}

                            {info.payment_qr_url && (
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Or Scan QR Code</p>
                                    <img src={info.payment_qr_url.startsWith('http') ? info.payment_qr_url : info.payment_qr_url.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:8000'}${info.payment_qr_url}` : info.payment_qr_url} alt="Payment QR" className="w-full max-w-[250px] mx-auto rounded-xl border border-gray-800 shadow-lg" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submission Form */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl">
                        <h3 className="text-xl font-black text-white uppercase border-b border-gray-800 pb-4 mb-6">Submit Details</h3>
                        
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Method *</label>
                                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:border-yellow-500 outline-none">
                                    <option value="Google Pay">Google Pay</option>
                                    <option value="PhonePe">PhonePe</option>
                                    <option value="Paytm">Paytm</option>
                                    <option value="Other UPI">Other UPI</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Payer Name *</label>
                                <input required type="text" value={payerName} onChange={(e) => setPayerName(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:border-yellow-500 outline-none" placeholder="Name on the bank account" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Amount Paid (₹) *</label>
                                <input required type="number" min={info.entry_fee} step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:border-yellow-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">UTR / Transaction ID *</label>
                                <input required type="text" value={utr} onChange={(e) => setUtr(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:border-yellow-500 outline-none font-mono" placeholder="12-digit UPI Reference No." />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Screenshot *</label>
                                <input required type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleFileChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-gray-800 file:text-white hover:file:bg-gray-700 outline-none" />
                                <p className="text-xs text-gray-500 mt-2">Allowed: JPG, PNG, WEBP (Max: 5MB)</p>
                            </div>

                            <button 
                                type="submit" 
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-950 font-black py-4 rounded-xl text-lg uppercase tracking-widest transition duration-300 disabled:opacity-50 mt-4 shadow-lg shadow-yellow-500/20"
                            >
                                {submitting ? 'Submitting...' : 'Submit Payment'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
