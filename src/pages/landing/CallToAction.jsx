import { useNavigate } from 'react-router-dom';
import { ArrowRight, PhoneCall, Zap, ShieldCheck } from 'lucide-react';

export default function CallToAction() {
    const navigate = useNavigate();
    return (
        <section className="py-32 bg-[#fcfbf9] relative overflow-hidden font-outfit">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                style={{ 
                    backgroundImage: 'radial-gradient(#1a120b 1px, transparent 1px)', 
                    backgroundSize: '40px 40px' 
                }} 
            />
            
            <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
                <div className="inline-flex items-center gap-3 bg-white border border-slate-100 rounded-full px-5 py-2.5 mb-10 shadow-sm animate-fade-in-up">
                    <ShieldCheck size={16} className="text-[#c5a059]" />
                    <span className="text-[#1a120b] text-[10px] font-black uppercase tracking-[0.25em]">Institutional Integrity Protocol</span>
                </div>

                <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-[#1a150e] mb-10 leading-[0.9] italic uppercase tracking-tighter animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    Elevate Your <br />
                    <span className="gold-text-gradient">
                        Academic Standard
                    </span>
                </h2>

                <p className="text-slate-500 text-lg md:text-xl mb-16 max-w-2xl mx-auto font-medium leading-relaxed italic animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    Join elite secondary schools leveraging high-fidelity assessment architecture. Initialize your institutional registry node in 120 seconds.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <button
                        onClick={() => navigate('/register-school')}
                        className="btn-gold group min-w-[280px] h-16 rounded-2xl flex items-center justify-center gap-4 text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-[#c5a059]/30"
                    >
                        Initialize Identity
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="min-w-[280px] h-16 rounded-2xl border border-slate-200 bg-white text-slate-500 font-black text-[10px] uppercase tracking-[0.25em] hover:bg-[#1a120b] hover:text-[#c5a059] hover:border-[#1a120b] transition-all duration-500"
                    >
                        Access Command Hub
                    </button>
                </div>

                <div className="mt-16 pt-10 border-t border-slate-100 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] italic mb-4">
                        Powered by KICC CBT Excellence
                    </p>
                    <div className="flex gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c5a059]/40" />
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c5a059]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c5a059]/40" />
                    </div>
                </div>
            </div>
        </section>
    );
}
