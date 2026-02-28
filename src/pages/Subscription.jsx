import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import {
    CheckCircle, XCircle, CreditCard, Shield, Star, Zap, Layout, Check,
    Users, CalendarCheck, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';

const Subscription = () => {
    const { token, user } = useSelector((state) => state.auth);
    const [currentPlan, setCurrentPlan] = useState(null); // the full subscription object
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    const plans = [
        {
            id: 'basic',
            name: 'Basic Plan',
            price: '$19.99',
            interval: '/month',
            description: 'Essential tools for small schools.',
            features: [
                'Basic exam mode (no proctoring)',
                'Up to 50 students',
                'Up to 5 teachers',
                'Basic analytics',
                'Email support'
            ],
            color: 'from-blue-400 to-blue-600',
            icon: Layout
        },
        {
            id: 'proctored',
            name: 'Proctored Plan',
            price: '$49.99',
            interval: '/month',
            description: 'Advanced monitoring for serious assessments.',
            features: [
                'Everything in Basic',
                'AI Proctoring (Camera/Audio)',
                'Screen Sharing Monitoring',
                'Up to 200 students',
                'Up to 20 teachers',
                'Advanced analytics'
            ],
            popular: true,
            color: 'from-indigo-500 to-purple-600',
            icon: Shield
        },
        {
            id: 'premium',
            name: 'Premium Plan',
            price: '$99.99',
            interval: '/month',
            description: 'Unlimited growth and custom branding.',
            features: [
                'Everything in Proctored',
                'Unlimited students',
                'Unlimited teachers',
                'Custom School Branding',
                'Priority 24/7 Support',
                'API Access'
            ],
            color: 'from-amber-400 to-orange-600',
            icon: Star
        }
    ];

    useEffect(() => {
        fetchSubscription();
        handlePaymentReturn();
    }, []);

    // -- Parse payment result from URL after Stripe redirect ------------------
    // HashRouter puts query params in the hash, e.g. /#/school/subscription?payment=success
    // window.location.search is empty in this case — we must parse from the full href.
    const handlePaymentReturn = () => {
        const href = window.location.href;
        const hashPart = href.split('#')[1] || '';
        const queryStart = hashPart.indexOf('?');
        if (queryStart === -1) return;

        const params = new URLSearchParams(hashPart.slice(queryStart));
        const paymentStatus = params.get('payment');
        const sessionId = params.get('session_id');

        if (paymentStatus === 'success') {
            toast.success('?? Payment successful! Your subscription has been activated.', {
                duration: 6000,
                style: { background: '#22c55e', color: '#fff', fontWeight: 'bold' }
            });
            // Re-fetch after a short delay to let webhook / session verify run
            setTimeout(fetchSubscription, 2500);
            // If we have a sessionId, verify server-side too
            if (sessionId) verifySession(sessionId);
            // Clean URL
            window.history.replaceState(null, '', window.location.pathname + '#/school/subscription');
        } else if (paymentStatus === 'cancelled') {
            toast.error('Payment was cancelled. You can try again anytime.', { duration: 5000 });
            window.history.replaceState(null, '', window.location.pathname + '#/school/subscription');
        }
    };

    const verifySession = async (sessionId) => {
        try {
            await axios.get(`https://educbt-pro-backend.onrender.com/subscription/verify/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch { /* silent — webhook may have already handled it */ }
    };

    const fetchSubscription = async () => {
        try {
            if (!user?.schoolId) return;
            const res = await axios.get(`https://educbt-pro-backend.onrender.com/subscription/${user.schoolId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Controller returns { success, subscription, isActive }
            setCurrentPlan(res.data.subscription);
        } catch (error) {
            console.error('Error fetching subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (planId, interval = 'month') => {
        try {
            setProcessing(planId);
            if (!user?.schoolId) {
                toast.error('School information not found. Please contact support.');
                return;
            }
            const res = await axios.post('https://educbt-pro-backend.onrender.com/subscription/checkout', {
                schoolId: user.schoolId,
                plan: planId,
                interval
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.url) {
                window.location.href = res.data.url;
            } else {
                toast.success('Subscription initiated (Mock Mode)');
                fetchSubscription();
            }
        } catch (error) {
            console.error('Subscription error:', error);
            toast.error(error.response?.data?.message || 'Failed to initiate subscription');
        } finally {
            setProcessing(null);
        }
    };

    // currentPlan.plan is the plan id ('basic' | 'proctored' | 'premium')
    const activePlanId = currentPlan?.plan || null;
    const isActive = currentPlan?.status === 'active' || currentPlan?.status === 'trial' || currentPlan?.status === 'trialing';

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    return (
        <AdminLayout>
            <div className="space-y-8 pb-12">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Subscription & Billing</h1>
                        <p className="text-gray-500 mt-1">Manage your school's plan and features.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm w-fit">
                        <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                        <span className="font-bold text-sm capitalize">
                            {currentPlan?.status || 'No Active Plan'}
                        </span>
                        {currentPlan?.currentPeriodEnd && (
                            <span className="text-xs text-gray-400 ml-1">
                                · renews {formatDate(currentPlan.currentPeriodEnd)}
                            </span>
                        )}
                    </div>
                </div>

                {/* -- School-wide access callout -- */}
                <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                    <Users size={20} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-indigo-900 text-sm">Your subscription covers your entire school</p>
                        <p className="text-indigo-700 text-sm mt-0.5">
                            All teachers and staff at your school automatically get access to every feature included in your plan — no extra seats or per-user charges.
                        </p>
                    </div>
                </div>

                {/* Current active plan summary */}
                {currentPlan && isActive && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <CalendarCheck size={20} className="text-emerald-600 shrink-0" />
                            <div>
                                <p className="text-sm text-gray-500">Active plan</p>
                                <p className="font-bold text-gray-900 capitalize">{currentPlan.plan} Plan</p>
                            </div>
                        </div>
                        {currentPlan.pricing?.amount > 0 && (
                            <div className="flex items-center gap-3 flex-1 sm:border-l sm:pl-4 border-gray-100">
                                <CreditCard size={20} className="text-gray-400 shrink-0" />
                                <div>
                                    <p className="text-sm text-gray-500">Billing</p>
                                    <p className="font-bold text-gray-900">
                                        ${(currentPlan.pricing.amount / 100).toFixed(2)} / {currentPlan.pricing.interval}
                                    </p>
                                </div>
                            </div>
                        )}
                        {currentPlan.currentPeriodEnd && (
                            <div className="flex items-center gap-3 flex-1 sm:border-l sm:pl-4 border-gray-100">
                                <div>
                                    <p className="text-sm text-gray-500">Next renewal</p>
                                    <p className="font-bold text-gray-900">{formatDate(currentPlan.currentPeriodEnd)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan) => {
                        const Icon = plan.icon;
                        const isCurrent = activePlanId === plan.id;

                        return (
                            <div
                                key={plan.id}
                                className={`relative bg-white rounded-3xl border transition-all duration-300 flex flex-col
                                    ${isCurrent ? 'border-indigo-600 shadow-xl scale-105 z-10' : 'border-gray-200 hover:border-indigo-300 hover:shadow-lg'}
                                `}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg tracking-wide uppercase">
                                        Most Popular
                                    </div>
                                )}

                                <div className={`p-8 rounded-t-3xl bg-gradient-to-br ${plan.color} text-white relative overflow-hidden`}>
                                    <div className="absolute top-0 right-0 p-4 opacity-20 transform rotate-12">
                                        <Icon size={120} />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-lg font-bold">{plan.name}</h3>
                                        <div className="flex items-baseline mt-2">
                                            <span className="text-4xl font-extrabold">{plan.price}</span>
                                            <span className="text-sm opacity-80">{plan.interval}</span>
                                        </div>
                                        <p className="text-sm mt-2 opacity-90 leading-relaxed font-medium">{plan.description}</p>
                                    </div>
                                </div>

                                <div className="p-8 flex flex-col flex-1">
                                    <ul className="space-y-4 mb-8 flex-1">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                                                <CheckCircle size={18} className={`shrink-0 ${isCurrent ? 'text-indigo-600' : 'text-gray-400'}`} />
                                                <span className="font-medium">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => !isCurrent && handleSubscribe(plan.id)}
                                        disabled={isCurrent || !!processing}
                                        className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                                            ${isCurrent
                                                ? 'bg-indigo-50 text-indigo-600 cursor-default border-2 border-indigo-200'
                                                : 'bg-gray-900 text-white hover:bg-indigo-600 shadow-lg hover:shadow-indigo-200 active:scale-95'
                                            }
                                        `}
                                    >
                                        {processing === plan.id ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : isCurrent ? (
                                            <><Check size={18} /> Current Plan</>
                                        ) : (
                                            <><Zap size={18} /> Upgrade Now</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Info footer */}
                <div className="flex items-start gap-2 text-gray-400 text-xs max-w-2xl mx-auto text-center justify-center">
                    <Info size={13} className="shrink-0 mt-0.5" />
                    <span>
                        Payments are processed securely by Stripe. Use test card <strong>4242 4242 4242 4242</strong> (any future date, any CVC) in test mode.
                    </span>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Subscription;
