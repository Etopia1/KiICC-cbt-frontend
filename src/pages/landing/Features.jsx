import {
    ClipboardList,
    Eye,
    BarChart2,
    Clock,
    ShieldCheck,
    Users,
    FileText,
    Smartphone,
} from 'lucide-react';

const features = [
    {
        icon: ClipboardList,
        title: 'Exam Engineering',
        desc: 'Advanced module for creating complex MCQ, Theory, and Hybrid assessments with ease.',
    },
    {
        icon: Eye,
        title: 'Integrity Protocol',
        desc: 'Built-in detection systems and time-lapse monitoring for maximum exam security.',
    },
    {
        icon: BarChart2,
        title: 'Data Intelligence',
        desc: "Comprehensive performance visualizations for students and academic faculty.",
    },
    {
        icon: Clock,
        title: 'Rapid Evaluation',
        desc: 'Instant scoring for objective questions with immediate result distribution.',
    },
    {
        icon: ShieldCheck,
        title: 'Proactive Guard',
        desc: 'Real-time notifications sent to proctors when session violations are detected.',
    },
    {
        icon: Users,
        title: 'Governance Control',
        desc: 'Robust role-based access for students, instructors, and system administrators.',
    },
    {
        icon: FileText,
        title: 'Export Systems',
        desc: 'Professional PDF and Excel reporting for official records and script management.',
    },
    {
        icon: Smartphone,
        title: 'Unified Access',
        desc: 'Full desktop-to-mobile responsiveness for consistent assessment experiences.',
    },
];

export default function Features() {
    return (
        <section id="features" className="py-24 bg-[#fcfbf9] relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-20 animate-fade-in-up">
                    <span className="inline-block text-[#c5a059] text-[10px] font-black uppercase tracking-[0.25em] mb-4">
                        Core Capabilities
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-[#1a150e] mb-6 italic uppercase tracking-tighter">
                        INSTITUTIONAL <span className="gold-text-gradient">OPERATIONS</span>
                    </h2>
                    <div className="w-20 h-1.5 bg-[#c5a059] mx-auto rounded-full mb-8" />
                    <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto font-medium leading-relaxed">
                        A centralized assessment ecosystem engineered to maintain global standards in digital testing and academic data management.
                    </p>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map(({ icon: Icon, title, desc }, idx) => (
                        <div
                            key={title}
                            className="premium-card p-10 group animate-fade-in-up hover:-translate-y-2"
                            style={{ animationDelay: `${0.1 * idx}s` }}
                        >
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-[#c5a059] blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                                <div className="relative w-14 h-14 rounded-2xl bg-[#1a120b] flex items-center justify-center border border-[#c5a059]/10 shadow-lg group-hover:rotate-12 transition-all duration-500">
                                    <Icon size={24} className="text-[#e2c08d]" />
                                </div>
                            </div>
                            <h3 className="text-[#1a150e] font-black text-lg mb-4 italic uppercase tracking-tighter group-hover:text-[#c5a059] transition-colors">{title}</h3>
                            <p className="text-slate-500 text-[13px] leading-relaxed font-medium">{desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
