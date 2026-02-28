import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    GraduationCap, ArrowLeft, Upload, School, Mail, Phone,
    MapPin, User, Lock, CheckCircle2, ArrowRight, ShieldCheck, Activity
} from 'lucide-react';

const steps = ['Institutional Info', 'Registry Location', 'Admin Protocol'];

const SchoolRegister = () => {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        schoolName: '',
        schoolEmail: '',
        phone: '',
        address: '',
        location: { city: '', state: '', country: 'Nigeria' },
        adminName: '',
        adminPassword: '',
    });
    const [logo, setLogo] = useState(null);
    const [preview, setPreview] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setLogo(file);
        setPreview(file ? URL.createObjectURL(file) : null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        if (logo) data.append('logo', logo);
        data.append('schoolName', formData.schoolName);
        data.append('schoolEmail', formData.schoolEmail);
        data.append('phone', formData.phone);
        data.append('address', formData.address);
        data.append('location', JSON.stringify(formData.location));
        data.append('adminName', formData.adminName);
        data.append('adminPassword', formData.adminPassword);

        const loadingToast = toast.loading('Initializing Institutional Registry...');
        try {
            const res = await axios.post('https://educbt-pro-backend.onrender.com/school/register', data);
            toast.dismiss(loadingToast);
            toast.success('Registry Initialized successfully!');
            toast((t) => (
                <div className="flex flex-col gap-2">
                    <p className="font-black text-[10px] uppercase tracking-widest text-[#1a120b]">Institutional Login ID</p>
                    <p className="text-xl font-black text-[#c5a059] italic">{res.data.schoolLoginId}</p>
                    <p className="text-[9px] text-slate-500 font-bold">Please secure this ID for portal access.</p>
                </div>
            ), { duration: 10000, icon: '??' });
            navigate('/login');
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error(error.response?.data?.message || 'Registry Initialization failed');
        }
    };

    return (
        <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center relative overflow-hidden px-4 py-20 font-outfit">
            {/* Design Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-[#c5a059]/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-[#1a120b]/5 blur-[100px] rounded-full pointer-events-none" />

            {/* Navigation Exit */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-10 left-10 flex items-center gap-3 text-slate-400 hover:text-[#1a150e] text-[10px] font-black uppercase tracking-[0.2em] transition-all group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Return to Landing
            </button>

            <div className="relative z-10 w-full max-w-xl">
                {/* Brand Identity */}
                <div className="flex flex-col items-center mb-12 animate-fade-in-up">
                    <div className="w-16 h-16 rounded-[2rem] bg-[#1a120b] flex items-center justify-center border border-[#c5a059]/10 shadow-2xl mb-6 group hover:rotate-12 transition-transform duration-500">
                        <Activity size={32} className="text-[#c5a059]" />
                    </div>
                    <h1 className="text-3xl font-black text-[#1a150e] tracking-tighter uppercase italic text-center">
                        Institutional <span className="gold-text-gradient">Onboarding</span>
                    </h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Registry Initialization Portal</p>
                </div>

                {/* Vertical Step Node */}
                <div className="flex items-center justify-center gap-4 mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    {steps.map((label, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="flex flex-col items-center group">
                                <div
                                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[10px] font-black transition-all duration-500 ${
                                        i < step
                                            ? 'bg-[#c5a059] text-[#1a120b] shadow-lg shadow-[#c5a059]/20'
                                            : i === step
                                            ? 'bg-[#1a120b] text-[#c5a059] shadow-xl border border-[#c5a059]/20'
                                            : 'bg-white border border-slate-100 text-slate-300'
                                    }`}
                                >
                                    {i < step ? <CheckCircle2 size={16} /> : `0${i + 1}`}
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest mt-2 hidden sm:block ${i === step ? 'text-[#1a150e]' : 'text-slate-400'}`}>
                                    {label}
                                </span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`w-12 h-px transition-all duration-500 ${i < step ? 'bg-[#c5a059]' : 'bg-slate-100'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Data Matrix Card */}
                <form onSubmit={step < 2 ? (e) => { e.preventDefault(); setStep(s => s + 1); } : handleSubmit} className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="bg-white border border-slate-100 rounded-[3.5rem] p-10 md:p-14 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#c5a059]/5 blur-[60px] rounded-full group-hover:bg-[#c5a059]/10 transition-colors" />

                        {/* Node 0: Institutional Entity */}
                        {step === 0 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-xl font-black text-[#1a150e] uppercase italic tracking-tighter">Institutional Identity</h2>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Foundational school parameters</p>
                                </div>

                                {/* Logo Matrix */}
                                <div className="flex flex-col items-center">
                                    <label htmlFor="logo-upload" className="cursor-pointer group relative">
                                        <div className={`w-28 h-28 rounded-[2.5rem] border-2 border-dashed flex items-center justify-center overflow-hidden transition-all duration-500 ${
                                            preview ? 'border-[#c5a059]/50 shadow-2xl' : 'border-slate-100 hover:border-[#c5a059] bg-slate-50/50 hover:bg-white'
                                        }`}>
                                            {preview ? (
                                                <img src={preview} alt="Identity preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-slate-300 group-hover:text-[#c5a059] transition-colors">
                                                    <Upload size={24} />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Upload</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#1a120b] text-[#c5a059] rounded-xl flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Upload size={16} />
                                        </div>
                                    </label>
                                    <input id="logo-upload" type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">School Nomenclature</label>
                                        <div className="relative group/input">
                                            <School size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-[#c5a059] transition-colors" />
                                            <input
                                                name="schoolName"
                                                value={formData.schoolName}
                                                onChange={handleChange}
                                                placeholder="ENTER OFFICIAL NAME"
                                                required
                                                className="input-field pl-14"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Official Channel</label>
                                        <div className="relative group/input">
                                            <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-[#c5a059] transition-colors" />
                                            <input
                                                name="schoolEmail"
                                                type="email"
                                                value={formData.schoolEmail}
                                                onChange={handleChange}
                                                placeholder="INSTITUTIONAL@EMAIL.COM"
                                                required
                                                className="input-field pl-14"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Secure Line</label>
                                        <div className="relative group/input">
                                            <Phone size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-[#c5a059] transition-colors" />
                                            <input
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="+234 000 000 0000"
                                                className="input-field pl-14"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Node 1: Geographic Matrix */}
                        {step === 1 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-xl font-black text-[#1a150e] uppercase italic tracking-tighter">Geographic Matrix</h2>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Spatial registry location</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Structural Address</label>
                                        <div className="relative group/input">
                                            <MapPin size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-[#c5a059] transition-colors" />
                                            <input
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                placeholder="STREET, SECTOR, ZONE"
                                                className="input-field pl-14"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">City Node</label>
                                            <input
                                                name="location.city"
                                                value={formData.location.city}
                                                onChange={handleChange}
                                                placeholder="CITY"
                                                className="input-field"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">State Node</label>
                                            <input
                                                name="location.state"
                                                value={formData.location.state}
                                                onChange={handleChange}
                                                placeholder="STATE"
                                                className="input-field"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Sovereign Domain</label>
                                        <input
                                            name="location.country"
                                            value={formData.location.country}
                                            onChange={handleChange}
                                            placeholder="COUNTRY"
                                            className="input-field"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Node 2: Administrative Protocol */}
                        {step === 2 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-xl font-black text-[#1a150e] uppercase italic tracking-tighter">Administrative Protocol</h2>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Authority clearance credentials</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Authority Full Name</label>
                                        <div className="relative group/input">
                                            <User size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-[#c5a059] transition-colors" />
                                            <input
                                                name="adminName"
                                                value={formData.adminName}
                                                onChange={handleChange}
                                                placeholder="ENTER OFFICIAL NAME"
                                                required
                                                className="input-field pl-14"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Access Key Override</label>
                                        <div className="relative group/input">
                                            <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-[#c5a059] transition-colors" />
                                            <input
                                                name="adminPassword"
                                                type="password"
                                                value={formData.adminPassword}
                                                onChange={handleChange}
                                                placeholder="CREATE SECURE KEY"
                                                required
                                                className="input-field pl-14"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-[#1a120b] border border-[#c5a059]/20 rounded-3xl p-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#c5a059]/10 blur-[40px] rounded-full" />
                                        <div className="flex gap-4 relative z-10">
                                            <ShieldCheck size={20} className="text-[#c5a059] shrink-0" />
                                            <p className="text-[#c5a059]/80 text-[10px] font-bold uppercase tracking-widest leading-relaxed italic">
                                                Protocol Notification: Upon completion, a unique Institutional ID will be generated. Secure this identifier for all administrative login cycles.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Execution */}
                        <div className={`flex gap-4 mt-12 ${step > 0 ? 'justify-between' : 'justify-end'}`}>
                            {step > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(s => s - 1)}
                                    className="flex items-center gap-3 h-14 px-8 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-[#1a150e] font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-sm"
                                >
                                    <ArrowLeft size={16} />
                                    Phase Back
                                </button>
                            )}
                            <button
                                type="submit"
                                className="flex-1 sm:flex-none flex items-center justify-center gap-3 h-14 px-10 bg-[#1a120b] hover:bg-black text-[#c5a059] font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-2xl active:scale-95 border border-[#c5a059]/20 shadow-black/20"
                            >
                                {step < 2 ? (
                                    <>Verify Node <ArrowRight size={16} /></>
                                ) : (
                                    <>Commit Registry <CheckCircle2 size={16} /></>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-10">
                    Existing Registry?{' '}
                    <button
                        onClick={() => navigate('/login')}
                        className="text-[#c5a059] hover:text-[#1a120b] transition-colors"
                    >
                        Access Portal Hub
                    </button>
                </p>
            </div>
        </div>
    );
};

export default SchoolRegister;
