import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import AdminLayout from '../components/AdminLayout';
import { Users, Mail, Phone, BookOpen, UserCheck, Clock, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const Teachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [filteredTeachers, setFilteredTeachers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, verified, pending
    const { token } = useSelector((state) => state.auth);

    useEffect(() => {
        if (token) fetchTeachers();
    }, [token]);

    useEffect(() => {
        filterTeachers();
    }, [searchQuery, statusFilter, teachers]);

    const fetchTeachers = async () => {
        try {
            const response = await axios.get('https://educbt-pro-backend.onrender.com/school/teachers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeachers(response.data);
            setFilteredTeachers(response.data);
        } catch (error) {
            console.error('Error fetching teachers:', error);
            toast.error('Failed to load teachers');
        } finally {
            setIsLoading(false);
        }
    };

    const filterTeachers = () => {
        let filtered = teachers;

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(t => t.status === statusFilter);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.fullName.toLowerCase().includes(query) ||
                t.uniqueLoginId.toLowerCase().includes(query) ||
                t.email?.toLowerCase().includes(query) ||
                t.info?.subjects?.some(s => s.toLowerCase().includes(query))
            );
        }

        setFilteredTeachers(filtered);
    };

    const getStatusBadge = (status) => {
        if (status === 'verified') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    <UserCheck size={12} />
                    Verified
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                <Clock size={12} />
                Pending
            </span>
        );
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
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
                        <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
                        <p className="text-gray-500 mt-1">Manage and view all teachers in your school</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-semibold">
                            {filteredTeachers.length} {filteredTeachers.length === 1 ? 'Teacher' : 'Teachers'}
                        </span>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name, ID, email, or subject..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="sm:w-48">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none cursor-pointer bg-white"
                            >
                                <option value="all">All Status</option>
                                <option value="verified">Verified</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Teachers List */}
                {filteredTeachers.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
                        <Users className="mx-auto text-gray-300 mb-4" size={48} />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No teachers found</h3>
                        <p className="text-gray-500">
                            {searchQuery || statusFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Start by inviting teachers to your school'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredTeachers.map((teacher) => (
                            <div key={teacher._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                                            {teacher.fullName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{teacher.fullName}</h3>
                                            <p className="text-sm text-gray-500">ID: {teacher.uniqueLoginId}</p>
                                        </div>
                                    </div>
                                    {getStatusBadge(teacher.status)}
                                </div>

                                {/* Details */}
                                <div className="space-y-3">
                                    {/* Email */}
                                    {teacher.email && !teacher.email.includes('@teacher.local') && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Mail className="text-gray-400 shrink-0" size={16} />
                                            <span className="text-gray-700">{teacher.email}</span>
                                        </div>
                                    )}

                                    {/* Phone */}
                                    {teacher.info?.phone && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Phone className="text-gray-400 shrink-0" size={16} />
                                            <span className="text-gray-700">{teacher.info.phone}</span>
                                        </div>
                                    )}

                                    {/* Class Level */}
                                    {teacher.info?.classLevel && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Users className="text-gray-400 shrink-0" size={16} />
                                            <span className="text-gray-700">Assigned Class: <span className="font-semibold text-indigo-600">{teacher.info.classLevel}</span></span>
                                        </div>
                                    )}

                                    {/* Subjects */}
                                    {teacher.info?.subjects && teacher.info.subjects.length > 0 && (
                                        <div className="flex items-start gap-3 text-sm">
                                            <BookOpen className="text-gray-400 shrink-0 mt-0.5" size={16} />
                                            <div className="flex-1">
                                                <p className="text-gray-500 mb-2">Teaching Subjects:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {teacher.info.subjects.map((subject, idx) => (
                                                        <span key={idx} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">
                                                            {subject}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default Teachers;

