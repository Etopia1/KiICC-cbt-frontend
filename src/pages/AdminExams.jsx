import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import AdminLayout from '../components/AdminLayout';
import { 
    FileQuestion, Search, Calendar, User, 
    CheckCircle, Clock, AlertCircle, ExternalLink 
} from 'lucide-react';

const AdminExams = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const { token } = useSelector((state) => state.auth);

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const res = await axios.get('https://educbt-pro-backend.onrender.com/school/monitoring/exams', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExams(res.data);
        } catch (error) {
            console.error('Error fetching exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredExams = exams.filter(exam => 
        exam.title.toLowerCase().includes(search.toLowerCase()) ||
        exam.subject.toLowerCase().includes(search.toLowerCase()) ||
        exam.teacherId?.fullName?.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'ended': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
            case 'scheduled': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-10 pb-20 font-outfit">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-3 bg-white border border-slate-100 rounded-full px-4 py-2 shadow-sm">
                            <FileQuestion size={14} className="text-[#c5a059]" />
                            <span className="text-[#a18146] text-[10px] font-black uppercase tracking-[0.2em]">Institutional Oversight</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-[#1a150e] leading-none tracking-tighter uppercase italic">
                            Exam <span className="gold-text-gradient">Registry</span>
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">Monitoring all academic assessment protocols across the institution.</p>
                    </div>

                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#c5a059] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="SEARCH BY TITLE, SUBJECT OR TEACHER..."
                            className="w-full h-14 pl-14 pr-6 bg-white border border-slate-100 rounded-2xl md:rounded-[1.25rem] text-[10px] font-black tracking-widest uppercase italic outline-none focus:border-[#c5a059] shadow-sm transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Exams Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-6">
                        <div className="w-16 h-16 border-4 border-[#c5a059]/10 border-t-[#c5a059] rounded-full animate-spin" />
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Initializing Data Stream...</p>
                    </div>
                ) : filteredExams.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredExams.map((exam) => (
                            <div key={exam._id} className="premium-card p-8 group hover:scale-[1.01] transition-all duration-500 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c5a059]/5 blur-[60px] rounded-full group-hover:bg-[#c5a059]/10 transition-colors" />
                                
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusStyle(exam.status)}`}>
                                                    {exam.status}
                                                </span>
                                                <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{exam.examType}</span>
                                            </div>
                                            <h3 className="text-2xl font-black text-[#1a150e] tracking-tighter italic uppercase group-hover:gold-text-gradient transition-all">{exam.title}</h3>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-[#1a120b] flex items-center justify-center border border-[#c5a059]/10 shadow-lg">
                                            <FileQuestion className="text-[#c5a059]" size={20} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[#c5a059]">
                                                    <Calendar size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Subject</p>
                                                    <p className="text-[11px] font-black text-[#1a150e] uppercase">{exam.subject}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[#c5a059]">
                                                    <User size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Architect</p>
                                                    <p className="text-[11px] font-black text-[#1a150e] uppercase">{exam.teacherId?.fullName || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[#c5a059]">
                                                    <Clock size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Duration</p>
                                                    <p className="text-[11px] font-black text-[#1a150e] uppercase">{exam.durationMinutes} Minutes</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[#c5a059]">
                                                    <CheckCircle size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Threshold</p>
                                                    <p className="text-[11px] font-black text-[#1a150e] uppercase">{exam.passingPercentage}% Pass Rate</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            {exam.examType === 'proctored' && (
                                                <span className="bg-rose-50 text-rose-500 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-rose-100">Proctored Active</span>
                                            )}
                                        </div>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">{new Date(exam.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="premium-card p-20 text-center space-y-6">
                        <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mx-auto border border-slate-100">
                            <AlertCircle className="text-slate-300" size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-[#1a150e] uppercase italic tracking-tight">No Protocols Found</h3>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto">Either refine your query or await the initialization of new academic assessments.</p>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminExams;
