import { ClipboardList, UploadCloud, PlayCircle, BarChart2 } from 'lucide-react';

const steps = [
    {
        icon: ClipboardList,
        step: '01',
        title: 'Institutional Enrollment',
        desc: 'Quick registration for your school. Configure academic levels, departments, and faculty access in one centralized dashboard.',
        img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500&q=80',
    },
    {
        icon: UploadCloud,
        step: '02',
        title: 'Assessment Engineering',
        desc: 'Deploy questions via intelligent manual entry or high-speed bulk upload. Configure time protocols and advanced randomization.',
        img: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=500&q=80',
    },
    {
        icon: PlayCircle,
        step: '03',
        title: 'Live Execution',
        desc: 'Students engage in a secure, focus-optimized environment protected by AI proctoring and real-time activity tracking.',
        img: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=500&q=80',
    },
    {
        icon: BarChart2,
        step: '04',
        title: 'Analytic Intelligence',
        desc: 'Immediate data processing post-submission. Access granular reports, subject metrics, and high-fidelity script exports.',
        img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80',
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-[#fcfbf9] relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-24 animate-fade-in-up">
                    <span className="inline-block text-[#c5a059] text-[10px] font-black uppercase tracking-[0.25em] mb-4">
                        Workflow Protocol
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-[#1a150e] mb-6 italic uppercase tracking-tighter">
                        OPERATIONAL <span className="gold-text-gradient">EFFICIENCY</span>
                    </h2>
                    <div className="w-20 h-1.5 bg-[#c5a059] mx-auto rounded-full" />
                </div>

                <div className="space-y-32">
                    {steps.map(({ icon: Icon, step, title, desc, img }, idx) => (
                        <div
                            key={step}
                            className={`flex flex-col lg:flex-row items-center gap-16 lg:gap-24 ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                        >
                            {/* Text Content */}
                            <div className="flex-1 space-y-8 animate-fade-in-up">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-[#1a120b] flex items-center justify-center shadow-xl border border-[#c5a059]/10">
                                        <Icon size={28} className="text-[#e2c08d]" />
                                    </div>
                                    <span className="text-6xl font-black text-slate-100 italic tracking-tighter uppercase leading-none">
                                        {step}
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-[#1a150e] text-3xl font-black italic uppercase tracking-tighter">{title}</h3>
                                    <p className="text-slate-500 text-lg leading-relaxed font-medium">{desc}</p>
                                </div>
                                <div className="flex items-center gap-4 text-[#c5a059] text-[10px] font-black uppercase tracking-widest bg-[#c5a059]/5 w-fit px-4 py-2 rounded-full border border-[#c5a059]/10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#c5a059]" />
                                    Phase Controlled
                                </div>
                            </div>

                            {/* Image Visualization */}
                            <div className="flex-1 relative group">
                                <div className="absolute inset-0 bg-[#c5a059] blur-[100px] opacity-0 group-hover:opacity-10 transition-opacity duration-700" />
                                <div className="relative rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]">
                                    <img
                                        src={img}
                                        alt={title}
                                        className="w-full h-[400px] object-cover contrast-[1.05] brightness-[0.95]"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-60" />
                                </div>
                                
                                {/* Floating Number */}
                                <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-[2.5rem] bg-[#1a120b] border-4 border-white flex items-center justify-center text-[#c5a059] text-2xl font-black italic shadow-2xl transform group-hover:-translate-y-2 transition-transform duration-500">
                                    {step}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
