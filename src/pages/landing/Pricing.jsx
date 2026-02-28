import { Check, Zap, Building2, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const plans = [
    {
        name: 'Starter',
        icon: GraduationCap,
        price: 'Free',
        period: '',
        desc: 'Perfect for small schools just getting started with CBT.',
        color: 'from-slate-600 to-slate-700',
        border: 'border-slate-700',
        cta: 'Get Started Free',
        ctaStyle: 'bg-white/10 hover:bg-white/20 text-white',
        features: [
            'Up to 100 students',
            'Up to 5 teachers',
            'Unlimited exams',
            'Basic AI proctoring',
            'Auto-grading',
            'CSV result export',
        ],
        popular: false,
    },
    {
        name: 'Professional',
        icon: Zap,
        price: '₦15,000',
        period: '/month',
        desc: 'Ideal for growing schools with advanced proctoring needs.',
        color: 'from-indigo-500 to-purple-600',
        border: 'border-indigo-500/50',
        cta: 'Start Free Trial',
        ctaStyle: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25',
        features: [
            'Up to 1,000 students',
            'Unlimited teachers',
            'Advanced AI proctoring',
            'Violation alert system',
            'PDF report export',
            'Analytics dashboard',
            'Priority email support',
            'Custom school branding',
        ],
        popular: true,
    },
    {
        name: 'Enterprise',
        icon: Building2,
        price: 'Custom',
        period: '',
        desc: 'For large institutions and state-wide deployments.',
        color: 'from-amber-500 to-orange-600',
        border: 'border-amber-500/30',
        cta: 'Contact Sales',
        ctaStyle: 'bg-white/10 hover:bg-white/20 text-white',
        features: [
            'Unlimited students',
            'Unlimited schools',
            'Full AI proctoring suite',
            'Dedicated account manager',
            'SLA uptime guarantee',
            'API access & integrations',
            'Custom feature development',
            'On-site training',
        ],
        popular: false,
    },
];

export default function Pricing() {
    const navigate = useNavigate();

    return (
        <section id="pricing" className="py-24 bg-[#FCFBFA] relative overflow-hidden">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <span className="inline-block text-amber-400 text-sm font-semibold uppercase tracking-widest mb-4">
                        Pricing
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto">
                        Choose the plan that fits your school. Start for free, scale when ready.
                    </p>
                </div>

                {/* Plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    {plans.map(({ name, icon: Icon, price, period, desc, color, border, cta, ctaStyle, features, popular }) => (
                        <div
                            key={name}
                            className={`relative bg-slate-800/50 border ${border} rounded-2xl p-7 flex flex-col transition-all duration-300 hover:scale-[1.02] ${popular ? 'ring-2 ring-indigo-500/50 shadow-2xl shadow-indigo-500/10' : ''}`}
                        >
                            {popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">
                                    Most Popular
                                </div>
                            )}

                            {/* Plan Header */}
                            <div className="mb-6">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg`}>
                                    <Icon size={22} className="text-white" />
                                </div>
                                <h3 className="text-white font-bold text-xl mb-1">{name}</h3>
                                <p className="text-slate-400 text-sm">{desc}</p>
                            </div>

                            {/* Price */}
                            <div className="mb-6">
                                <span className="text-white text-4xl font-extrabold">{price}</span>
                                {period && <span className="text-slate-400 text-sm ml-1">{period}</span>}
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 mb-8 flex-1">
                                {features.map((f) => (
                                    <li key={f} className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
                                            <Check size={11} className="text-white" strokeWidth={3} />
                                        </div>
                                        <span className="text-slate-300 text-sm">{f}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <button
                                onClick={() => navigate('/register-school')}
                                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${ctaStyle}`}
                            >
                                {cta}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Note */}
                <p className="text-center text-slate-500 text-sm mt-8">
                    All plans include 14-day free trial. No credit card required.
                </p>
            </div>
        </section>
    );
}
