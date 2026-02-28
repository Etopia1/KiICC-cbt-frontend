import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import { BookOpen, MapPin, User, Mail, Lock, Plus, X, Phone, Building2, ArrowRight, CheckCircle, GraduationCap, Users, Activity, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const TeacherSignup = () => {
    const [searchParams] = useSearchParams();
    const { token } = useParams();
    const navigate = useNavigate();
    const urlSchoolId = searchParams.get('schoolId');

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        location: '',
        subjects: [],
        experienceYears: '',
        qualifications: '',
        schoolId: urlSchoolId || token || '',
    });

    const [subjectInput, setSubjectInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [schoolInfo, setSchoolInfo] = useState(null);

    useEffect(() => {
        const fetchSchool = async () => {
            const id = urlSchoolId || token;
            if (id) {
                try {
                    const res = await axios.get(`https://educbt-pro-backend.onrender.com/school/${id}`);
                    setSchoolInfo(res.data);
                } catch (err) {
                    console.error("School context error:", err);
                }
            }
        };
        fetchSchool();
    }, [urlSchoolId, token]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const addSubject = () => {
        if (subjectInput && !formData.subjects.includes(subjectInput)) {
            setFormData({ ...formData, subjects: [...formData.subjects, subjectInput] });
            setSubjectInput('');
        }
    };

    const removeSubject = (val) => {
        setFormData({ ...formData, subjects: formData.subjects.filter(s => s !== val) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.subjects.length === 0) {
            toast.error("Please add at least one subject node");
            return;
        }
        
        setIsLoading(true);
        const loadingToast = toast.loading('Initializing Faculty Credentials...');
        try {
            await axios.post('https://educbt-pro-backend.onrender.com/school/teacher/register', formData);
            toast.dismiss(loadingToast);
            toast.success('Faculty Registry Success! Awaiting Admin Clearance.');
            navigate('/login');
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error(error.response?.data?.message || 'Registration failure');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center p-6 md:p-12 relative overflow-hidden font-outfit">
             {/* Design Elements */}
             <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-[#c5a059]/5 blur-[120px] rounded-full pointer-events-none" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-[#1a120b]/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex flex-col lg:flex-row w-full max-w-6xl bg-white border border-slate-100 rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] overflow-hidden relative z-10 animate-fade-in-up">
                
                {/* Left Panel: Contextual Information */}
                <div className="lg:w-2/5 bg-[#1a120b] p-12 md:p-16 flex flex-col justify-between relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#c5a059]/10 to-transparent pointer-events-none" />
                    <div className="relative z-10">
                        <Link to="/" className="inline-flex items-center gap-2 text-[#c5a059] text-[10px] font-black uppercase tracking-[0.2em] mb-12 hover:translate-x-1 transition-transform">
                            <GraduationCap size={16} />
                            Exit to Hub
                        </Link>
                        
                        <div className="mb-12">
                            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none mb-6">
                                Faculty <span className="text-[#c5a059]">Registry</span>
                            </h2>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed italic">
                                Initialize your credentials within the {schoolInfo?.schoolName ? <span className="text-[#c5a059] font-black">{schoolInfo.schoolName}</span> : 'institutional'} assessment network.
                            </p>
                        </div>

                        <div className="space-y-8">
                            {[
                                { icon: ShieldCheck, title: 'Verified Status', desc: 'Secure credential verification for all faculty nodes.' },
                                { icon: Activity, title: 'Network Sync', desc: 'Real-time synchronization with institutional repositories.' },
                                { icon: BookOpen, title: 'Vault Access', desc: 'Authorized deployment of assessment scripts.' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-5 group/item">
                                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#c5a059] group-hover/item:bg-[#c5a059] group-hover/item:text-[#1a120b] transition-all">
                                        <item.icon size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-white text-xs font-black uppercase tracking-widest mb-1 italic">{item.title}</h4>
                                        <p className="text-slate-500 text-[11px] font-medium leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 pt-12 border-t border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#c5a059]/20 flex items-center justify-center border border-[#c5a059]/30">
                                <Users size={16} className="text-[#c5a059]" />
                            </div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Join 1,000+ Verified Educators</p>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Data Entry */}
                <div className="lg:w-3/5 p-10 md:p-16 overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-8 max-w-lg mx-auto">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Personal Nomenclature</label>
                            <div className="relative group/input">
                                <User size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-[#c5a059] transition-colors" />
                                <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="FULL LEGAL NAME" required className="input-field pl-14" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Digital Channel</label>
                                <div className="relative group/input">
                                    <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-[#c5a059] transition-colors" />
                                    <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="EMAIL@DOMAIN.COM" required className="input-field pl-14" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Secure Link</label>
                                <div className="relative group/input">
                                    <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-[#c5a059] transition-colors" />
                                    <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="ACCESS KEY" required className="input-field pl-14" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Contact Line</label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input name="phone" value={formData.phone} onChange={handleChange} placeholder="+234 CELLULAR" className="input-field pl-14" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Registry Domain</label>
                                <div className="relative">
                                    <Building2 size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input name="schoolId" value={formData.schoolId} onChange={handleChange} placeholder="SCHOOL ID (Optional)" className="input-field pl-14" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Operational Location</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input name="location" value={formData.location} onChange={handleChange} placeholder="CURRENT RESIDENCE/ZONE" className="input-field pl-14" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Subject Verticals</label>
                            <div className="flex gap-3">
                                <input 
                                    value={subjectInput} 
                                    onChange={(e) => setSubjectInput(e.target.value)} 
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubject())}
                                    placeholder="ADD SUBJECT NODE" 
                                    className="input-field flex-1 uppercase"
                                />
                                <button type="button" onClick={addSubject} className="w-14 h-14 bg-[#1a120b] text-[#c5a059] rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 border border-[#c5a059]/10">
                                    <Plus size={20} />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.subjects.map((sub, i) => (
                                    <span key={i} className="px-4 py-2 bg-slate-50 text-slate-600 text-[10px] font-black rounded-lg flex items-center gap-2 border border-slate-100 uppercase italic">
                                        {sub}
                                        <X size={12} className="cursor-pointer hover:text-rose-500 transition-colors" onClick={() => removeSubject(sub)} />
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Service Cycles</label>
                                <input name="experienceYears" type="number" value={formData.experienceYears} onChange={handleChange} placeholder="YEARS" className="input-field" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Credential Rank</label>
                                <input name="qualifications" value={formData.qualifications} onChange={handleChange} placeholder="M.Sc, B.Ed, ETC." className="input-field uppercase" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-16 bg-[#1a120b] hover:bg-black text-[#c5a059] font-black text-[11px] uppercase tracking-[0.25em] rounded-[1.25rem] transition-all shadow-2xl active:scale-95 border border-[#c5a059]/20 flex items-center justify-center gap-4 group"
                        >
                            {isLoading ? (
                                <Activity size={20} className="animate-spin" />
                            ) : (
                                <>
                                    Commit Credentials
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Existing Account?{' '}
                            <Link to="/login" className="text-[#c5a059] hover:underline transition-all italic">Institutional Access</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TeacherSignup;
