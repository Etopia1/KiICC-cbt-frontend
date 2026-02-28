import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Shield, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('https://educbt-pro-backend.onrender.com/auth/send-otp', { email });
            toast.success('Verification code sent to your email');
            navigate(`/verify-otp?vid=${res.data.verificationId}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error sending verification code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center relative overflow-hidden px-4 font-outfit">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div 
                    className="absolute top-[-15%] right-[-10%] w-[45rem] h-[45rem] rounded-full blur-[130px] opacity-[0.06]" 
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
                    <div className="w-16 h-16 rounded-3xl bg-[#1a120b] flex items-center justify-center shadow-2xl border border-[#c5a059]/10 mb-6 group hover:rotate-12 transition-transform duration-500">
                        <Mail size={32} className="text-[#c5a059]" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-[#1a150e] font-black text-3xl tracking-tighter uppercase italic">
                            Forgot <span className="gold-text-gradient">Access Key</span>
                        </h2>
                        <div className="flex items-center justify-center gap-2">
                             <Shield size={10} className="text-[#c5a059]" />
                             <span className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em]">Identity Recovery Protocol</span>
                        </div>
                    </div>
                </div>

                <div className="premium-card p-10 sm:p-12">
                    <div className="mb-10">
                        <h1 className="text-xl font-black text-[#1a150e] mb-2 uppercase italic tracking-tight">Recover Secure Node</h1>
                        <p className="text-slate-500 text-[13px] font-medium leading-relaxed italic">System will transmit a 6-digit cryptographic OTP to your registered institutional email.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-3">
                            <label className="block text-[#1a150e]/40 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Institutional Email</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your-node@institution.edu"
                                    required
                                    className="input-field pl-14"
                                />
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#c5a059]/40 border-r border-slate-100 pr-4">
                                    <Mail size={18} />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full h-14"
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 border-2 border-[#c5a059]/20 border-t-[#c5a059] rounded-full animate-spin" />
                                    <span>Transmitting...</span>
                                </div>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Transmit OTP Node
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-10 text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] text-center italic">
                    Secured by KICC Auth Layer v4.0.1
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
