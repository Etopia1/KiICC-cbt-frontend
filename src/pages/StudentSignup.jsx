import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import { User, MapPin, Hash, Book, Lock, Building2, ArrowRight, GraduationCap, Phone, Clock, Activity, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentSignup = () => {
    const [searchParams] = useSearchParams();
    const { schoolRefId } = useParams();
    const navigate = useNavigate();
    const urlSchoolId = searchParams.get('schoolId');

    const [formData, setFormData] = useState({
        fullName: '',
        classLevel: '',
        location: '',
        dateOfBirth: '',
        phone: '',
        password: '',
        schoolId: urlSchoolId || schoolRefId || '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [schoolInfo, setSchoolInfo] = useState(null);

    useEffect(() => {
        const fetchSchool = async () => {
            const id = urlSchoolId || schoolRefId;
            if (id) {
                try {
                    const res = await axios.get(`https://educbt-pro-backend.onrender.com/school/${id}`);
                    setSchoolInfo(res.data);
                } catch (err) {
                    console.error("School context fetch error:", err);
                }
            }
        };
        fetchSchool();
    }, [urlSchoolId, schoolRefId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const loadingToast = toast.loading('Initializing Candidate Identity...');
        try {
            await axios.post('https://educbt-pro-backend.onrender.com/auth/register', { ...formData, role: 'student' });
            toast.dismiss(loadingToast);
            toast.success('Identity Created Successfully!');
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
                
                {/* Left Panel: Information */}
                <div className="lg:w-2/5 bg-[#1a120b] p-12 md:p-16 flex flex-col justify-between relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#c5a059]/10 to-transparent pointer-events-none" />
                    <div className="relative z-10">
                        <Link to="/" className="inline-flex items-center gap-2 text-[#c5a059] text-[10px] font-black uppercase tracking-[0.2em] mb-12 hover:translate-x-1 transition-transform">
                            <Activity size={16} />
                            Portal Exit
                        </Link>
                        
                        <div className="mb-12">
                            <div className="w-14 h-14 rounded-2xl bg-[#c5a059]/10 flex items-center justify-center border border-[#c5a059]/20 mb-8">
                                <GraduationCap size={28} className="text-[#c5a059]" />
                            </div>
                            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none mb-6">
                                Candidate <span className="text-[#c5a059]">Registry</span>
                            </h2>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed italic">
                                Initialize your student identity profile at {schoolInfo?.schoolName ? <span className="text-[#c5a059] font-black">{schoolInfo.schoolName}</span> : 'your institution'} and begin your digital assessment journey.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <ShieldCheck size={18} className="text-[#c5a059]" />
                                    <h4 className="text-white text-[10px] font-black uppercase tracking-widest italic">Secure Access</h4>
                                </div>
                                <p className="text-slate-500 text-[11px] leading-relaxed">High-integrity credential encryption for all student nodes.</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 pt-12 border-t border-white/5">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Institutional Authentication Protocol v2.4</p>
                    </div>
                </div>

                {/* Right Panel: Data Matrix */}
                <div className="lg:w-3/5 p-10 md:p-16 overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-8 max-w-lg mx-auto">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Candidate Full Name</label>
                            <div className="relative group/input">
                                <User size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-[#c5a059] transition-colors" />
                                <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="LEGAL NAME AS ON RECORD" required className="input-field pl-14" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Academic Level</label>
                                <div className="relative group/input">
                                    <Hash size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-[#c5a059] transition-colors" />
                                    <select name="classLevel" value={formData.classLevel} onChange={handleChange} required className="input-field pl-14 appearance-none cursor-pointer">
                                        <option value="">SELECT LEVEL</option>
                                        <option value="JSS 1">JSS 1</option>
                                        <option value="JSS 2">JSS 2</option>
                                        <option value="JSS 3">JSS 3</option>
                                        <option value="SSS 1">SSS 1</option>
                                        <option value="SSS 2">SSS 2</option>
                                        <option value="SSS 3">SSS 3</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Registry Domain</label>
                                <div className="relative group/input">
                                    <Building2 size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-[#c5a059] transition-colors" />
                                    <input name="schoolId" value={formData.schoolId} onChange={handleChange} placeholder="INSTITUTION CODE" required className="input-field pl-14" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Temporal Node (DOB)</label>
                                <div className="relative group/input">
                                    <Clock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-[#c5a059] transition-colors" />
                                    <input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required className="input-field pl-14" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Secure Link (Phone)</label>
                                <div className="relative group/input">
                                    <Phone size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-[#c5a059] transition-colors" />
                                    <input name="phone" value={formData.phone} onChange={handleChange} placeholder="+234 CELLULAR" required className="input-field pl-14" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Spatial Location</label>
                            <div className="relative group/input">
                                <MapPin size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-[#c5a059] transition-colors" />
                                <input name="location" value={formData.location} onChange={handleChange} placeholder="CURRENT RESIDENCE/ZONE" required className="input-field pl-14" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Access Key Override</label>
                            <div className="relative group/input">
                                <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-[#c5a059] transition-colors" />
                                <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="CREATE SECURE KEY" required className="input-field pl-14" />
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
                                    Commit Identity
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Already Registered?{' '}
                            <Link to="/login" className="text-[#c5a059] hover:underline transition-all italic">Access Portal</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StudentSignup;
