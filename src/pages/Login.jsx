import { useState } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../redux/authSlice';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, LogIn, ArrowLeft, Shield } from 'lucide-react';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(loginStart());
        try {
            const res = await axios.post('https://educbt-pro-backend.onrender.com/auth/login', credentials);
            dispatch(loginSuccess(res.data));
            const user = res.data.user;
            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'school_admin') navigate('/school/dashboard');
            else if (user.role === 'teacher') navigate('/teacher/dashboard');
            else if (user.role === 'student') navigate('/student/dashboard');
            else navigate('/login');
        } catch (err) {
            dispatch(loginFailure(err.response?.data?.message || 'Authentication failed. Please check your credentials.'));
        }
    };

    return (
        <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center relative overflow-hidden px-4 font-outfit">
            {/* Soft Background Accents */}
            <div className="absolute inset-0 pointer-events-none">
                <div 
                    className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full blur-[120px] opacity-[0.05]" 
                    style={{ background: 'radial-gradient(circle, #c5a059, transparent)' }}
                />
                <div 
                    className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] rounded-full blur-[100px] opacity-[0.03]" 
                    style={{ background: 'radial-gradient(circle, #8b6b23, transparent)' }}
                />
            </div>

            {/* Navigation Header */}
            <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-20">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-3 text-slate-400 hover:text-[#c5a059] text-[10px] font-black uppercase tracking-[0.2em] transition-all group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Registry
                </button>
            </div>

            {/* Login Container */}
            <div className="relative z-10 w-full max-w-[440px] animate-fade-in-up">
                {/* Brand Header */}
                <div className="flex flex-col items-center mb-12">
                    <div className="w-16 h-16 rounded-3xl bg-[#1a120b] flex items-center justify-center shadow-2xl border border-[#c5a059]/10 mb-6 transition-transform hover:rotate-12 duration-500">
                        <GraduationCap size={32} className="text-[#c5a059]" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-[#1a150e] font-black text-3xl tracking-tighter leading-none mb-2 uppercase italic">
                            KICC <span className="gold-text-gradient">CBT</span>
                        </h2>
                        <div className="flex items-center justify-center gap-2">
                             <Shield size={10} className="text-[#c5a059]" />
                             <span className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em]">Kids Can Code Authority</span>
                        </div>
                    </div>
                </div>

                {/* Authentication Card */}
                <div className="premium-card p-10 sm:p-12 relative">
                    <div className="mb-10 text-center sm:text-left">
                        <h1 className="text-2xl font-black text-[#1a150e] mb-2 uppercase italic tracking-tight">Identity Access</h1>
                        <p className="text-slate-500 text-[13px] font-medium leading-relaxed italic">Enter your institutional credentials to bypass the security layer.</p>
                    </div>

                    {error && (
                        <div className="mb-8 flex items-start gap-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl px-5 py-4 text-[12px] font-bold animate-pulse">
                            <span className="shrink-0 mt-0.5">⚠️</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Username/ID */}
                        <div className="space-y-3">
                            <label className="block text-[#1a150e]/40 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Registry ID / Username</label>
                            <input
                                name="username"
                                value={credentials.username}
                                onChange={handleChange}
                                placeholder="e.g. SCH-10492"
                                required
                                autoComplete="username"
                                className="input-field"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between ml-1">
                                <label className="block text-[#1a150e]/40 text-[10px] font-black uppercase tracking-[0.2em]">Secure Pass-Key</label>
                                <button 
                                    type="button" 
                                    onClick={() => navigate('/forgot-password')} 
                                    className="text-[#c5a059] text-[9px] font-black uppercase tracking-widest hover:underline"
                                >
                                    Forgot Key?
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={credentials.password}
                                    onChange={handleChange}
                                    placeholder="••••••••••••"
                                    required
                                    autoComplete="current-password"
                                    className="input-field pr-14"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#c5a059] transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Primary Action */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full mt-4 h-14"
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 border-2 border-[#c5a059]/20 border-t-[#c5a059] rounded-full animate-spin" />
                                    <span>Verifying...</span>
                                </div>
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    Initialize Session
                                </>
                            )}
                        </button>
                    </form>

                    {/* Registration Redirect */}
                    <div className="mt-12 pt-8 border-t border-slate-50 text-center">
                        <p className="text-slate-400 text-xs font-semibold">
                            Institutional registry pending?{' '}
                            <button
                                onClick={() => navigate('/register-school')}
                                className="text-[#c5a059] hover:text-[#8b6b23] font-black transition-all underline decoration-[#c5a059]/30 underline-offset-4 ml-1"
                            >
                                Register Identity
                            </button>
                        </p>
                    </div>
                </div>

                {/* Bottom Legal/Footer */}
                <div className="mt-10 flex flex-col items-center gap-2">
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] text-center">
                        © {new Date().getFullYear()} KICC CBT Authority Hub
                    </p>
                    <div className="w-12 h-[1px] bg-slate-100" />
                </div>
            </div>
        </div>
    );
};

export default Login;
