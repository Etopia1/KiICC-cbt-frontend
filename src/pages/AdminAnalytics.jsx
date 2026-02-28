import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
    TrendingUp, Award, Users, Download, RefreshCcw,
    ShieldAlert, BrainCircuit, Zap, Activity, BookOpen, Search
} from 'lucide-react';
import toast from 'react-hot-toast';

const GOLD = '#c5a059';
const DARK = '#1a120b';
const COLORS = ['#c5a059', '#e9c97c', '#8B7040', '#f0d9a0', '#6b5a32'];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#1a120b] border border-[#c5a059]/20 rounded-2xl px-5 py-3 shadow-2xl">
            <p className="text-[#c5a059] text-[9px] font-black uppercase tracking-widest mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="text-white font-black text-sm">
                    {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
                    <span className="text-slate-400 text-[10px] ml-1">{p.name}</span>
                </p>
            ))}
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, sub }) => (
    <div className="premium-card p-6 group hover:scale-[1.02] transition-all relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#c5a059]/5 blur-[40px] rounded-full" />
        <div className="relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-[#1a120b] flex items-center justify-center mb-4 border border-[#c5a059]/10 shadow-lg group-hover:scale-110 transition-transform">
                <Icon size={18} className="text-[#c5a059]" />
            </div>
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">{label}</p>
            <h3 className="text-3xl font-black text-[#1a150e] tracking-tighter italic">{value}</h3>
            {sub && <p className="text-slate-400 text-[9px] uppercase tracking-widest mt-1">{sub}</p>}
        </div>
    </div>
);

const AdminAnalytics = () => {
    const { token } = useSelector(state => state.auth);
    const [performanceData, setPerformanceData] = useState(null);
    const [aiInsights, setAiInsights] = useState([]);
    const [growthData, setGrowthData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [perfRes, aiRes, growthRes] = await Promise.all([
                axios.get('https://educbt-pro-backend.onrender.com/school/analytics/performance', config),
                axios.get('https://educbt-pro-backend.onrender.com/school/analytics/ai-insights', config),
                axios.get('https://educbt-pro-backend.onrender.com/school/analytics/user-growth', config)
            ]);
            setPerformanceData(perfRes.data);
            setAiInsights(aiRes.data);
            setGrowthData(growthRes.data);
        } catch (err) {
            toast.error('Protocol Sync Failure: Data fetch interrupted');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const runAIAnalysis = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            fetchData();
            setIsAnalyzing(false);
            toast.success('Heuristic Engine Re-calibrated');
        }, 2000);
    };

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-16 h-16 rounded-2xl bg-[#1a120b] flex items-center justify-center border border-[#c5a059]/10 animate-bounce">
                    <Activity size={32} className="text-[#c5a059]" />
                </div>
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-10 pb-20 font-outfit">
                
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-3 bg-white border border-slate-100 rounded-full px-4 py-2 shadow-sm">
                            <TrendingUp size={14} className="text-[#c5a059]" />
                            <span className="text-[#a18146] text-[10px] font-black uppercase tracking-[0.2em]">Institutional Analytics</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-[#1a150e] leading-none tracking-tighter uppercase italic">
                            Command <span className="gold-text-gradient">Intelligence</span>
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">Global perspective on academic and operational output.</p>
                    </div>

                    <button 
                        onClick={runAIAnalysis}
                        disabled={isAnalyzing}
                        className={`group relative overflow-hidden h-14 px-8 rounded-2xl flex items-center gap-4 transition-all
                            ${isAnalyzing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[#1a120b] text-[#c5a059] hover:shadow-2xl hover:shadow-black/20'}
                        `}
                    >
                        <div className={`transition-transform duration-1000 ${isAnalyzing ? 'animate-spin' : 'group-hover:rotate-180'}`}>
                            <BrainCircuit size={20} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">
                            {isAnalyzing ? 'Analyzing Nodes...' : 'Invoke AI Advisor'}
                        </span>
                        {!isAnalyzing && <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </button>
                </div>

                {/* AI Insights Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-[#1a120b] border border-[#c5a059]/20 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                             <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#c5a059]/5 blur-[50px] rounded-full" />
                             <div className="relative z-10">
                                <h3 className="text-white font-black text-sm uppercase italic tracking-widest mb-6 flex items-center gap-2">
                                    <Zap size={16} className="text-[#c5a059]" />
                                    AI Diagnostics
                                </h3>
                                <div className="space-y-6">
                                    {aiInsights.length > 0 ? aiInsights.map((insight, idx) => (
                                        <div key={idx} className="space-y-2 group cursor-help">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${insight.priority === 'high' ? 'bg-rose-500 animate-pulse' : 'bg-[#c5a059]'}`} />
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{insight.type}</span>
                                            </div>
                                            <p className="text-white text-[11px] font-black italic uppercase leading-tight group-hover:text-[#c5a059] transition-colors">{insight.title}</p>
                                            <p className="text-slate-500 text-[10px] font-medium leading-relaxed italic">{insight.message}</p>
                                        </div>
                                    )) : (
                                        <p className="text-slate-600 text-[10px] italic">No anomalies detected in current cycle.</p>
                                    )}
                                </div>
                             </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3 space-y-6">
                         {/* Core Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <StatCard label="Global Average" value={`${performanceData?.avgGlobalPercentage || 0}%`} icon={Activity} sub="System-wide score" />
                            <StatCard label="Module Load" value={performanceData?.totalExams || 0} icon={BookOpen} sub="Active assessment scripts" />
                            <StatCard label="Network Throughput" value={performanceData?.totalSubmissions || 0} icon={Users} sub="Completed submissions" />
                        </div>

                        {/* Subject Performance Graph */}
                        <div className="premium-card p-8 md:p-10">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-lg font-black text-[#1a150e] uppercase italic tracking-tighter">Academic Distribution</h3>
                                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Cross-subject performance heuristics</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#c5a059]" />
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Avg Score</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#1a120b]" />
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pass Rate</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={performanceData?.performanceBySubject} barGap={12}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 12 }} />
                                        <Bar dataKey="avgScore" name="Avg Score" fill="#c5a059" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="passRate" name="Pass Rate" fill="#1a120b" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* User Growth Trend */}
                    <div className="premium-card p-10">
                        <div className="mb-10">
                            <h3 className="text-lg font-black text-[#1a150e] uppercase italic tracking-tighter">Registry Trajectory</h3>
                            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Institutional expansion analytics</p>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={growthData}>
                                    <defs>
                                        <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#c5a059" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#c5a059" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="students" stroke="#c5a059" fillOpacity={1} fill="url(#colorStudents)" strokeWidth={3} dot={{ fill: '#c5a059', strokeWidth: 2, r: 4 }} />
                                    <Area type="monotone" dataKey="teachers" stroke="#1a120b" fill="none" strokeWidth={2} strokeDasharray="5 5" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Subject Table */}
                    <div className="premium-card overflow-hidden">
                        <div className="p-8 border-b border-slate-50 bg-[#1a120b]">
                            <h3 className="text-white font-black text-xs uppercase italic tracking-widest">Global Module Registry</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-8 py-5">Protocol Subject</th>
                                        <th className="px-8 py-5 text-center">Throughput</th>
                                        <th className="px-8 py-5 text-center">Merit Avg</th>
                                        <th className="px-8 py-5 text-center">Clearance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {performanceData?.performanceBySubject?.map((sub, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-black text-[#1a150e] uppercase italic">{sub.name}</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-lg italic">{sub.submissions} SESSIONS</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="text-sm font-black text-[#1a150e] italic">{sub.avgScore}%</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${Number(sub.passRate) >= 70 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : Number(sub.passRate) >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                                    <span className="text-[10px] font-black text-slate-500 uppercase italic">{sub.passRate}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
};

export default AdminAnalytics;
