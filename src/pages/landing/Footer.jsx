import { GraduationCap, Mail, Phone, MapPin, Twitter, Linkedin, Facebook, Github } from 'lucide-react';

const links = {
    Platform: ['Capabilities', 'Workflow', 'System Status', 'Changelog'],
    Institution: ['About KICC', 'Digital Faculty', 'Careers', 'Press Kit', 'Privacy'],
    Compliance: ['Security Protocol', 'Terms of Use', 'Ethical Standards', 'Registry Policy'],
};

const socials = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Github, href: '#', label: 'GitHub' },
];

export default function Footer() {
    return (
        <footer className="bg-[#1a120b] border-t border-[#c5a059]/10 pt-24 pb-12 overflow-hidden relative">
            {/* Background Accent */}
            <div className="absolute bottom-0 right-0 w-[40rem] h-[40rem] bg-[#c5a059] blur-[150px] opacity-[0.03] rounded-full pointer-events-none" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-20">
                    {/* Brand */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-[#c5a059]/10 flex items-center justify-center shadow-2xl">
                                <GraduationCap size={24} className="text-[#c5a059]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white font-black text-2xl tracking-tighter italic uppercase leading-none">
                                    KICC <span className="gold-text-gradient">CBT</span>
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#c5a059]">Kids Can Code Initiative</span>
                            </div>
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-sm font-medium">
                            The definitive standard for institutional digital assessment. Engineered in Nigeria for the next generation of academic excellence.
                        </p>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4 text-slate-400 group cursor-pointer transition-colors hover:text-[#c5a059]">
                                <Mail size={16} className="text-[#c5a059]/60 shrink-0" />
                                <span className="text-xs font-black uppercase tracking-widest">registry@kicc-cbt.edu.ng</span>
                            </div>
                            <div className="flex items-center gap-4 text-slate-400 group cursor-pointer transition-colors hover:text-[#c5a059]">
                                <Phone size={16} className="text-[#c5a059]/60 shrink-0" />
                                <span className="text-xs font-black uppercase tracking-widest">+234 (0) 812 345 6789</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Columns */}
                    {Object.entries(links).map(([category, items]) => (
                        <div key={category}>
                            <h4 className="text-white font-black text-[10px] uppercase tracking-[0.3em] mb-8 italic">{category}</h4>
                            <ul className="space-y-4">
                                {items.map((item) => (
                                    <li key={item}>
                                        <a
                                            href="#"
                                            className="text-slate-500 hover:text-[#c5a059] text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 group"
                                        >
                                            <span className="w-0 h-[1px] bg-[#c5a059] transition-all group-hover:w-3" />
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] italic">
                            © {new Date().getFullYear()} KICC CBT — ALL RIGHTS RESERVED.
                        </p>
                        <p className="text-slate-700 text-[9px] font-bold uppercase tracking-widest">
                            Built with precision for the Nigerian academic ecosystem.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {socials.map(({ icon: Icon, href, label }) => (
                            <a
                                key={label}
                                href={href}
                                aria-label={label}
                                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-[#c5a059] hover:border-[#c5a059]/30 hover:bg-[#c5a059]/5 transition-all duration-500"
                            >
                                <Icon size={20} />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
