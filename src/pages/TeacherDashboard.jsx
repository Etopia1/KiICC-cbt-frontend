import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TeacherLayout from '../components/TeacherLayout';
import {
    BookOpen, CheckCircle, ChevronRight, Plus, ArrowUpRight, TrendingUp,
    Users, Clock, Activity, Play, Square, Eye, Edit3, Trash2,
    BarChart2, Award, FileText, RefreshCcw, Zap, MonitorPlay, Upload,
    UserCheck, AlertCircle, XCircle
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';

/* ── Mini components ─────────────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, sub, color = '#c5a059', onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white border border-[#ede3d4] rounded-3xl p-5 md:p-7 group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-[#c5a059]/30 ${onClick ? 'cursor-pointer' : ''}`}
    >
        <div className="absolute top-0 right-0 w-24 h-24 blur-[50px] rounded-full opacity-60 transition-opacity group-hover:opacity-100"
            style={{ background: color + '18' }} />
        <div className="relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-[#1a120b] flex items-center justify-center mb-4 border border-[#c5a059]/10 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Icon size={17} className="text-[#c5a059]" />
            </div>
            <p className="text-[#8a7564] text-[9px] font-black uppercase tracking-widest mb-1">{label}</p>
            <h3 className="text-3xl font-black text-[#1a150e] tracking-tighter italic mb-1">{value}</h3>
            {sub && <p className="text-[#a89282] text-[9px] font-bold uppercase tracking-widest">{sub}</p>}
        </div>
    </div>
);

const GoldTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#1a120b] border border-[#c5a059]/20 rounded-2xl px-5 py-3 shadow-2xl">
            <p className="text-[#c5a059] text-[9px] font-black uppercase tracking-widest mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="text-white font-black text-lg italic">
                    {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
                    <span className="text-[#c5a059] text-[10px] ml-1">{p.name}</span>
                </p>
            ))}
        </div>
    );
};

/* ── Status badge ─────────────────────────────────────────── */
const StatusBadge = ({ status, isActive }) => {
    if (isActive && status === 'active') return (
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-wide border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
        </span>
    );
    if (status === 'scheduled') return (
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-wide border border-amber-100">
            <Clock size={9} /> Scheduled
        </span>
    );
    if (status === 'ended') return (
        <span className="px-2.5 py-1 rounded-lg bg-[#f0e8da] text-[#8a7564] text-[9px] font-black uppercase tracking-wide border border-[#ede3d4]">
            Ended
        </span>
    );
    return (
        <span className="px-2.5 py-1 rounded-lg bg-[#f5efea] text-[#a89282] text-[9px] font-black uppercase tracking-wide border border-[#ede3d4]">
            Draft
        </span>
    );
};

/* ── Main Dashboard ───────────────────────────────────────── */
const TeacherDashboard = () => {
    const navigate  = useNavigate();
    const { token, user } = useSelector(state => state.auth);

    const [pendingStudents, setPendingStudents] = useState([]);
    const [exams,           setExams]           = useState([]);
    const [results,         setResults]         = useState([]);
    const [gradingCount,    setGradingCount]     = useState(0);
    const [loading,         setLoading]         = useState(true);
    const [approvingId,     setApprovingId]      = useState(null);
    const [togglingId,      setTogglingId]       = useState(null);
    const [deletingId,      setDeletingId]       = useState(null);
    const [deleteModal,     setDeleteModal]      = useState(null); // exam object to confirm delete

    /* ── Fetch everything ─────────────────────────────────── */
    const fetchAll = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [studRes, examRes, resultRes, gradingRes] = await Promise.allSettled([
                axios.get('https://educbt-pro-backend.onrender.com/school/teacher/pending-students',  { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('https://educbt-pro-backend.onrender.com/exam/teacher/all',                 { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('https://educbt-pro-backend.onrender.com/exam/results',                     { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('https://educbt-pro-backend.onrender.com/exam/grading/list',               { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (studRes.status   === 'fulfilled') setPendingStudents(studRes.value.data   || []);
            if (examRes.status   === 'fulfilled') setExams          (examRes.value.data   || []);
            if (resultRes.status === 'fulfilled') setResults        (resultRes.value.data || []);
            if (gradingRes.status === 'fulfilled') setGradingCount(gradingRes.value.data?.length || 0);
        } catch (e) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    /* ── Computed stats ───────────────────────────────────── */
    const liveExams     = exams.filter(e => e.isActive && e.status === 'active').length;
    const totalStudents = new Set(results.map(r => r.studentId)).size;
    const avgScore      = results.length
        ? (results.reduce((a, r) => a + (r.percentage || 0), 0) / results.length).toFixed(1)
        : '—';
    const passRate      = results.length
        ? ((results.filter(r => r.percentage >= 50).length / results.length) * 100).toFixed(0) + '%'
        : '—';

    /* ── Chart: avg score per exam (last 7) ───────────────── */
    const chartData = exams.slice(0, 7).map(e => {
        const er  = results.filter(r => r.examTitle === e.title || r.examId === e._id);
        const avg = er.length ? (er.reduce((a, r) => a + (r.percentage || 0), 0) / er.length) : 0;
        return { name: e.title?.slice(0, 10), avg: parseFloat(avg.toFixed(1)) };
    }).reverse();

    /* ── Actions ──────────────────────────────────────────── */
    const handleApprove = async (studentId) => {
        setApprovingId(studentId);
        try {
            await axios.post(`https://educbt-pro-backend.onrender.com/school/teacher/approve-student/${studentId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Student verified ✓');
            setPendingStudents(prev => prev.filter(s => s._id !== studentId));
        } catch {
            toast.error('Approval failed');
        } finally {
            setApprovingId(null);
        }
    };

    const handleToggleExam = async (exam) => {
        setTogglingId(exam._id);
        const newActive = !exam.isActive;
        const newStatus = newActive ? 'active' : 'ended';
        try {
            await axios.patch(`https://educbt-pro-backend.onrender.com/exam/${exam._id}/status`, {
                isActive: newActive,
                status:   newStatus
            }, { headers: { Authorization: `Bearer ${token}` } });
            setExams(prev => prev.map(e =>
                e._id === exam._id ? { ...e, isActive: newActive, status: newStatus } : e
            ));
            toast.success(newActive ? `"${exam.title}" is now LIVE 🟢` : `"${exam.title}" has been stopped`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Toggle failed');
        } finally {
            setTogglingId(null);
        }
    };

    const handleDeleteExam = async (exam) => {
        setDeletingId(exam._id);
        try {
            await axios.delete(`https://educbt-pro-backend.onrender.com/exam/${exam._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExams(prev => prev.filter(e => e._id !== exam._id));
            toast.success(`"${exam.title}" deleted`);
            setDeleteModal(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed');
        } finally {
            setDeletingId(null);
        }
    };

    /* ── Render ───────────────────────────────────────────── */
    return (
        <TeacherLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-24 font-outfit">

                {/* ── Page Header ───────── */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 bg-white border border-[#ede3d4] rounded-full px-4 py-1.5 shadow-sm">
                            <Activity size={12} className="text-[#c5a059]" />
                            <span className="text-[#a18146] text-[9px] font-black uppercase tracking-widest">
                                {liveExams > 0 ? `${liveExams} Exam${liveExams > 1 ? 's' : ''} Live` : 'No Live Exams'}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-[#1a150e] leading-none tracking-tighter uppercase italic">
                            Faculty <span className="gold-text-gradient">Dashboard</span>
                        </h1>
                        <p className="text-[#8a7564] text-sm font-medium">
                            Welcome back, <span className="text-[#1a150e] font-black">{user?.fullName || 'Educator'}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchAll}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#ede3d4] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#8a7564] hover:text-[#c5a059] hover:border-[#c5a059]/30 transition-all shadow-sm"
                        >
                            <RefreshCcw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                        <button
                            onClick={() => navigate('/teacher/tests/create')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#1a120b] text-[#c5a059] rounded-2xl text-[10px] font-black uppercase tracking-widest border border-[#c5a059]/20 hover:bg-black transition-all shadow-lg"
                        >
                            <Plus size={13} /> New Exam
                        </button>
                    </div>
                </div>

                {/* ── Stat Cards ────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Exams"    value={exams.length}       icon={BookOpen}   sub="created"                onClick={() => navigate('/teacher/tests')} />
                    <StatCard label="Pending Grade"   value={gradingCount}       icon={CheckCircle} sub="essays to mark"          onClick={() => navigate('/teacher/grading')} color="#D4AF37" />
                    <StatCard label="Avg Score"       value={`${avgScore}%`}     icon={TrendingUp} sub="all submissions"        onClick={() => navigate('/teacher/analytics')} />
                    <StatCard label="Pass Rate"       value={passRate}           icon={Award}      sub="above 50%"              onClick={() => navigate('/teacher/analytics')} />
                </div>

                {/* ── Pending Students ──── */}
                {pendingStudents.length > 0 && (
                    <div className="bg-[#1a120b] border border-[#c5a059]/20 rounded-3xl p-6 md:p-10 shadow-2xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#c5a059]/10 border border-[#c5a059]/20 flex items-center justify-center text-[#c5a059]">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white italic uppercase">Pending Approvals</h3>
                                    <p className="text-[#6b5a4a] text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                        {pendingStudents.length} student{pendingStudents.length > 1 ? 's' : ''} awaiting verification
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {pendingStudents.map(student => (
                                <div key={student._id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/8 hover:border-[#c5a059]/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059] font-black text-sm uppercase italic border border-[#c5a059]/20">
                                            {student.fullName?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white italic truncate max-w-[120px]">{student.fullName}</p>
                                            <p className="text-[9px] text-[#6b5a4a] font-bold uppercase tracking-widest">{student.info?.classLevel || student.classLevel}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleApprove(student._id)}
                                        disabled={approvingId === student._id}
                                        className="h-8 px-3 bg-[#c5a059] hover:bg-[#e2c08d] text-[#1a120b] text-[9px] font-black rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 uppercase tracking-wide shrink-0"
                                    >
                                        {approvingId === student._id
                                            ? <span className="w-3.5 h-3.5 border-2 border-[#1a120b]/30 border-t-[#1a120b] rounded-full animate-spin" />
                                            : <><UserCheck size={11} /> Approve</>
                                        }
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Main Grid ─────────── */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

                    {/* Performance Chart (3/5) */}
                    <div className="xl:col-span-3 bg-white border border-[#ede3d4] rounded-3xl p-6 md:p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-base font-black text-[#1a150e] uppercase italic tracking-tight">Score Performance</h3>
                                <p className="text-[#a89282] text-[10px] font-bold uppercase tracking-widest mt-0.5">Average % per exam</p>
                            </div>
                            <button onClick={() => navigate('/teacher/analytics')} className="text-[9px] font-black text-[#c5a059] uppercase tracking-widest bg-[#c5a059]/5 px-3 py-1.5 rounded-xl border border-[#c5a059]/10 hover:bg-[#c5a059]/10 transition-all flex items-center gap-1">
                                <BarChart2 size={10} /> Full Analytics
                            </button>
                        </div>
                        <div className="h-52 w-full">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ left: -20, right: 10 }}>
                                        <defs>
                                            <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#c5a059" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#c5a059" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0e8da" />
                                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#a89282', fontWeight: 900 }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#a89282', fontWeight: 900 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<GoldTooltip />} />
                                        <Area type="monotone" dataKey="avg" name="Avg %" stroke="#c5a059" fill="url(#goldGrad)" strokeWidth={2.5} dot={{ fill: '#c5a059', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#c5a059' }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-[#a89282] text-[10px] font-bold uppercase tracking-widest">No results data yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions (2/5) */}
                    <div className="xl:col-span-2 grid grid-rows-3 gap-4">
                        {[
                            { label: 'Create New Exam',     icon: Plus,        path: '/teacher/tests/create',    color: '#1a120b', text: '#c5a059' },
                            { label: 'Upload Questions',    icon: Upload,       path: '/teacher/tests/create',    color: '#fff9f2', text: '#1a150e', border: true },
                            { label: 'Monitor Live Exams',  icon: MonitorPlay,  path: '/teacher/tests',           color: '#fff9f2', text: '#1a150e', border: true },
                        ].map(({ label, icon: Icon, path, color, text, border }) => (
                            <button
                                key={label}
                                onClick={() => navigate(path)}
                                className="w-full h-full min-h-[72px] rounded-2xl flex items-center gap-4 px-6 font-black text-sm uppercase tracking-tight transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-md text-left"
                                style={{
                                    background: color,
                                    color: text,
                                    border: border ? '1.5px solid #ede3d4' : '1px solid rgba(197,160,89,0.2)'
                                }}
                            >
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: text + '15' }}>
                                    <Icon size={16} style={{ color: text === '#c5a059' ? '#c5a059' : '#1a150e' }} />
                                </div>
                                <span className="italic">{label}</span>
                                <ChevronRight size={14} className="ml-auto opacity-40" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Exam Cards ────────── */}
                <div className="bg-white border border-[#ede3d4] rounded-3xl overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 md:px-8 py-5 border-b border-[#f0e8da]">
                        <div>
                            <h3 className="text-base font-black text-[#1a150e] uppercase italic tracking-tight">My Exams</h3>
                            <p className="text-[#a89282] text-[9px] font-bold uppercase tracking-widest">{exams.length} total · {liveExams} live now</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate('/teacher/tests/create')}
                                className="flex items-center gap-2 px-4 py-2 bg-[#1a120b] text-[#c5a059] rounded-xl text-[9px] font-black uppercase tracking-widest border border-[#c5a059]/20 hover:bg-black transition-all"
                            >
                                <Plus size={11} /> Create
                            </button>
                            <button
                                onClick={() => navigate('/teacher/tests')}
                                className="flex items-center gap-2 px-4 py-2 bg-[#f5efea] text-[#6b5a4a] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#ede3d4] transition-all"
                            >
                                View All <ChevronRight size={10} />
                            </button>
                        </div>
                    </div>

                    {/* Table-style list — responsive */}
                    {loading ? (
                        <div className="py-16 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-[#c5a059]/20 border-t-[#c5a059] rounded-full animate-spin" />
                        </div>
                    ) : exams.length === 0 ? (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-[#f5efea] rounded-2xl flex items-center justify-center">
                                <BookOpen size={24} className="text-[#c4b09a]" />
                            </div>
                            <p className="text-[#a89282] text-[10px] font-black uppercase tracking-widest">No exams yet</p>
                            <button
                                onClick={() => navigate('/teacher/tests/create')}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#1a120b] text-[#c5a059] rounded-2xl text-[10px] font-black uppercase tracking-widest border border-[#c5a059]/20 hover:bg-black transition-all"
                            >
                                <Plus size={12} /> Create Your First Exam
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#f0e8da]">
                            {exams.slice(0, 10).map(exam => {
                                const examResults = results.filter(r => r.examTitle === exam.title || r.examId === exam._id);
                                const examAvg = examResults.length
                                    ? (examResults.reduce((a, r) => a + (r.percentage || 0), 0) / examResults.length).toFixed(0)
                                    : null;

                                return (
                                    <div key={exam._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 md:px-8 py-4 hover:bg-[#fdf9f4] transition-all group">

                                        {/* Left: subject letter + info */}
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className="w-10 h-10 bg-[#1a120b] text-[#c5a059] rounded-2xl flex items-center justify-center font-black text-sm uppercase italic border border-[#c5a059]/10 group-hover:rotate-6 transition-all shrink-0">
                                                {exam.subject?.charAt(0) || 'E'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-sm font-black text-[#1a150e] uppercase italic truncate group-hover:text-[#c5a059] transition-colors">
                                                    {exam.title}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                                                    <span className="text-[9px] text-[#c5a059] font-black uppercase tracking-widest">{exam.subject}</span>
                                                    <span className="w-1 h-1 rounded-full bg-[#c4b09a]" />
                                                    <span className="text-[9px] text-[#a89282] font-bold uppercase">{exam.classLevel || 'All'}</span>
                                                    <span className="w-1 h-1 rounded-full bg-[#c4b09a]" />
                                                    <span className="text-[9px] text-[#a89282] font-bold uppercase">{exam.questions?.length} Q</span>
                                                    <span className="w-1 h-1 rounded-full bg-[#c4b09a]" />
                                                    <span className="text-[9px] text-[#a89282] font-bold uppercase">{exam.durationMinutes} min</span>
                                                    {examAvg !== null && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-[#c4b09a]" />
                                                            <span className={`text-[9px] font-black uppercase ${Number(examAvg) >= 50 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                                avg {examAvg}%
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: status + actions */}
                                        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                                            <StatusBadge status={exam.status} isActive={exam.isActive} />

                                            {/* Start/Stop */}
                                            <button
                                                onClick={() => handleToggleExam(exam)}
                                                disabled={togglingId === exam._id}
                                                title={exam.isActive ? 'Stop exam' : 'Start exam'}
                                                className={`h-8 px-3 rounded-xl text-[9px] font-black uppercase tracking-wide flex items-center gap-1.5 transition-all border disabled:opacity-50
                                                    ${exam.isActive
                                                        ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                                                        : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                                                    }`}
                                            >
                                                {togglingId === exam._id
                                                    ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                                    : exam.isActive ? <><Square size={9} /> Stop</> : <><Play size={9} /> Start</>
                                                }
                                            </button>

                                            {/* Monitor */}
                                            {exam.isActive && (
                                                <button
                                                    onClick={() => navigate(`/teacher/exam-monitor/${exam._id}`)}
                                                    className="h-8 px-3 bg-[#f5efea] text-[#6b5a4a] border border-[#ede3d4] rounded-xl text-[9px] font-black uppercase tracking-wide flex items-center gap-1.5 hover:bg-[#ede3d4] transition-all"
                                                    title="Monitor students"
                                                >
                                                    <Eye size={9} /> Monitor
                                                </button>
                                            )}

                                            {/* Edit */}
                                            <button
                                                onClick={() => navigate(`/teacher/tests/create?edit=${exam._id}`)}
                                                className="h-8 w-8 bg-[#f5efea] text-[#6b5a4a] border border-[#ede3d4] rounded-xl flex items-center justify-center hover:bg-[#c5a059] hover:text-white hover:border-[#c5a059] transition-all"
                                                title="Edit exam"
                                            >
                                                <Edit3 size={11} />
                                            </button>

                                            {/* Delete */}
                                            <button
                                                onClick={() => setDeleteModal(exam)}
                                                className="h-8 w-8 bg-[#f5efea] text-[#a89282] border border-[#ede3d4] rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all"
                                                title="Delete exam"
                                            >
                                                <Trash2 size={11} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Show more */}
                    {exams.length > 10 && (
                        <div className="px-8 py-4 border-t border-[#f0e8da]">
                            <button
                                onClick={() => navigate('/teacher/tests')}
                                className="text-[10px] font-black text-[#c5a059] uppercase tracking-widest hover:underline"
                            >
                                View all {exams.length} exams →
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Bottom grid ───────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Recent Results */}
                    <div className="bg-white border border-[#ede3d4] rounded-3xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-[#f0e8da] flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black text-[#1a150e] uppercase italic">Recent Results</h3>
                                <p className="text-[#a89282] text-[9px] font-bold uppercase tracking-widest">{results.length} total submissions</p>
                            </div>
                            <button onClick={() => navigate('/teacher/analytics')} className="text-[9px] font-black text-[#c5a059] uppercase tracking-widest hover:underline flex items-center gap-1">
                                Analytics <ArrowUpRight size={10} />
                            </button>
                        </div>
                        <div className="divide-y divide-[#f0e8da] max-h-72 overflow-y-auto">
                            {results.length === 0 ? (
                                <p className="px-6 py-10 text-center text-[#a89282] text-[10px] font-bold uppercase tracking-widest">No results yet</p>
                            ) : results.slice(0, 8).map((r, i) => (
                                <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-[#fdf9f4] transition-all">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-7 h-7 rounded-xl bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059] font-black text-[10px] shrink-0">
                                            {r.studentName?.charAt(0) || 'S'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-[#1a150e] uppercase italic truncate">{r.studentName || 'Student'}</p>
                                            <p className="text-[9px] text-[#a89282] font-bold truncate">{r.examTitle || '—'}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border shrink-0 ml-2
                                        ${r.percentage >= 70 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                          r.percentage >= 50 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                          'bg-rose-50 text-rose-600 border-rose-100'}`}
                                    >
                                        {(r.percentage || 0).toFixed(0)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation shortcuts */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Attendance',    icon: UserCheck,    path: '/teacher/attendance',       desc: 'Mark & track student attendance' },
                            { label: 'Grading Matrix', icon: CheckCircle,  path: '/teacher/grading',          desc: 'Bulk grade automated spreadsheet' },
                            { label: 'Results',       icon: FileText,     path: '/teacher/results',          desc: 'View all published results' },
                            { label: 'Analytics',     icon: BarChart2,    path: '/teacher/analytics',        desc: 'Charts, leaderboards & trends' },
                        ].map(({ label, icon: Icon, path, desc }) => (
                            <button
                                key={label}
                                onClick={() => navigate(path)}
                                className="bg-white border border-[#ede3d4] rounded-2xl p-5 text-left hover:border-[#c5a059]/30 hover:shadow-md transition-all group active:scale-[0.98]"
                            >
                                <div className="w-9 h-9 rounded-xl bg-[#1a120b] flex items-center justify-center mb-3 border border-[#c5a059]/10 group-hover:scale-110 transition-transform">
                                    <Icon size={15} className="text-[#c5a059]" />
                                </div>
                                <p className="text-sm font-black text-[#1a150e] uppercase italic tracking-tight">{label}</p>
                                <p className="text-[9px] text-[#a89282] font-bold mt-1 leading-relaxed normal-case">{desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Delete Confirm Modal ── */}
            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !deletingId && setDeleteModal(null)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div
                        className="relative bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-5">
                            <Trash2 size={24} className="text-rose-500" />
                        </div>
                        <h3 className="text-lg font-black text-[#1a150e] uppercase italic text-center mb-2">Delete Exam?</h3>
                        <p className="text-[#8a7564] text-sm text-center mb-6 normal-case font-medium">
                            "<span className="font-black text-[#1a150e]">{deleteModal.title}</span>" will be permanently deleted. This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModal(null)}
                                disabled={deletingId}
                                className="flex-1 py-3 border border-[#ede3d4] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#8a7564] hover:bg-[#f5efea] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteExam(deleteModal)}
                                disabled={deletingId === deleteModal._id}
                                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2"
                            >
                                {deletingId === deleteModal._id
                                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <><Trash2 size={12} /> Delete</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </TeacherLayout>
    );
};

export default TeacherDashboard;
