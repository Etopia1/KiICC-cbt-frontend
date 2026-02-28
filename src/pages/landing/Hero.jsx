import { ArrowRight, ShieldCheck, Activity, Users, Star, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Hero() {
    const navigate = useNavigate();

    return (
        <section
            id="hero"
            className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#fcfbf9] pt-28 pb-20 font-outfit"
        >
            {/* Soft Ambient Background Elements */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div 
                    className="absolute top-[5%] left-[5%] w-160 h-160 rounded-full blur-[120px] opacity-[0.08]" 
                    style={{ background: 'radial-gradient(circle, #c5a059, transparent)' }}
                />
                <div 
                    className="absolute bottom-[5%] right-[5%] w-140 h-140 rounded-full blur-[100px] opacity-[0.05]" 
                    style={{ background: 'radial-gradient(circle, #e2c08d, transparent)' }}
                />
                
                <div 
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `radial-gradient(#c5a059 1.5px, transparent 1.5px)`,
                        backgroundSize: '64px 64px'
                    }}
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-20">
                {/* Left Content */}
                <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-3 bg-white border border-slate-100 rounded-full px-5 py-2.5 mb-10 shadow-sm animate-fade-in-up">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#c5a059] animate-pulse" />
                        <span className="text-[#a18146] text-[10px] font-black uppercase tracking-[0.3em]">Institutional Node: System Online</span>
                    </div>

                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-[#1a150e] leading-[0.9] mb-10 tracking-[-0.05em] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        THE STANDARD OF <br />
                        <span className="gold-text-gradient italic">ACADEMIC INTEGRITY</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-500 mb-12 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed italic animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Empowering KICC <span className="text-[#c5a059] font-black underline decoration-[#c5a059]/30 underline-offset-4">Kids Can Code</span> institutions with high-fidelity examination security. The future of Nigerian secondary school assessments.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 mb-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <button
                            onClick={() => navigate('/register-school')}
                            className="btn-gold group min-w-[280px] h-16 rounded-2xl flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-[#c5a059]/20"
                        >
                            Initialize Identity
                            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="min-w-[280px] h-16 rounded-2xl border border-slate-200 bg-white text-slate-500 font-black text-[11px] uppercase tracking-[0.25em] hover:bg-[#1a120b] hover:text-[#c5a059] hover:border-[#1a120b] transition-all duration-500"
                        >
                            Command Hub Access
                        </button>
                    </div>

                    <div className="flex flex-wrap justify-center lg:justify-start gap-8 border-t border-slate-100 pt-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center text-[#c5a059]">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Secure Layer</p>
                                <p className="text-sm font-black text-[#1a150e]">AI-Guard Active</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-[#c5a059]">
                                <Activity size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Throughput</p>
                                <p className="text-sm font-black text-[#1a150e]">1.2M+ Scripts</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Visual - Dashboard Mockup */}
                <div className="flex-1 relative animate-fade-in-up w-full lg:w-auto" style={{ animationDelay: '0.5s' }}>
                    <div className="relative z-10 rounded-[3rem] overflow-hidden border-[12px] border-[#1a120b] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] bg-white group">
                        <img 
                            src="/cbt_dashboard_mockup.png" 
                            alt="CBT Dashboard Mockup" 
                            className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                        />
                        
                        {/* Floating elements */}
                        <div className="absolute top-10 -left-10 bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl animate-float lg:block hidden">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
                                    <Activity size={16} />
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Node Monitoring</span>
                            </div>
                            <div className="flex -space-x-3 mb-4">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-[#c5a059]">S</div>
                                ))}
                            </div>
                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[78%] animate-pulse" />
                            </div>
                        </div>

                        <div className="absolute -bottom-8 -right-8 bg-[#1a120b] border border-[#c5a059]/20 rounded-3xl p-8 shadow-2xl lg:block hidden">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-[#c5a059]">
                                    <Lock size={20} />
                                </div>
                                <div>
                                    <p className="text-white text-xs font-black uppercase tracking-widest mb-1">Encrypted Data</p>
                                    <p className="text-slate-500 text-[10px] font-bold">256-bit institutional vault</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Decorative base */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-20 bg-[#c5a059]/20 blur-[60px] rounded-full -z-1" />
                </div>
            </div>

            {/* Visual weight at the bottom */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[1px] bg-linear-to-r from-transparent via-slate-100 to-transparent" />
        </section>
    );
}
