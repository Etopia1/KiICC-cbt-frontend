import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import TeacherLayout from '../components/TeacherLayout';
import { 
    Calendar, Save, UserCheck, UserX, Clock, Search, 
    FileDown, Edit2, CheckCircle, CheckCircle2, ShieldCheck, 
    UserMinus, Zap
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'jspdf-autotable';

const TeacherAttendance = () => {
    const { token, user } = useSelector((state) => state.auth);
    const [searchParams] = useSearchParams();
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({}); // { studentId: { status, remarks } }
    const [loading, setLoading] = useState(true);
    const [teacherProfile, setTeacherProfile] = useState(null);

    // Get date from URL or default to Today (local time)
    const todayStr = new Date().toLocaleDateString('sv-SE');
    const dateParam = searchParams.get('date');
    const selectedDate = dateParam || todayStr;
    const isToday = selectedDate === todayStr;

    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(isToday);
    const [hasExistingData, setHasExistingData] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        if (token) {
            fetchClassStudents();
            fetchAttendanceForDate(selectedDate);
            fetchTeacherProfile();
        }
    }, [token, selectedDate]);

    const fetchTeacherProfile = async () => {
        try {
            const res = await axios.get('https://educbt-pro-backend.onrender.com/school/teacher/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeacherProfile(res.data);
        } catch (error) {
            console.error("Error fetching teacher profile:", error);
        }
    };

    const fetchClassStudents = async () => {
        try {
            const res = await axios.get('https://educbt-pro-backend.onrender.com/school/teacher/class-students', {
                headers: { Authorization: `Bearer ${token} ` }
            });
            setStudents(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load students");
            setLoading(false);
        }
    };

    const fetchAttendanceForDate = async (date) => {
        try {
            const res = await axios.get(`https://educbt-pro-backend.onrender.com/school/teacher/attendance?date=${date}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Transform array to map for easy access
            const attendanceMap = {};
            if (res.data && res.data.records) {
                if (res.data.records.length > 0) {
                    res.data.records.forEach(rec => {
                        attendanceMap[rec.studentId] = { status: rec.status, remarks: rec.remarks || '' };
                    });
                    setHasExistingData(true);
                    setIsLocked(res.data.isLocked || false);
                    setIsEditing(false); // Lock by default if data exists
                } else {
                    setHasExistingData(false);
                    setIsLocked(false);
                    setIsEditing(isToday); // ONLY allow marking if new AND it's today
                }
            }
            setAttendance(attendanceMap);
        } catch (error) {
            console.error(error);
        }
    };

    const handleStatusChange = (studentId, status) => {
        if (!isEditing || isLocked) {
            toast.error(isLocked ? "This record is finalized and cannot be modified" : "Click 'Update' to change status");
            return;
        }
        setAttendance(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], status }
        }));
    };

    const handleRemarksChange = (studentId, remarks) => {
        if (!isEditing || isLocked) {
            toast.error(isLocked ? "This record is finalized and cannot be modified" : "Click 'Update' to change remarks");
            return;
        }
        setAttendance(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], remarks }
        }));
    };

    const handleSave = async (shouldLock = false) => {
        if (shouldLock && !confirm("Are you sure you want to finalize this attendance? This action CANNOT be undone and no further changes will be allowed.")) return;

        const loadingToast = toast.loading(shouldLock ? "Finalizing attendance..." : "Saving attendance...");
        try {
            // Prepare payload
            const records = students.map(student => ({
                studentId: student._id,
                status: attendance[student._id]?.status || 'Absent',
                remarks: attendance[student._id]?.remarks || ''
            }));

            // Ensure selectedDate is treated as a Date object for formatting
            const dateObj = new Date(selectedDate);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            await axios.post('https://educbt-pro-backend.onrender.com/school/teacher/attendance',
                { date: dateStr, records, isLocked: shouldLock },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success(shouldLock ? "Attendance finalized" : "Attendance saved successfully", { id: loadingToast });
            setHasExistingData(true);
            setIsLocked(shouldLock);
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to save attendance", { id: loadingToast });
        }
    };

    const generatePDF = () => {
        const doc = new jsPDF();

        // Use teacherProfile as primary source, then auth user, then fallback
        const teacherName = teacherProfile?.fullName || user?.fullName || 'Teacher';
        const classLevel = teacherProfile?.info?.classLevel || user?.info?.classLevel || 'N/A';
        const schoolName = teacherProfile?.schoolName || user?.schoolName || 'School Management System';

        const dateStr = new Date(selectedDate).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        // Calculate Stats
        const stats = {
            total: students.length,
            present: Object.values(attendance).filter(a => a.status === 'Present').length,
            absent: Object.values(attendance).filter(a => a.status === 'Absent').length,
            late: Object.values(attendance).filter(a => a.status === 'Late').length
        };

        // Add Header
        doc.setFontSize(22);
        doc.setTextColor(31, 41, 55); // Dark Gray
        doc.text(schoolName.toUpperCase(), 105, 20, { align: 'center' });

        doc.setFontSize(16);
        doc.setTextColor(79, 70, 229); // Indigo
        doc.text('OFFICIAL ATTENDANCE REPORT', 105, 30, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 37, { align: 'center' });

        // info section
        doc.setDrawColor(209, 213, 219);
        doc.line(20, 42, 190, 42);

        doc.setFontSize(11);
        doc.setTextColor(31, 41, 55);
        doc.setFont("helvetica", "bold");
        doc.text(`CLASS: ${classLevel}`, 20, 52);
        doc.text(`TEACHER: ${teacherName.toUpperCase()}`, 20, 59);
        doc.text(`DATE: ${dateStr.toUpperCase()}`, 20, 66);

        // Stats in boxes or aligned
        doc.setFont("helvetica", "normal");
        doc.text(`TOTAL STUDENTS: ${stats.total}`, 140, 52);
        doc.setTextColor(5, 150, 105); // Green
        doc.text(`PRESENT: ${stats.present}`, 140, 59);
        doc.setTextColor(220, 38, 38); // Red
        doc.text(`ABSENT: ${stats.absent}`, 140, 66);
        doc.setTextColor(217, 119, 6); // Amber
        doc.text(`LATE: ${stats.late}`, 140, 73);

        doc.setTextColor(31, 41, 55);

        // Table
        const tableData = students.map((student, index) => [
            index + 1,
            student.fullName,
            student.info.registrationNumber || 'N/A',
            student.gender || 'N/A',
            attendance[student._id]?.status || 'Absent',
            attendance[student._id]?.remarks || '-'
        ]);

        autoTable(doc, {
            startY: 80,
            head: [['S/N', 'STUDENT NAME', 'REG NUMBER', 'GENDER', 'STATUS', 'REMARKS']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
            bodyStyles: { textColor: [31, 41, 55], halign: 'left' },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                2: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'center' }
            },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            margin: { top: 80 }
        });

        // Signature Section
        const finalY = doc.lastAutoTable.finalY + 30;

        doc.setFontSize(10);
        doc.setTextColor(31, 41, 55);

        // Line for Teacher
        doc.line(20, finalY, 80, finalY);
        doc.text("Class Teacher's Signature", 20, finalY + 5);

        // Line for Principal
        doc.line(130, finalY, 190, finalY);
        doc.text("Principal's Signature", 130, finalY + 5);

        doc.save(`Attendance_${classLevel}_${selectedDate}.pdf`);
        toast.success("Professional PDF Generated");
    };

    // Filter students
    const filteredStudents = students.filter(s =>
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.info?.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate Age Helper
    const getAge = (dob) => {
        if (!dob) return 'N/A';
        return new Date().getFullYear() - new Date(dob).getFullYear();
    };

    return (
        <TeacherLayout>
            <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative">
                    <div className="absolute -top-24 -left-20 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 mb-4">
                            <Zap size={12} className="text-indigo-400" />
                            <span className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Attendance Protocol v2.5</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white italic tracking-tight uppercase">
                            Registry <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent italic tracking-tighter">Manifest</span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-2 font-medium italic">Mark and finalize standard registry for Class {teacherProfile?.info?.classLevel || 'N/A'}.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative group bg-slate-900/60 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-hover:text-indigo-400 transition-colors" size={16} />
                            <input
                                type="date"
                                disabled
                                className="pl-10 pr-4 py-2 bg-transparent rounded-xl outline-none text-slate-400 font-black text-[10px] uppercase tracking-widest cursor-not-allowed"
                                value={selectedDate}
                            />
                        </div>

                        <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
                            {isLocked ? (
                                <div className="px-6 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-2">
                                    <ShieldCheck size={14} /> Finalized
                                </div>
                            ) : isToday ? (
                                hasExistingData && !isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-amber-500/10 text-amber-400 font-black uppercase tracking-widest border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-all active:scale-95 shadow-lg shadow-amber-900/20"
                                    >
                                        <Edit2 size={14} /> Update
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleSave(false)}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-[#FCFBFA]/50 text-indigo-400 border border-white/5 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-900 transition-all active:scale-95 shadow-inner"
                                        >
                                            <Save size={14} /> Save Draft
                                        </button>
                                        <button
                                            onClick={() => handleSave(true)}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-600/30"
                                        >
                                            <CheckCircle2 size={14} /> Finalize
                                        </button>
                                    </div>
                                )
                            ) : (
                                <div className="px-6 py-2.5 bg-slate-800/10 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 flex items-center gap-2 italic">
                                    <Clock size={14} /> Archive Node
                                </div>
                            )}
                        </div>

                        <button
                            onClick={generatePDF}
                            className="p-3 bg-slate-900/60 text-slate-400 border border-white/5 rounded-2xl hover:text-white hover:bg-slate-800 transition-all active:scale-95 shadow-inner"
                            title="Generate PDF Report"
                        >
                            <FileDown size={20} />
                        </button>
                    </div>
                </div>

                {/* Search & Intelligence Stats */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Identify student by name or registration number..."
                            className="w-full pl-14 pr-6 py-4.5 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 text-slate-200 font-bold transition-all placeholder:text-slate-700 shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex items-center gap-8 shadow-inner">
                        <div className="flex flex-col items-center min-w-[60px]">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Items</span>
                            <span className="text-xl font-black text-white italic">{students.length}</span>
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div className="flex flex-col items-center min-w-[60px]">
                            <span className="text-[8px] font-black text-emerald-500/80 uppercase tracking-widest mb-1">Present</span>
                            <span className="text-xl font-black text-emerald-400 italic">
                                {students.filter(s => attendance[s._id]?.status === 'Present').length}
                            </span>
                        </div>
                        <div className="flex flex-col items-center min-w-[60px]">
                            <span className="text-[8px] font-black text-rose-500/80 uppercase tracking-widest mb-1">Absent</span>
                            <span className="text-xl font-black text-rose-400 italic">
                                {students.filter(s => (attendance[s._id]?.status || 'Absent') === 'Absent').length}
                            </span>
                        </div>
                        {hasExistingData && (
                            <div className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${isLocked ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                                {isLocked ? "Secure" : isEditing ? "Writing" : "Buffered"}
                            </div>
                        )}
                    </div>
                </div>

                {/* Registry Ledger Table */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/2 border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
                                <tr>
                                    <th className="px-8 py-6">Student Identity</th>
                                    <th className="px-8 py-6">Vitals</th>
                                    <th className="px-8 py-6 text-center">Status Protocol</th>
                                    <th className="px-8 py-6">Ledger Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan="4" className="text-center py-20 text-slate-500 font-black uppercase tracking-widest animate-pulse">Syncing Registry...</td></tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-20 text-slate-500 font-bold italic">No entities detected for current search query.</td></tr>
                                ) : (
                                    filteredStudents.map((student) => {
                                        const currentStatus = attendance[student._id]?.status || 'Absent';
                                        return (
                                            <tr key={student._id} className="hover:bg-white/2 transition-all group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm italic shadow-inner">
                                                            {student.fullName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-white uppercase italic text-sm tracking-tight group-hover:text-indigo-400 transition-colors">{student.fullName}</div>
                                                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1.5">{student.info.registrationNumber}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="text-xs font-black text-slate-500 uppercase tracking-widest italic">{student.gender || 'N/A'}</div>
                                                    <div className="text-[10px] font-bold text-indigo-400/60 uppercase mt-1 tracking-tighter">{getAge(student.info?.dateOfBirth)} Sol Cycle Age</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className={`flex items-center justify-center gap-2.5 bg-[#FCFBFA]/50 rounded-2xl p-2 w-fit mx-auto border border-white/5 shadow-inner ${(!isEditing || isLocked) ? 'opacity-50 grayscale' : ''}`}>
                                                        {[
                                                            { id: 'Present', icon: UserCheck, color: 'text-emerald-400', activeBg: 'bg-emerald-500/20 border-emerald-500/30' },
                                                            { id: 'Absent', icon: UserX, color: 'text-rose-400', activeBg: 'bg-rose-500/20 border-rose-500/30' },
                                                            { id: 'Late', icon: Clock, color: 'text-amber-400', activeBg: 'bg-amber-500/20 border-amber-500/30' }
                                                        ].map((status) => (
                                                            <button
                                                                key={status.id}
                                                                onClick={() => handleStatusChange(student._id, status.id)}
                                                                disabled={!isEditing || isLocked}
                                                                className={`p-2.5 rounded-xl transition-all border border-transparent ${currentStatus === status.id ? `${status.activeBg} ${status.color} shadow-lg shadow-black/40` : 'text-slate-600 hover:text-slate-400'} disabled:cursor-not-allowed active:scale-90`}
                                                                title={status.id}
                                                            >
                                                                <status.icon size={20} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="relative group/input">
                                                        <input
                                                            type="text"
                                                            placeholder="Add ledger entry..."
                                                            disabled={!isEditing || isLocked}
                                                            className={`w-full bg-[#FCFBFA]/20 border-b-2 border-white/5 group-hover/input:border-indigo-500/30 focus:border-indigo-500/50 outline-none py-2 text-xs font-bold text-slate-300 transition-all placeholder:text-slate-800 italic ${(!isEditing || isLocked) ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                            value={attendance[student._id]?.remarks || ''}
                                                            onChange={(e) => handleRemarksChange(student._id, e.target.value)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </TeacherLayout>
    );
};

export default TeacherAttendance;

