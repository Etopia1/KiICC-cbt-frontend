import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import AdminLayout from '../components/AdminLayout';
import { UserCheck, CheckCircle, X, Clock, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminApprovals = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [approvingId, setApprovingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState('all');
    const { token } = useSelector((state) => state.auth);

    useEffect(() => {
        if (token) fetchPendingUsers();
    }, [token]);

    const fetchPendingUsers = async () => {
        try {
            const res = await axios.get('https://educbt-pro-backend.onrender.com/school/pending', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingUsers(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching pending users", error);
            // toast.error("Failed to load pending approvals"); // Optional: verify error isn't just cancelled
            setLoading(false);
        }
    };

    const handleApproveUser = async (userId) => {
        setApprovingId(userId);
        try {
            await axios.post('https://educbt-pro-backend.onrender.com/school/approve',
                { userId, action: 'approve' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('User approved successfully!');
            setPendingUsers(prev => prev.filter(u => u._id !== userId));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve user');
        } finally {
            setApprovingId(null);
        }
    };

    const handleRejectUser = async (userId) => {
        if (!confirm('Are you sure you want to reject this user? This action cannot be undone.')) return;

        setApprovingId(userId);
        try {
            await axios.post('https://educbt-pro-backend.onrender.com/school/approve',
                { userId, action: 'reject' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('User rejected');
            setPendingUsers(prev => prev.filter(u => u._id !== userId));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject user');
        } finally {
            setApprovingId(null);
        }
    };

    const filteredUsers = pendingUsers.filter(user => {
        if (filterRole === 'all') return true;
        return user.role === filterRole;
    });

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
                    <p className="text-gray-500">Review and verify new account requests.</p>
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                            <Clock size={16} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Waiting: {pendingUsers.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setFilterRole('all')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${filterRole === 'all' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilterRole('teacher')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${filterRole === 'teacher' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                Teachers
                            </button>
                            <button
                                onClick={() => setFilterRole('student')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${filterRole === 'student' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                Students
                            </button>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="grid gap-4">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Loading requests...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-xl border border-gray-200 border-dashed">
                            <UserCheck size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No pending approvals</h3>
                            <p className="text-gray-500">All caught up! New registrations will appear here.</p>
                        </div>
                    ) : (
                        filteredUsers.map((user) => (
                            <div key={user._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-200 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${user.role === 'teacher' ? 'bg-linear-to-br from-indigo-500 to-purple-600' : 'bg-linear-to-br from-emerald-400 to-teal-500'}`}>
                                        {user.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-bold text-gray-900 text-lg">{user.fullName}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.role === 'teacher' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                                {user.role === 'teacher' ? 'Teacher' : 'Student'}
                                            </span>
                                        </div>
                                        <div className="mt-1 space-y-1">
                                            <p className="text-sm text-gray-600">ID: <span className="font-mono bg-gray-100 px-1 rounded">{user.uniqueLoginId}</span></p>
                                            {user.email && !user.email.includes('.local') && (
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            )}
                                            {user.info && (
                                                <div className="text-sm text-gray-500 flex gap-3 mt-1">
                                                    {user.info.classLevel && <span>Class: {user.info.classLevel}</span>}
                                                    {user.info.phone && <span>Tel: {user.info.phone}</span>}
                                                    {user.info.subjects && user.info.subjects.length > 0 && <span>Subjects: {user.info.subjects.join(', ')}</span>}
                                                    {user.info.registrationNumber && <span>Reg: {user.info.registrationNumber}</span>}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">Registered: {new Date(user.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <button
                                        onClick={() => handleRejectUser(user._id)}
                                        disabled={approvingId === user._id}
                                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition-colors disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                    {user.role === 'student' ? (
                                        <div className="flex flex-col items-end">
                                            <span className="px-4 py-2 text-sm font-medium text-amber-600 bg-amber-50 rounded-lg border border-amber-100 flex items-center gap-2">
                                                <Clock size={16} />
                                                Waiting for Class Teacher
                                            </span>
                                            <span className="text-xs text-gray-500 mt-1">
                                                To be approved by {user.info?.classLevel} Teacher
                                            </span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleApproveUser(user._id)}
                                            disabled={approvingId === user._id}
                                            className="px-6 py-2 text-sm font-bold text-white bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {approvingId === user._id ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <CheckCircle size={16} />
                                            )}
                                            {approvingId === user._id ? 'Approving...' : 'Approve Teacher'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminApprovals;

