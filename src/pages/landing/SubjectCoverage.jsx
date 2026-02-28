const subjects = [
    { name: 'Mathematics', icon: '📐' },
    { name: 'English Language', icon: '📝' },
    { name: 'Biology', icon: '🧬' },
    { name: 'Physics', icon: '⚡' },
    { name: 'Chemistry', icon: '🧪' },
    { name: 'Geography', icon: '🌍' },
    { name: 'Economics', icon: '📊' },
    { name: 'Civic Education', icon: '🏛️' },
    { name: 'Agricultural Science', icon: '🌾' },
    { name: 'Computer Studies', icon: '💻' },
    { name: 'Literature in English', icon: '📚' },
    { name: 'Religious Studies', icon: '🛐' },
    { name: 'Government', icon: '⚖️' },
    { name: 'Technical Drawing', icon: '📏' },
    { name: 'Financial Accounting', icon: '💰' },
    { name: 'Home Economics', icon: '🏠' },
];

export default function SubjectCoverage() {
    return (
        <section id="subjects" className="py-24 bg-white relative overflow-hidden font-outfit">
            {/* Design accents */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-[#c5a059]/5 blur-[100px] rounded-full" />
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-20">
                    <span className="inline-block text-[#c5a059] text-[10px] font-black uppercase tracking-[0.4em] mb-6">
                        Curriculum Spectrum
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#1a150e] mb-8 italic uppercase tracking-tighter leading-none">
                        Comprehensive <span className="gold-text-gradient">Discipline</span> Coverage
                    </h2>
                    <p className="text-slate-500 text-sm max-w-2xl mx-auto font-medium leading-relaxed italic">
                        Strategic alignment with WAEC, NECO, and JAMB standards, providing high-fidelity assessment scripts across all major academic verticals.
                    </p>
                </div>

                {/* Subject grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-8">
                    {subjects.map(({ name, icon }, idx) => (
                        <div
                            key={name}
                            className="flex items-center gap-5 bg-white border border-slate-50 rounded-[2rem] p-6 hover:border-[#c5a059]/30 hover:shadow-2xl hover:shadow-[#c5a059]/5 transition-all duration-500 cursor-default group animate-fade-in-up"
                            style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-lg border border-slate-100 flex items-center justify-center shrink-0 text-xl group-hover:bg-[#1a120b] group-hover:rotate-12 transition-all duration-500 group-hover:scale-110">
                                {icon}
                            </div>
                            <span className="text-[#1a150e] text-[11px] font-black uppercase tracking-tight italic group-hover:text-[#c5a059] transition-colors">{name}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                    <div className="inline-flex items-center gap-4 bg-[#1a120b] border border-[#c5a059]/20 rounded-full px-10 py-5 shadow-2xl group hover:border-[#c5a059]/50 transition-all cursor-pointer">
                        <div className="relative">
                            <span className="absolute inset-0 bg-[#c5a059] rounded-full animate-ping opacity-40" />
                            <span className="relative block w-2.5 h-2.5 rounded-full bg-[#c5a059]" />
                        </div>
                        <span className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Institutional Custom Modules: Online & Scalable</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
