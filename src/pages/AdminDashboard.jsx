import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import AdminLayout from '../components/AdminLayout';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    Users, GraduationCap, CheckCircle, Clock, AlertTriangle,
    Zap, ArrowUpRight, ShieldCheck, Activity, TrendingUp, BrainCircuit
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const COLORS = ['#c5a059', '#1A120B', '#EF4444'];

const StatCard = ({ title, value, icon: Icon, description }) => (
    <div className="premium-card p-5 md:p-8 group relative overflow-hidden animate-fade-in-up">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#c5a059]/5 blur-[60px] rounded-full group-hover:bg-[#c5a059]/10 transition-colors" />
        <div className="relative z-10">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-[#1a120b] flex items-center justify-center mb-4 md:mb-6 border border-[#c5a059]/10 shadow-lg group-hover:scale-110 transition-transform duration-500">
                <Icon size={18} className="text-[#c5a059]" />
            </div>
            <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] mb-1 md:mb-2">{title}</p>
            <h3 className="text-3xl md:text-4xl font-black text-[#1a150e] tracking-tighter italic uppercase mb-1 md:mb-2 group-hover:gold-text-gradient transition-all">{value}</h3>
            <p className="text-slate-400 text-[8px] md:text-[9px] font-bold uppercase tracking-widest">{description}</p>
        </div>
    </div>
);

const GoldTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#1a120b] border border-[#c5a059]/20 rounded-2xl px-6 py-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mb-3 italic">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-6">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">{p.name}</span>
                    <span className="text-white text-lg font-black italic">{p.value}</span>
                </div>
            ))}
        </div>
    );
};

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalTeachers: 0, totalStudents: 0,
        pendingApprovals: 0, activeExams: 0,
        totalExams: 0, currentTermEndDate: ''
    });
    const [userGrowth, setUserGrowth] = useState([]);
    const [integrityData, setIntegrityData] = useState([
        { name: 'SECURE', value: 85 },
        { name: 'FLAGGED', value: 10 },
        { name: 'BREACH', value: 5 }
    ]);
    const [aiInsights, setAiInsights] = useState([]);
    const { token } = useSelector((state) => state.auth);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    const fetchData = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [statsRes, growthRes, aiRes] = await Promise.all([
                axios.get('https://educbt-pro-backend.onrender.com/school/dashboard/stats', config),
                axios.get('https://educbt-pro-backend.onrender.com/school/analytics/user-growth', config),
                axios.get('https://educbt-pro-backend.onrender.com/school/analytics/ai-insights', config)
            ]);
            setStats(statsRes.data);
            setUserGrowth(growthRes.data);
            setAiInsights(aiRes.data);
        } catch (error) {
            console.error('Dashboard error:', error);
        }
    };

    const kpiCards = [
        { title: 'Faculty Assets', value: stats.totalTeachers, icon: Users, description: 'Verified Academic Staff' },
        { title: 'Student Registry', value: stats.totalStudents, icon: GraduationCap, description: 'Enrolled Assessment Subjects' },
        { title: 'Pending Clearance', value: stats.pendingApprovals, icon: Clock, description: 'Enrollment Requests' },
        { title: 'Live Nodes', value: stats.activeExams, icon: Activity, description: 'Active Examination Sessions' },
    ];

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-10 pb-20 font-outfit">
                {/* Dashboard Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 py-4 md:py-6">
                    <div className="space-y-3 animate-fade-in-up">
                        <div className="inline-flex items-center gap-3 bg-white border border-slate-100 rounded-full px-4 py-2 shadow-sm">
                            <ShieldCheck size={14} className="text-[#c5a059]" />
                            <span className="text-[#a18146] text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]">Institutional Command Center</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-[#1a150e] leading-none tracking-tighter uppercase italic">
                            Operational <span className="gold-text-gradient">Intelligence</span>
                        </h1>
                        <p className="text-slate-500 text-xs md:text-sm font-medium">Administrator: <span className="text-[#1a150e] font-black">{user?.schoolName || 'KICC Portal'}</span> Branch Control.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link 
                            to="/school/analytics" 
                            className="bg-[#1a120b] text-[#c5a059] px-6 py-3 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-xl hover:shadow-black/10 transition-all border border-[#c5a059]/20"
                        >
                            <BrainCircuit size={16} />
                            Deep Analytics
                        </Link>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                    {kpiCards.map((card, idx) => (
                        <StatCard key={card.title} {...card} style={{ animationDelay: `${idx * 0.1}s` }} />
                    ))}
                </div>

                {/* Analytics Landscape */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
                    {/* Growth Analytics */}
                    <div className="xl:col-span-2 premium-card p-6 md:p-10 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 md:mb-12">
                             <div>
                                <h3 className="text-lg md:text-xl font-black text-[#1a150e] tracking-tighter uppercase italic">Registry Expansion</h3>
                                <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest mt-1">Institutional demographic trajectory</p>
                             </div>
                             <div className="flex items-center gap-4 md:gap-6">
                                <span className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#c5a059]" /> Students
                                </span>
                                <span className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#1a120b]" /> Faculty
                                </span>
                             </div>
                        </div>
                        <div className="h-64 md:h-80 w-full overflow-hidden">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={userGrowth} barGap={12}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                                    <Tooltip content={<GoldTooltip />} cursor={{ fill: '#f8fafc', radius: 12 }} />
                                    <Bar dataKey="students" fill="#c5a059" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="teachers" fill="#1a120b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Integrity Circle */}
                    <div className="premium-card p-6 md:p-10 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                        <div className="mb-8 md:mb-12">
                            <h3 className="text-lg md:text-xl font-black text-[#1a150e] tracking-tighter uppercase italic">System Health</h3>
                            <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest mt-1">Heuristic behavior distribution</p>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <div className="h-52 md:h-60 w-full mb-6 md:mb-8">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={integrityData}
                                            innerRadius={60}
                                            outerRadius={85}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {integrityData.map((_, index) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<GoldTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full space-y-3">
                                {integrityData.map((entry, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                            <span className="text-[#1a150e] text-[9px] font-black italic tracking-widest uppercase">{entry.name}</span>
                                        </div>
                                        <span className="text-[#c5a059] text-[10px] font-black italic">{entry.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    {/* Alerts Hub */}
                    <div className="bg-[#1a120b] border border-[#c5a059]/20 rounded-3xl md:rounded-[3rem] p-6 md:p-10 shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                         <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg md:text-xl font-black text-white italic tracking-tighter uppercase leading-none">Global <span className="text-[#c5a059]">Alerts</span></h3>
                            <Zap size={18} className="text-[#c5a059] animate-pulse" />
                         </div>
                         <div className="space-y-4">
                            <div className="flex items-start gap-4 p-5 md:p-6 bg-white/5 border border-white/5 rounded-2xl md:rounded-3xl hover:bg-white/10 transition-all cursor-default">
                                <AlertTriangle className="text-rose-500 shrink-0 mt-1" size={16} />
                                <div>
                                    <h4 className="font-black text-white text-xs md:text-sm italic uppercase tracking-tight">Security Anomalies</h4>
                                    <p className="text-slate-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-1 leading-relaxed">System detected unusual bypass attempts on Node Lagos-04.</p>
                                </div>
                            </div>
                            {stats.pendingApprovals > 0 && (
                                <div className="flex items-start gap-4 p-5 md:p-6 bg-[#c5a059]/10 border border-[#c5a059]/20 rounded-2xl md:rounded-3xl hover:bg-[#c5a059]/20 transition-all cursor-default">
                                    <Clock className="text-[#c5a059] shrink-0 mt-1" size={16} />
                                    <div>
                                        <h4 className="font-black text-[#c5a059] text-xs md:text-sm italic uppercase tracking-tight">Governance Required</h4>
                                        <p className="text-[#c5a059]/70 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-1 leading-relaxed">{stats.pendingApprovals} academic personnel awaiting registry authorization.</p>
                                    </div>
                                </div>
                            )}
                         </div>
                    </div>

                    {/* Cycle Management */}
                    <div className="premium-card p-6 md:p-10 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: '0.7s' }}>
                        <div className="relative z-10 flex flex-col h-full">
                            <h3 className="text-lg md:text-xl font-black text-[#1a150e] tracking-tighter uppercase italic mb-8 md:mb-10">Cycle Control</h3>
                            <div className="bg-slate-50 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 flex-1 flex flex-col justify-center">
                                <label className="block text-[#1a150e]/40 text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] mb-4">Academic Term Termination Node</label>
                                <input
                                    type="date"
                                    className="w-full h-12 md:h-14 px-4 md:px-6 bg-white border border-slate-200 rounded-xl md:rounded-2xl text-[#1a150e] text-xs md:text-sm font-black italic focus:border-[#c5a059] outline-none transition-all shadow-sm"
                                    value={stats.currentTermEndDate ? new Date(stats.currentTermEndDate).toISOString().split('T')[0] : ''}
                                    onChange={async (e) => {
                                        try {
                                            const newDate = e.target.value;
                                            await axios.post('https://educbt-pro-backend.onrender.com/school/term/update',
                                                { termEndDate: newDate },
                                                { headers: { Authorization: `Bearer ${token}` } }
                                            );
                                            toast.success('Registry Cycle Updated');
                                            setStats(prev => ({ ...prev, currentTermEndDate: newDate }));
                                        } catch {
                                            toast.error('Synchronization Failure');
                                        }
                                    }}
                                />
                                <div className="mt-6 md:mt-8 flex items-center gap-3 md:gap-4 p-4 bg-[#c5a059]/5 rounded-xl md:rounded-2xl border border-[#c5a059]/10">
                                    <Zap size={14} className="text-[#c5a059]" />
                                    <p className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase tracking-[0.1em] leading-relaxed">System will automatically initialize archive protocols upon target date reaching.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Insights Board */}
                <div className="premium-card p-10 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-lg font-black text-[#1a150e] uppercase italic tracking-tighter">AI Operational Advisor</h3>
                            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Real-time heuristic analysis results</p>
                        </div>
                        <Link to="/school/analytics" className="text-[#c5a059] text-[9px] font-black uppercase tracking-widest hover:underline flex items-center gap-2">
                             Full Heuristics <ArrowUpRight size={12} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {aiInsights.length > 0 ? aiInsights.map((insight, idx) => (
                            <div key={idx} className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl group hover:border-[#c5a059]/30 transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-2 h-2 rounded-full ${insight.priority === 'high' ? 'bg-rose-500 animate-pulse' : 'bg-[#c5a059]'}`} />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{insight.type}</span>
                                </div>
                                <h4 className="text-sm font-black text-[#1a150e] uppercase italic mb-2 leading-tight group-hover:text-[#c5a059] transition-colors">{insight.title}</h4>
                                <p className="text-slate-500 text-[10px] font-medium leading-relaxed italic">{insight.message}</p>
                            </div>
                        )) : (
                            <div className="col-span-full py-10 flex flex-col items-center justify-center text-center space-y-3">
                                <Activity className="text-slate-200" size={32} />
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">System idle. No operational anomalies detected in current node.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
