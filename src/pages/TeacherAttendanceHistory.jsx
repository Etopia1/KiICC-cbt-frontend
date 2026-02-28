import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../components/TeacherLayout';
import { Calendar, ChevronRight, FileDown, Search, Filter, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TeacherAttendanceHistory = () => {
    const { token, user } = useSelector((state) => state.auth);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [teacherProfile, setTeacherProfile] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            fetchHistory();
            fetchTeacherProfile();
        }
    }, [token]);

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

    const fetchHistory = async () => {
        try {
            const res = await axios.get('https://educbt-pro-backend.onrender.com/school/teacher/history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching history:', error);
            toast.error("Failed to load attendance records");
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const handleExportPDF = async (record) => {
        const loadingToast = toast.loading("Preparing PDF...");
        try {
            const dateStr = record.date.split('T')[0];
            const res = await axios.get(`https://educbt-pro-backend.onrender.com/school/teacher/attendance?date=${dateStr}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.data || !res.data.records) {
                toast.error("No records found for this date", { id: loadingToast });
                return;
            }

            // Fetch class students to get full names
            const studentsRes = await axios.get('https://educbt-pro-backend.onrender.com/school/teacher/class-students', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const students = studentsRes.data;

            const doc = new jsPDF();

            // Use local teacherProfile fallback
            const teacherName = teacherProfile?.fullName || user?.fullName || 'Teacher';
            const classLevel = teacherProfile?.info?.classLevel || user?.info?.classLevel || 'N/A';
            const schoolName = teacherProfile?.schoolName || user?.schoolName || 'School Management System';
            const displayDate = formatDate(record.date);

            const attendanceRecords = res.data.records;

            // Calculate Stats
            const stats = {
                total: students.length,
                present: attendanceRecords.filter(r => r.status === 'Present').length,
                absent: attendanceRecords.filter(r => r.status === 'Absent').length,
                late: attendanceRecords.filter(r => r.status === 'Late').length
            };

            // Header
            doc.setFontSize(22);
            doc.setTextColor(31, 41, 55);
            doc.text(schoolName.toUpperCase(), 105, 20, { align: 'center' });

            doc.setFontSize(16);
            doc.setTextColor(79, 70, 229);
            doc.text('OFFICIAL ATTENDANCE REPORT', 105, 30, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 37, { align: 'center' });

            doc.setDrawColor(209, 213, 219);
            doc.line(20, 42, 190, 42);

            doc.setFontSize(11);
            doc.setTextColor(31, 41, 55);
            doc.setFont("helvetica", "bold");
            doc.text(`CLASS: ${classLevel}`, 20, 52);
            doc.text(`TEACHER: ${teacherName.toUpperCase()}`, 20, 59);
            doc.text(`DATE: ${displayDate.toUpperCase()}`, 20, 66);

            doc.setFont("helvetica", "normal");
            doc.text(`TOTAL STUDENTS: ${stats.total}`, 140, 52);
            doc.setTextColor(5, 150, 105);
            doc.text(`PRESENT: ${stats.present}`, 140, 59);
            doc.setTextColor(220, 38, 38);
            doc.text(`ABSENT: ${stats.absent}`, 140, 66);
            doc.setTextColor(217, 119, 6);
            doc.text(`LATE: ${stats.late}`, 140, 73);

            doc.setTextColor(31, 41, 55);

            // Table Data
            const tableData = students.map((s, i) => {
                const rec = attendanceRecords.find(r => r.studentId === s._id);
                return [
                    i + 1,
                    s.fullName,
                    s.info?.registrationNumber || '-',
                    s.gender || 'N/A',
                    rec?.status || 'Absent',
                    rec?.remarks || '-'
                ];
            });

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

            doc.line(20, finalY, 80, finalY);
            doc.text("Class Teacher's Signature", 20, finalY + 5);

            doc.line(130, finalY, 190, finalY);
            doc.text("Principal's Signature", 130, finalY + 5);

            doc.save(`Attendance_${classLevel}_${dateStr}.pdf`);
            toast.success("Professional PDF Exported", { id: loadingToast });
        } catch (error) {
            console.error('PDF Error:', error);
            toast.error("Failed to generate PDF", { id: loadingToast });
        }
    };

    const filteredHistory = history.filter(item =>
        formatDate(item.date).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <TeacherLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
                        <p className="text-gray-500">View and export past attendance history.</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Find by date..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={() => navigate('/teacher/attendance')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition">
                        <ArrowLeft size={18} /> Take Attendance
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Class</th>
                                    <th className="px-6 py-4">Present</th>
                                    <th className="px-6 py-4">Absent</th>
                                    <th className="px-6 py-4">Late</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 italic">
                                {loading ? (
                                    <tr><td colSpan="3" className="text-center py-10 text-gray-500">Loading history...</td></tr>
                                ) : filteredHistory.length === 0 ? (
                                    <tr><td colSpan="3" className="text-center py-10 text-gray-500">No attendance records found.</td></tr>
                                ) : (
                                    filteredHistory.map((item) => (
                                        <tr key={item._id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                <div className="flex items-center gap-3">
                                                    <Calendar className="text-indigo-400" size={18} />
                                                    {formatDate(item.date)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {teacherProfile?.info?.classLevel || user?.info?.classLevel || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold">{item.stats?.present || 0}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full font-bold">{item.stats?.absent || 0}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-bold">{item.stats?.late || 0}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/teacher/attendance?date=${item.date.split('T')[0]}`)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium transition"
                                                    >
                                                        <ChevronRight size={16} /> View
                                                    </button>
                                                    <button
                                                        onClick={() => handleExportPDF(item)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition"
                                                    >
                                                        <FileDown size={16} /> PDF
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </TeacherLayout>
    );
};

export default TeacherAttendanceHistory;

