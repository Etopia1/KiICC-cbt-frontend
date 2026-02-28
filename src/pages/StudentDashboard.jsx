import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle, AlertCircle, Play, FileText, Bell, GraduationCap, ChevronRight, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import StudentLayout from '../components/StudentLayout';

const StatCard = ({ title, value, icon: Icon, description }) => (
    <div className="premium-card p-5 md:p-8 group relative overflow-hidden animate-fade-in-up">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#c5a059]/5 blur-[60px] rounded-full group-hover:bg-[#c5a059]/10 transition-colors" />
        <div className="relative z-10">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-[#1a120b] flex items-center justify-center mb-4 md:mb-6 border border-[#c5a059]/10 shadow-lg group-hover:scale-110 transition-transform duration-500">
                <Icon size={18} className="text-[#c5a059]" />
            </div>
            <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] mb-1 md:mb-2">{title}</p>
            <h3 className="text-3xl md:text-4xl font-black text-[#1a150e] tracking-tighter italic uppercase mb-1 md:mb-2 group-hover:gold-text-gradient transition-all">{value}</h3>
            <p className="text-slate-400 text-[8px] md:text-[9px] font-bold uppercase tracking-widest leading-none">{description}</p>
        </div>
    </div>
);

const StudentDashboard = () => {
    const { token, user } = useSelector((state) => state.auth);
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [view, setView] = useState('exams');
    const [results, setResults] = useState([]);

    useEffect(() => {
        if (token) {
            fetchExams();
            fetchResults();
        }
    }, [token]);

    const fetchExams = async () => {
        try {
            const res = await axios.get('https://educbt-pro-backend.onrender.com/exam/student', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExams(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Fetch exams error:", error);
            setLoading(false);
        }
    };

    const fetchResults = async () => {
        try {
            const res = await axios.get('https://educbt-pro-backend.onrender.com/exam/results', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResults(res.data);
        } catch (error) {
            console.error("Fetch results error:", error);
        }
    };

    return (
        <StudentLayout>
            <div className="max-w-7xl mx-auto space-y-12 pb-20 font-outfit">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 py-2 md:py-4">
                    <div className="space-y-3 animate-fade-in-up">
                        <div className="inline-flex items-center gap-3 bg-white border border-slate-100 rounded-full px-4 py-2 shadow-sm">
                            <Activity size={14} className="text-[#c5a059]" />
                            <span className="text-[#a18146] text-[8px] md:text-[10px] font-black uppercase tracking-[0.25em]">Session Continuity: High</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-[#1a150e] leading-none tracking-tighter uppercase italic">
                            Student <span className="gold-text-gradient">Portal</span>
                        </h1>
                        <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">Candidate: <span className="text-[#1a150e] font-black">{user?.fullName || 'Academic User'}</span>. Registry ID Verified.</p>
                    </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    <StatCard title="Active Vault" value={exams.length} icon={BookOpen} description="Available Assessments" />
                    <StatCard title="Archived" value={results.length} icon={CheckCircle} description="Completed Sessions" />
                    <StatCard title="System Alerts" value="03" icon={Bell} description="Priority Notifications" />
                </div>

                {/* View Controller */}
                <div className="flex bg-white border border-slate-100 p-1 rounded-xl md:rounded-2xl w-full sm:w-fit shadow-sm animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <button
                        onClick={() => setView('exams')}
                        className={`flex-1 sm:flex-none px-4 md:px-8 py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${view === 'exams' ? 'bg-[#1a120b] text-[#c5a059] shadow-lg shadow-black/5' : 'text-slate-400 hover:text-[#1a150e]'}`}
                    >
                        Availability List
                    </button>
                    <button
                        onClick={() => setView('results')}
                        className={`flex-1 sm:flex-none px-4 md:px-8 py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${view === 'results' ? 'bg-[#1a120b] text-[#c5a059] shadow-lg shadow-black/5' : 'text-slate-400 hover:text-[#1a150e]'}`}
                    >
                        Historical Data
                    </button>
                </div>

                {view === 'exams' ? (
                    <div className="space-y-8 md:space-y-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {loading ? (
                                [1, 2, 3].map(i => <div key={i} className="premium-card h-64 border-dashed border-slate-200 animate-pulse" />)
                            ) : exams.length === 0 ? (
                                <div className="col-span-full py-16 md:py-24 text-center rounded-[2rem] md:rounded-[3rem] bg-slate-50 border border-dashed border-slate-200">
                                    <div className="w-12 md:w-16 h-12 md:h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-sm">
                                        <BookOpen size={20} className="text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] italic px-4">No active assessment nodes found.</p>
                                </div>
                            ) : (
                                exams.map((exam, idx) => (
                                    <div 
                                        key={exam._id} 
                                        className="premium-card p-6 md:p-10 group relative animate-fade-in-up hover:-translate-y-2 transition-all duration-500"
                                        style={{ animationDelay: `${0.1 * idx}s` }}
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#c5a059]/5 blur-[60px] rounded-full group-hover:bg-[#c5a059]/10 transition-colors" />
                                        
                                        <div className="flex justify-between items-start mb-6 md:mb-8 relative z-10">
                                            <div className="w-10 md:w-12 h-10 md:h-12 rounded-xl md:rounded-2xl bg-[#1a120b] flex items-center justify-center border border-[#c5a059]/10 shadow-lg group-hover:rotate-12 transition-all">
                                                <GraduationCap size={18} className="text-[#c5a059]" />
                                            </div>
                                            {/* Status Badge */}
                                            {exam.isCompleted ? (
                                                <div className="bg-emerald-50 text-emerald-600 px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                                                    <CheckCircle size={8} />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">Done</span>
                                                </div>
                                            ) : exam.status === 'active' && exam.isActive ? (
                                                <div className="bg-emerald-50 text-emerald-600 px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-emerald-100 flex items-center gap-1.5 shadow-sm animate-pulse">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">Ready</span>
                                                </div>
                                            ) : (
                                                <div className="bg-amber-50 text-amber-600 px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-amber-200 flex items-center gap-1.5 shadow-sm">
                                                    <Clock size={8} />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">Coming Soon</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1 md:space-y-2 mb-8 md:mb-10 relative z-10">
                                            <span className="text-[8px] md:text-[10px] font-black text-[#c5a059] uppercase tracking-[0.2em]">{exam.subject}</span>
                                            <h3 className="text-lg md:text-xl font-black text-[#1a150e] uppercase italic tracking-tighter leading-tight group-hover:text-[#c5a059] transition-colors">{exam.title}</h3>
                                        </div>

                                        <div className="flex items-center gap-6 md:gap-8 mb-8 md:mb-10 relative z-10">
                                            <div className="flex items-center gap-2">
                                                <Clock size={10} className="text-slate-300" />
                                                <span className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest">{exam.durationMinutes}min</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FileText size={10} className="text-slate-300" />
                                                <span className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest">{exam.questions?.length || 0} Questions</span>
                                            </div>
                                            {exam.classLevel && (
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap size={10} className="text-slate-300" />
                                                    <span className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest">{exam.classLevel}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="relative z-10">
                                            {exam.isCompleted ? (
                                                <div className="w-full h-12 md:h-14 flex items-center justify-center gap-3 bg-emerald-50 text-emerald-500 text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-xl md:rounded-2xl border border-emerald-100">
                                                    <CheckCircle size={14} /> Submitted
                                                </div>
                                            ) : exam.status === 'active' && exam.isActive ? (
                                                <button
                                                    onClick={() => navigate(`/exam/${exam._id}`)}
                                                    className="btn-primary w-full h-12 md:h-14 group/btn px-4! md:px-10!"
                                                >
                                                    Start Exam
                                                    <Play size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                                                </button>
                                            ) : (
                                                <div className="w-full h-12 md:h-14 flex flex-col items-center justify-center gap-1 bg-amber-50 text-amber-600 text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-xl md:rounded-2xl border border-amber-200 cursor-not-allowed">
                                                    <Clock size={12} />
                                                    Not started yet — waiting for teacher
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="premium-card overflow-hidden shadow-sm animate-fade-in-up">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#1a120b] text-white text-[10px] font-black uppercase tracking-[0.25em] italic">
                                    <tr>
                                        <th className="px-8 py-6">Subject</th>
                                        <th className="px-8 py-6">Exam Title</th>
                                        <th className="px-8 py-6 text-center">Score</th>
                                        <th className="px-8 py-6">Date</th>
                                        <th className="px-8 py-6 text-right">Result</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {results.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-24 text-center text-slate-400 italic font-black uppercase tracking-widest text-[10px]">No results yet.</td>
                                        </tr>
                                    ) : (
                                        results.map(res => (
                                            <tr key={res._id} className="hover:bg-slate-50 transition-all group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059] font-black text-[10px] uppercase">
                                                            {res.subject?.charAt(0)}
                                                        </div>
                                                        <span className="text-[11px] font-black text-[#c5a059] uppercase tracking-wider">{res.subject}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-[13px] font-black text-[#1a150e] uppercase italic tracking-tight">{res.examTitle}</p>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                                                        <span className="text-sm font-black text-[#1a150e]">{res.score}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold">/ {res.totalMarks}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-[11px] text-slate-500 font-medium uppercase tracking-widest">{new Date(res.submittedAt).toLocaleDateString()}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className={`inline-flex px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] border ${res.grade === 'Pass' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                        {res.grade}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentDashboard;
