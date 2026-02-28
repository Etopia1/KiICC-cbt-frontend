import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import TeacherLayout from '../components/TeacherLayout';
import { 
    FileText, Users, Download, Search, Filter, 
    TrendingUp, Award, BarChart3, AlertCircle, CheckCircle2, ChevronDown, Activity, ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const TeacherResults = () => {
    const navigate = useNavigate();
    const { token, user } = useSelector((state) => state.auth);
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchExams();
    }, [token]);

    useEffect(() => {
        if (selectedExam) {
            fetchResults(selectedExam._id);
        }
    }, [selectedExam]);

    const fetchExams = async () => {
        try {
            setLoading(true);
            const res = await axios.get('https://educbt-pro-backend.onrender.com/exam/teacher/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExams(res.data);
            if (res.data.length > 0) {
                setSelectedExam(res.data[0]);
            }
        } catch (error) {
            console.error('Error fetching exams:', error);
            toast.error('Failed to load exams');
        } finally {
            setLoading(false);
        }
    };

    const fetchResults = async (examId) => {
        try {
            const res = await axios.get(`https://educbt-pro-backend.onrender.com/exam/${examId}/sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const completedSessions = res.data.filter(
                session => (session.status === 'completed' || session.status === 'terminated') && (session.score !== undefined)
            );
            setResults(completedSessions);
        } catch (error) {
            console.error('Error fetching results:', error);
            toast.error('Failed to load results');
        }
    };

    const handleBackendExport = async (format) => {
        if (!selectedExam) return;
        const loadingToast = toast.loading(`Preparing ${format.toUpperCase()} export...`);
        try {
            const res = await axios.get(`https://educbt-pro-backend.onrender.com/exam/${selectedExam._id}/export-results?format=${format}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${selectedExam.title}_results.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Export successful', { id: loadingToast });
        } catch (error) {
            console.error('Export Error:', error);
            toast.error('Failed to export from server', { id: loadingToast });
        }
    };

    const filteredResults = results.filter(result => {
        const studentName = result.user?.fullName || result.student?.name || 'Unknown';
        const regNum = result.user?.info?.registrationNumber || result.student?.registrationNumber || '';
        
        const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            regNum.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === 'all' || result.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    const calculateStats = () => {
        if (results.length === 0) return { avgScore: 0, highestScore: 0, lowestScore: 0, passRate: 0 };

        const scores = results.map(r => r.score || 0);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const highestScore = Math.max(...scores);
        const lowestScore = Math.min(...scores);
        const passRate = (results.filter(r => (r.percentage || 0) >= 50).length / results.length) * 100;

        return { avgScore, highestScore, lowestScore, passRate };
    };

    const stats = calculateStats();

    if (loading) {
        return (
            <TeacherLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-pulse">
                    <div className="w-16 h-16 border-4 border-[#c5a059]/10 border-t-[#c5a059] rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Syncing Analytics Cloud</p>
                </div>
            </TeacherLayout>
        );
    }

    return (
        <TeacherLayout>
            <div className="max-w-7xl mx-auto space-y-12 pb-24 px-4 sm:px-6">
                {/* Header Section */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
                    <div className="space-y-6 flex-1">
                        <div className="inline-flex items-center gap-2 bg-gold-50 border border-[#c5a059]/20 rounded-full px-4 py-1.5">
                            <Activity size={12} className="text-[#c5a059]" />
                            <span className="text-[#a18146] text-[10px] font-black uppercase tracking-widest italic">Performance Analysis Nexus</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-[#1a150e] leading-none tracking-tight uppercase italic">
                            Intelligence <span className="gold-text-gradient">Engine</span>
                        </h1>
                        
                        <div className="max-w-xl space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Secure Assessment Feed</label>
                            <div className="relative group">
                                <FileText className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#c5a059] transition-colors" size={20} />
                                <select
                                    value={selectedExam?._id || ''}
                                    onChange={(e) => {
                                        const exam = exams.find(ex => ex._id === e.target.value);
                                        setSelectedExam(exam);
                                    }}
                                    className="w-full pl-14 pr-12 py-5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-[#c5a059] text-[#1a150e] font-black italic shadow-sm appearance-none cursor-pointer group-hover:bg-slate-50 transition-all uppercase text-sm tracking-tighter"
                                >
                                    {exams.map(exam => (
                                        <option key={exam._id} value={exam._id}>
                                            {exam.title.toUpperCase()} — {exam.classLevel || 'GENERAL'}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-hover:text-[#c5a059] transition-all" size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={() => handleBackendExport('pdf')}
                            disabled={results.length === 0}
                            className="bg-[#1a120b] text-[#c5a059] px-8 h-16 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-black/10 hover:bg-black transition-all active:scale-95 flex items-center gap-3 disabled:opacity-20"
                        >
                            <FileText size={18} /> Export PDF Report
                        </button>
                        <button
                            onClick={() => handleBackendExport('csv')}
                            disabled={results.length === 0}
                            className="bg-white border border-slate-200 text-[#1a150e] px-8 h-16 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3 disabled:opacity-20 shadow-sm"
                        >
                            <Download size={18} /> CSV Dataset
                        </button>
                    </div>
                </div>

                {/* Metrics Grid */}
                {selectedExam && results.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Avg Efficiency', value: stats.avgScore.toFixed(1), total: selectedExam.totalMarks, icon: TrendingUp },
                            { label: 'Peak Script', value: stats.highestScore.toFixed(1), total: selectedExam.totalMarks, icon: Award },
                            { label: 'Baseline Unit', value: stats.lowestScore.toFixed(1), total: selectedExam.totalMarks, icon: AlertCircle },
                            { label: 'Global Clearance', value: `${stats.passRate.toFixed(1)}%`, sub: `Pass Ratio`, icon: Users }
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 group hover:border-[#c5a059]/30 transition-all shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                                    <stat.icon size={18} className="text-slate-300 group-hover:text-[#c5a059] transition-colors" />
                                </div>
                                <div className="text-3xl font-black text-[#1a150e] italic tracking-tighter uppercase leading-none">
                                    {stat.value}
                                    {stat.total && <span className="text-sm font-bold text-slate-300 ml-2">/ {stat.total}</span>}
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#c5a059] animate-pulse" />
                                    <span className="text-[9px] font-black text-[#c5a059] uppercase tracking-widest">Analytics Active</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#c5a059] transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="SEARCH BY IDENTITY OR REGISTRATION UNIT..."
                            className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-2xl focus:border-[#c5a059] outline-none font-black text-[10px] uppercase tracking-widest italic transition-all shadow-sm placeholder:text-slate-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Filter:</span>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-white text-[#1a150e] font-black text-[10px] uppercase tracking-widest outline-none px-6 py-3 rounded-xl cursor-pointer border border-slate-200 shadow-sm"
                        >
                            <option value="all">Global Matrix</option>
                            <option value="completed">Finalized</option>
                            <option value="terminated">Terminated</option>
                        </select>
                    </div>
                </div>

                {/* Records Table */}
                <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full min-w-[1000px] text-left border-collapse">
                            <thead>
                                <tr className="bg-[#1a120b] border-b border-[#c5a059]/10">
                                    <th className="px-8 py-6 text-[9px] font-black text-[#c5a059] uppercase tracking-[0.2em] italic">Candidate Identity</th>
                                    <th className="px-8 py-6 text-[9px] font-black text-[#c5a059] uppercase tracking-[0.2em] italic">Reg Unit</th>
                                    <th className="px-8 py-6 text-[9px] font-black text-[#c5a059] uppercase tracking-[0.2em] italic text-center">Score</th>
                                    <th className="px-8 py-6 text-[9px] font-black text-[#c5a059] uppercase tracking-[0.2em] italic text-center">Efficiency</th>
                                    <th className="px-8 py-6 text-[9px] font-black text-[#c5a059] uppercase tracking-[0.2em] italic text-center">Anomalies</th>
                                    <th className="px-8 py-6 text-[9px] font-black text-[#c5a059] uppercase tracking-[0.2em] italic text-right">Log Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredResults.map((result, idx) => {
                                    const studentName = result.user?.fullName || result.student?.name || 'Unknown Candidate';
                                    const regNum = result.user?.info?.registrationNumber || result.student?.registrationNumber || 'N/A';
                                    
                                    return (
                                        <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-[#c5a059] text-xs uppercase italic group-hover:bg-[#1a120b] transition-all">
                                                        {studentName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-[#1a150e] uppercase italic tracking-tight">{studentName}</p>
                                                        <p className="text-[9px] font-black text-[#c5a059] uppercase tracking-[0.3em]">{result.status}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{regNum}</td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="text-xl font-black text-[#1a150e] italic tracking-tighter">
                                                    {result.score?.toFixed(1) || '0'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                    result.percentage >= 70 ? 'bg-emerald-50 text-emerald-500' :
                                                    result.percentage >= 45 ? 'bg-gold-50 text-[#c5a059]' : 'bg-rose-50 text-rose-500'
                                                }`}>
                                                    {result.percentage?.toFixed(1) || '0'}%
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`text-[10px] font-black ${result.violations?.length > 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                                                    {result.violations?.length || 0}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <p className="text-[10px] font-black text-[#1a150e] uppercase italic mb-0.5">
                                                    {result.endTime ? new Date(result.endTime).toLocaleDateString() : 'Active'}
                                                </p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                                    {result.endTime ? new Date(result.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Pending'}
                                                </p>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    
                    {filteredResults.length === 0 && (
                        <div className="py-24 text-center">
                            <Activity size={40} className="text-slate-200 mx-auto mb-6" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No Intelligence Records Found</p>
                        </div>
                    )}
                </div>
            </div>
        </TeacherLayout>
    );
};

export default TeacherResults;
