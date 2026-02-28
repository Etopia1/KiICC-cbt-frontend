import { Play, Maximize2, Camera } from 'lucide-react';

const galleryItems = [
    {
        src: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&q=80',
        label: 'Digital Assessment Lab',
        description: 'Smart CBT protocols in action'
    },
    {
        src: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&q=80',
        label: 'Candidate Surveillance',
        description: 'Real-time monitoring active'
    },
    {
        src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80',
        label: 'Faculty Supervision',
        description: 'High-integrity proctoring'
    },
    {
        src: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80',
        label: 'Mobile Connectivity',
        description: 'Testing on any hardware'
    },
    {
        src: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&q=80',
        label: 'Instant Result Stream',
        description: 'Zero-latency data lifecycle'
    },
    {
        src: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&q=80',
        label: 'Institutional Excellence',
        description: 'WAEC / NECO Standards'
    }
];

export default function StudentGallery() {
    return (
        <section id="gallery" className="py-32 bg-[#fcfbf9] relative overflow-hidden font-outfit">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-20">
                    <span className="inline-block text-[#c5a059] text-[10px] font-black uppercase tracking-[0.4em] mb-6">
                        Institutional Visuals
                    </span>
                    <h2 className="text-4xl md:text-6xl font-black text-[#1a150e] leading-none italic uppercase tracking-tighter mb-8">
                        The KICC <span className="gold-text-gradient">Experience</span>
                    </h2>
                    <p className="text-slate-500 text-sm max-w-2xl mx-auto font-medium leading-relaxed italic">
                        Visualizing the transformation of Nigerian secondary school assessments through high-fidelity digital infrastructure.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {galleryItems.map((item, idx) => (
                        <div key={idx} className="group relative rounded-[2.5rem] overflow-hidden aspect-[4/5] shadow-2xl shadow-black/5 animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                            <img
                                src={item.src}
                                alt={item.label}
                                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
                                loading="lazy"
                            />
                            
                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-linear-to-t from-[#1a120b] via-[#1a120b]/20 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-80" />
                            
                            <div className="absolute top-6 right-6 flex flex-col gap-3 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white cursor-pointer hover:bg-[#c5a059] hover:border-[#c5a059] transition-all">
                                    <Maximize2 size={16} />
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white cursor-pointer hover:bg-emerald-500 hover:border-emerald-500 transition-all">
                                    <Camera size={16} />
                                </div>
                            </div>

                            <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                <div>
                                    <span className="text-[#c5a059] text-[9px] font-black uppercase tracking-widest mb-1 block">{item.label}</span>
                                    <p className="text-white text-base font-black italic uppercase tracking-tighter leading-none">{item.description}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-[#c5a059] flex items-center justify-center text-[#1a120b] shadow-xl group-hover:scale-110 transition-transform">
                                    <Play size={18} fill="currentColor" className="ml-1" />
                                </div>
                            </div>

                            {/* Border Accent */}
                            <div className="absolute inset-0 border-[1px] border-white/5 rounded-[2.5rem] pointer-events-none group-hover:border-[#c5a059]/30 transition-colors duration-500" />
                        </div>
                    ))}
                </div>

                <div className="mt-24 text-center">
                    <button className="h-16 px-12 bg-[#1a120b] text-[#c5a059] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl active:scale-95 group">
                        Enter Infinite Gallery
                        <ArrowRight size={16} className="inline-block ml-3 group-hover:translate-x-2 transition-transform" />
                    </button>
                </div>
            </div>
            
            {/* Design accents */}
            <div className="absolute top-1/2 right-[-10%] w-[50rem] h-[50rem] bg-[#c5a059]/3 blur-[120px] rounded-full pointer-events-none" />
        </section>
    );
}
// Add ArrowRight for the button
import { ArrowRight } from 'lucide-react';
