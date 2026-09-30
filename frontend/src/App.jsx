import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Login from './pages/admin/Login';
import AdminLayout from './layouts/AdminLayout';
import TournamentsList from './pages/admin/TournamentsList';
import TournamentForm from './pages/admin/TournamentForm';
import TournamentDetails from './pages/TournamentDetails';
import Registration from './pages/Registration';
import Payment from './pages/Payment';
import PaymentsList from './pages/admin/PaymentsList';
import FormBuilder from './pages/admin/FormBuilder';
import Dashboard from './pages/admin/Dashboard';
import RegistrationsList from './pages/admin/RegistrationsList';
import RegistrationDetails from './pages/admin/RegistrationDetails';
import TeamsList from './pages/admin/TeamsList';
import PlayersList from './pages/admin/PlayersList';
import Reports from './pages/admin/Reports';
import RegistrationStatus from './pages/RegistrationStatus';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            <div className="min-h-screen bg-gray-950 relative overflow-hidden">
              {/* Animated background effects */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-yellow-500/8 rounded-full blur-[150px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-orange-600/8 rounded-full blur-[150px] animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-red-600/5 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
              </div>

              {/* Navigation */}
              <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center font-black text-gray-900 text-lg shadow-lg shadow-yellow-500/20">
                    FF
                  </div>
                  <span className="text-white font-black text-xl tracking-tight hidden sm:block">FREE FIRE <span className="text-yellow-500">TOURNAMENTS</span></span>
                </div>
                <Link to="/admin/login" className="px-5 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 text-gray-300 hover:text-white hover:border-yellow-500/50 hover:bg-yellow-500/10 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300">
                  Admin Portal
                </Link>
              </nav>

              {/* Hero Section */}
              <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-24 md:pt-24 md:pb-32">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-8">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                  <span className="text-yellow-500 text-xs font-bold uppercase tracking-widest">Live Tournament Platform</span>
                </div>

                <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-6">
                  <span className="block">Compete.</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">Dominate.</span>
                  <span className="block">Win.</span>
                </h1>

                <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
                  The ultimate Free Fire competitive platform. Join tournaments, battle your way to the top, and claim massive prize pools.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/admin/login" className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-950 font-black text-lg uppercase tracking-wider rounded-2xl shadow-xl shadow-yellow-500/25 hover:shadow-yellow-500/40 transition-all duration-300 transform hover:-translate-y-1">
                    Get Started
                  </Link>
                </div>
              </div>

              {/* Stats Section */}
              <div className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Tournaments', value: '∞', icon: '🏆' },
                    { label: 'Prize Pools', value: '₹₹₹', icon: '💰' },
                    { label: 'Modes', value: 'All', icon: '🎮' },
                    { label: 'Support', value: '24/7', icon: '⚡' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:border-yellow-500/30 hover:bg-yellow-500/5 transition-all duration-300 group">
                      <div className="text-2xl mb-2">{stat.icon}</div>
                      <div className="text-2xl md:text-3xl font-black text-white group-hover:text-yellow-500 transition-colors">{stat.value}</div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
                <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-12 uppercase tracking-tight">How It <span className="text-yellow-500">Works</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { step: '01', title: 'Find Tournament', desc: 'Browse open tournaments. View prizes, rules, and schedules.' },
                    { step: '02', title: 'Register & Pay', desc: 'Fill your team details, pay via UPI, and submit your screenshot.' },
                    { step: '03', title: 'Battle & Win', desc: 'Get verified, join the match, and compete for the prize pool.' },
                  ].map((item, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-yellow-500/30 transition-all duration-300 group relative overflow-hidden">
                      <div className="absolute top-4 right-4 text-5xl font-black text-white/5 group-hover:text-yellow-500/10 transition-colors">{item.step}</div>
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-gray-950 font-black text-sm mb-5 shadow-lg shadow-yellow-500/20">{item.step}</div>
                      <h3 className="text-xl font-black text-white uppercase tracking-wide mb-3">{item.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <footer className="relative z-10 border-t border-white/5 py-8 text-center">
                <p className="text-gray-600 text-sm font-medium">© {new Date().getFullYear()} Free Fire Tournaments. Built for competitive gamers.</p>
              </footer>
            </div>
          } />
          
          <Route path="/tournament/:slug" element={<TournamentDetails />} />
          <Route path="/tournament/:slug/register" element={<Registration />} />
          <Route path="/payment/:id" element={<Payment />} />
          <Route path="/registration/:registrationId" element={<RegistrationStatus />} />
          
          {/* Admin Authentication */}
          <Route path="/admin/login" element={<Login />} />
          
          {/* Protected Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tournaments" element={<TournamentsList />} />
            <Route path="tournaments/create" element={<TournamentForm />} />
            <Route path="tournaments/:id/edit" element={<TournamentForm />} />
            <Route path="tournaments/:id/form-builder" element={<FormBuilder />} />
            <Route path="registrations" element={<RegistrationsList />} />
            <Route path="registrations/:id" element={<RegistrationDetails />} />
            <Route path="teams" element={<TeamsList />} />
            <Route path="players" element={<PlayersList />} />
            <Route path="payments" element={<PaymentsList />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
