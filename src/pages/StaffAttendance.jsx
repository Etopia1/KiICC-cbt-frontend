import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import TeacherLayout from '../components/TeacherLayout';
import AdminLayout from '../components/AdminLayout';
import { 
    Clock, UserCheck, LogIn, LogOut, Calendar, Search, 
    ShieldCheck, Users, Zap, Briefcase, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

const StaffAttendance = ({ isAdmin = false }) => {
    const { token, user } = useSelector((state) => state.auth);
    const [staffData, setStaffData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date());

    const Layout = isAdmin ? AdminLayout : TeacherLayout;
    // Theme colors: Admin uses Gold (#c5a059), Teacher uses emerald/teal
    const activeColor = isAdmin ? 'text-[#c5a059]' : 'text-emerald-400';
    const activeBg = isAdmin ? 'bg-[#c5a059]/10' : 'bg-emerald-500/10';
    const activeBorder = isAdmin ? 'border-[#c5a059]/20' : 'border-emerald-500/20';
    const buttonBg = isAdmin ? 'bg-[#1a120b]' : 'bg-emerald-600';

    const isWeekend = (date) => {
        const day = date.getDay();
        return day === 0 || day === 6;
    };

    const fetchStaffAttendance = async () => {
        try {
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            // Use admin endpoint if admin
            const endpoint = isAdmin 
                ? `https://educbt-pro-backend.onrender.com/school/monitoring/attendance?date=${dateStr}`
                : `https://educbt-pro-backend.onrender.com/school/staff/attendance?date=${dateStr}`;

            const res = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStaffData(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching staff attendance:", error);
            // toast.error("Failed to load staff records"); // Removed to avoid multiple toasts
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchStaffAttendance();
    }, [token, currentDate, isAdmin]);

    const handleTimeIn = async () => {
        if (isWeekend(new Date())) {
            return toast.error("Attendance can only be marked on weekdays.");
        }
        setMarking(true);
        try {
            await axios.post('https://educbt-pro-backend.onrender.com/school/staff/time-in', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Time In marked successfully!");
            fetchStaffAttendance();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to mark Time In");
        } finally {
            setMarking(false);
        }
    };

    const handleTimeOut = async () => {
        setMarking(true);
        try {
            await axios.post('https://educbt-pro-backend.onrender.com/school/staff/time-out', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Time Out marked successfully!");
            fetchStaffAttendance();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to mark Time Out");
        } finally {
            setMarking(false);
        }
    };

    const filteredStaff = staffData.filter(member =>
        (member.fullName || member.teacherName)?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentUserRecord = staffData.find(s => (s.teacherId?._id || s.teacherId)?.toString() === user?._id?.toString());

    return (
        <Layout>
            <div className={`max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700 ${isAdmin ? 'font-outfit' : ''}`}>
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative">
                    {!isAdmin && <div className="absolute -top-24 -left-20 w-64 h-64 bg-emerald-600/10 blur-[100px] rounded-full pointer-events-none" />}
                    {isAdmin && <div className="absolute -top-24 -left-20 w-64 h-64 bg-[#c5a059]/10 blur-[100px] rounded-full pointer-events-none" />}
                    
                    <div className="flex-1">
                        <div className={`inline-flex items-center gap-2 ${activeBg} border ${activeBorder} rounded-full px-3 py-1 mb-4`}>
                            <Activity size={12} className={activeColor} />
                            <span className={`${activeColor} text-[10px] font-black uppercase tracking-widest`}>
                                Institution Status Active
                            </span>
                        </div>
                        <h1 className={`text-3xl md:text-5xl font-black ${isAdmin ? 'text-[#1a150e]' : 'text-white'} italic tracking-tight uppercase leading-none`}>
                            Staff <span className={isAdmin ? 'gold-text-gradient italic' : 'bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent italic tracking-tighter'}>Attendance</span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-2 font-medium italic">High-fidelity monitoring of instructional and faculty engagement.</p>
                    </div>

                    {!isAdmin && (
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handleTimeIn}
                                disabled={marking || currentUserRecord?.timeIn !== '-' || isWeekend(new Date())}
                                className={`group flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all relative overflow-hidden ${
                                    currentUserRecord?.timeIn !== '-' 
                                    ? 'bg-slate-900/40 text-slate-600 border border-white/5 cursor-not-allowed' 
                                    : 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 hover:-translate-y-0.5 active:scale-95'
                                }`}
                            >
                                <LogIn size={14} className={currentUserRecord?.timeIn !== '-' ? 'opacity-20' : ''} />
                                Log Entrance
                            </button>
                            <button
                                onClick={handleTimeOut}
                                disabled={marking || currentUserRecord?.timeIn === '-' || currentUserRecord?.timeOut !== '-'}
                                className={`group flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all relative overflow-hidden ${
                                    currentUserRecord?.timeIn === '-' || currentUserRecord?.timeOut !== '-' 
                                    ? 'bg-slate-900/40 text-slate-600 border border-white/5 cursor-not-allowed' 
                                    : 'bg-rose-600 text-white shadow-xl shadow-rose-600/20 hover:bg-rose-500 hover:-translate-y-0.5 active:scale-95'
                                }`}
                            >
                                <LogOut size={14} className={currentUserRecord?.timeIn === '-' || currentUserRecord?.timeOut !== '-' ? 'opacity-20' : ''} />
                                Log Exit
                            </button>
                        </div>
                    )}
                </div>

                {/* Search & Date Module */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 relative group">
                        <Search className={`absolute left-5 top-1/2 -translate-y-1/2 ${isAdmin ? 'text-slate-300' : 'text-slate-500'} group-focus-within:${activeColor} transition-colors`} size={20} />
                        <input
                            type="text"
                            placeholder="Find colleague in the registry..."
                            className={`w-full pl-14 pr-6 py-4.5 rounded-2xl outline-none focus:ring-2 ${activeBg}/20 focus:border-${activeColor}/40 font-bold transition-all shadow-sm ${
                                isAdmin 
                                ? 'bg-white border border-slate-100 text-[#1a150e] placeholder:text-slate-300' 
                                : 'bg-slate-900/40 backdrop-blur-xl border border-white/5 text-slate-200 placeholder:text-slate-700 shadow-inner'
                            }`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className={`${isAdmin ? 'bg-white border-slate-100' : 'bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-inner'} border rounded-2xl p-4 flex items-center justify-center gap-4`}>
                        <Calendar size={18} className={activeColor} />
                        <span className={`text-xs font-black uppercase tracking-[0.2em] italic ${isAdmin ? 'text-[#1a150e]' : 'text-white'}`}>
                            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </div>

                {/* Staff Registry Ledger */}
                <div className={`${isAdmin ? 'bg-white border-slate-100 shadow-lg' : 'bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-2xl'} border rounded-[2.5rem] overflow-hidden`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className={`${isAdmin ? 'bg-[#1a120b] text-[#c5a059]' : 'bg-white/2 border-b border-white/5 text-slate-500'} text-[10px] font-black uppercase tracking-[0.2em] italic`}>
                                <tr>
                                    <th className="px-8 py-6">Reference</th>
                                    <th className="px-8 py-6">Faculty Member</th>
                                    <th className="px-8 py-6 text-center">Arrival</th>
                                    <th className="px-8 py-6 text-center">Departure</th>
                                    <th className="px-8 py-6 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isAdmin ? 'divide-slate-50' : 'divide-white/5'}`}>
                                {loading ? (
                                    <tr><td colSpan="5" className={`text-center py-24 font-black uppercase tracking-[0.3em] animate-pulse italic ${isAdmin ? 'text-slate-300' : 'text-slate-600'}`}>Synchronizing Frequency...</td></tr>
                                ) : filteredStaff.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-24 text-slate-400 font-bold italic uppercase tracking-widest text-[10px]">Registry Empty for this cycle.</td></tr>
                                ) : (
                                    filteredStaff.map((staff, index) => (
                                        <tr key={staff.teacherId || index} className={`hover:bg-slate-50 transition-all group ${staff.teacherId?.toString() === user?._id?.toString() ? activeBg + '/20' : ''}`}>
                                            <td className="px-8 py-6 text-[10px] font-black text-slate-300 uppercase tracking-widest italic group-hover:text-[#c5a059]/50 transition-colors">
                                                [{String(index + 1).padStart(3, '0')}]
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-xs italic shadow-sm transition-all ${
                                                        isAdmin 
                                                        ? 'bg-slate-50 border-slate-100 text-[#1a150e]' 
                                                        : 'bg-[#FCFBFA]/60 border-white/5 text-emerald-400'
                                                    } group-hover:bg-[#1a120b] group-hover:text-[#c5a059]`}>
                                                        {(staff.fullName || staff.teacherName)?.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`font-black uppercase italic text-sm tracking-tight transition-colors ${isAdmin ? 'text-[#1a150e]' : 'text-white'} group-hover:text-[#c5a059]`}>{staff.fullName || staff.teacherName}</span>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{staff.loginId || 'Faculty'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className={`inline-flex items-center px-4 py-1.5 rounded-lg font-mono font-black text-xs border transition-all ${
                                                    staff.timeIn !== '-' && staff.timeIn !== 'N/A'
                                                    ? `${activeBg} ${activeColor} ${activeBorder} shadow-sm px-4` 
                                                    : 'text-slate-200 border-transparent bg-slate-50'
                                                }`}>
                                                    {staff.timeIn !== '-' ? staff.timeIn : 'OFFLINE'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className={`inline-flex items-center px-4 py-1.5 rounded-lg font-mono font-black text-xs border transition-all ${
                                                    staff.timeOut !== '-' && staff.timeOut !== 'N/A'
                                                    ? 'bg-rose-50 text-rose-500 border-rose-100 shadow-sm' 
                                                    : 'text-slate-200 border-transparent bg-slate-50'
                                                }`}>
                                                    {staff.timeOut !== '-' ? staff.timeOut : 'PENDING'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                                                    staff.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    staff.status === 'Late' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                    {staff.status}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Stats Ledger Footer */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'On-Site Faculty', value: staffData.filter(s => s.status === 'Present' || s.status === 'Late').length, icon: Users, color: isAdmin ? '#c5a059' : '#10b981' },
                        { label: 'Tardy Signatures', value: staffData.filter(s => s.status === 'Late').length, icon: Clock, color: '#f59e0b' },
                        { label: 'Absent Personnel', value: staffData.filter(s => s.status === 'Absent').length, icon: ShieldCheck, color: '#f43f5e' },
                        { label: 'Registry Load', value: staffData.length, icon: Briefcase, color: isAdmin ? '#1a120b' : '#3b82f6' }
                    ].map((stat, idx) => (
                        <div key={idx} className={`${isAdmin ? 'bg-white border-slate-100 shadow-md' : 'bg-slate-900/40 border-white/5 shadow-inner'} border rounded-2xl p-6 group transition-all`}>
                            <div className="flex items-center justify-between mb-2">
                                <stat.icon size={16} style={{ color: stat.color, opacity: 0.6 }} />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                            </div>
                            <div className={`text-2xl font-black italic tracking-tighter ${isAdmin ? 'text-[#1a150e]' : 'text-white'}`}>{stat.value}</div>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default StaffAttendance;

