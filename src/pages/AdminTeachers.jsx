import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import AdminLayout from '../components/AdminLayout';
import { Search, UserCheck, UserX, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminTeachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useSelector((state) => state.auth);

    useEffect(() => {
        if (token) fetchTeachers();
    }, [token]);

    const fetchTeachers = async () => {
        try {
            const res = await axios.get('https://educbt-pro-backend.onrender.com/school/teachers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeachers(res.data);
        } catch (error) {
            toast.error("Failed to fetch teachers");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await axios.post('https://educbt-pro-backend.onrender.com/school/approve',
                { userId: id, action: 'approve' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Teacher approved");
            fetchTeachers();
        } catch (error) {
            toast.error("Action failed");
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
                        <p className="text-gray-500">Manage and monitor your teaching staff.</p>
                    </div>
                    <button className="btn-primary w-auto px-6">Invite Teacher</button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="text" placeholder="Search teachers..." className="pl-10 input-field" />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium capitalize">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Subjects</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Joined</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center py-8">Loading...</td></tr>
                                ) : teachers.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-8 text-gray-500">No teachers found.</td></tr>
                                ) : (
                                    teachers.map((teacher) => (
                                        <tr key={teacher._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                        {teacher.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{teacher.fullName}</p>
                                                        <p className="text-xs text-gray-500">{teacher.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {teacher.info?.subjects?.join(', ') || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${teacher.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {teacher.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {new Date(teacher.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {teacher.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleApprove(teacher._id)}
                                                        className="text-green-600 hover:text-green-700 font-medium text-sm mr-3"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                <button className="text-gray-400 hover:text-gray-600">
                                                    <MoreVertical size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminTeachers;

