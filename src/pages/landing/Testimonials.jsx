import { Star, Quote, CheckCircle2 } from 'lucide-react';

const testimonials = [
    {
        name: 'Mr. Tunji Alausa',
        role: 'Vice Principal, Lagos Model College',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80',
        quote:
            'KICC CBT completely redefined exam integrity in our institution. The AI-surveillance catches breaches with absolute precision — students have moved from fear to focused excellence.',
        rating: 5,
        verified: true
    },
    {
        name: 'Mrs. Fatima Bello',
        role: 'Dean of Studies, Abuja Elite School',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80',
        quote:
            "The rapid deployment is what impressed me. We moved 4,000 students to digital testing in one week. The automated marking saves our faculty hundreds of hours every term.",
        rating: 5,
        verified: true
    },
    {
        name: 'Obinna Eze',
        role: 'SS3 Student, FGC Enugu',
        avatar: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=100&q=80',
        quote:
            "I love the instant result stream. It gives me immediate clarity on where I stand before the final WAEC exams. The interface is smoother than any app I've used.",
        rating: 5,
        verified: false
    }
];

export default function Testimonials() {
    return (
        <section id="testimonials" className="py-32 bg-[#FCFBFA] relative overflow-hidden font-outfit">
            {/* Design accents */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-[#c5a059]/30 to-transparent" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#c5a059]/5 blur-[100px] rounded-full" />
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-24">
                    <div className="inline-flex items-center gap-2 bg-gold-50 border border-[#c5a059]/20 rounded-full px-4 py-1.5 mb-6">
                        <Star size={12} className="text-[#c5a059] fill-[#c5a059]" />
                        <span className="text-[#a18146] text-[10px] font-black uppercase tracking-widest">Global Feedback</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-[#1a150e] leading-tight italic uppercase tracking-tighter mb-8">
                        The Institutional <span className="gold-text-gradient">Ledger</span>
                    </h2>
                    <p className="text-slate-500 text-sm max-w-2xl mx-auto font-medium leading-relaxed italic">
                        Verified accounts from principals, faculty, and candidates across the Nigerian educational spectrum.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((t, idx) => (
                        <div
                            key={idx}
                            className="bg-white border border-slate-100 rounded-[2.5rem] p-10 flex flex-col relative group transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] hover:-translate-y-2 animate-fade-in-up"
                            style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                            {/* Quote Icon */}
                            <div className="absolute top-10 right-10 text-slate-50 group-hover:text-gold-50 transition-colors duration-500">
                                <Quote size={60} fill="currentColor" />
                            </div>

                            {/* Stars */}
                            <div className="flex gap-1 mb-8">
                                {[...Array(t.rating)].map((_, i) => (
                                    <Star key={i} size={14} className="text-[#c5a059] fill-[#c5a059]" />
                                ))}
                            </div>

                            {/* Quote */}
                            <blockquote className="text-[#1a150e] text-[15px] italic font-medium leading-[1.8] flex-1 mb-10 relative z-10">
                                "{t.quote}"
                            </blockquote>

                            {/* Author */}
                            <div className="flex items-center gap-4 pt-8 border-t border-slate-50">
                                <div className="relative">
                                    <img
                                        src={t.avatar}
                                        alt={t.name}
                                        className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-xl shadow-black/5"
                                    />
                                    {t.verified && (
                                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white">
                                            <CheckCircle2 size={10} fill="currentColor" strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[#1a150e] text-sm font-black uppercase italic tracking-tight truncate">{t.name}</p>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest truncate">{t.role}</p>
                                </div>
                            </div>
                            
                            {/* Hover underline */}
                            <div className="absolute bottom-0 left-10 right-10 h-1 bg-[#c5a059] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
