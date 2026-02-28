import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TeacherLayout from '../components/TeacherLayout';
import { BookOpen, Search, Filter, Plus, Monitor, Edit, Trash2, Clock, FileText, Play, ShieldCheck, Grid, List, Download, FileDown, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';

const TeacherTests = () => {
    const navigate = useNavigate();
    const { token } = useSelector((state) => state.auth);
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (token) fetchExams();
    }, [token]);

    const fetchExams = async () => {
        try {
            setLoading(true);
            const res = await axios.get('https://educbt-pro-backend.onrender.com/exam/teacher/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExams(res.data);
        } catch (error) {
            toast.error("Failed to fetch assessments");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Permanent deletion cannot be undone. Proceed?")) return;
        try {
            await axios.delete(`https://educbt-pro-backend.onrender.com/exam/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Assessment expunged");
            setExams(exams.filter(e => e._id !== id));
        } catch (error) {
            toast.error("Operation failed");
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'scheduled' : 'active';
        const newIsActive = newStatus === 'active'; // sync both together
        try {
            await axios.patch(`https://educbt-pro-backend.onrender.com/exam/${id}/status`, {
                status: newStatus,
                isActive: newIsActive
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Exam is now ${newStatus === 'active' ? '🟢 ACTIVE — students can see it' : '⏸ Paused'}`);
            setExams(exams.map(e => e._id === id ? { ...e, status: newStatus, isActive: newIsActive } : e));
        } catch (error) {
            toast.error('Status update failed. Please try again.');
        }
    };


    const handleExportPDF = async (exam) => {
        const loadingToast = toast.loading('Preparing exam PDF...');
        try {
            // Fetch full exam with questions from backend
            const res = await axios.get(`https://educbt-pro-backend.onrender.com/exam/${exam._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const fullExam = res.data;

            toast.dismiss(loadingToast);

            // Build the print HTML
            const questions = fullExam.questions || [];
            const optionLabels = ['A', 'B', 'C', 'D', 'E'];

            const questionsHtml = questions.map((q, i) => {
                const opts = (q.options || []).map((opt, idx) => `
                    <div style="margin: 6px 0; padding: 6px 12px; display:flex; gap:10px; align-items:flex-start;">
                        <span style="font-weight:700; min-width:22px; color:#1a120b;">${optionLabels[idx]}.</span>
                        <span>${opt}</span>
                    </div>
                `).join('');

                const typeBadge = q.type ? `<span style="font-size:9px;background:#f5f0e8;color:#c5a059;padding:2px 8px;border-radius:20px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-left:8px;">${q.type}</span>` : '';

                return `
                    <div style="margin-bottom:24px; page-break-inside:avoid;">
                        <div style="display:flex; align-items:flex-start; gap:10px; margin-bottom:8px;">
                            <span style="font-weight:900; font-size:14px; color:#c5a059; min-width:28px;">${i + 1}.</span>
                            <div style="flex:1;">
                                <span style="font-size:14px; font-weight:600; color:#1a150e; line-height:1.5;">${q.text || q.question || ''}</span>
                                ${typeBadge}
                            </div>
                            <span style="font-size:10px;color:#999;white-space:nowrap;">[${q.marks || 1} mk${(q.marks||1)>1?'s':''}]</span>
                        </div>
                        ${opts ? `<div style="margin-left:38px;">${opts}</div>` : ''}
                        <div style="margin-left:38px; margin-top:6px; border-top:1px dashed #eee; padding-top:4px;">
                            <span style="font-size:10px;color:#aaa;">Answer: _______________</span>
                        </div>
                    </div>
                `;
            }).join('');

            const printHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8" />
                    <title>${fullExam.title} — Question Paper</title>
                    <style>
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body { font-family: 'Georgia', serif; color: #1a150e; background: white; padding: 40px; font-size: 13px; }
                        .header { border-bottom: 3px double #c5a059; padding-bottom: 16px; margin-bottom: 28px; text-align: center; }
                        .header h1 { font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #1a120b; }
                        .header p { font-size: 12px; color: #666; margin-top: 4px; }
                        .meta { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; padding: 12px 16px; background: #fdfaf4; border: 1px solid #e8dfc4; border-radius: 8px; font-size: 11px; }
                        .meta span { color: #555; }
                        .meta strong { color: #1a120b; }
                        .instructions { margin-bottom: 24px; padding: 12px 16px; border-left: 3px solid #c5a059; background: #fffbf0; font-size: 12px; color: #555; line-height: 1.6; }
                        .section-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #c5a059; margin-bottom: 16px; padding-bottom: 4px; border-bottom: 1px solid #f0e8d0; }
                        .footer { margin-top: 40px; border-top: 2px double #c5a059; padding-top: 12px; display:flex; justify-content:space-between; font-size:10px; color:#999; }
                        @media print {
                            body { padding: 20px; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${fullExam.title}</h1>
                        <p>${fullExam.subject}${fullExam.classLevel ? ' &mdash; ' + fullExam.classLevel : ''}</p>
                    </div>

                    <div class="meta">
                        <span><strong>Subject:</strong> ${fullExam.subject || '—'}</span>
                        <span><strong>Class:</strong> ${fullExam.classLevel || 'All Classes'}</span>
                        <span><strong>Duration:</strong> ${fullExam.durationMinutes || '—'} minutes</span>
                        <span><strong>Total Questions:</strong> ${questions.length}</span>
                        <span><strong>Total Marks:</strong> ${fullExam.totalMarks || questions.reduce((a, q) => a + (q.marks || 1), 0)}</span>
                    </div>

                    <div class="instructions">
                        <strong>Instructions:</strong> Answer ALL questions. Write clearly and legibly.
                        Do not open until instructed to do so. Any attempt to cheat will lead to disqualification.
                    </div>

                    <div>
                        <div class="section-title">Questions</div>
                        ${questionsHtml || '<p style="color:#999;font-style:italic;">No questions found for this exam.</p>'}
                    </div>

                    <div class="footer">
                        <span>Generated: ${new Date().toLocaleDateString()}</span>
                        <span>${fullExam.title} — ${fullExam.subject}</span>
                        <span>Page 1</span>
                    </div>

                    <div class="no-print" style="margin-top:30px; text-align:center;">
                        <button onclick="window.print()" style="padding:12px 32px;background:#1a120b;color:#c5a059;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:1px;">
                            🖨 Save as PDF / Print
                        </button>
                    </div>
                </body>
                </html>
            `;

            // Open in new window and trigger print
            const win = window.open('', '_blank', 'width=900,height=700');
            if (!win) {
                toast.error('Pop-up blocked. Please allow pop-ups for this site and try again.');
                return;
            }
            win.document.write(printHtml);
            win.document.close();
            // Auto-trigger print after load
            win.onload = () => {
                setTimeout(() => win.print(), 500);
            };
            toast.success(`PDF ready — ${questions.length} questions`);
        } catch (error) {
            console.error('PDF export error:', error);
            toast.error(error.response?.data?.message || 'Could not load exam. Please try again.', { id: loadingToast });
        }
    };


    const filteredExams = exams.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':    return 'bg-emerald-50 text-emerald-500 border-emerald-500/20';
            case 'ended':     return 'bg-rose-50 text-rose-400 border-rose-100';
            case 'scheduled': return 'bg-slate-50 text-slate-400 border-slate-100';
            default:          return 'bg-slate-50 text-slate-400 border-slate-100';
        }
    };

    return (
        <TeacherLayout>
            <div className="max-w-7xl mx-auto space-y-10 pb-20">
                {/* Header Controls */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 bg-gold-50 border border-[#D4AF37]/20 rounded-full px-4 py-1.5 shadow-sm">
                            <BookOpen size={14} className="text-[#D4AF37]" />
                            <span className="text-[#996515] text-[10px] font-black uppercase tracking-widest italic">Exams</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-none tracking-tight uppercase italic">
                            My <span className="gold-text-gradient">Exams</span>
                        </h1>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative group w-full sm:w-80">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search Vault..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-3xl focus:border-[#D4AF37] outline-none font-black text-sm transition-all shadow-sm italic text-slate-900"
                            />
                        </div>
                        <div className="flex items-center gap-3 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-100">
                            <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-[#1A120B] text-[#D4AF37] shadow-xl shadow-black/10' : 'text-slate-400 hover:text-slate-600'}`}>
                                <Grid size={18} />
                            </button>
                            <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-[#1A120B] text-[#D4AF37] shadow-xl shadow-black/10' : 'text-slate-400 hover:text-slate-600'}`}>
                                <List size={18} />
                            </button>
                        </div>
                        <button onClick={() => navigate('/teacher/tests/create')} className="btn-primary py-4! px-8! text-[11px]! whitespace-nowrap shadow-xl shadow-gold-500/10">
                            <Plus size={18} /> Create New Exam
                        </button>
                    </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-6">
                        <div className="w-20 h-20 border-[6px] border-[#D4AF37]/10 border-t-[#D4AF37] rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic animate-pulse">Accessing Vault Data</p>
                    </div>
                ) : filteredExams.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-100 rounded-4xl p-24 text-center">
                        <div className="w-24 h-24 bg-gold-50 rounded-4xl flex items-center justify-center mx-auto mb-8 border border-[#D4AF37]/10">
                            <BookOpen size={40} className="text-[#D4AF37]" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 italic">No Exams Yet</h3>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium">You haven't created any exams yet, or none match your search.</p>
                        <button onClick={() => navigate('/teacher/tests/create')} className="mt-8 text-[11px] font-black text-[#D4AF37] uppercase tracking-widest hover:underline decoration-2 underline-offset-8 transition-all">Create Your First Exam</button>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredExams.map((exam) => (
                            <div key={exam._id} className="group bg-white border border-slate-100 rounded-[2.5rem] p-8 hover:border-[#D4AF37]/30 transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-gold-500/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-50/50 blur-3xl rounded-full -translate-y-16 translate-x-16 group-hover:bg-[#D4AF37]/10 transition-colors" />
                                
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="w-14 h-14 bg-[#1A120B] text-[#D4AF37] rounded-2xl flex items-center justify-center font-black text-sm italic border border-[#D4AF37]/20 group-hover:rotate-10 transition-transform">
                                            {exam.subject.charAt(0)}
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-widest italic ${getStatusColor(exam.status)}`}>
                                            {exam.status}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-black text-slate-900 mb-2 italic tracking-tight group-hover:gold-text-gradient transition-all leading-tight uppercase">{exam.title}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">{exam.subject} — {exam.classLevel || 'GENERIC'}</p>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:bg-[#1A120B] transition-all group-hover:border-[#D4AF37]/20">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-[#D4AF37]/70">Duration</p>
                                            <p className="text-xs font-black text-slate-900 group-hover:text-white italic">{exam.durationMinutes}m <span className="text-slate-400 group-hover:text-slate-600 font-bold ml-1">Clock</span></p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:bg-[#1A120B] transition-all group-hover:border-[#D4AF37]/20">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-[#D4AF37]/70">Items</p>
                                            <p className="text-xs font-black text-slate-900 group-hover:text-white italic">{exam.questions?.length || 0}u <span className="text-slate-400 group-hover:text-slate-600 font-bold ml-1">Qns</span></p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-8 border-t border-slate-50 group-hover:border-[#D4AF37]/10 transition-colors">
                                        <button onClick={() => toggleStatus(exam._id, exam.status)} className="flex-1 py-3.5 bg-slate-50 hover:bg-[#1A120B] text-slate-600 hover:text-[#D4AF37] rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border border-slate-100 hover:border-[#D4AF37]/20 active:scale-95 group/btn">
                                            {exam.status === 'active' ? 'End Session' : 'Start Session'}
                                        </button>
                                        <div className="flex gap-2">
                                            <button onClick={() => navigate(`/teacher/exam/${exam._id}/monitor`)} className="p-3.5 bg-slate-50 text-slate-400 hover:text-[#D4AF37] hover:bg-[#1A120B] rounded-2xl transition-all border border-slate-100 hover:border-[#D4AF37]/20" title="Monitor Vault"><Monitor size={16} /></button>
                                            <button onClick={() => handleExportPDF(exam)} className="p-3.5 bg-slate-50 text-slate-400 hover:text-[#D4AF37] hover:bg-[#1A120B] rounded-2xl transition-all border border-slate-100 hover:border-[#D4AF37]/20" title="Export Security PDF"><FileDown size={16} /></button>
                                            <button onClick={() => navigate(`/teacher/tests/create?edit=${exam._id}`)} className="p-3.5 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all border border-slate-100" title="Edit Encryption"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(exam._id)} className="p-3.5 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-slate-100 hover:border-rose-100" title="Purge Vault"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] italic">
                                    <tr>
                                        <th className="px-10 py-8">Vault Identification</th>
                                        <th className="px-10 py-8">Faculty Stream</th>
                                        <th className="px-10 py-8">Metrics</th>
                                        <th className="px-10 py-8">Status</th>
                                        <th className="px-10 py-8 text-right">Strategic Ops</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredExams.map((exam) => (
                                        <tr key={exam._id} className="hover:bg-gold-50/10 transition-all group">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 bg-[#1A120B] text-[#D4AF37] rounded-2xl flex items-center justify-center font-black text-xs italic border border-[#D4AF37]/20 shadow-lg shadow-black/5">
                                                        {exam.subject.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 italic uppercase text-[15px] leading-none tracking-tight group-hover:gold-text-gradient transition-all">{exam.title}</p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">UID: {exam._id.slice(-12).toUpperCase()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] italic bg-gold-50 px-3 py-1 rounded-lg">{exam.subject}</span>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-6 text-[10px] font-black text-slate-900 uppercase tracking-widest italic">
                                                    <span className="flex items-center gap-2 text-slate-400"><Clock size={14} /> {exam.durationMinutes}m</span>
                                                    <span className="flex items-center gap-2 text-slate-400"><FileText size={14} /> {exam.questions?.length || 0}u</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black border uppercase tracking-widest italic ${getStatusColor(exam.status)}`}>
                                                    {exam.status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                     <button onClick={() => toggleStatus(exam._id, exam.status)} className={`p-3 rounded-2xl transition-all border ${exam.status === 'active' ? 'text-rose-500 bg-rose-50 border-rose-100' : 'text-emerald-500 bg-emerald-50 border-emerald-100'}`} title={exam.status === 'active' ? 'End' : 'Start'}><Play size={16} fill="currentColor" /></button>
                                                     <button onClick={() => navigate(`/teacher/exam/${exam._id}/monitor`)} className="p-3 text-slate-400 hover:text-[#D4AF37] hover:bg-[#1A120B] rounded-2xl transition-all border border-slate-50 hover:border-[#D4AF37]/20" title="Monitor"><Monitor size={16} /></button>
                                                     <button onClick={() => handleExportPDF(exam)} className="p-3 text-slate-400 hover:text-[#D4AF37] hover:bg-[#1A120B] rounded-2xl transition-all border border-slate-50 hover:border-[#D4AF37]/20" title="PDF"><FileDown size={16} /></button>
                                                     <button onClick={() => navigate(`/teacher/tests/create?edit=${exam._id}`)} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all border border-slate-50" title="Edit"><Edit size={16} /></button>
                                                     <button onClick={() => handleDelete(exam._id)} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-slate-50 hover:border-rose-100" title="Delete"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </TeacherLayout >
    );
};

export default TeacherTests;
