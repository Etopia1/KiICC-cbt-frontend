import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu as MenuIcon, X as XIcon, GraduationCap as GradIcon } from 'lucide-react';

const navLinks = [
    { id: 'features', label: 'Capabilities' },
    { id: 'subjects', label: 'Verticals' },
    { id: 'how-it-works', label: 'Workflow' },
    { id: 'stats', label: 'Metrics' },
];

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollTo = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        } else if (id === 'hero') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        setMenuOpen(false);
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                    ? 'bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm'
                    : 'bg-transparent border-b border-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20 sm:h-24">
                    {/* Logo */}
                    <div className="flex items-center gap-4 cursor-pointer group" onClick={() => scrollTo('hero')}>
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#1a120b] flex items-center justify-center shadow-lg shadow-black/10 group-hover:scale-110 transition-transform duration-500">
                            <GradIcon size={22} className="text-[#c5a059]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-lg sm:text-xl tracking-tighter leading-none text-[#1a150e] uppercase italic">
                                KICC <span className="gold-text-gradient">CBT</span>
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#c5a059]">Digital Registry</span>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-12">
                        {navLinks.map(({ id, label }) => (
                            <button
                                key={id}
                                onClick={() => scrollTo(id)}
                                className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a150e]/60 hover:text-[#c5a059] transition-all relative group"
                            >
                                {label}
                                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#c5a059] transition-all duration-300 group-hover:w-full"></span>
                            </button>
                        ))}
                    </div>

                    {/* Authentication Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a150e] px-6 py-3 rounded-xl hover:bg-slate-50 transition-all"
                        >
                            Portal Login
                        </button>
                        <button
                            onClick={() => navigate('/register-school')}
                            className="bg-[#1a120b] text-[#c5a059] text-[10px] font-black uppercase tracking-[0.2em] px-8 py-3.5 rounded-xl hover:bg-black transition-all shadow-xl shadow-black/5 border border-[#c5a059]/10"
                        >
                            Join Registry
                        </button>
                    </div>

                    {/* Mobile menu toggle */}
                    <button
                        className="lg:hidden p-3 rounded-2xl text-[#1a120b] bg-white border border-slate-100 shadow-sm transition-all active:scale-95"
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        {menuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Sidebar/Menu */}
            {menuOpen && (
                <div className="lg:hidden fixed inset-0 top-20 bg-white z-40 px-8 py-12 flex flex-col gap-10 animate-fade-in-up">
                    <div className="flex flex-col gap-8">
                        {navLinks.map(({ id, label }) => (
                            <button
                                key={id}
                                onClick={() => scrollTo(id)}
                                className="text-left text-[#1a150e] text-2xl font-black uppercase italic tracking-tight border-b border-slate-50 pb-4"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="mt-auto flex flex-col gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full text-[#1a150e] font-black uppercase tracking-widest py-5 rounded-3xl bg-slate-50 text-xs border border-slate-100"
                        >
                            Institutional Login
                        </button>
                        <button
                            onClick={() => navigate('/register-school')}
                            className="w-full bg-[#1a120b] text-[#c5a059] font-black uppercase tracking-widest py-5 rounded-3xl text-xs shadow-xl shadow-black/10"
                        >
                            Open Free Registry
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
