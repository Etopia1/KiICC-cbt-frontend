import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import TeacherLayout from '../components/TeacherLayout';
import {
    RefreshCw, Filter, Search, Plus, Download,
    Lock, Unlock, Edit2, Check, X, Eye,
    ChevronRight, BookOpen, TrendingUp, Award, FileSpreadsheet,
    Activity, GraduationCap, LayoutGrid, List, Sparkles, AlertCircle, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fillTemplate, flattenStudent } from './ResultTemplateManager';

// --- Subject columns ------------------------------------------------
const subjects = [
    { key: 'mathematics', label: 'Maths' },
    { key: 'english', label: 'English' },
    { key: 'physics', label: 'Physics' },
    { key: 'chemistry', label: 'Chemistry' },
    { key: 'biology', label: 'Biology' },
    { key: 'geography', label: 'Geography' },
    { key: 'economics', label: 'Economics' },
    { key: 'commerce', label: 'Commerce' },
    { key: 'accounting', label: 'Accounting' },
    { key: 'government', label: 'Govt' },
    { key: 'literature', label: 'Literature' },
    { key: 'history', label: 'History' },
    { key: 'civicEducation', label: 'Civic Ed' },
    { key: 'computerScience', label: 'Comp Sci' },
    { key: 'furtherMathematics', label: 'Further Maths' },
    { key: 'technicalDrawing', label: 'Tech Drawing' },
    { key: 'foodAndNutrition', label: 'Food & Nut' },
    { key: 'agriculturalScience', label: 'Agric Sci' },
];

// --- Grade helper ----------------------------------------------------
const getGrade = (score) => {
    if (score >= 75) return { grade: 'A', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', bar: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' };
    if (score >= 60) return { grade: 'B', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', bar: 'bg-indigo-500', shadow: 'shadow-indigo-500/20' };
    if (score >= 50) return { grade: 'C', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', bar: 'bg-amber-500', shadow: 'shadow-amber-500/20' };
    if (score >= 40) return { grade: 'D', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', bar: 'bg-orange-500', shadow: 'shadow-orange-500/20' };
    return { grade: 'F', color: 'text-rose-400 bg-rose-500/10 border-rose-400/20', bar: 'bg-rose-500', shadow: 'shadow-rose-400/20' };
};

const avatarColors = [
    'from-indigo-500 to-purple-500',
    'from-pink-500 to-rose-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-sky-500 to-cyan-500',
    'from-violet-500 to-fuchsia-500',
];

// --- Student Result Modal --------------------------------------------
const StudentResultModal = ({ record, onClose, subjects }) => {
    if (!record) return null;

    const subjectResults = subjects.map(s => {
        const test = record.testScores?.[s.key] || 0;
        const exam = record.examScores?.[s.key] || 0;
        const total = test + exam;
        return { ...s, test, exam, total, ...getGrade(total) };
    });

    const avg = record.average || 0;
    const { grade: overallGrade, color: overallColor, shadow: overallShadow } = getGrade(avg);
    const colorIndex = record.fullName.charCodeAt(0) % avatarColors.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#FCFBFA]/80 backdrop-blur-md" onClick={onClose}>
            <div
                className="bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal header */}
                <div className={`bg-gradient-to-br ${avatarColors[colorIndex]} p-8 relative overflow-hidden shrink-0`}>
                    <div className="absolute top-0 left-0 w-full h-full bg-black/10" />
                    <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center text-white transition-all active:scale-90 z-10">
                        <X size={20} />
                    </button>
                    
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-3xl font-black border-2 border-white/30 shadow-2xl">
                            {record.fullName.charAt(0)}
                        </div>
                        <div>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1 italic">Registry Node #{record._id.slice(-4)}</p>
                            <h2 className="text-white text-2xl font-black uppercase italic tracking-tight mb-1">{record.fullName}</h2>
                            <p className="text-white/80 text-sm font-bold opacity-80 uppercase tracking-widest">{record.registrationNumber} · {record.classLevel}</p>
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-3 gap-4 mt-8 relative z-10">
                        {[
                            { label: 'Cumulative', value: (record.totalScore || 0).toFixed(0), icon: TrendingUp },
                            { label: 'Efficacy', value: `${avg.toFixed(1)}%`, icon: Activity },
                            { label: 'Classification', value: overallGrade, icon: Award, accent: true },
                        ].map(({ label, value, icon: Icon, accent }) => (
                            <div key={label} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 shadow-lg">
                                <Icon size={18} className="text-white/60 mx-auto mb-2" />
                                <p className={`text-xl font-black italic tracking-tighter ${accent ? 'text-white underline decoration-white/30' : 'text-white'}`}>{value}</p>
                                <p className="text-white/50 text-[9px] font-black uppercase tracking-widest mt-1">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto space-y-8 bg-slate-900/50">
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-black uppercase italic text-sm tracking-widest">Subject Matrix</h3>
                            <div className="h-px flex-1 bg-white/5 mx-4" />
                            <Sparkles size={14} className="text-indigo-400" />
                        </div>
                        
                        <div className="space-y-5">
                            {subjectResults.map(s => (
                                <div key={s.key} className="group/item">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-24 shrink-0">
                                            <p className="text-slate-400 text-[11px] font-black uppercase tracking-tight italic group-hover/item:text-indigo-400 transition-colors">{s.label}</p>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    <span>Test: <strong className="text-slate-300 ml-1">{s.test}</strong></span>
                                                    <span>Exam: <strong className="text-slate-300 ml-1">{s.exam}</strong></span>
                                                </div>
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-lg border italic tracking-widest ${s.color}`}>
                                                    {s.total} — {s.grade}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-[#FCFBFA] rounded-full overflow-hidden shadow-inner">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)] ${s.bar}`}
                                                    style={{ width: `${Math.min(s.total, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Vitals Footer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                        <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10 rounded-2xl px-6 py-4 shadow-inner">
                            <div className="flex items-center gap-3">
                                <Activity className="text-emerald-400" size={18} />
                                <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Engagement Score</span>
                            </div>
                            <span className="text-emerald-400 font-black text-2xl italic tracking-tighter">{(record.attendanceScore || 0).toFixed(0)}</span>
                        </div>
                        
                        <div className="flex items-start gap-4 p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl shadow-inner">
                            <Info size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1 italic">Architect Insight</p>
                                <p className="text-slate-300 text-xs font-medium italic leading-relaxed">
                                    {avg >= 75 ? 'Exceptional cognitive resonance detected. Maintain current frequency.' :
                                     avg >= 50 ? 'Stable output. Optimization recommended for peak efficiency.' :
                                     'Deficiency in metrics. Immediate calibration and support suggested.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Component --------------------------------------------------
const StudentRecordsSpreadsheet = () => {
    const { token } = useSelector((state) => state.auth);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [classFilter, setClassFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [teacherSubjects, setTeacherSubjects] = useState([]);
    const [editingCell, setEditingCell] = useState(null);
    const [tempValue, setTempValue] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [view, setView] = useState('cards'); // 'cards' | 'table'
    const [resultTemplate, setResultTemplate] = useState(null);

    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => { fetchRecords(); }, [classFilter]);
    useEffect(() => { fetchResultTemplate(); }, []);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const params = {};
            if (classFilter !== 'all') params.classLevel = classFilter;
            const res = await axios.get('https://educbt-pro-backend.onrender.com/student-records/with-permissions', {
                headers,
                params
            });
            setRecords(res.data.records);
            setTeacherSubjects(res.data.teacherSubjects || []);
        } catch {
            toast.error('Failed to connect to registry node');
        } finally {
            setLoading(false);
        }
    };

    const fetchResultTemplate = async () => {
        try {
            const res = await axios.get('https://educbt-pro-backend.onrender.com/result-template', { headers });
            setResultTemplate(res.data.template);
        } catch { /* no template yet */ }
    };

    const initializeClass = async () => {
        if (!classFilter || classFilter === 'all') { toast.error('Please select a specific class sector'); return; }
        try {
            const res = await axios.post('https://educbt-pro-backend.onrender.com/student-records/initialize-class',
                { classLevel: classFilter, term: 'Current Term', academicYear: '2025/2026' },
                { headers }
            );
            toast.success(res.data.message);
            fetchRecords();
        } catch { toast.error('Failed to initialize local records'); }
    };

    const publishSubject = async (subject, publish) => {
        if (!classFilter || classFilter === 'all') { toast.error('Please select a specific class sector'); return; }
        try {
            const res = await axios.post('https://educbt-pro-backend.onrender.com/student-records/publish-subject',
                { classLevel: classFilter, subject: subject.label, publish },
                { headers }
            );
            toast.success(res.data.message);
            fetchRecords();
        } catch (e) { toast.error(e.response?.data?.message || 'Publish sequence failure'); }
    };

    const handleEditExamScore = (recordId, subjectKey) => {
        const record = records.find(r => r._id === recordId);
        setEditingCell({ recordId, subject: subjectKey });
        setTempValue(record.examScores?.[subjectKey] || 0);
    };

    const saveExamScore = async () => {
        if (!editingCell) return;
        const { recordId, subject } = editingCell;
        const subjectLabel = subjects.find(s => s.key === subject)?.label;
        try {
            await axios.put(`https://educbt-pro-backend.onrender.com/student-records/${recordId}/exam-score`,
                { subject: subjectLabel, score: parseFloat(tempValue) || 0 },
                { headers }
            );
            setRecords(records.map(r => r._id === recordId
                ? { ...r, examScores: { ...r.examScores, [subject]: parseFloat(tempValue) || 0 } }
                : r
            ));
            toast.success('Core metric updated');
            setEditingCell(null);
        } catch (e) { toast.error(e.response?.data?.message || 'Update failure'); }
    };

    const exportToCSV = () => {
        if (!records.length) { toast.error('No records detected'); return; }
        const headersArr = ['#', 'Name', 'Reg No', 'Gender', ...subjects.flatMap(s => [`${s.label} Test`, `${s.label} Exam`, `${s.label} Total`]), 'Attendance', 'Total', 'Avg'];
        const rows = records.map((r, i) => [
            i + 1, r.fullName, r.registrationNumber, r.gender || '',
            ...subjects.flatMap(s => [r.testScores?.[s.key] || 0, r.examScores?.[s.key] || 0, (r.testScores?.[s.key] || 0) + (r.examScores?.[s.key] || 0)]),
            r.attendanceScore || 0, r.totalScore || 0, r.average?.toFixed(2) || 0
        ]);
        const csv = [headersArr, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
        const a = Object.assign(document.createElement('a'), { 
            href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), 
            download: `Registry-Data-${classFilter}-${new Date().toISOString().split('T')[0]}.csv` 
        });
        a.click();
        toast.success('CSV Export Initiated');
    };

    const teachesSubject = s => teacherSubjects.map(x => x.toLowerCase().replace(/\s+/g, '')).includes(s.key.toLowerCase());
    const isSubjectPublished = (r, s) => r.publishedSubjects?.[s.key] || false;
    const canEditExamScore = (r, s) => teachesSubject(s) && isSubjectPublished(r, s);

    const downloadResult = (record) => {
        if (!resultTemplate) {
            toast.error('Uplink result template first via Admin Settings.');
            return;
        }
        try {
            const wb = fillTemplate(resultTemplate.fileBase64, resultTemplate.fieldMappings || {}, record);
            const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
            const safeName = record.fullName.replace(/[^a-z0-9]/gi, '_');
            saveAs(
                new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
                `Record_${safeName}_${record.term || 'Term'}.xlsx`
            );
            toast.success(`Encrypted Result Generated`);
        } catch (err) {
            toast.error('Processing error');
        }
    };

    const downloadAllResults = () => {
        if (!resultTemplate) { toast.error('No blueprint template found.'); return; }
        if (!filtered.length) { toast.error('Query returned zero records.'); return; }
        filtered.forEach((record, i) => {
            setTimeout(() => downloadResult(record), i * 300); 
        });
        toast.success(`Batch processing ${filtered.length} records…`);
    };

    const filtered = records.filter(r =>
        r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <TeacherLayout>
            <div className="flex items-center justify-center min-h-[70vh]">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] animate-pulse">Syncing Registry Node...</p>
                </div>
            </div>
        </TeacherLayout>
    );

    return (
        <TeacherLayout>
            <div className="space-y-10 pb-20 animate-in fade-in duration-700">
                {/* -- Header -- */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-24 -left-20 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />
                    
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 mb-4">
                                <GraduationCap size={12} className="text-indigo-400" />
                                <span className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Academic Matrix</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white italic tracking-tight uppercase">
                                Registry <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent italic tracking-tighter">Management</span>
                            </h1>
                            <p className="text-slate-500 text-sm mt-3 font-medium italic max-w-lg">
                                Authorized access to <span className="text-indigo-400 font-bold underline decoration-indigo-400/30">{teacherSubjects.join(', ') || 'Global Monitoring'}</span>. 
                                Synchronizing real-time student performance metrics.
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-3">
                            <button onClick={initializeClass}
                                className="h-12 flex items-center gap-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] italic shadow-lg shadow-indigo-600/20 transition-all active:scale-95 group">
                                <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Initialize Node
                            </button>
                            
                            <div className="flex gap-2 p-1.5 bg-[#FCFBFA]/50 rounded-2xl border border-white/5">
                                <button onClick={fetchRecords}
                                    title="Synchronize Data"
                                    className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                                    <RefreshCw size={18} />
                                </button>
                                <button onClick={exportToCSV} disabled={!records.length}
                                    title="Export Registry"
                                    className="p-3 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-20 rounded-xl transition-all">
                                    <Download size={18} />
                                </button>
                                <button onClick={downloadAllResults} disabled={!records.length || !resultTemplate}
                                    title="Batch Processing"
                                    className="p-3 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 disabled:opacity-20 rounded-xl transition-all">
                                    <FileSpreadsheet size={18} />
                                </button>
                            </div>

                            <div className="flex p-1.5 bg-[#FCFBFA]/50 rounded-2xl border border-white/5">
                                <button onClick={() => setView('cards')}
                                    className={`p-3 rounded-xl transition-all ${view === 'cards' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}>
                                    <LayoutGrid size={18} />
                                </button>
                                <button onClick={() => setView('table')}
                                    className={`p-3 rounded-xl transition-all ${view === 'table' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}>
                                    <List size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filter Cluster */}
                    <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative group">
                            <Filter size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
                                className="w-full pl-14 pr-6 h-14 bg-[#FCFBFA]/50 border border-white/10 rounded-2xl focus:outline-none focus:border-indigo-500/50 font-black text-[10px] uppercase tracking-widest text-white italic cursor-pointer appearance-none">
                                <option value="all" className="bg-slate-900 border-none">All Sector Nodes</option>
                                {['JSS 1','JSS 2','JSS 3','SS 1','SS 2','SS 3'].map(c => (
                                    <option key={c} value={c} className="bg-slate-900 border-none">{c} Sector</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="relative group md:col-span-2">
                            <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            <input type="text" placeholder="QUERY IDENTITY OR REGISTRY CODE..." value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 h-14 bg-[#FCFBFA]/50 border border-white/10 rounded-2xl focus:outline-none focus:border-indigo-500/50 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-slate-600 italic" />
                        </div>
                    </div>
                </div>

                {/* -- Publish Controls -- */}
                {classFilter !== 'all' && teacherSubjects.length > 0 && (
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl animate-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                <Lock size={18} className="text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-black text-white italic tracking-tight uppercase">Subject Publication Protocol</h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {subjects.filter(s => teachesSubject(s)).map(subject => {
                                const published = records.length > 0 && isSubjectPublished(records[0], subject);
                                return (
                                    <button key={subject.key} onClick={() => publishSubject(subject, !published)}
                                        className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest italic transition-all border ${
                                            published 
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                                            : 'bg-[#FCFBFA]/50 text-slate-500 border-white/5 hover:border-white/20'
                                        }`}>
                                        {published ? <Unlock size={14} /> : <Lock size={14} />}
                                        {subject.label} Matrix {published ? '(OPEN)' : '(LOCKED)'}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-6 flex items-center gap-2">
                            <Sparkles size={12} /> Calibration insight: Open a matrix to initiate score injection.
                        </p>
                    </div>
                )}

                {/* -- Empty state -- */}
                {filtered.length === 0 && (
                    <div className="bg-slate-900/40 backdrop-blur-xl rounded-[3rem] p-24 text-center border border-white/5 shadow-2xl group transition-all">
                        <div className="w-24 h-24 bg-[#FCFBFA]/50 border border-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner group-hover:scale-105 transition-transform">
                            <AlertCircle size={40} className="text-slate-700 group-hover:text-indigo-500/50 transition-colors" />
                        </div>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">No Records Detected</h3>
                        <p className="text-slate-500 max-w-sm mx-auto text-sm font-medium italic leading-relaxed">
                            {records.length === 0
                                ? 'Initialize your class node to generate a new performance matrix for this sector.'
                                : 'Query returned zero matches in the current registry dataset.'}
                        </p>
                    </div>
                )}

                {/* -- CARD VIEW -- */}
                {view === 'cards' && filtered.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((record) => {
                            const avg = record.average || 0;
                            const { grade, color, bar, shadow } = getGrade(avg);
                            const colorIdx = record.fullName.charCodeAt(0) % avatarColors.length;
                            return (
                                <div key={record._id}
                                    className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 group hover:border-indigo-500/20 transition-all duration-500 hover:shadow-2xl hover:shadow-black/40 relative overflow-hidden flex flex-col">
                                    <div className={`absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full group-hover:bg-indigo-500/10 transition-colors`} />
                                    
                                    <div className="flex items-start justify-between mb-8 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br ${avatarColors[colorIdx]} flex items-center justify-center text-white font-black text-xl italic shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-500`}>
                                                {record.fullName.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-white uppercase italic tracking-tight truncate group-hover:text-indigo-400 transition-colors">{record.fullName}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-60">ID: {record.registrationNumber}</p>
                                            </div>
                                        </div>
                                        <div className={`text-sm font-black px-4 py-1.5 rounded-xl shrink-0 border italic tracking-widest shadow-lg ${color} ${shadow}`}>
                                            {grade}
                                        </div>
                                    </div>

                                    {/* Mini stats */}
                                    <div className="grid grid-cols-3 gap-3 mb-8 relative z-10">
                                        {[
                                            { label: 'Cumulative', value: (record.totalScore || 0).toFixed(0), icon: TrendingUp },
                                            { label: 'Efficacy', value: `${avg.toFixed(1)}%`, icon: Activity },
                                            { label: 'Attendance', value: (record.attendanceScore || 0).toFixed(0), icon: BookOpen },
                                        ].map(({ label, value, icon: Icon }) => (
                                            <div key={label} className="bg-[#FCFBFA]/50 rounded-2xl p-3 text-center border border-white/5 group-hover:border-white/10 transition-colors shadow-inner">
                                                <Icon size={14} className="text-slate-600 mx-auto mb-2 opacity-50" />
                                                <p className="text-white font-black italic tracking-tighter text-lg">{value}</p>
                                                <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest mt-1">{label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mb-10 relative z-10 mt-auto">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 italic">
                                            <span>Efficiency Baseline</span>
                                            <span className="text-indigo-400">{avg.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-2 bg-[#FCFBFA] rounded-full overflow-hidden shadow-inner border border-white/5">
                                            <div className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${bar}`} style={{ width: `${Math.min(avg, 100)}%` }} />
                                        </div>
                                    </div>

                                    {/* Action Cluster */}
                                    <div className="flex gap-3 relative z-10">
                                        <button
                                            onClick={() => setSelectedStudent(record)}
                                            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 font-black text-[10px] uppercase tracking-widest italic transition-all group/btn active:scale-95">
                                            <Eye size={16} />
                                            Analyze
                                            <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                        <button
                                            onClick={() => downloadResult(record)}
                                            disabled={!resultTemplate}
                                            className={`flex items-center justify-center w-12 h-12 rounded-2xl font-black text-sm transition-all border shrink-0 active:scale-95 ${
                                                resultTemplate
                                                    ? 'bg-[#FCFBFA]/50 hover:bg-slate-900 text-purple-400 border-purple-500/20 hover:border-purple-500/40'
                                                    : 'bg-[#FCFBFA]/20 text-slate-700 border-white/5 cursor-not-allowed opacity-50'
                                            }`}>
                                            <FileSpreadsheet size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* -- TABLE VIEW -- */}
                {view === 'table' && filtered.length > 0 && (
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#FCFBFA]/50 border-b border-white/5">
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Identity Node</th>
                                        {subjects.map(s => {
                                            const mySubject = teachesSubject(s);
                                            return (
                                                <th key={s.key} className={`p-6 text-[10px] font-black uppercase tracking-widest italic text-center min-w-[120px] ${mySubject ? 'text-indigo-400' : 'text-slate-500'}`}>
                                                    {s.label}
                                                    {mySubject && <Sparkles size={10} className="inline ml-1" />}
                                                </th>
                                            );
                                        })}
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 italic text-center">Avg</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 italic text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filtered.map((record) => {
                                        const avg = record.average || 0;
                                        const { color: gradeColor } = getGrade(avg);
                                        return (
                                            <tr key={record._id} className="group hover:bg-white/5 transition-colors">
                                                <td className="p-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-[#FCFBFA] flex items-center justify-center text-slate-400 font-black text-xs border border-white/5">
                                                            {record.fullName.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-white font-black text-xs uppercase italic tracking-tight truncate">{record.fullName}</p>
                                                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">{record.registrationNumber}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {subjects.map(s => {
                                                    const test = record.testScores?.[s.key] || 0;
                                                    const exam = record.examScores?.[s.key] || 0;
                                                    const total = test + exam;
                                                    const isEditing = editingCell?.recordId === record._id && editingCell?.subject === s.key;
                                                    const canEdit = canEditExamScore(record, s);

                                                    return (
                                                        <td key={s.key} className={`p-4 text-center group/cell ${canEdit ? 'bg-indigo-500/0 hover:bg-indigo-500/5' : ''} transition-colors`}>
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="text-[9px] text-slate-600 font-black uppercase tracking-tighter">T:{test}</span>
                                                                {isEditing ? (
                                                                    <div className="flex items-center gap-1 animate-in zoom-in-95 duration-200">
                                                                        <input
                                                                            type="number"
                                                                            value={tempValue}
                                                                            onChange={e => setTempValue(e.target.value)}
                                                                            className="w-14 h-8 bg-[#FCFBFA] border border-indigo-500/50 rounded-lg text-center text-white font-black text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                            autoFocus
                                                                            onBlur={saveExamScore}
                                                                            onKeyDown={e => e.key === 'Enter' && saveExamScore()}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div className="relative group/score">
                                                                        <span className={`text-[11px] font-black ${canEdit ? 'text-indigo-400 underline decoration-indigo-400/20 cursor-pointer' : 'text-slate-400'}`}
                                                                              onClick={() => canEdit && handleEditExamScore(record._id, s.key)}>
                                                                            E:{exam}
                                                                        </span>
                                                                        {canEdit && <Edit2 size={10} className="absolute -right-4 top-0.5 text-indigo-500 opacity-0 group-hover/score:opacity-100 transition-opacity" />}
                                                                    </div>
                                                                )}
                                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border mt-1 shadow-sm ${getGrade(total).color}`}>
                                                                    {total}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                                <td className="p-6 text-center">
                                                    <span className={`text-xs font-black italic tracking-widest ${gradeColor}`}>
                                                        {avg.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => setSelectedStudent(record)} className="p-2.5 bg-[#FCFBFA]/50 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all active:scale-90">
                                                            <Eye size={16} />
                                                        </button>
                                                        <button onClick={() => downloadResult(record)} className="p-2.5 bg-[#FCFBFA]/50 hover:bg-purple-500/10 text-purple-400 hover:text-purple-300 rounded-xl border border-purple-500/10 transition-all active:scale-90">
                                                            <FileSpreadsheet size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Modal Overlay Mapping */}
            {selectedStudent && (
                <StudentResultModal 
                    record={selectedStudent} 
                    onClose={() => setSelectedStudent(null)} 
                    subjects={subjects} 
                />
            )}
        </TeacherLayout>
    );
};

export default StudentRecordsSpreadsheet;
