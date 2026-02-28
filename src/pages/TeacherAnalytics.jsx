import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import TeacherLayout from '../components/TeacherLayout';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
    TrendingUp, Award, Users, Download, RefreshCcw,
    FileText, Trophy, Target, Activity, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

const GOLD   = '#c5a059';
const DARK   = '#1a120b';
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

const StatCard = ({ label, value, icon: Icon, sub, color = 'gold' }) => (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm group hover:shadow-md transition-all relative overflow-hidden">
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

const TeacherAnalytics = () => {
    const { token } = useSelector(state => state.auth);
    const [exams, setExams]       = useState([]);
    const [results, setResults]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [filter, setFilter]     = useState('all'); // all | subject

    // ── Fetch all data ────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [examRes, resultRes] = await Promise.all([
                axios.get('https://educbt-pro-backend.onrender.com/exam/teacher/all', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('https://educbt-pro-backend.onrender.com/exam/results', { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            setExams(examRes.data || []);
            setResults(resultRes.data || []);
        } catch (err) {
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Computed stats ────────────────────────────────────────────
    const totalStudents = new Set(results.map(r => r.studentId || r.userId)).size;
    const totalExams    = exams.length;
    const avgScore      = results.length
        ? (results.reduce((a, r) => a + (r.percentage || 0), 0) / results.length).toFixed(1)
        : 0;
    const passRate      = results.length
        ? ((results.filter(r => r.percentage >= 50).length / results.length) * 100).toFixed(1)
        : 0;

    // ── Charts data ───────────────────────────────────────────────

    // 1. Score distribution chart (0-10, 11-20, ..., 91-100)
    const scoreDistribution = Array.from({ length: 10 }, (_, i) => {
        const low = i * 10, high = low + 9;
        return {
            range: `${low}-${high}`,
            count: results.filter(r => r.percentage >= low && r.percentage <= high).length
        };
    });

    // 2. Pass/fail pie
    const passed = results.filter(r => r.percentage >= 50).length;
    const failed  = results.length - passed;
    const passFailData = [
        { name: 'Passed', value: passed },
        { name: 'Failed', value: failed },
    ];

    // 3. Performance trend (group by exam creation date)
    const trendData = exams
        .filter(e => e.totalMarks)
        .slice(0, 10)
        .map(e => {
            const examResults = results.filter(r => r.examId === e._id || r.examTitle === e.title);
            const avg = examResults.length
                ? (examResults.reduce((a, r) => a + (r.percentage || 0), 0) / examResults.length)
                : 0;
            return {
                name: e.title?.slice(0, 12) + '...',
                avgScore: avg.toFixed(1),
                submissions: examResults.length,
            };
        });

    // 4. Per-subject comparison
    const subjects = [...new Set(exams.map(e => e.subject))];
    const subjectData = subjects.map(sub => {
        const subResults = results.filter(r => r.subject === sub);
        const avg = subResults.length
            ? (subResults.reduce((a, r) => a + (r.percentage || 0), 0) / subResults.length)
            : 0;
        return { subject: sub || 'Unknown', avgScore: avg.toFixed(1), count: subResults.length };
    });

    // 5. Leaderboard (top 10 students by avg score)
    const studentMap = {};
    results.forEach(r => {
        const id = r.studentId || r.userId || r.studentName;
        if (!id) return;
        if (!studentMap[id]) studentMap[id] = { name: r.studentName || 'Student', scores: [] };
        studentMap[id].scores.push(r.percentage || 0);
    });
    const leaderboard = Object.values(studentMap)
        .map(s => ({ name: s.name, avg: (s.scores.reduce((a, b) => a + b, 0) / s.scores.length).toFixed(1), exams: s.scores.length }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 10);

    // ── Export helpers ────────────────────────────────────────────
    const exportPDF = () => {
        try {
            const doc = new jsPDF();

            // Title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(20);
            doc.setTextColor(26, 18, 11);
            doc.text('Teacher Analytics Report', 14, 22);

            // Subtitle
            doc.setFontSize(10);
            doc.setTextColor(138, 117, 100);
            doc.text(`Generated: ${new Date().toLocaleString()}  |  Total Results: ${results.length}`, 14, 30);

            // Summary row
            doc.setFontSize(11);
            doc.setTextColor(26, 18, 11);
            doc.text(`Avg Score: ${avgScore}%   Pass Rate: ${passRate}%   Exams: ${totalExams}   Students: ${totalStudents}`, 14, 40);

            autoTable(doc, {
                startY: 48,
                head: [['#', 'Student', 'Exam', 'Subject', 'Score %', 'Marks', 'Grade']],
                body: results.map((r, i) => [
                    i + 1,
                    r.studentName || '—',
                    r.examTitle   || '—',
                    r.subject     || '—',
                    `${(r.percentage || 0).toFixed(1)}%`,
                    `${r.score || 0} / ${r.totalMarks || 100}`,
                    r.percentage >= 70 ? 'A' : r.percentage >= 60 ? 'B' : r.percentage >= 50 ? 'C' : 'F',
                ]),
                theme: 'striped',
                headStyles: { fillColor: [26, 18, 11], textColor: [197, 160, 89], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [250, 247, 243] },
                styles: { fontSize: 9 },
                columnStyles: { 0: { cellWidth: 8 } },
            });

            // Output as blob → triggers standard Save dialog  
            const blob = doc.output('blob');
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `analytics_report_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 3000);

            toast.success(`PDF exported — ${results.length} results`);
        } catch (err) {
            console.error('PDF error:', err);
            toast.error('PDF export failed: ' + err.message);
        }
    };


    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(results.map(r => ({
            'Student Name': r.studentName || '—',
            'Exam Title':   r.examTitle || '—',
            'Score':        r.score || 0,
            'Total Marks':  r.totalMarks || 0,
            'Percentage':   `${(r.percentage || 0).toFixed(1)}%`,
            'Submitted At': r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—',
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Results');
        const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([buf], { type: 'application/octet-stream' }), 'analytics_results.xlsx');
        toast.success('Excel exported');
    };

    if (loading) return (
        <TeacherLayout>
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-16 h-16 rounded-2xl bg-[#1a120b] flex items-center justify-center border border-[#c5a059]/10 animate-bounce">
                    <Activity size={32} className="text-[#c5a059]" />
                </div>
            </div>
        </TeacherLayout>
    );

    return (
        <TeacherLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-20">

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 bg-white border border-slate-100 rounded-full px-4 py-1.5 shadow-sm">
                            <TrendingUp size={12} className="text-[#c5a059]" />
                            <span className="text-[10px] font-black text-[#1a120b] uppercase tracking-widest">Analytics</span>
                        </div>
                        <h1 className="text-3xl font-black text-[#1a150e] uppercase italic tracking-tight">
                            Performance <span className="gold-text-gradient">Analytics</span>
                        </h1>
                        <p className="text-slate-400 text-sm">Live data from all your exams and students</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#c5a059] hover:border-[#c5a059]/30 transition-all shadow-sm">
                            <RefreshCcw size={14} /> Refresh
                        </button>
                        <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm">
                            <FileText size={14} /> PDF
                        </button>
                        <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-[#1a120b] border border-[#c5a059]/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#c5a059] hover:bg-black transition-all shadow-sm">
                            <Download size={14} /> Excel
                        </button>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard label="Total Exams" value={totalExams} icon={BookOpen} sub="created" />
                    <StatCard label="Students Tested" value={totalStudents} icon={Users} sub="unique students" />
                    <StatCard label="Avg Score" value={`${avgScore}%`} icon={Target} sub="across all exams" />
                    <StatCard label="Pass Rate" value={`${passRate}%`} icon={Award} sub="above 50% threshold" />
                </div>

                {/* Row 1: Trend + Pass/Fail */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Performance Trend */}
                    <div className="xl:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                        <h2 className="text-sm font-black text-[#1a150e] uppercase italic tracking-tight mb-1">Score Trend Across Exams</h2>
                        <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-6">Average % per exam</p>
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={trendData} margin={{ left: -20 }}>
                                <defs>
                                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#aaa' }} />
                                <YAxis tick={{ fontSize: 10, fill: '#aaa' }} domain={[0, 100]} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="avgScore" name="Avg %" stroke={GOLD} fill="url(#goldGrad)" strokeWidth={2} dot={{ fill: GOLD, r: 4 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Pass / Fail Pie */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                        <h2 className="text-sm font-black text-[#1a150e] uppercase italic tracking-tight mb-1">Pass vs Fail</h2>
                        <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-4">All exam results</p>
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie data={passFailData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                                    {passFailData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-6 mt-2">
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: COLORS[0] }} /><span className="text-[9px] font-black text-slate-500 uppercase">Passed ({passed})</span></div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: COLORS[1] }} /><span className="text-[9px] font-black text-slate-500 uppercase">Failed ({failed})</span></div>
                        </div>
                    </div>
                </div>

                {/* Row 2: Score Distribution + Subject Comparison */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Score Distribution */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                        <h2 className="text-sm font-black text-[#1a150e] uppercase italic tracking-tight mb-1">Score Distribution</h2>
                        <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-6">Number of students per score range</p>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={scoreDistribution} margin={{ left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe0" />
                                <XAxis dataKey="range" tick={{ fontSize: 9, fill: '#aaa' }} />
                                <YAxis tick={{ fontSize: 10, fill: '#aaa' }} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" name="Students" fill={GOLD} radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Subject Comparison */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                        <h2 className="text-sm font-black text-[#1a150e] uppercase italic tracking-tight mb-1">Subject Performance</h2>
                        <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-6">Average score per subject</p>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={subjectData} layout="vertical" margin={{ left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe0" />
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: '#aaa' }} />
                                <YAxis type="category" dataKey="subject" tick={{ fontSize: 9, fill: '#555' }} width={80} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="avgScore" name="Avg %" fill={GOLD} radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Row 3: Submission volume (line) */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                    <h2 className="text-sm font-black text-[#1a150e] uppercase italic tracking-tight mb-1">Submission Volume</h2>
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-6">How many students submitted each exam</p>
                    <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={trendData} margin={{ left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe0" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#aaa' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#aaa' }} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="submissions" name="Submissions" stroke={GOLD} strokeWidth={2} dot={{ fill: GOLD, r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Leaderboard */}
                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                    <div className="bg-[#1a120b] px-8 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Trophy size={20} className="text-[#c5a059]" />
                            <h2 className="text-sm font-black text-white uppercase italic tracking-widest">Student Leaderboard</h2>
                        </div>
                        <span className="text-[9px] text-[#c5a059] font-black uppercase tracking-widest">Top {leaderboard.length} Students</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                <tr>
                                    <th className="px-8 py-4">Rank</th>
                                    <th className="px-8 py-4">Student</th>
                                    <th className="px-8 py-4 text-center">Exams Taken</th>
                                    <th className="px-8 py-4 text-center">Avg Score</th>
                                    <th className="px-8 py-4 text-right">Medal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {leaderboard.length === 0 ? (
                                    <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-400 text-sm">No result data yet. Students must complete exams first.</td></tr>
                                ) : leaderboard.map((s, i) => (
                                    <tr key={i} className={`hover:bg-slate-50 transition-all ${i < 3 ? 'bg-amber-50/30' : ''}`}>
                                        <td className="px-8 py-4">
                                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black
                                                ${i === 0 ? 'bg-yellow-100 text-yellow-600' :
                                                  i === 1 ? 'bg-slate-100 text-slate-500' :
                                                  i === 2 ? 'bg-orange-100 text-orange-600' :
                                                  'bg-slate-50 text-slate-400'}`}>
                                                {i + 1}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059] font-black text-[10px]">
                                                    {s.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <span className="text-sm font-black text-[#1a150e] uppercase italic">{s.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <span className="text-slate-500 font-bold text-sm">{s.exams}</span>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black border
                                                ${s.avg >= 70 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                  s.avg >= 50 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                  'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                {s.avg}%
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right text-xl">
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '⭐'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Exam Quick Stats Table */}
                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                    <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-sm font-black text-[#1a150e] uppercase italic tracking-tight">Exam Performance Summary</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                <tr>
                                    <th className="px-8 py-4">Exam</th>
                                    <th className="px-8 py-4">Subject</th>
                                    <th className="px-8 py-4 text-center">Submissions</th>
                                    <th className="px-8 py-4 text-center">Avg Score</th>
                                    <th className="px-8 py-4 text-center">Pass Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {exams.map(exam => {
                                    const er = results.filter(r => r.examTitle === exam.title || r.examId === exam._id);
                                    const avg = er.length ? (er.reduce((a, r) => a + (r.percentage || 0), 0) / er.length).toFixed(1) : '—';
                                    const pr = er.length ? ((er.filter(r => r.percentage >= 50).length / er.length) * 100).toFixed(0) : '—';
                                    return (
                                        <tr key={exam._id} className="hover:bg-slate-50 transition-all">
                                            <td className="px-8 py-4">
                                                <p className="text-sm font-black text-[#1a150e] uppercase italic">{exam.title}</p>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className="text-[10px] font-black text-[#c5a059] uppercase">{exam.subject}</span>
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                <span className="text-slate-500 font-bold">{er.length}</span>
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                <span className="font-black text-[#1a150e]">{avg}{avg !== '—' ? '%' : ''}</span>
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black border
                                                    ${pr !== '—' && Number(pr) >= 70 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                      pr !== '—' && Number(pr) >= 50 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                      pr !== '—' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                      'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                    {pr}{pr !== '—' ? '%' : ''}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {exams.length === 0 && (
                                    <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-400 text-sm">No exams found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </TeacherLayout>
    );
};

export default TeacherAnalytics;
