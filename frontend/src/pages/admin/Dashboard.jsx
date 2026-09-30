import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { 
    StatCard, ChartCard, DataTable, StatusBadge, 
    LoadingState, ErrorState 
} from '../../components/admin/DashboardWidgets';

const COLORS = ['#eab308', '#22c55e', '#ef4444', '#3b82f6', '#a855f7'];

const Dashboard = () => {
    const { api } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/admin/dashboard');
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} onRetry={fetchDashboardData} />;
    if (!data) return null;

    const { stats, charts, recent_registrations } = data;

    // Formatting for pie chart
    const pieData = charts.payment_status.map(item => ({
        name: item._id,
        value: item.count
    }));

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-6">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-wider">Dashboard</h2>
                    <p className="text-gray-400">Overview of your Free Fire tournaments and revenue.</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/admin/tournaments/create" className="bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold py-2 px-4 rounded shadow uppercase transition">
                        + New Tournament
                    </Link>
                    <Link to="/admin/payments" className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded shadow uppercase transition border border-gray-700">
                        Verify Payments
                    </Link>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={`₹${stats.total_revenue}`} colorClass="text-green-500" icon="💰" to="/admin/payments" />
                <StatCard title="Verified Registrations" value={stats.verified_registrations} colorClass="text-yellow-500" icon="✅" to="/admin/registrations" />
                <StatCard title="Pending Payments" value={stats.pending_payments} colorClass="text-orange-500" icon="⏳" to="/admin/payments" />
                <StatCard title="Available Slots" value={stats.available_slots} colorClass="text-blue-500" icon="🎮" to="/admin/tournaments" />
                
                <StatCard title="Total Tournaments" value={stats.total_tournaments} colorClass="text-gray-300" to="/admin/tournaments" />
                <StatCard title="Active Tournaments" value={stats.active_tournaments} colorClass="text-gray-300" to="/admin/tournaments" />
                <StatCard title="Total Registrations" value={stats.total_registrations} colorClass="text-gray-300" to="/admin/registrations" />
                <StatCard title="Rejected Payments" value={stats.rejected_payments} colorClass="text-red-500" to="/admin/payments" />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Registrations (Last 7 Days)">
                    {charts.registrations_over_time.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={charts.registrations_over_time}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="_id" stroke="#9ca3af" tick={{fill: '#9ca3af', fontSize: 12}} />
                                <YAxis stroke="#9ca3af" tick={{fill: '#9ca3af', fontSize: 12}} allowDecimals={false} />
                                <Tooltip contentStyle={{backgroundColor: '#111827', borderColor: '#374151', color: '#fff'}} />
                                <Line type="monotone" dataKey="count" name="Registrations" stroke="#eab308" strokeWidth={3} dot={{r: 4, fill: '#eab308'}} activeDot={{r: 6}} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-gray-500">No data for the last 7 days</div>
                    )}
                </ChartCard>

                <ChartCard title="Revenue Collection (Last 7 Days)">
                    {charts.payments_over_time.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.payments_over_time}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="_id" stroke="#9ca3af" tick={{fill: '#9ca3af', fontSize: 12}} />
                                <YAxis stroke="#9ca3af" tick={{fill: '#9ca3af', fontSize: 12}} />
                                <Tooltip contentStyle={{backgroundColor: '#111827', borderColor: '#374151', color: '#fff'}} cursor={{fill: '#1f2937'}} />
                                <Bar dataKey="amount" name="Revenue (₹)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-gray-500">No revenue data for the last 7 days</div>
                    )}
                </ChartCard>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <ChartCard title="Payment Status Distribution">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{backgroundColor: '#111827', borderColor: '#374151', color: '#fff'}} />
                                    <Legend wrapperStyle={{fontSize: '12px', color: '#9ca3af'}} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-gray-500">No payments recorded</div>
                        )}
                    </ChartCard>
                </div>
                
                <div className="lg:col-span-2">
                    <ChartCard title="Top Tournaments (Registrations)">
                        {charts.tournament_registrations.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.tournament_registrations} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                                    <XAxis type="number" stroke="#9ca3af" tick={{fill: '#9ca3af', fontSize: 12}} allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" stroke="#9ca3af" tick={{fill: '#9ca3af', fontSize: 10}} width={100} />
                                    <Tooltip contentStyle={{backgroundColor: '#111827', borderColor: '#374151', color: '#fff'}} cursor={{fill: '#1f2937'}} />
                                    <Legend wrapperStyle={{fontSize: '12px', color: '#9ca3af'}} />
                                    <Bar dataKey="registered_count" name="Registered" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="maximum_slots" name="Capacity" fill="#4b5563" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-gray-500">No tournaments available</div>
                        )}
                    </ChartCard>
                </div>
            </div>

            {/* Recent Registrations Table */}
            <div>
                <div className="flex justify-between items-end mb-4 border-b border-gray-800 pb-2">
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">Recent Registrations</h3>
                    <Link to="/admin/payments" className="text-yellow-500 hover:text-yellow-400 text-sm font-bold uppercase tracking-widest">View All →</Link>
                </div>
                
                <DataTable 
                    columns={["Reg ID", "Team / Captain", "Tournament", "Amount", "Payment", "Status", "Date"]}
                    data={recent_registrations}
                    keyExtractor={(item) => item._id}
                    emptyMessage="No registrations found."
                    renderRow={(r) => {
                        const captain = r.players && r.players.length > 0 ? r.players[0] : {};
                        const p = r.payment || {};
                        const t = r.tournament || {};
                        
                        return (
                            <>
                                <td className="px-6 py-4 font-black text-yellow-500">{r.registration_id}</td>
                                <td className="px-6 py-4">
                                    {r.team_name && <div className="font-bold text-white uppercase">{r.team_name}</div>}
                                    <div className="text-gray-300 font-medium">{captain.full_name}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-400 max-w-[150px] truncate" title={t.name}>{t.name || 'Unknown'}</td>
                                <td className="px-6 py-4 font-bold text-white">{p.amount_paid ? `₹${p.amount_paid}` : '-'}</td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={p.status || 'UNPAID'} />
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={r.status} />
                                </td>
                                <td className="px-6 py-4 text-gray-400 text-xs">
                                    {new Date(r.created_at).toLocaleDateString()}
                                </td>
                            </>
                        )
                    }}
                />
            </div>
        </div>
    );
};

export default Dashboard;
