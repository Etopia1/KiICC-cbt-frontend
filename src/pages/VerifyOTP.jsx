import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyOTP = () => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    
    // Extract Verification ID from query param
    const query = new URLSearchParams(location.search);
    const vid = query.get('vid');

    useEffect(() => {
        if (!vid) navigate('/forgot-password');
    }, [vid, navigate]);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('https://educbt-pro-backend.onrender.com/auth/verify-otp', { verificationId: vid, otp });
            toast.success('Node verified successfully');
            // Navigate with the new token to Reset Password page
            navigate(`/reset-password?token=${encodeURIComponent(res.data.token)}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid or expired OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        try {
            await axios.post('https://educbt-pro-backend.onrender.com/auth/send-otp', { verificationId: vid });
            toast.success('New OTP transmitted');
            setResendCooldown(60);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error resending OTP');
        }
    };

    return (
        <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center relative overflow-hidden px-4 font-outfit">
             <div className="absolute inset-0 pointer-events-none">
                <div 
                    className="absolute bottom-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full blur-[120px] opacity-[0.05]" 
                    style={{ background: 'radial-gradient(circle, #c5a059, transparent)' }}
                />
            </div>

            <div className="absolute top-0 left-0 right-0 p-8">
                <button
                    onClick={() => navigate('/forgot-password')}
                    className="flex items-center gap-3 text-slate-400 hover:text-[#c5a059] text-[10px] font-black uppercase tracking-[0.2em] transition-all group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Recovery
                </button>
            </div>

            <div className="relative z-10 w-full max-w-[440px] animate-fade-in-up">
                <div className="flex flex-col items-center mb-12">
                    <div className="w-16 h-16 rounded-3xl bg-[#1a120b] flex items-center justify-center shadow-2xl border border-[#c5a059]/10 mb-6 transition-transform hover:rotate-12 duration-500">
                        <KeyRound size={32} className="text-[#c5a059]" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-[#1a150e] font-black text-3xl tracking-tighter uppercase italic">
                            Verification <span className="gold-text-gradient">Protocol</span>
                        </h2>
                        <div className="flex items-center justify-center gap-2">
                             <ShieldCheck size={10} className="text-[#c5a059]" />
                             <span className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] font-medium">Authenticating Identity Layer</span>
                        </div>
                    </div>
                </div>

                <div className="premium-card p-10 sm:p-12 relative">
                    <div className="mb-10 text-center">
                        <h1 className="text-xl font-black text-[#1a150e] mb-2 uppercase italic tracking-tight">Enter Node-Key</h1>
                        <p className="text-slate-500 text-[13px] font-medium leading-relaxed italic">System waiting for cryptographic input sent to your institutional email.</p>
                        <p className="text-[#c5a059] text-[10px] font-black mt-2 italic uppercase tracking-widest bg-[#D4AF37]/5 px-3 py-1 rounded-lg border border-[#D4AF37]/10">Session Node: {vid?.slice(-12).toUpperCase()}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-3">
                            <label className="block text-[#1a150e]/40 text-[10px] font-black uppercase tracking-[0.2em] text-center mb-4 italic">6-Digit Hash Code</label>
                            <input
                                type="text"
                                maxLength="6"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                required
                                className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl h-20 text-center text-4xl font-black text-[#1a120b] tracking-[0.4em] focus:ring-4 focus:ring-[#c5a059]/10 focus:border-[#c5a059]/30 transition-all outline-none italic"
                                style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length < 6}
                            className="btn-primary w-full h-14"
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 border-2 border-[#c5a059]/20 border-t-[#c5a059] rounded-full animate-spin" />
                                    <span>Decrypting...</span>
                                </div>
                            ) : (
                                <>
                                    <ShieldCheck size={18} />
                                    Authorize Entry
                                </>
                            )}
                        </button>

                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resendCooldown > 0}
                                className={`flex items-center justify-center gap-2 mx-auto text-[10px] font-black uppercase tracking-widest transition-all ${resendCooldown > 0 ? 'text-slate-300' : 'text-[#c5a059] hover:text-[#8b6b23] hover:scale-105'}`}
                            >
                                <RefreshCw size={12} className={resendCooldown > 0 ? '' : 'animate-spin-slow'} />
                                {resendCooldown > 0 ? `Retransmission in ${resendCooldown}s` : 'Retransmit Protocol'}
                            </button>
                        </div>
                    </form>
                </div>

                <style>{`
                    .animate-spin-slow { animation: spin 4s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
            </div>
        </div>
    );
};

export default VerifyOTP;
