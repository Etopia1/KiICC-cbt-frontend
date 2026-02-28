import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Loader2, Save, Eye, EyeOff, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Extract token from URL (the "URL Header" as requested)
    const query = new URLSearchParams(location.search);
    const token = query.get('token');

    useEffect(() => {
        if (!token) navigate('/forgot-password');
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) return toast.error('Passwords do not match');
        if (password.length < 6) return toast.error('Password must be at least 6 characters');

        setLoading(true);
        try {
            // Using the token from URL in the Authorization header to bypass normal auth 
            // since the token was specifically for this flow.
            await axios.post('https://educbt-pro-backend.onrender.com/auth/reset-password', 
                { password },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Identity reset successful. Please log in.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error resetting password. Session may have expired.');
            navigate('/forgot-password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center relative overflow-hidden px-4 font-outfit">
             <div className="absolute inset-0 pointer-events-none">
                <div 
                    className="absolute top-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-full blur-[120px] opacity-[0.05]" 
                    style={{ background: 'radial-gradient(circle, #c5a059, transparent)' }}
                />
            </div>

            <div className="absolute top-0 left-0 right-0 p-8">
                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-3 text-slate-400 hover:text-[#c5a059] text-[10px] font-black uppercase tracking-[0.2em] transition-all group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Command Hub
                </button>
            </div>

            <div className="relative z-10 w-full max-w-[440px] animate-fade-in-up">
                <div className="flex flex-col items-center mb-12">
                    <div className="w-16 h-16 rounded-3xl bg-[#1a120b] flex items-center justify-center shadow-2xl border border-[#c5a059]/10 mb-6 transition-transform hover:rotate-12 duration-500">
                        <Lock size={32} className="text-[#c5a059]" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-[#1a150e] font-black text-3xl tracking-tighter uppercase italic">
                            Identity <span className="gold-text-gradient">Override</span>
                        </h2>
                        <div className="flex items-center justify-center gap-2">
                             <ShieldAlert size={10} className="text-rose-500" />
                             <span className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] font-medium">Re-initializing Security Keys</span>
                        </div>
                    </div>
                </div>

                <div className="premium-card p-10 sm:p-12 relative">
                    <div className="mb-10 sm:text-left text-center">
                        <h1 className="text-xl font-black text-[#1a150e] mb-2 uppercase italic tracking-tight">Create New Key</h1>
                        <p className="text-slate-500 text-[13px] font-medium leading-relaxed italic">System requiring new cryptographic pass-key for Node {token?.slice(-8).toUpperCase()}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-3">
                            <label className="block text-[#1a150e]/40 text-[10px] font-black uppercase tracking-[0.2em] ml-1">New Secure Pass-Key</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    required
                                    className="input-field pr-14"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#c5a059] transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-[#1a150e]/40 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Confirm Identity Key</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••••••"
                                required
                                className="input-field"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full h-14"
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Syncing Keys...</span>
                                </div>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Write New Identity Key
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-10 text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] text-center italic">
                    Encrypted Node Reset Layer
                </p>
            </div>
        </div>
    );
};

export default ResetPassword;
