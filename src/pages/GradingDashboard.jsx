import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import TeacherLayout from '../components/TeacherLayout';
import { 
    CheckCircle, AlertCircle, Clock, ArrowRight, User, BookOpen, 
    Search, Filter, Save, X, LayoutGrid, List, Table, ChevronDown, 
    Eye, Edit3, MessageSquare, Award, RefreshCcw, Maximize2, Minimize2,
    Database, FileText, ChevronLeft, ChevronRight, Send
} from 'lucide-react';
import toast from 'react-hot-toast';

const GradingDashboard = () => {
    const { token } = useSelector((state) => state.auth);
    const [gradingList, setGradingList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards' | 'spreadsheet'
    const [selectedSession, setSelectedSession] = useState(null);
    const [gradeData, setGradeData] = useState({}); // { sessionId-qIndex: marks }
    const [searchTerm, setSearchTerm] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [selectedExamId, setSelectedExamId] = useState('all');
    const spreadsheetRef = useRef(null);

    useEffect(() => {
        if (token) fetchGradingList();
    }, [token]);

    const fetchGradingList = async () => {
        try {
            setLoading(true);
            const res = await axios.get('https://educbt-pro-backend.onrender.com/exam/grading/list', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGradingList(res.data);
            
            // Initialize bulk grade data if we have results
            const initialGrades = {};
            res.data.forEach(session => {
                if (session.manualGrades) {
                    Object.entries(session.manualGrades).forEach(([qIdx, marks]) => {
                        initialGrades[`${session._id}-${qIdx}`] = marks;
                    });
                }
            });
            setGradeData(prev => ({...prev, ...initialGrades}));
        } catch (error) {
            toast.error("Failed to load grading data");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenGrading = (session) => {
        setSelectedSession(session);
        // Pre-fill local grade data specifically for this modal session
        const sessionMarks = {};
        if (session.manualGrades) {
            Object.entries(session.manualGrades).forEach(([idx, marks]) => {
                sessionMarks[idx] = marks;
            });
        }
        // We'll keep gradeData as the source of truth for all sessions
    };

    const handleBulkSubmit = async (sessionId) => {
        const loadingToast = toast.loading("Publishing Scores...");
        try {
            const sessionsToProcess = sessionId ? gradingList.filter(s => s._id === sessionId) : [];
            
            for (const session of sessionsToProcess) {
                const sessionGrades = [];
                Object.entries(gradeData).forEach(([key, marks]) => {
                    if (key.startsWith(`${session._id}-`)) {
                        const qIdx = key.split('-')[1];
                        sessionGrades.push({
                            questionIndex: parseInt(qIdx),
                            marksEarned: parseFloat(marks)
                        });
                    }
                });

                await axios.post('https://educbt-pro-backend.onrender.com/exam/grading/submit', {
                    sessionId: session._id,
                    grades: sessionGrades
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            
            toast.success(sessionId ? "Result Published" : "Batch Synced Successfully", { id: loadingToast });
            if (sessionId === selectedSession?._id) setSelectedSession(null);
            fetchGradingList();
        } catch (error) {
            toast.error("Cloud Sync Failed", { id: loadingToast });
        }
    };

    const filteredList = gradingList.filter(item => {
        const matchesSearch = item.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.examTitle?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSubject = subjectFilter === 'all' || item.subject === subjectFilter;
        const matchesExam = selectedExamId === 'all' || item.exam?._id === selectedExamId;
        return matchesSearch && matchesSubject && matchesExam;
    });

    const subjects = [...new Set(gradingList.map(item => item.subject))];
    const exams = [...new Map(gradingList.map(item => [item.exam?._id, item.exam?.title])).entries()];

    // Spreadsheet Logic: Group essay questions by the selected exam
    const getEssayQuestions = () => {
        if (selectedExamId === 'all') return [];
        const session = gradingList.find(s => s.exam?._id === selectedExamId);
        return session?.exam?.questions?.filter(q => q.type === 'essay') || [];
    };

    const essayQuestions = getEssayQuestions();

    return (
        <TeacherLayout>
            <div className="max-w-[1600px] mx-auto space-y-6 pb-20 font-outfit">
                {/* Modern Adaptive Header */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-lg px-3 py-1">
                            <Database size={12} className="text-[#D4AF37]" />
                            <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.2em]">Academic Evaluation Nexus</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-[#1A120B] tracking-tight uppercase italic leading-none">
                            Grading <span className="gold-text-gradient">Matrix</span>
                        </h1>
                        <p className="text-slate-400 text-xs font-medium">Batch evaluation and result synchronization engine.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* View Modes */}
                        <div className="flex p-1.5 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner">
                            <button 
                                onClick={() => setViewMode('table')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${viewMode === 'table' ? 'bg-[#1A120B] text-[#D4AF37] shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <List size={14} /> List
                            </button>
                            <button 
                                onClick={() => setViewMode('cards')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${viewMode === 'cards' ? 'bg-[#1A120B] text-[#D4AF37] shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid size={14} /> Cards
                            </button>
                            <button 
                                onClick={() => { setViewMode('spreadsheet'); if(selectedExamId === 'all' && exams.length > 0) setSelectedExamId(exams[0][0]); }}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${viewMode === 'spreadsheet' ? 'bg-[#1A120B] text-[#D4AF37] shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Table size={14} /> Spreadsheet
                            </button>
                        </div>
                        
                        <button 
                            onClick={fetchGradingList}
                            className="w-12 h-12 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/20 transition-all shadow-sm active:scale-90 flex items-center justify-center"
                        >
                            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Intelligent Filter Bar */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm relative z-10">
                    <div className="relative group md:col-span-2">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="SEARCH BY IDENTITY OR EXAM TRACE..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-transparent focus:bg-white focus:border-[#D4AF37]/20 rounded-2xl outline-none font-black text-[10px] uppercase tracking-[0.2em] italic transition-all placeholder:text-slate-300"
                        />
                    </div>
                    <div>
                        <select 
                            value={subjectFilter}
                            onChange={(e) => setSubjectFilter(e.target.value)}
                            className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:bg-white focus:border-[#D4AF37]/20 rounded-2xl outline-none font-black text-[10px] uppercase tracking-widest italic transition-all appearance-none cursor-pointer"
                        >
                            <option value="all">GLOBAL SUBJECTS</option>
                            {subjects.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                    </div>
                    {viewMode === 'spreadsheet' && (
                        <div>
                            <select 
                                value={selectedExamId}
                                onChange={(e) => setSelectedExamId(e.target.value)}
                                className="w-full px-6 py-4 bg-[#1A120B] text-[#D4AF37] border-none rounded-2xl outline-none font-black text-[10px] uppercase tracking-widest italic transition-all appearance-none cursor-pointer shadow-xl shadow-[#D4AF37]/5"
                            >
                                <option value="all" disabled>SELECT TARGET EXAM</option>
                                {exams.map(([id, title]) => <option key={id} value={id}>{title.toUpperCase()}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {/* Content Workspace */}
                <div className="relative">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 animate-in fade-in duration-700">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-[#D4AF37]/5 border-t-[#D4AF37] rounded-full animate-spin" />
                                <Database size={24} className="absolute inset-0 m-auto text-[#D4AF37] animate-pulse" />
                            </div>
                            <p className="mt-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Accessing Evaluation Core...</p>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-bottom-4 duration-500">
                            {viewMode === 'spreadsheet' ? (
                                /* THE "LONG ONE" - SPREADSHEET MODE */
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between bg-[#1A120B] p-6 rounded-[2rem] border border-[#D4AF37]/20 shadow-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/20">
                                                <Database size={20} className="text-[#D4AF37]" />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-black uppercase text-sm italic tracking-tight">Active Matrix: <span className="text-[#D4AF37]">{exams.find(e => e[0] === selectedExamId)?.[1]}</span></h3>
                                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{essayQuestions.length} EVALUATION COLUMNS AVAILABLE</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex -space-x-2 mr-4">
                                                {filteredList.slice(0, 5).map((s, i) => (
                                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#1A120B] bg-slate-800 flex items-center justify-center text-[8px] font-black text-white">{s.studentName?.[0]}</div>
                                                ))}
                                                {filteredList.length > 5 && <div className="w-8 h-8 rounded-full border-2 border-[#1A120B] bg-[#D4AF37] flex items-center justify-center text-[8px] font-black text-[#1A120B]">+{filteredList.length - 5}</div>}
                                            </div>
                                            <button 
                                                onClick={() => handleBulkSubmit()}
                                                className="px-8 py-3.5 bg-[#D4AF37] text-[#1A120B] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-[#EBC34F] transition-all flex items-center gap-3 active:scale-95"
                                            >
                                                <Send size={14} /> Export All Grades
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-100 rounded-[3rem] shadow-2xl overflow-hidden">
                                        <div className="overflow-x-auto custom-scrollbar-gold">
                                            <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
                                                <thead>
                                                    <tr className="bg-[#FCFBFA] border-b border-slate-100">
                                                        <th className="w-[300px] px-8 py-8 text-[10px] font-black uppercase tracking-widest text-slate-400 italic sticky left-0 bg-[#FCFBFA] z-20 border-r border-slate-50 shadow-[4px_0_10px_rgba(0,0,0,0.02)]">STUDENT IDENTITY</th>
                                                        {essayQuestions.map((q, idx) => (
                                                            <th key={idx} className="w-[450px] px-8 py-8 text-[10px] font-black uppercase tracking-widest text-[#D4AF37] italic border-r border-slate-50">
                                                                <div className="flex flex-col gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-8 h-8 rounded-lg bg-[#1A120B] text-[#D4AF37] flex items-center justify-center text-xs shadow-lg">#{idx+1}</span>
                                                                        <span>{q.marks} PTS MAX</span>
                                                                    </div>
                                                                    <span className="text-[11px] text-[#1A120B] normal-case font-black truncate leading-tight mt-1">{q.text}</span>
                                                                </div>
                                                            </th>
                                                        ))}
                                                        <th className="w-[200px] px-8 py-8 text-[10px] font-black uppercase tracking-widest text-emerald-500 italic text-center">FINAL SYNC</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {filteredList.map((session) => (
                                                        <tr key={session._id} className="group hover:bg-gold-50/20 transition-all duration-300">
                                                            {/* Student Identity Cell - Sticky */}
                                                            <td className="px-8 py-6 sticky left-0 bg-white z-10 group-hover:bg-[#FCFBFA] transition-colors border-r border-slate-50 shadow-[4px_0_10px_rgba(0,0,0,0.02)]">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#1A120B] font-black text-xs shadow-inner group-hover:bg-[#1A120B] group-hover:text-[#D4AF37] transition-all">
                                                                        {session.studentName?.charAt(0) || 'S'}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-[#1A120B] uppercase italic tracking-tighter truncate max-w-[180px]">{session.studentName}</p>
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{session.user?.info?.registrationNumber || 'NO ID UNIT'}</p>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Essay Responses Cells */}
                                                            {essayQuestions.map((q, qIdx) => {
                                                                const originalIndex = session.exam.questions.indexOf(q);
                                                                const response = session.answers[originalIndex] || '---';
                                                                const gradeKey = `${session._id}-${originalIndex}`;
                                                                
                                                                return (
                                                                    <td key={qIdx} className="px-8 py-6 border-r border-slate-50 align-top">
                                                                        <div className="space-y-4">
                                                                            <div className="p-5 bg-slate-50 rounded-[1.5rem] text-slate-800 text-xs font-black italic leading-relaxed border border-transparent group-hover:bg-white group-hover:border-[#D4AF37]/10 transition-all max-h-[120px] overflow-y-auto custom-scrollbar">
                                                                                {response}
                                                                            </div>
                                                                            <div className="flex items-center gap-4">
                                                                                <div className="relative flex-1 group/score">
                                                                                    <div className="absolute -top-2 left-3 px-2 bg-white text-[8px] font-black text-[#D4AF37] uppercase tracking-widest z-10 scale-90">Score</div>
                                                                                    <input 
                                                                                        type="number" 
                                                                                        max={q.marks}
                                                                                        min="0"
                                                                                        step="0.5"
                                                                                        value={gradeData[gradeKey] || 0}
                                                                                        onChange={(e) => setGradeData({ ...gradeData, [gradeKey]: e.target.value })}
                                                                                        className="w-full bg-white border border-slate-100 focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-center font-black text-[#1A120B] italic text-sm transition-all shadow-inner"
                                                                                    />
                                                                                </div>
                                                                                <div className="text-[10px] font-black text-slate-300 italic">/ {q.marks}</div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                );
                                                            })}

                                                            {/* Actions Cell */}
                                                            <td className="px-8 py-6 text-center">
                                                                <button 
                                                                    onClick={() => handleBulkSubmit(session._id)}
                                                                    className="p-4 bg-slate-50 hover:bg-[#1A120B] text-slate-400 hover:text-[#D4AF37] rounded-2xl transition-all shadow-sm active:scale-95 group/save"
                                                                >
                                                                    <Save size={20} className="group-hover/save:scale-110 transition-transform" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : viewMode === 'table' ? (
                                /* ENHANCED TABLE VIEW */
                                <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xl overflow-hidden">
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-[#1A120B] text-[#D4AF37]">
                                                    <th className="px-8 py-7 text-[10px] font-black uppercase tracking-[0.3em] italic">Intelligence Trace</th>
                                                    <th className="px-8 py-7 text-[10px] font-black uppercase tracking-[0.3em] italic">Assessment Context</th>
                                                    <th className="px-8 py-7 text-[10px] font-black uppercase tracking-[0.3em] italic text-center">Status</th>
                                                    <th className="px-8 py-7 text-[10px] font-black uppercase tracking-[0.3em] italic text-center">Base Score</th>
                                                    <th className="px-8 py-7 text-[10px] font-black uppercase tracking-[0.3em] italic text-right">Operations</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {filteredList.map((item) => {
                                                    const essayCount = item.exam?.questions?.filter(q => q.type === 'essay').length || 0;
                                                    return (
                                                        <tr key={item._id} className="group hover:bg-gold-50/40 transition-all duration-300">
                                                            <td className="px-8 py-6">
                                                                <div className="flex items-center gap-5">
                                                                    <div className="w-12 h-12 rounded-[1.25rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-[#1A120B] font-black italic shadow-inner group-hover:bg-[#1A120B] group-hover:text-[#D4AF37] transition-all duration-500">
                                                                        {item.studentName?.charAt(0) || 'S'}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[13px] font-black text-[#1A120B] uppercase italic tracking-tight">{item.studentName}</p>
                                                                        <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mt-1">ID: {item.user?.info?.registrationNumber || 'UNMATCHED'}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="space-y-1">
                                                                    <p className="text-xs font-black text-[#1A120B] uppercase">{item.exam?.title}</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest bg-[#D4AF37]/5 px-2 py-0.5 rounded-lg border border-[#D4AF37]/10">{item.subject}</span>
                                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.exam?.classLevel}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 text-center">
                                                                <div className="inline-flex items-center gap-2.5 px-5 py-2 bg-amber-50 text-amber-700 text-[10px] font-black rounded-2xl border border-amber-100 uppercase tracking-widest italic shadow-sm">
                                                                    <MessageSquare size={14} /> {essayCount} PENDING
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 text-center">
                                                                <div className="text-2xl font-black text-[#1A120B] italic tracking-tighter">{item.score?.toFixed(1) || '0'}</div>
                                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">OBJ SCORE</div>
                                                            </td>
                                                            <td className="px-8 py-6 text-right">
                                                                <button 
                                                                    onClick={() => handleOpenGrading(item)}
                                                                    className="px-8 py-4 bg-[#1A120B] text-[#D4AF37] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black hover:shadow-2xl hover:shadow-[#D4AF37]/10 transition-all active:scale-95 flex items-center justify-center gap-3 ml-auto"
                                                                >
                                                                    EXECUTE AUDIT <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                /* FUTURISTIC CARDS VIEW */
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {filteredList.map((item) => (
                                        <div 
                                            key={item._id} 
                                            onClick={() => handleOpenGrading(item)}
                                            className="group bg-white border border-slate-100 rounded-[3rem] p-10 hover:border-[#D4AF37]/40 transition-all duration-700 shadow-sm cursor-pointer relative overflow-hidden active:scale-95 hover:shadow-3xl hover:shadow-gold-500/10"
                                        >
                                            <div className="absolute top-0 right-0 w-40 h-40 bg-gold-100/30 blur-[60px] rounded-full -translate-y-20 translate-x-20 transition-all duration-700 group-hover:bg-[#D4AF37]/20" />
                                            
                                            <div className="flex items-center justify-between mb-10 relative z-10">
                                                <div className="w-16 h-16 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#1A120B] group-hover:text-[#D4AF37] transition-all duration-500 shadow-inner">
                                                    <BookOpen size={24} />
                                                </div>
                                                <div className="text-[9px] text-slate-300 font-black uppercase tracking-[0.4em] transform rotate-90 origin-right">SCRPT-2026</div>
                                            </div>

                                            <div className="space-y-2 relative z-10 mb-10">
                                                <h3 className="text-2xl font-black text-[#1A120B] italic uppercase tracking-tighter leading-tight group-hover:gold-text-gradient transition-all duration-500">{item.exam?.title}</h3>
                                                <div className="flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                                    <span className="text-[#D4AF37]">{item.subject}</span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                                                    <span>{item.exam?.classLevel}</span>
                                                </div>
                                            </div>

                                            <div className="pt-10 border-t border-slate-50 flex items-center justify-between relative z-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-2xl bg-[#FCFBFA] flex items-center justify-center font-black text-[#1A120B] border border-slate-200 shadow-sm">
                                                        {item.studentName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-black text-[#1A120B] block uppercase italic tracking-tighter">{item.studentName?.split(' ')[0]}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">STUDENT UNIT</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-2xl font-black text-[#1A120B] leading-none italic">{item.score?.toFixed(0)}%</span>
                                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">INITIAL</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* HIGH-PRECISION AUDIT OVERLAY */}
            {selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-[#0E0B08]/90 backdrop-blur-3xl animate-in fade-in duration-500" onClick={() => setSelectedSession(null)} />
                    <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20 flex flex-col">
                        {/* Elite Master Header */}
                        <div className="px-16 py-12 border-b border-slate-50 flex items-center justify-between bg-white relative z-10 shrink-0">
                            <div className="flex items-center gap-8">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-[#1A120B] p-1 border-2 border-[#D4AF37]/50 shadow-2xl shadow-[#D4AF37]/30 transform group cursor-pointer active:scale-95 transition-all">
                                        <div className="w-full h-full rounded-[2.25rem] bg-white flex items-center justify-center text-[#1A120B] font-black italic text-3xl shadow-inner">
                                            {selectedSession.studentName?.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#D4AF37] rounded-2xl border-4 border-white flex items-center justify-center text-[#1A120B] shadow-lg">
                                        <User size={12} weight="fill" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-4xl font-black text-[#1A120B] tracking-tighter uppercase italic leading-none">
                                            {selectedSession.studentName}
                                        </h2>
                                        <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                                            VERIFIED SESSION
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-400">
                                        <p className="text-[11px] font-black uppercase tracking-[0.3em] font-outfit">{selectedSession.exam?.title}</p>
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">{selectedSession.subject}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="hidden md:flex items-center gap-3 mr-6 px-6 py-4 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Base Assessment</p>
                                        <p className="text-xl font-black text-[#1A120B] italic leading-none tracking-tighter">{selectedSession.score?.toFixed(1)} / {selectedSession.exam?.totalMarks}</p>
                                    </div>
                                    <Award size={24} className="text-[#D4AF37]" />
                                </div>
                                <button onClick={() => setSelectedSession(null)} className="w-16 h-16 bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-[2rem] transition-all shadow-inner active:scale-90 flex items-center justify-center border border-slate-100">
                                    <X size={28} />
                                </button>
                            </div>
                        </div>

                        {/* Audit Log / Script Sheet */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar-gold p-16 space-y-16 bg-[#FCFBFA]">
                            <div className="grid grid-cols-1 gap-20">
                                {selectedSession.exam?.questions?.filter(q => q.type === 'essay').map((q, idx) => {
                                    const origIdx = selectedSession.exam.questions.indexOf(q);
                                    const response = selectedSession.answers[origIdx] || 'NO RESPONSE LOGGED BY CANDIDATE';
                                    const gradeKey = `${selectedSession._id}-${origIdx}`;
                                    
                                    return (
                                        <div key={idx} className="group/item flex flex-col lg:flex-row gap-12 animate-in slide-in-from-bottom-6 duration-700">
                                            {/* Lateral Descriptor */}
                                            <div className="lg:w-40 flex-shrink-0">
                                                <div className="sticky top-0 space-y-4">
                                                    <div className="w-16 h-16 rounded-[2rem] bg-[#1A120B] text-[#D4AF37] flex items-center justify-center text-2xl font-black italic shadow-2xl shadow-black/20 transform group-hover/item:-translate-y-2 transition-all">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest block">AUDIT POINT</span>
                                                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest block">ESSAY ITEM</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Data Manifest */}
                                            <div className="flex-1 space-y-8">
                                                <div className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-sm group-hover/item:shadow-3xl group-hover/item:shadow-[#D4AF37]/10 group-hover/item:border-[#D4AF37]/30 transition-all duration-500">
                                                    {/* Goal Prompt */}
                                                    <div className="px-12 py-10 bg-[#1A120B] relative">
                                                        <div className="absolute top-0 right-0 p-8 opacity-10">
                                                            <Award size={100} className="text-white" />
                                                        </div>
                                                        <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] block mb-4 opacity-50">Operational Prompt</label>
                                                        <p className="text-white text-xl font-black italic tracking-tight leading-relaxed relative z-10">{q.text}</p>
                                                    </div>

                                                    {/* Candidate Content */}
                                                    <div className="p-12 space-y-10">
                                                        <div>
                                                            <div className="flex items-center justify-between mb-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
                                                                    <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Candidate Transcript</label>
                                                                </div>
                                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">UTF-8 DECODED</span>
                                                            </div>
                                                            <div className="p-10 bg-[#FCFBFA] border border-slate-100 rounded-[2.5rem] text-[#1A120B] text-xl font-medium leading-relaxed italic relative shadow-inner">
                                                                <MessageSquare size={60} className="absolute bottom-6 right-6 opacity-5" />
                                                                {response}
                                                            </div>
                                                        </div>

                                                        {/* Precision Grading Controls */}
                                                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10 pt-10 border-t border-slate-50">
                                                            <div className="space-y-4">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Fidelity Adjustment</label>
                                                                <div className="flex flex-wrap gap-2.5">
                                                                    {[0, 0.25, 0.5, 0.75, 1].map(m => (
                                                                        <button 
                                                                            key={m}
                                                                            onClick={() => setGradeData({ ...gradeData, [gradeKey]: q.marks * m })}
                                                                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm active:scale-95 ${
                                                                                (parseFloat(gradeData[gradeKey]) === q.marks * m)
                                                                                ? 'bg-[#1A120B] text-[#D4AF37] border-[#D4AF37]'
                                                                                : 'bg-white text-slate-400 border-slate-100 hover:border-[#D4AF37]/50 hover:bg-gold-50/50'
                                                                            }`}
                                                                        >
                                                                            {m === 0 ? 'ZERO' : m === 1 ? 'ELITE (100%)' : `${m*100}%`}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="relative group/score-inp self-end xl:self-auto">
                                                                <div className="absolute -top-3 left-6 px-3 bg-white text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] z-10 rounded-full border border-slate-50 shadow-sm">Score Input</div>
                                                                <div className="flex items-center gap-6 bg-white border-2 border-slate-100 group-focus-within/score-inp:border-[#D4AF37] rounded-[2.5rem] p-4 pl-10 pr-12 transition-all shadow-xl shadow-slate-100/50">
                                                                    <input 
                                                                        type="number" 
                                                                        max={q.marks}
                                                                        min="0"
                                                                        step="0.5"
                                                                        value={gradeData[gradeKey] || 0}
                                                                        onChange={(e) => setGradeData({ ...gradeData, [gradeKey]: e.target.value })}
                                                                        className="w-24 bg-transparent border-none outline-none font-black text-3xl text-[#1A120B] text-center italic tracking-tighter"
                                                                    />
                                                                    <div className="h-12 w-[2px] bg-slate-100" />
                                                                    <div className="text-lg font-black text-slate-300 italic">/ {q.marks}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Elite Master Footer */}
                        <div className="px-16 py-12 border-t border-slate-50 bg-[#1A120B] flex items-center justify-between relative z-10 shrink-0">
                            <div className="hidden lg:flex items-center gap-6">
                                <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
                                    <Database size={24} className="text-[#D4AF37] opacity-60" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em]">Audit Persistence</p>
                                    <p className="text-white/40 text-[11px] font-medium leading-none italic">Session log will be updated with teacher credentials.</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-5 w-full lg:w-auto">
                                <button 
                                    onClick={() => setSelectedSession(null)} 
                                    className="flex-1 lg:flex-none px-12 py-5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white font-black text-[12px] uppercase tracking-widest rounded-[2rem] border border-white/10 transition-all active:scale-95"
                                >
                                    Cancel Changes
                                </button>
                                <button 
                                    onClick={() => handleBulkSubmit(selectedSession._id)} 
                                    className="flex-1 lg:flex-none px-16 py-5 bg-[#D4AF37] hover:bg-[#EBC34F] text-[#1A120B] font-black text-[12px] uppercase tracking-[0.25em] rounded-[2rem] transition-all shadow-2xl shadow-[#D4AF37]/30 flex items-center justify-center gap-4 active:scale-95 hover:shadow-[#D4AF37]/50"
                                >
                                    <Save size={20} /> SYNC RESULTS
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </TeacherLayout>
    );
};

export default GradingDashboard;
