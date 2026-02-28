import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Image as ImageIcon, X, Save, ArrowLeft, CheckCircle2, AlertCircle, Clock, BookOpen, Key, LayoutGrid, FileText, Sparkles, ChevronDown } from 'lucide-react';
import TeacherLayout from '../components/TeacherLayout';
import toast from 'react-hot-toast';

const CreateTest = () => {
    const { token, user: authUser } = useSelector((state) => state.auth);
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [teacherProfile, setTeacherProfile] = useState(null);
    const [aiModal, setAiModal] = useState(false);
    const [aiConfig, setAiConfig] = useState({ topic: '', count: 10, type: 'mcq', difficulty: 'medium' });
    const [aiLoading, setAiLoading] = useState(false);

    const [examData, setExamData] = useState({
        title: '',
        subject: '',
        classLevel: '', // JSS1, JSS2, JSS3, SS1, SS2, SS3
        durationMinutes: 30,
        totalMarks: 0,
        passingPercentage: 50,
        negativeMarking: 0,
        startTime: '',
        endTime: '',
        accessCode: '',
        questions: [
            { text: '', type: 'mcq', options: ['', '', '', ''], correctOptions: [0], correctAnswer: '', marks: 1, imageUrl: '' }
        ],
        examType: 'basic', // basic or proctored
        proctoringSettings: {
            requireCamera: false,
            requireAudio: false,
            detectViolations: false,
            lockBrowser: false,
            screenSharing: false,
            faceDetection: false,
            tabSwitchLimit: 0
        }
    });

    const [canMonitor, setCanMonitor] = useState(false); // Controlled by subscription

    useEffect(() => {
        if (token) {
            fetchTeacherProfile();
            if (editId) fetchExamForEdit();
        }
    }, [token, editId]);

    const fetchExamForEdit = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`https://educbt-pro-backend.onrender.com/exam/${editId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Ensure questions have all necessary fields
            const formattedQuestions = res.data.questions.map(q => ({
                ...q,
                options: q.options || ['', '', '', ''],
                correctOptions: q.correctOptions || [0],
                imageUrl: q.imageUrl || ''
            }));

            setExamData({
                ...res.data,
                questions: formattedQuestions
            });
        } catch (error) {
            console.error("Error fetching exam:", error);
            toast.error("Failed to load test for editing");
            navigate('/teacher/tests');
        } finally {
            setLoading(false);
        }
    };

    const fetchTeacherProfile = async () => {
        try {
            const res = await axios.get('https://educbt-pro-backend.onrender.com/school/teacher/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeacherProfile(res.data);

            // Check Subscription Status for Monitoring Access
            if (res.data.subscription && res.data.subscription.canMonitor) {
                setCanMonitor(true);
            } else {
                setCanMonitor(false);
            }

            // Only set default subject if NOT editing
            if (!editId && res.data.info?.subjects?.length > 0) {
                setExamData(prev => ({ ...prev, subject: res.data.info.subjects[0] }));
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const handleChange = (e) => {
        setExamData({ ...examData, [e.target.name]: e.target.value });
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...examData.questions];
        newQuestions[index][field] = value;
        setExamData({ ...examData, questions: newQuestions });
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const newQuestions = [...examData.questions];
        newQuestions[qIndex].options[oIndex] = value;
        setExamData({ ...examData, questions: newQuestions });
    };

    const addQuestion = () => {
        setExamData({
            ...examData,
            questions: [...examData.questions, { text: '', type: 'mcq', options: ['', '', '', ''], correctOptions: [0], correctAnswer: '', marks: 1, imageUrl: '' }]
        });
    };

    const handleAIModalSubmit = async () => {
        if (!examData.subject || !examData.title) {
            toast.error('Please set the exam title and subject first');
            return;
        }
        if (!aiConfig.topic.trim()) {
            toast.error('Please enter a topic');
            return;
        }
        setAiLoading(true);
        try {
            const res = await axios.post('https://educbt-pro-backend.onrender.com/exam/ai-generate', {
                subject: examData.subject,
                topic: aiConfig.topic,
                classLevel: examData.classLevel || 'SS1',
                count: Number(aiConfig.count),
                type: aiConfig.type,
                difficulty: aiConfig.difficulty,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const formattedQuestions = res.data.questions.map(q => ({
                text: q.text || '',
                type: q.type || aiConfig.type,
                options: q.options && q.options.length > 0 ? q.options : (q.type === 'mcq' || !q.type ? ['', '', '', ''] : []),
                correctOptions: q.correctOptions || [0],
                correctAnswer: q.correctAnswer || '',
                marks: q.marks || 1,
                imageUrl: q.imageUrl || ''
            }));

            setExamData(prev => ({ ...prev, questions: [...prev.questions, ...formattedQuestions] }));
            toast.success(`✨ ${formattedQuestions.length} questions generated!`);
            setAiModal(false);
            setAiConfig({ topic: '', count: 10, type: 'mcq', difficulty: 'medium' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'AI Generation failed. Check your API key.');
        } finally {
            setAiLoading(false);
        }
    };


    const handleBulkUpload = async (file) => {
        const loadingToast = toast.loading("Processing file...");
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post('https://educbt-pro-backend.onrender.com/exam/bulk-upload-questions', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setExamData(prev => ({
                ...prev,
                questions: [...prev.questions, ...res.data.questions]
            }));
            toast.success("Bulk questions imported", { id: loadingToast });
        } catch (error) {
            toast.error("Bulk upload failed", { id: loadingToast });
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await axios.get('https://educbt-pro-backend.onrender.com/exam/template/bulk-upload', {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'bulk_question_template.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Failed to download template");
        }
    };

    const addOption = (qIndex) => {
        const newQuestions = [...examData.questions];
        if (newQuestions[qIndex].options.length >= 6) {
            toast.error("Maximum 6 options allowed");
            return;
        }
        newQuestions[qIndex].options.push('');
        setExamData({ ...examData, questions: newQuestions });
    };

    const removeOption = (qIndex, oIndex) => {
        const newQuestions = [...examData.questions];
        if (newQuestions[qIndex].options.length <= 2) {
            toast.error("Minimum 2 options required");
            return;
        }

        // Remove option
        newQuestions[qIndex].options.splice(oIndex, 1);

        // Adjust correctOptions indices
        newQuestions[qIndex].correctOptions = newQuestions[qIndex].correctOptions
            .filter(idx => idx !== oIndex)
            .map(idx => idx > oIndex ? idx - 1 : idx);

        // Ensure at least one correct option exists if we removed the only one
        if (newQuestions[qIndex].correctOptions.length === 0) {
            newQuestions[qIndex].correctOptions = [0];
        }

        setExamData({ ...examData, questions: newQuestions });
    };

    const toggleCorrectOption = (qIndex, oIndex) => {
        const newQuestions = [...examData.questions];
        const correctOnes = newQuestions[qIndex].correctOptions || [];

        if (correctOnes.includes(oIndex)) {
            if (correctOnes.length === 1) {
                toast.error("At least one correct option is required");
                return;
            }
            newQuestions[qIndex].correctOptions = correctOnes.filter(idx => idx !== oIndex);
        } else {
            newQuestions[qIndex].correctOptions = [...correctOnes, oIndex];
        }

        setExamData({ ...examData, questions: newQuestions });
    };

    const removeQuestion = (index) => {
        if (examData.questions.length === 1) {
            toast.error("At least one question is required");
            return;
        }
        const newQuestions = examData.questions.filter((_, i) => i !== index);
        setExamData({ ...examData, questions: newQuestions });
    };

    const handleImageUpload = async (index, file) => {
        if (!file) return;

        const loadingToast = toast.loading("Uploading image...");
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await axios.post('https://educbt-pro-backend.onrender.com/exam/teacher/upload-image', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            handleQuestionChange(index, 'imageUrl', res.data.imageUrl);
            toast.success("Image uploaded", { id: loadingToast });
        } catch (error) {
            toast.error("Upload failed", { id: loadingToast });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!examData.title || !examData.subject || !examData.classLevel) {
            toast.error("Please fill in all basic details including class level");
            return;
        }

        // Validate questions — rules differ by type
        const isQuestionsValid = examData.questions.every(q => {
            if (!q.text) return false;
            if (q.type === 'essay') return true; // no options needed
            if (q.type === 'fib') return q.correctAnswer && q.correctAnswer.trim() !== '';
            // mcq / true_false need options + a correct option
            return q.options.every(o => o.trim() !== '') && q.correctOptions && q.correctOptions.length > 0;
        });

        if (!isQuestionsValid) {
            toast.error("Please fill in all questions, options, and select correct answers");
            return;
        }

        setLoading(true);
        try {
            if (editId) {
                await axios.put(`https://educbt-pro-backend.onrender.com/exam/${editId}`, examData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Test updated successfully!');
            } else {
                await axios.post('https://educbt-pro-backend.onrender.com/exam/create', examData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Test created successfully!');
            }
            navigate('/teacher/tests');
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create test");
        } finally {
            setLoading(false);
        }
    };

    return (
        <TeacherLayout>
            <div className="max-w-5xl mx-auto pb-20 space-y-10 animate-in fade-in duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#D4AF37]/10 blur-[100px] rounded-full pointer-events-none" />
                    <div>
                        <div className="inline-flex items-center gap-2 bg-gold-50 border border-[#D4AF37]/20 rounded-full px-3 py-1 mb-4">
                            <Plus size={12} className="text-[#D4AF37]" />
                            <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest">Assessment Creator</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 italic tracking-tight">
                            {editId ? 'Edit' : 'Create'} <span className="gold-text-gradient italic">Institutional</span> Test
                        </h1>
                        <p className="text-slate-500 text-sm mt-2 font-medium italic">Craft a secure and engaging assessment for your students.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/teacher/tests')}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-[#D4AF37] transition-all flex items-center gap-2"
                        >
                            <ArrowLeft size={14} /> Back
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`btn-primary py-2.5! px-8! text-[11px]! ${loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                        >
                            <Save size={14} /> {loading ? 'Saving...' : 'Publish Test'}
                        </button>
                    </div>
                </div>

                {/* Step 1: Basic Info */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 md:p-10 space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
                    
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-11 h-11 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner">
                            <LayoutGrid size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white italic">Assessment Essentials</h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Specify the core details of your test</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Assessment Title</label>
                            <div className="relative group/input">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-indigo-500 transition-colors" size={18} />
                                <input
                                    type="text" name="title" placeholder="e.g. Mid-Term Geometry Quiz"
                                    className="w-full pl-12 pr-4 py-4 bg-[#FCFBFA]/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all font-bold text-slate-200 placeholder:text-slate-700"
                                    value={examData.title} onChange={handleChange} required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Subject Category</label>
                            <div className="relative">
                                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                <select
                                    name="subject"
                                    className="w-full pl-12 pr-4 py-4 bg-[#FCFBFA]/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all font-bold text-slate-200 appearance-none cursor-pointer"
                                    value={examData.subject} onChange={handleChange} required
                                >
                                    <option value="" className="bg-slate-900">Select Subject</option>
                                    {teacherProfile?.info?.subjects?.map(s => (
                                        <option key={s} value={s} className="bg-slate-900">{s}</option>
                                    ))}
                                    <option value="General" className="bg-slate-900">General</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Duration (Mins)</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                    <input
                                        type="number" name="durationMinutes"
                                        className="w-full pl-12 pr-4 py-4 bg-[#FCFBFA]/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all font-bold text-slate-200"
                                        value={examData.durationMinutes} onChange={handleChange} required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Access Code</label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                    <input
                                        type="text" name="accessCode" placeholder="Optional"
                                        className="w-full pl-12 pr-4 py-4 bg-[#FCFBFA]/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all font-bold text-slate-200 uppercase tracking-widest placeholder:text-slate-700"
                                        value={examData.accessCode} onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Class Level</label>
                            <select
                                name="classLevel"
                                className="w-full px-6 py-4 bg-[#FCFBFA]/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all font-bold text-slate-200 appearance-none cursor-pointer"
                                value={examData.classLevel} onChange={handleChange} required
                            >
                                <option value="" className="bg-slate-900">Select Class</option>
                                {['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'].map(c => (
                                    <option key={c} value={c} className="bg-slate-900">{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Negative Marking</label>
                                <input
                                    type="number" step="0.25" name="negativeMarking"
                                    className="w-full px-6 py-4 bg-[#FCFBFA]/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-slate-200"
                                    value={examData.negativeMarking} onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Pass %</label>
                                <input
                                    type="number" name="passingPercentage"
                                    className="w-full px-6 py-4 bg-[#FCFBFA]/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-slate-200"
                                    value={examData.passingPercentage} onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Start Time</label>
                                <input
                                    type="datetime-local" name="startTime"
                                    className="w-full px-6 py-4 bg-[#FCFBFA]/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-slate-200"
                                    value={examData.startTime} onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">End Time</label>
                                <input
                                    type="datetime-local" name="endTime"
                                    className="w-full px-6 py-4 bg-[#FCFBFA]/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-slate-200"
                                    value={examData.endTime} onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Security Selection */}
                    <div className="pt-6 border-t border-white/5">
                        <h3 className="text-sm font-black text-slate-300 italic mb-6">Execution Mode</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div
                                onClick={() => setExamData({ ...examData, examType: 'basic' })}
                                className={`group/mode relative rounded-2xl border-2 p-6 transition-all cursor-pointer ${examData.examType === 'basic' ? 'border-indigo-600 bg-indigo-600/5' : 'border-white/5 bg-[#FCFBFA]/30 hover:border-white/10'}`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                     <div className={`p-2.5 rounded-xl ${examData.examType === 'basic' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                        <LayoutGrid size={18} />
                                     </div>
                                     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${examData.examType === 'basic' ? 'border-indigo-600' : 'border-slate-700'}`}>
                                        {examData.examType === 'basic' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-[0_0_8px_#4f46e5]" />}
                                     </div>
                                </div>
                                <h4 className="font-black text-white italic tracking-tight mb-2">Standard Mode</h4>
                                <p className="text-slate-500 text-xs font-medium leading-relaxed">Classic exam format. Students focus solely on questions without strict monitoring.</p>
                            </div>

                            <div
                                onClick={() => {
                                    if (canMonitor) {
                                        setExamData({ ...examData, examType: 'proctored' });
                                    } else {
                                        toast.error("Premium upgrade required for Monitor Mode");
                                    }
                                }}
                                className={`group/mode relative rounded-2xl border-2 p-6 transition-all ${!canMonitor ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'} ${examData.examType === 'proctored' ? 'border-amber-500 bg-amber-500/5' : 'border-white/5 bg-[#FCFBFA]/30'}`}
                            >
                                {!canMonitor && (
                                    <div className="absolute top-4 right-4 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-amber-500/20 z-10 animate-pulse">
                                        UPGRADE
                                    </div>
                                )}
                                <div className="flex items-center justify-between mb-4">
                                     <div className={`p-2.5 rounded-xl ${examData.examType === 'proctored' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                        <AlertCircle size={18} />
                                     </div>
                                     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${examData.examType === 'proctored' ? 'border-amber-500' : 'border-slate-700'}`}>
                                        {examData.examType === 'proctored' && <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />}
                                     </div>
                                </div>
                                <h4 className="font-black text-white italic tracking-tight mb-2">Monitor Pro</h4>
                                <p className="text-slate-500 text-xs font-medium leading-relaxed italic">AI-powered proctoring, face tracking, and browser locking for high-stakes tests.</p>
                            </div>
                        </div>
                    </div>

                    {/* Proctoring Settings */}
                    {examData.examType === 'proctored' && (
                        <div className="mt-8 p-6 bg-amber-500/5 border border-amber-500/20 rounded-[1.5rem] space-y-6 animate-in slide-in-from-top-2 duration-500">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Premium Security Engine Active</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { key: 'requireCamera', label: 'Face Tracking' },
                                    { key: 'requireAudio', label: 'Audio Detection' },
                                    { key: 'screenSharing', label: 'Screen Mirror' },
                                    { key: 'lockBrowser', label: 'Tab Lockdown' }
                                ].map((setting) => (
                                    <label key={setting.key} className="relative flex items-center justify-between p-4 bg-[#FCFBFA]/50 border border-white/5 rounded-xl cursor-pointer hover:border-amber-500/30 transition-all group/opt">
                                        <span className="text-xs font-black text-slate-300 italic group-hover/opt:text-amber-400 transition-colors uppercase tracking-tight">{setting.label}</span>
                                        <input
                                            type="checkbox"
                                            checked={examData.proctoringSettings[setting.key]}
                                            onChange={(e) => setExamData({
                                                ...examData,
                                                proctoringSettings: {
                                                    ...examData.proctoringSettings,
                                                    [setting.key]: e.target.checked
                                                }
                                            })}
                                            className="w-5 h-5 rounded bg-slate-900 border-white/10 text-amber-500 focus:ring-amber-500/30"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Step 2: Questions */}
                <div className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                                <BookOpen size={22} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white italic">Questions Ledger</h2>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest italic">Inventory of assessment items</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setAiModal(true)}
                                className="px-4 py-2 bg-linear-to-r from-[#D4AF37] to-[#996515] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-gold-600/20 hover:scale-105 transition-all flex items-center gap-1.5"
                            >
                                <Sparkles size={12} /> AI Generate
                            </button>
                            <button
                                type="button"
                                onClick={handleDownloadTemplate}
                                className="px-4 py-2 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 hover:bg-slate-200 transition-all"
                            >
                                Get Template
                            </button>
                            <label className="px-4 py-2 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl border border-[#D4AF37]/30 cursor-pointer hover:bg-gold-50 transition-all flex items-center gap-2 shadow-sm">
                                <Plus size={12} className="text-[#D4AF37]" /> Bulk Upload
                                <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={(e) => handleBulkUpload(e.target.files[0])} />
                            </label>
                            <div className="flex flex-col items-end ml-4">
                                <span className="text-2xl font-black text-[#D4AF37] tracking-tighter italic">{examData.questions.length}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Units</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {examData.questions.map((q, qIndex) => (
                            <div key={qIndex} className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2rem] overflow-hidden group hover:border-indigo-500/30 transition-all duration-500">
                                <div className="bg-white/2 px-8 py-4 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                         <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-indigo-600/20 italic">#{qIndex + 1}</span>
                                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Question Entry</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeQuestion(qIndex)}
                                        className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="p-8 space-y-8">
                                    {/* Question Text & Image */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2 space-y-4">
                                            <div className="flex items-center gap-4 mb-2">
                                                <select
                                                    className="bg-slate-900 text-slate-300 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/10 outline-none"
                                                    value={q.type || 'mcq'}
                                                    onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                                                >
                                                    <option value="mcq">Multiple Choice</option>
                                                    <option value="true_false">True / False</option>
                                                    <option value="fib">Fill in Blank</option>
                                                    <option value="essay">Essay / Free Text</option>
                                                </select>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Marks:</span>
                                                    <input
                                                        type="number"
                                                        className="w-12 bg-slate-900 border border-white/5 rounded px-2 py-1 text-xs font-bold text-indigo-400"
                                                        value={q.marks || 1}
                                                        onChange={(e) => handleQuestionChange(qIndex, 'marks', parseInt(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="relative group/q">
                                                <textarea
                                                    placeholder="Describe the question context..."
                                                    className="w-full px-6 py-5 bg-[#FCFBFA]/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 outline-none transition-all font-bold text-slate-200 placeholder:text-slate-700 resize-none min-h-[120px] shadow-inner"
                                                    value={q.text}
                                                    onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                                                    required
                                                />
                                                <label className="absolute bottom-5 right-5 cursor-pointer flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-slate-300 transition-colors border border-white/5 shadow-xl">
                                                    <input
                                                        type="file" accept="image/*" className="hidden"
                                                        onChange={(e) => handleImageUpload(qIndex, e.target.files[0])}
                                                    />
                                                    <ImageIcon size={14} className="group-hover/q:text-indigo-400 transition-colors" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Attach Media</span>
                                                </label>
                                            </div>

                                            {q.imageUrl && (
                                                <div className="relative inline-block group/img">
                                                    <img src={q.imageUrl} alt="Q" className="max-h-56 rounded-2xl border border-white/10 ring-4 ring-slate-950" />
                                                    <button
                                                        onClick={() => handleQuestionChange(qIndex, 'imageUrl', '')}
                                                        className="absolute -top-3 -right-3 bg-rose-600 text-white p-1.5 rounded-full shadow-xl hover:bg-rose-500 group-hover/img:scale-110 transition-all border-4 border-slate-950"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            {(q.type === 'mcq' || q.type === 'true_false' || !q.type) && (
                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Options & Answer</p>
                                                    {q.options.map((option, oIndex) => (
                                                        <div key={oIndex} className="relative group/opt">
                                                            <input
                                                                type="text"
                                                                placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                                                className={`w-full pl-10 pr-10 py-3 bg-[#FCFBFA]/20 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all text-xs font-bold text-slate-300 ${q.correctOptions.includes(oIndex) ? 'border-indigo-600/40 bg-indigo-600/5' : 'border-white/5'}`}
                                                                value={option}
                                                                onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                                required
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleCorrectOption(qIndex, oIndex)}
                                                                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all ${q.correctOptions.includes(oIndex) ? 'text-indigo-400' : 'text-slate-700'}`}
                                                            >
                                                                <CheckCircle2 size={16} fill={q.correctOptions.includes(oIndex) ? 'currentColor' : 'none'} fillOpacity={0.2} />
                                                            </button>
                                                            {q.type === 'mcq' && q.options.length > 2 && (
                                                                <button onClick={() => removeOption(qIndex, oIndex)} className="absolute -left-2 top-1/2 -translate-y-1/2 text-slate-800 hover:text-rose-500 transition-colors opacity-0 group-hover/opt:opacity-100">
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {q.type === 'mcq' && q.options.length < 6 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => addOption(qIndex)}
                                                            className="w-full py-2 border border-dashed border-white/5 rounded-xl text-slate-600 text-[10px] font-black uppercase tracking-widest hover:border-indigo-500/30 hover:text-indigo-400 transition-all"
                                                        >
                                                            + Add Option
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {q.type === 'fib' && (
                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Correct Answer</p>
                                                    <input
                                                        type="text"
                                                        placeholder="Enter exact correct answer..."
                                                        className="w-full px-4 py-3 bg-[#FCFBFA]/50 border border-indigo-500/30 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-slate-200"
                                                        value={q.correctAnswer}
                                                        onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                                                    />
                                                    <p className="text-[9px] text-slate-500 italic">Case-insensitive matching will be used.</p>
                                                </div>
                                            )}

                                            {q.type === 'essay' && (
                                                <div className="p-4 bg-[#FCFBFA]/30 border border-white/5 rounded-xl">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Essay Mode</p>
                                                    <p className="text-[10px] text-slate-600 italic leading-relaxed">Students will provide a long-form text response. These must be manually graded or use AI feedback (if enabled).</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addQuestion}
                        className="w-full py-6 rounded-[2rem] border-2 border-dashed border-white/5 bg-slate-900/20 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-slate-900/40 transition-all font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 group/add"
                    >
                        <div className="w-8 h-8 rounded-xl bg-slate-800 group-hover/add:bg-indigo-600 group-hover/add:text-white flex items-center justify-center transition-all">
                            <Plus size={18} />
                        </div>
                        Mint New Question Unit
                    </button>
                </div>

                {/* Sticky Mobile Bar */}
                <div className="md:hidden sticky bottom-4 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 mx-4">
                     <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">{examData.questions.length} Items Locked</span>
                     <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                     >
                        {loading ? 'Processing...' : 'Sync & Publish'}
                     </button>
                </div>
            </div>

            {/* ── AI Generate Modal ──────────────────────────────────────── */}
            {aiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !aiLoading && setAiModal(false)}>
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                    <div
                        className="relative bg-[#0f0d0b] border border-[#c5a059]/20 rounded-3xl w-full max-w-lg shadow-2xl shadow-black/50 animate-in zoom-in-95 fade-in duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#c5a059]/10 border border-[#c5a059]/20 flex items-center justify-center">
                                    <Sparkles size={18} className="text-[#c5a059]" />
                                </div>
                                <div>
                                    <h3 className="font-black text-white italic tracking-tight">AI Question Generator</h3>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Powered by Gemini AI</p>
                                </div>
                            </div>
                            <button onClick={() => setAiModal(false)} disabled={aiLoading} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-8 py-6 space-y-6">

                            {/* Subject + Title read-only info */}
                            <div className="bg-white/3 border border-white/5 rounded-2xl px-5 py-3 flex items-center justify-between">
                                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Exam</span>
                                <span className="text-white text-xs font-bold">{examData.title || '—'} · {examData.subject || '—'}</span>
                            </div>

                            {/* Topic */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Topic *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Quadratic equations, Photosynthesis, World War II..."
                                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm font-medium placeholder:text-slate-600 focus:outline-none focus:border-[#c5a059]/40 focus:bg-white/8 transition-all"
                                    value={aiConfig.topic}
                                    onChange={e => setAiConfig(p => ({ ...p, topic: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && handleAIModalSubmit()}
                                    autoFocus
                                />
                            </div>

                            {/* Count slider */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Number of Questions</label>
                                    <span className="text-2xl font-black text-[#c5a059] italic">{aiConfig.count}</span>
                                </div>
                                <input
                                    type="range" min="5" max="50" step="5"
                                    value={aiConfig.count}
                                    onChange={e => setAiConfig(p => ({ ...p, count: Number(e.target.value) }))}
                                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#c5a059]"
                                />
                                <div className="flex justify-between text-[9px] font-black text-slate-600 uppercase">
                                    <span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span><span>40</span><span>50</span>
                                </div>
                            </div>

                            {/* Type + Difficulty row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Type</label>
                                    <select
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-bold uppercase tracking-wide focus:outline-none focus:border-[#c5a059]/40 appearance-none cursor-pointer"
                                        value={aiConfig.type}
                                        onChange={e => setAiConfig(p => ({ ...p, type: e.target.value }))}
                                    >
                                        <option value="mcq" className="bg-slate-900">Multiple Choice (MCQ)</option>
                                        <option value="true_false" className="bg-slate-900">True / False</option>
                                        <option value="fib" className="bg-slate-900">Fill in the Blank</option>
                                        <option value="essay" className="bg-slate-900">Essay / Open-ended</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Difficulty</label>
                                    <select
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-bold uppercase tracking-wide focus:outline-none focus:border-[#c5a059]/40 appearance-none cursor-pointer"
                                        value={aiConfig.difficulty}
                                        onChange={e => setAiConfig(p => ({ ...p, difficulty: e.target.value }))}
                                    >
                                        <option value="easy" className="bg-slate-900">Easy</option>
                                        <option value="medium" className="bg-slate-900">Medium</option>
                                        <option value="hard" className="bg-slate-900">Hard</option>
                                        <option value="mixed" className="bg-slate-900">Mixed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 pb-8 flex items-center gap-3">
                            <button
                                onClick={() => setAiModal(false)}
                                disabled={aiLoading}
                                className="flex-1 py-3 border border-white/10 rounded-2xl text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-white hover:border-white/20 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAIModalSubmit}
                                disabled={aiLoading || !aiConfig.topic.trim()}
                                className={`flex-1 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg
                                    ${aiLoading || !aiConfig.topic.trim()
                                        ? 'bg-[#c5a059]/30 text-[#c5a059]/50 cursor-not-allowed'
                                        : 'bg-[#c5a059] text-[#1a120b] hover:bg-yellow-400 shadow-[#c5a059]/20 active:scale-95'}`}
                            >
                                {aiLoading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-[#1a120b]/30 border-t-[#1a120b] rounded-full animate-spin" />
                                        Generating {aiConfig.count} questions...
                                    </>
                                ) : (
                                    <><Sparkles size={14} /> Generate {aiConfig.count} Questions</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </TeacherLayout>
    );
};

export default CreateTest;
