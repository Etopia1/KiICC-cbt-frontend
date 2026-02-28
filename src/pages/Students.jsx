import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import AdminLayout from '../components/AdminLayout';
import { GraduationCap, Search, Calendar, Trash2, Edit, ChevronLeft, ChevronRight, X, Mail, Phone, MapPin, Hash, User, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeClass, setActiveClass] = useState('all');
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const { token } = useSelector((state) => state.auth);

    const classes = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];

    useEffect(() => {
        if (token) fetchStudents();
    }, [token]);

    useEffect(() => {
        filterStudents();
        setCurrentPage(1);
    }, [searchQuery, activeClass, students]);

    const fetchStudents = async () => {
        try {
            const response = await axios.get('https://educbt-pro-backend.onrender.com/school/students', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Failed to load students');
        } finally {
            setIsLoading(false);
        }
    };

    const filterStudents = () => {
        let filtered = students;

        if (activeClass !== 'all') {
            filtered = filtered.filter(s => s.info?.classLevel === activeClass);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s =>
                s.fullName.toLowerCase().includes(query) ||
                s.uniqueLoginId.toLowerCase().includes(query) ||
                s.info?.registrationNumber?.toLowerCase().includes(query)
            );
        }

        setFilteredStudents(filtered);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = paginatedStudents.map(s => s._id);
            setSelectedStudents(new Set(allIds));
        } else {
            setSelectedStudents(new Set());
        }
    };

    const handleSelectStudent = (studentId) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    const handleDeleteStudent = async (studentId) => {
        if (!confirm('Are you sure you want to delete this student?')) return;

        try {
            await axios.delete(`https://educbt-pro-backend.onrender.com/school/students/${studentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Student deleted successfully');
            fetchStudents();
        } catch (error) {
            toast.error('Failed to delete student');
        }
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    const goToPage = (page) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const getClassStats = (className) => {
        return students.filter(s => s.info?.classLevel === className).length;
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-purple-900">Students List</h1>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                            <span>Home</span>
                            <span>/</span>
                            <span className="text-purple-600 font-medium">Students</span>
                        </div>
                    </div>
                </div>

                {/* Class Filter Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <button
                        onClick={() => setActiveClass('all')}
                        className={`p-4 rounded-xl border-2 transition-all ${activeClass === 'all'
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-purple-300'
                            }`}
                    >
                        <p className={`text-sm font-semibold mb-1 ${activeClass === 'all' ? 'text-purple-900' : 'text-gray-600'}`}>
                            All Classes
                        </p>
                        <p className={`text-2xl font-bold ${activeClass === 'all' ? 'text-purple-700' : 'text-gray-700'}`}>
                            {students.length}
                        </p>
                    </button>
                    {classes.map((className) => {
                        const count = getClassStats(className);
                        const isActive = activeClass === className;
                        return (
                            <button
                                key={className}
                                onClick={() => setActiveClass(className)}
                                className={`p-4 rounded-xl border-2 transition-all ${isActive
                                    ? 'border-purple-500 bg-purple-50 shadow-md'
                                    : 'border-gray-200 bg-white hover:border-purple-300'
                                    }`}
                            >
                                <p className={`text-sm font-semibold mb-1 ${isActive ? 'text-purple-900' : 'text-gray-600'}`}>
                                    {className}
                                </p>
                                <p className={`text-2xl font-bold ${isActive ? 'text-purple-700' : 'text-gray-700'}`}>
                                    {count}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* Students Information Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Table Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <h2 className="text-xl font-bold text-gray-900">Students Information</h2>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search by name or roll"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                                    />
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                                    <Calendar size={16} />
                                    Last 30 days
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    {filteredStudents.length === 0 ? (
                        <div className="p-12 text-center">
                            <GraduationCap className="mx-auto text-gray-300 mb-4" size={48} />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
                            <p className="text-gray-500">
                                {searchQuery ? 'Try adjusting your search' : 'No students available'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1200px]">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-4 text-left w-12">
                                                <input
                                                    type="checkbox"
                                                    checked={paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudents.has(s._id))}
                                                    onChange={handleSelectAll}
                                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                                />
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[200px]">
                                                Student's Name
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[140px]">
                                                Reg Number
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[100px]">
                                                Class
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[100px]">
                                                Gender
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[80px]">
                                                Age
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[140px]">
                                                Phone
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[100px]">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[100px]">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {paginatedStudents.map((student) => (
                                            <tr
                                                key={student._id}
                                                className="hover:bg-purple-50 transition-colors cursor-pointer"
                                                onClick={(e) => {
                                                    // Don't open modal if clicking checkbox or action buttons
                                                    if (!e.target.closest('input') && !e.target.closest('button')) {
                                                        setSelectedStudent(student);
                                                    }
                                                }}
                                            >
                                                <td className="px-4 py-5" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStudents.has(student._id)}
                                                        onChange={() => handleSelectStudent(student._id)}
                                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        {student.profilePicture ? (
                                                            <img
                                                                src={student.profilePicture}
                                                                alt={student.fullName}
                                                                className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-purple-200"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                                {student.fullName.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <span className="font-medium text-gray-900 whitespace-nowrap">{student.fullName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-sm text-gray-600 whitespace-nowrap">
                                                    {student.info?.registrationNumber || '-'}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 whitespace-nowrap">
                                                        {student.info?.classLevel || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-sm text-gray-600 whitespace-nowrap">
                                                    {student.gender || '-'}
                                                </td>
                                                <td className="px-6 py-5 text-sm text-gray-600 whitespace-nowrap">
                                                    {student.info?.dateOfBirth ? new Date().getFullYear() - new Date(student.info.dateOfBirth).getFullYear() : '-'}
                                                </td>
                                                <td className="px-6 py-5 text-sm text-gray-600 whitespace-nowrap">
                                                    {student.info?.phone || '-'}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${student.status === 'verified'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                        }`}>
                                                        {student.status === 'verified' ? (
                                                            <><CheckCircle size={12} className="mr-1" /> Verified</>
                                                        ) : (
                                                            <><Clock size={12} className="mr-1" /> Pending</>
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleDeleteStudent(student._id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedStudent(student)}
                                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                                    >
                                        <option value={5}>5 / page</option>
                                        <option value={10}>10 / page</option>
                                        <option value={20}>20 / page</option>
                                        <option value={50}>50 / page</option>
                                    </select>
                                    <span className="text-sm text-gray-600">
                                        Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredStudents.length)} of {filteredStudents.length}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>

                                    {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = idx + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = idx + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + idx;
                                        } else {
                                            pageNum = currentPage - 2 + idx;
                                        }

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => goToPage(pageNum)}
                                                className={`w-10 h-10 rounded-lg font-medium ${currentPage === pageNum
                                                    ? 'bg-purple-600 text-white'
                                                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    {totalPages > 5 && (
                                        <>
                                            <span className="text-gray-500">...</span>
                                            <button
                                                onClick={() => goToPage(totalPages)}
                                                className="w-10 h-10 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                                            >
                                                {totalPages}
                                            </button>
                                        </>
                                    )}

                                    <button
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Student Details Modal */}
                {selectedStudent && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                                <h2 className="text-xl font-bold text-white">Student Details</h2>
                                <button
                                    onClick={() => setSelectedStudent(null)}
                                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6">
                                {/* Student Avatar & Name */}
                                <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                                        {selectedStudent.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">{selectedStudent.fullName}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {selectedStudent.status === 'verified' ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                    <CheckCircle size={14} />
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                                    <Clock size={14} />
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Information */}
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <User className="text-purple-600" size={20} />
                                        Personal Information
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Login ID</p>
                                            <p className="text-sm font-mono font-semibold text-gray-900">{selectedStudent.uniqueLoginId}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Registration Number</p>
                                            <p className="text-sm font-semibold text-gray-900">{selectedStudent.info?.registrationNumber || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Class Level</p>
                                            <p className="text-sm font-semibold text-gray-900">{selectedStudent.info?.classLevel || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Date of Birth</p>
                                            <p className="text-sm font-semibold text-gray-900">{selectedStudent.info?.dateOfBirth || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Phone className="text-purple-600" size={20} />
                                        Contact Information
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                                            <Mail className="text-gray-400" size={20} />
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
                                                <p className="text-sm font-semibold text-gray-900">{selectedStudent.email || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                                            <Phone className="text-gray-400" size={20} />
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">Phone</p>
                                                <p className="text-sm font-semibold text-gray-900">{selectedStudent.info?.phone || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                                            <MapPin className="text-gray-400" size={20} />
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">Location/Address</p>
                                                <p className="text-sm font-semibold text-gray-900">{selectedStudent.info?.location || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Information */}
                                {selectedStudent.info?.additionalInfo && (
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Hash className="text-purple-600" size={20} />
                                            Additional Information
                                        </h4>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-700">{selectedStudent.info.additionalInfo}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            // Handle edit action
                                            setSelectedStudent(null);
                                        }}
                                        className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Edit size={18} />
                                        Edit Student
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleDeleteStudent(selectedStudent._id);
                                            setSelectedStudent(null);
                                        }}
                                        className="px-4 py-3 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={18} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default Students;

