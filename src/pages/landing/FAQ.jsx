import { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle, ArrowRight } from 'lucide-react';

const faqs = [
    {
        q: 'Is KICC CBT aligned with WAEC/NECO standards?',
        a: "Absolutely. Our platform is architected around the Nigerian secondary school curriculum, supporting specialized question formats like Theory, Objectives, and Math notations required for National Exams.",
    },
    {
        q: 'How does the Surveillance AI function?',
        a: "The Surveillance Hub utilizes high-fidelity face tracking and environmental monitoring. It detects tab switching, multiple persons, and audio patterns that deviate from standard exam room noise.",
    },
    {
        q: 'Is there a hardware installation requirement?',
        a: "None. KICC CBT is a zero-footprint web application. It runs natively on any modern browser across Windows, Android, and iOS devices with full performance optimization.",
    },
    {
        q: 'How secure is the data lifecycle?',
        a: "Every session is encrypted with institutional-grade 256-bit protocols. Results are vaulted in secure nodes and can only be accessed by verified institutional authorities.",
    },
    {
        q: 'Can we generate AI assessments in bulk?',
        a: "Yes. Our Intelligence Engine can generate hundreds of high-quality, curriculumn-accurate questions in seconds based on specific subjects and topics.",
    },
    {
        q: 'What happens during a network outage?',
        a: "The system features 'Persistent Session Recovery'. If a student loses connection, their current progress is cached locally and synced automatically once the node regains connectivity.",
    }
];

export default function FAQ() {
    const [open, setOpen] = useState(0);

    return (
        <section id="faq" className="py-32 bg-[#FCFBFA] relative overflow-hidden font-outfit">
            <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-[#c5a059]/5 blur-[120px] rounded-full" />
            
            <div className="max-w-5xl mx-auto px-6 relative z-10">
                <div className="flex flex-col lg:flex-row gap-20 items-start">
                    {/* Left side: Heading */}
                    <div className="lg:w-1/3">
                        <div className="inline-flex items-center gap-3 bg-white border border-slate-100 rounded-full px-5 py-2 mb-8 shadow-sm">
                            <HelpCircle size={14} className="text-[#c5a059]" />
                            <span className="text-[#a18146] text-[10px] font-black uppercase tracking-[0.2em]">Institutional Support</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-[#1a150e] leading-[1.1] italic uppercase tracking-tighter mb-8">
                            Knowledge <span className="gold-text-gradient">Base</span>
                        </h2>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed italic mb-10">
                            Deep-dive into the technical and operational infrastructure of KICC CBT. For further inquiries, contact our Command Hub.
                        </p>
                        
                        <div className="p-8 bg-[#1a120b] rounded-3xl border border-[#c5a059]/20 shadow-2xl relative overflow-hidden group">
                           <div className="relative z-10">
                                <p className="text-[#c5a059] text-[10px] font-black uppercase tracking-widest mb-2">Still Unclear?</p>
                                <p className="text-white text-lg font-black italic uppercase tracking-tight mb-6">Talk to a Surveillance Expert</p>
                                <button className="w-full py-4 bg-[#c5a059] text-[#1a120b] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 group/btn">
                                    Initialize Chat <MessageCircle size={16} className="group-hover/btn:rotate-12 transition-transform" />
                                </button>
                           </div>
                           <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#c5a059]/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        </div>
                    </div>

                    {/* Right side: Questions */}
                    <div className="lg:w-2/3 space-y-4 w-full">
                        {faqs.map(({ q, a }, i) => (
                            <div
                                key={i}
                                className={`group border-2 rounded-[2rem] transition-all duration-500 overflow-hidden ${
                                    open === i
                                        ? 'border-[#c5a059]/30 bg-white shadow-[0_30px_60px_-15px_rgba(197,160,89,0.08)] scale-[1.02]'
                                        : 'border-slate-50 bg-[#fcfbf9]/50 hover:border-slate-100'
                                }`}
                            >
                                <button
                                    className="w-full flex items-center justify-between gap-6 px-10 py-8 text-left"
                                    onClick={() => setOpen(open === i ? null : i)}
                                >
                                    <div className="flex items-center gap-6">
                                        <span className={`text-sm font-black italic uppercase tracking-tighter transition-colors duration-500 ${open === i ? 'text-[#c5a059]' : 'text-slate-300 group-hover:text-slate-500'}`}>0{i+1}</span>
                                        <span className={`text-base font-black italic uppercase tracking-tight transition-colors duration-500 ${open === i ? 'text-[#1a150e]' : 'text-slate-600 group-hover:text-[#1a150e]'}`}>{q}</span>
                                    </div>
                                    <div className={`p-2 rounded-xl transition-all duration-500 ${open === i ? 'bg-[#c5a059] text-[#1a120b] rotate-180' : 'bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100'}`}>
                                        <ChevronDown size={18} />
                                    </div>
                                </button>
                                {open === i && (
                                    <div className="px-10 pb-8 ml-10">
                                        <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-50">
                                            <p className="text-slate-500 text-sm leading-relaxed font-bold italic">{a}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
