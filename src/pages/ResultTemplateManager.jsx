import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import {
    Upload, FileSpreadsheet, Download, Trash2, RefreshCw,
    Settings, CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
    Info, ArrowRight, Zap, Layers, FileJson, Sparkles
} from 'lucide-react';

// ─── All known data fields the system can provide ─────────────────────
const AVAILABLE_FIELDS = [
    { value: '', label: '— Do not map —' },
    // Student Info
    { group: 'Student Info', value: 'fullName', label: 'Full Name' },
    { group: 'Student Info', value: 'registrationNumber', label: 'Registration Number' },
    { group: 'Student Info', value: 'gender', label: 'Gender' },
    { group: 'Student Info', value: 'classLevel', label: 'Class Level' },
    { group: 'Student Info', value: 'term', label: 'Term' },
    { group: 'Student Info', value: 'academicYear', label: 'Academic Year' },
    // Summary
    { group: 'Summary', value: 'totalScore', label: 'Total Score' },
    { group: 'Summary', value: 'average', label: 'Average (%)' },
    { group: 'Summary', value: 'attendanceScore', label: 'Attendance Score' },
    { group: 'Summary', value: 'position', label: 'Position in Class' },
    { group: 'Summary', value: 'remarks', label: 'Teacher Remarks' },
    { group: 'Summary', value: 'conduct', label: 'Conduct' },
    // Per-subject
    ...['mathematics','english','physics','chemistry','biology','geography',
        'economics','commerce','accounting','government','literature',
        'computerScience','history','civicEducation','furtherMathematics',
        'agriculturalScience','foodAndNutrition','technicalDrawing'].flatMap(s => [
        { group: `${label(s)} Scores`, value: `testScores.${s}`, label: `${label(s)} — Test` },
        { group: `${label(s)} Scores`, value: `examScores.${s}`, label: `${label(s)} — Exam` },
        { group: `${label(s)} Scores`, value: `subjectTotals.${s}`, label: `${label(s)} — Total` },
    ]),
];

function label(key) {
    const map = {
        mathematics: 'Mathematics', english: 'English', physics: 'Physics',
        chemistry: 'Chemistry', biology: 'Biology', geography: 'Geography',
        economics: 'Economics', commerce: 'Commerce', accounting: 'Accounting',
        government: 'Government', literature: 'Literature', computerScience: 'Computer Science',
        history: 'History', civicEducation: 'Civic Education', furtherMathematics: 'Further Maths',
        agriculturalScience: 'Agric Science', foodAndNutrition: 'Food & Nutrition',
        technicalDrawing: 'Technical Drawing',
    };
    return map[key] || key;
}

// ─── Scan an Excel workbook for {{PLACEHOLDER}} patterns ─────────────────
const scanPlaceholders = (workbook) => {
    const found = new Set();
    const regex = /\{\{([^}]+)\}\}/g;
    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        Object.values(sheet).forEach(cell => {
            if (cell && cell.v && typeof cell.v === 'string') {
                let m;
                while ((m = regex.exec(cell.v)) !== null) found.add(`{{${m[1]}}}`);
                regex.lastIndex = 0;
            }
        });
    });
    return [...found];
};

// ─── Fill a workbook with student data using mappings ────────────────────
const fillTemplate = (fileBase64, mappings, studentData) => {
    const buffer = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Build data lookup (flat)
    const flat = flattenStudent(studentData);

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        Object.keys(sheet).forEach(cellRef => {
            if (cellRef.startsWith('!')) return;
            const cell = sheet[cellRef];
            if (!cell || typeof cell.v !== 'string') return;
            let val = cell.v;
            let replaced = false;
            Object.entries(mappings).forEach(([placeholder, field]) => {
                if (val.includes(placeholder) && field) {
                    val = val.replace(new RegExp(escapeReg(placeholder), 'g'), flat[field] ?? '');
                    replaced = true;
                }
            });
            if (replaced) {
                cell.v = val;
                cell.w = val;
                // If value is a number, update type
                if (!isNaN(val) && val !== '') { cell.t = 'n'; cell.v = parseFloat(val); }
            }
        });
    });
    return workbook;
};

const flattenStudent = (record) => {
    const subjectKeys = ['mathematics','english','physics','chemistry','biology','geography',
        'economics','commerce','accounting','government','literature','computerScience',
        'history','civicEducation','furtherMathematics','agriculturalScience','foodAndNutrition','technicalDrawing'];

    const subjectTotals = {};
    subjectKeys.forEach(s => {
        subjectTotals[s] = (record.testScores?.[s] || 0) + (record.examScores?.[s] || 0);
    });

    return {
        fullName: record.fullName || '',
        registrationNumber: record.registrationNumber || '',
        gender: record.gender || '',
        classLevel: record.classLevel || '',
        term: record.term || 'Current Term',
        academicYear: record.academicYear || '2025/2026',
        totalScore: record.totalScore || 0,
        average: (record.average || 0).toFixed(1),
        attendanceScore: record.attendanceScore || 0,
        position: record.position || '',
        remarks: record.remarks || '',
        conduct: record.conduct || '',
        // Test scores
        ...Object.fromEntries(subjectKeys.map(s => [`testScores.${s}`, record.testScores?.[s] || 0])),
        // Exam scores
        ...Object.fromEntries(subjectKeys.map(s => [`examScores.${s}`, record.examScores?.[s] || 0])),
        // Totals
        ...Object.fromEntries(subjectKeys.map(s => [`subjectTotals.${s}`, subjectTotals[s]])),
    };
};

const escapeReg = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── Main Component ────────────────────────────────────────────────────
const ResultTemplateManager = () => {
    const { token } = useSelector(s => s.auth);
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [mappings, setMappings] = useState({});
    const [showMappings, setShowMappings] = useState(true);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef();

    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => { fetchTemplate(); }, []);

    const fetchTemplate = async () => {
        try {
            setLoading(true);
            const res = await axios.get('https://educbt-pro-backend.onrender.com/result-template', { headers });
            setTemplate(res.data.template);
            setMappings(res.data.template.fieldMappings || {});
        } catch (e) {
            if (e.response?.status !== 404) toast.error('Failed to load template');
        } finally {
            setLoading(false);
        }
    };

    const handleFile = async (file) => {
        if (!file) return;
        if (!file.name.match(/\.(xlsx|xls)$/i)) { toast.error('Only .xlsx or .xls files are allowed'); return; }

        setUploading(true);
        try {
            // Read file and scan for placeholders on the frontend
            const arrayBuf = await file.arrayBuffer();
            const wb = XLSX.read(arrayBuf, { type: 'array' });
            const detected = scanPlaceholders(wb);

            const formData = new FormData();
            formData.append('template', file);
            formData.append('templateName', file.name);
            formData.append('detectedPlaceholders', JSON.stringify(detected));

            const res = await axios.post('https://educbt-pro-backend.onrender.com/result-template/upload', formData, {
                headers: { ...headers, 'Content-Type': 'multipart/form-data' }
            });
            setTemplate(res.data.template);
            setMappings(res.data.template.fieldMappings || {});
            toast.success(`Template uploaded! Found ${detected.length} placeholder(s).`);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const saveMappings = async () => {
        try {
            const res = await axios.put('https://educbt-pro-backend.onrender.com/result-template/mappings', { mappings }, { headers });
            setTemplate(res.data.template);
            toast.success('Mappings saved!');
        } catch { toast.error('Failed to save mappings'); }
    };

    const deleteTemplate = async () => {
        if (!confirm('Delete the uploaded template? This cannot be undone.')) return;
        try {
            await axios.delete('https://educbt-pro-backend.onrender.com/result-template', { headers });
            setTemplate(null);
            setMappings({});
            toast.success('Template deleted');
        } catch { toast.error('Failed to delete template'); }
    };

    const downloadBlankTemplate = () => {
        if (!template) return;
        const buf = Uint8Array.from(atob(template.fileBase64), c => c.charCodeAt(0));
        saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), template.templateName);
    };

    // ── generate result for a sample/demo student ──────────────────────
    const previewWithDummyData = () => {
        if (!template) return;
        const dummy = {
            fullName: 'Sample Student', registrationNumber: 'STD-001', gender: 'Male',
            classLevel: 'SS 2', term: 'Second Term', academicYear: '2025/2026',
            totalScore: 423, average: 70.5, attendanceScore: 18, position: 2,
            remarks: 'Very good performance', conduct: 'Excellent',
            testScores: { mathematics: 32, english: 28, physics: 30, chemistry: 25, biology: 27, geography: 20, economics: 22, commerce: 20, accounting: 18, government: 21 },
            examScores: { mathematics: 55, english: 48, physics: 50, chemistry: 42, biology: 45, geography: 38, economics: 40, commerce: 36, accounting: 33, government: 38 },
        };
        const wb = fillTemplate(template.fileBase64, mappings, dummy);
        const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        saveAs(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Preview_Sample_Student.xlsx');
        toast.success('Preview downloaded!');
    };

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center min-h-[70vh]">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] animate-pulse">Syncing Template Engine...</p>
                </div>
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative">
                    <div className="absolute -top-24 -left-20 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 mb-4">
                            <Layers size={12} className="text-indigo-400" />
                            <span className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Compiler Engine v4.0</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white italic tracking-tight uppercase">
                            Result <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent italic tracking-tighter">Architect</span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-2 font-medium italic">Synchronize your institution's custom reporting matrix with our core processing node.</p>
                    </div>
                </div>

                {/* Instructional Logic Cluster */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 group hover:border-indigo-500/20 transition-all relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full group-hover:bg-indigo-500/10 transition-colors" />
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                <Sparkles size={20} className="text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-black text-white italic tracking-tight uppercase">How to set up your template</h3>
                        </div>
                        <ul className="space-y-4">
                            {[
                                { t: 'Initialize Protocol', s: 'Open your result sheet in Excel' },
                                { t: 'Inject Variable Codes', s: 'Use placeholders like {{STUDENT_NAME}} or {{MATH_TEST}}' },
                                { t: 'Uplink to Node', s: 'Save as .xlsx and upload to the terminal' },
                                { t: 'Map Logic', s: 'Assign system fields to your custom placeholders' },
                                { t: 'Execute Generation', s: 'Access filled records in the Student Records module' }
                            ].map((step, i) => (
                                <li key={i} className="flex items-start gap-4 group/item">
                                    <div className="w-6 h-6 shrink-0 bg-[#FCFBFA]/50 border border-white/10 rounded-lg flex items-center justify-center text-[10px] font-black text-indigo-400 group-hover/item:border-indigo-500/50 transition-colors mt-0.5">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{step.t}</p>
                                        <p className="text-sm text-slate-300 font-medium italic">{step.s}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Upload area */}
                    {!template ? (
                        <div
                            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative group border-2 border-dashed rounded-[2.5rem] p-10 flex flex-col items-center justify-center transition-all duration-500 overflow-hidden ${
                                dragOver 
                                ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_50px_rgba(99,102,241,0.1)]' 
                                : 'border-white/5 hover:border-indigo-500/40 hover:bg-white/2'
                            }`}
                        >
                            <div className={`w-24 h-24 rounded-3xl mb-6 flex items-center justify-center transition-all duration-500 shadow-inner ${
                                dragOver ? 'bg-indigo-600 scale-110 rotate-12' : 'bg-[#FCFBFA]/50 group-hover:scale-105'
                            }`}>
                                {uploading ? (
                                    <RefreshCw size={40} className="text-white animate-spin" />
                                ) : (
                                    <Upload size={40} className={dragOver ? 'text-white' : 'text-slate-600 group-hover:text-indigo-400'} />
                                )}
                            </div>
                            <h4 className="text-xl font-black text-white italic tracking-tighter uppercase mb-2">
                                {uploading ? 'Processing Signal...' : 'Drop Matrix Module'}
                            </h4>
                            <p className="text-slate-500 text-sm font-bold tracking-widest uppercase text-center max-w-[200px]">
                                or click to browse standard .xlsx / .xls format
                            </p>
                            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => handleFile(e.target.files[0])} />
                            
                            {/* Visual grid effect for dropzone */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px]" />
                        </div>
                    ) : (
                        /* Loaded Template Card */
                        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 flex flex-col justify-between group hover:border-emerald-500/20 transition-all shadow-2xl relative overflow-hidden">
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
                            <div>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-inner">
                                        <FileSpreadsheet size={32} className="text-emerald-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 italic">Active Template</p>
                                        <h4 className="text-xl font-black text-white italic truncate tracking-tight">{template.templateName}</h4>
                                        <p className="text-sm text-slate-500 font-bold mt-1 opacity-60">
                                            {template.detectedPlaceholders?.length || 0} Dynamic Anchors Detected
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <button onClick={downloadBlankTemplate}
                                        className="flex items-center justify-center gap-2 h-11 bg-[#FCFBFA]/50 hover:bg-slate-900 text-slate-400 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                                        <Download size={14} /> Download
                                    </button>
                                    <button onClick={previewWithDummyData}
                                        className="flex items-center justify-center gap-2 h-11 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                                        <Zap size={14} /> Generate Preview
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center justify-center gap-2 h-11 bg-[#FCFBFA]/50 hover:bg-slate-900 text-slate-400 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                                        <RefreshCw size={14} /> Re-link Template
                                    </button>
                                    <button onClick={deleteTemplate}
                                        className="flex items-center justify-center gap-2 h-11 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                                        <Trash2 size={14} /> Purge Node
                                    </button>
                                </div>
                            </div>
                            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => handleFile(e.target.files[0])} />
                        </div>
                    )}
                </div>

                {/* Field Mappings Protocol */}
                {template && template.detectedPlaceholders?.length > 0 && (
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-500">
                        <button
                            onClick={() => setShowMappings(v => !v)}
                            className="w-full flex items-center justify-between px-8 py-6 hover:bg-white/2 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-[#FCFBFA]/50 rounded-lg border border-white/5">
                                    <Settings size={20} className="text-slate-500" />
                                </div>
                                <div>
                                    <span className="font-black text-white italic uppercase tracking-tight text-lg">Logic Mapping Protocol</span>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                                            Object.values(mappings).filter(Boolean).length === template.detectedPlaceholders.length 
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                        }`}>
                                            {Object.values(mappings).filter(Boolean).length} / {template.detectedPlaceholders.length} Anchors Synced
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className={`p-2 rounded-full transition-transform duration-300 ${showMappings ? 'rotate-180' : ''}`}>
                                <ChevronDown size={24} className="text-slate-600" />
                            </div>
                        </button>

                        {showMappings && (
                            <div className="px-8 pb-8 space-y-6 border-t border-white/5 pt-8 animate-in slide-in-from-top-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {template.detectedPlaceholders.map(ph => {
                                        const isMapped = !!mappings[ph];
                                        return (
                                            <div key={ph} className="flex flex-col gap-2 p-3 bg-[#FCFBFA]/30 rounded-2xl border border-white/5 hover:border-white/10 transition-all group/mapping">
                                                <div className="flex items-center justify-between px-2">
                                                    <div className="flex items-center gap-2">
                                                        <FileJson size={14} className={isMapped ? 'text-emerald-400' : 'text-slate-600'} />
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic group-hover/mapping:text-indigo-400 transition-colors">
                                                            {ph}
                                                        </span>
                                                    </div>
                                                    {isMapped ? (
                                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                                    ) : (
                                                        <AlertCircle size={12} className="text-amber-500" />
                                                    )}
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <select
                                                        value={mappings[ph] || ''}
                                                        onChange={e => setMappings(m => ({ ...m, [ph]: e.target.value }))}
                                                        className="w-full bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3 text-xs font-black text-white italic uppercase tracking-tight focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer hover:bg-slate-900 transition-all"
                                                    >
                                                        {AVAILABLE_FIELDS.map(f =>
                                                            f.group ? (
                                                                <option key={f.value} value={f.value} className="bg-slate-900 text-slate-300">[{f.group}] — {f.label}</option>
                                                            ) : (
                                                                <option key="none" value="" className="bg-slate-900 text-slate-500 tracking-widest font-black italic">— NO ASSIGNMENT —</option>
                                                            )
                                                        )}
                                                    </select>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <button onClick={saveMappings}
                                    className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black uppercase tracking-[0.2em] italic text-xs rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group">
                                    <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
                                    Synchronize Logic Matrix
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Deficiency Alert Module */}
                {template && template.detectedPlaceholders?.length === 0 && (
                    <div className="bg-rose-500/5 backdrop-blur-xl border border-rose-500/20 rounded-[2rem] p-8 flex items-start gap-6 shadow-2xl animate-in zoom-in-95 duration-500">
                        <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                            <AlertCircle size={32} className="text-rose-400" />
                        </div>
                        <div>
                            <h5 className="text-lg font-black text-white italic uppercase tracking-tight mb-2">Null Sequence Detected</h5>
                            <p className="text-slate-400 text-sm font-medium italic leading-relaxed">
                                The uplinked template does not contain any functional <code className="bg-[#FCFBFA] px-2 py-1 rounded text-rose-400 font-mono">{'{{PLACEHOLDER}}'}</code> indices. 
                                Please modify the original spreadsheet and define the spatial anchors for data injection, then re-initialize the upload sequence.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

// Export fillTemplate and flattenStudent for use in StudentRecordsSpreadsheet
export { fillTemplate, flattenStudent };
export default ResultTemplateManager;
