const stats = [
    { value: '500+', label: 'Registry Reach', sub: 'Institutional Network' },
    { value: '1.2M+', label: 'Sessions Logged', sub: 'Secure Assessment Data' },
    { value: '98.5%', label: 'Loyalty Index', sub: 'Institutional Retention' },
    { value: '< 2.4s', label: 'Evaluation Cycle', sub: 'Real-time Processing' },
    { value: '24/7', label: 'System Uptime', sub: 'High-Availability Node' },
    { value: 'Bank', label: '100k+ Questions', sub: 'Standardized Vault' },
];

export default function Stats() {
    return (
        <section id="stats" className="py-24 bg-[#fcfbf9] relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {stats.map(({ value, label, sub }, idx) => (
                        <div
                            key={label}
                            className="premium-card p-12 text-center group relative animate-fade-in-up"
                            style={{ animationDelay: `${0.1 * idx}s` }}
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#c5a059]/5 blur-[60px] rounded-full group-hover:bg-[#c5a059]/10 transition-colors" />
                            
                            <div className="relative z-10">
                                <span className="block text-5xl font-black text-[#1a150e] mb-4 italic tracking-tighter uppercase group-hover:gold-text-gradient transition-all duration-500">
                                    {value}
                                </span>
                                <div className="w-12 h-1 bg-slate-100 mx-auto mb-6 group-hover:bg-[#c5a059]/30 transition-colors" />
                                <h3 className="text-[#1a150e] font-black text-sm mb-2 uppercase tracking-[0.1em] italic">{label}</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
