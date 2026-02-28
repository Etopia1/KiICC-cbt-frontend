import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import AdminLayout from '../components/AdminLayout';
import { 
    ClipboardCheck, Search, GraduationCap, 
    BookOpen, Award, Calendar, AlertCircle, Download
} from 'lucide-react';

const AdminResults = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const { token } = useSelector((state) => state.auth);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const res = await axios.get('https://educbt-pro-backend.onrender.com/school/monitoring/results', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResults(res.data);
        } catch (error) {
            console.error('Error fetching results:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredResults = results.filter(res => 
        res.studentName.toLowerCase().includes(search.toLowerCase()) ||
        res.examTitle.toLowerCase().includes(search.toLowerCase()) ||
        res.subject.toLowerCase().includes(search.toLowerCase()) ||
        res.registrationNumber.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-10 pb-20 font-outfit">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-3 bg-white border border-slate-100 rounded-full px-4 py-2 shadow-sm">
                            <ClipboardCheck size={14} className="text-[#c5a059]" />
                            <span className="text-[#a18146] text-[10px] font-black uppercase tracking-[0.2em]">Institutional Merit Registry</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-[#1a150e] leading-none tracking-tighter uppercase italic">
                            Academic <span className="gold-text-gradient">Deliverables</span>
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">Holistic repository of candidate assessment performance outcomes.</p>
                    </div>

                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#c5a059] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="SEARCH BY CANDIDATE, SUBJECT OR REF..."
                            className="w-full h-14 pl-14 pr-6 bg-white border border-slate-100 rounded-2xl md:rounded-[1.25rem] text-[10px] font-black tracking-widest uppercase italic outline-none focus:border-[#c5a059] shadow-sm transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Results Table */}
                <div className="premium-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-[#1a120b] text-[#c5a059]">
                                    <th className="px-8 py-6 text-left text-[9px] font-black uppercase tracking-[0.3em] italic">Candidate Identity</th>
                                    <th className="px-8 py-6 text-left text-[9px] font-black uppercase tracking-[0.3em] italic">Module / Protocol</th>
                                    <th className="px-8 py-6 text-left text-[9px] font-black uppercase tracking-[0.3em] italic">Merit Score</th>
                                    <th className="px-8 py-6 text-left text-[9px] font-black uppercase tracking-[0.3em] italic">Timeline</th>
                                    <th className="px-8 py-6 text-right text-[9px] font-black uppercase tracking-[0.3em] italic">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-10 h-10 border-2 border-[#c5a059]/20 border-t-[#c5a059] rounded-full animate-spin" />
                                                <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Compiling Analytics...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredResults.length > 0 ? (
                                    filteredResults.map((result, idx) => (
                                        <tr key={result.sessionId} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#1a150e] font-black uppercase italic text-xs shadow-sm group-hover:bg-[#1a120b] group-hover:text-[#c5a059] transition-all">
                                                        {result.studentName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] font-black text-[#1a150e] uppercase italic">{result.studentName}</p>
                                                        <p className="text-[9px] text-[#c5a059] font-black uppercase tracking-widest">{result.registrationNumber}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1">
                                                    <p className="text-[11px] font-black text-[#1a150e] uppercase tracking-tight">{result.examTitle}</p>
                                                    <div className="flex items-center gap-2">
                                                        <BookOpen size={10} className="text-slate-300" />
                                                        <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{result.subject}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-black text-[#1a150e] italic">{result.percentage.toFixed(1)}%</p>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{result.score} / {result.totalMarks} Marks</p>
                                                    </div>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${result.percentage >= 50 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`} />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Calendar size={12} />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">
                                                        {new Date(result.submittedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#1a120b] hover:text-[#c5a059] transition-all border border-transparent hover:border-[#c5a059]/20 shadow-sm">
                                                    <Download size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center">
                                            <div className="space-y-4">
                                                <AlertCircle size={32} className="mx-auto text-slate-200" />
                                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Merit Data Depleted or Uninitialized</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminResults;
