import { useState, useEffect } from 'react';
import axios from 'axios';

const SchoolDashboard = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [inviteLink, setInviteLink] = useState('');

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('https://educbt-pro-backend.onrender.com/school/pending', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingUsers(res.data);
        } catch (error) {
            console.error('Error fetching pending users', error);
        }
    };

    const handleAction = async (userId, action) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('https://educbt-pro-backend.onrender.com/school/approve', { userId, action }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPending(); // Refresh list
        } catch (error) {
            alert('Action failed');
        }
    };

    const generateInvite = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('https://educbt-pro-backend.onrender.com/school/invite', { role: 'teacher' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInviteLink(res.data.inviteLink);
        } catch (error) {
            alert('Failed to generate invite');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-8">School Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Approvals Section */}
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-bold mb-4">Pending Approvals</h2>
                    {pendingUsers.length === 0 ? <p>No pending users.</p> : (
                        <ul className="space-y-4">
                            {pendingUsers.map(user => (
                                <li key={user._id} className="border p-4 rounded flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{user.fullName}</p>
                                        <p className="text-sm text-gray-600">{user.role} - {user.username}</p>
                                    </div>
                                    <div className="space-x-2">
                                        <button onClick={() => handleAction(user._id, 'approve')} className="bg-green-500 text-white px-3 py-1 rounded">Approve</button>
                                        <button onClick={() => handleAction(user._id, 'reject')} className="bg-red-500 text-white px-3 py-1 rounded">Reject</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Invite Section */}
                <div className="bg-white p-6 rounded shadow h-fit">
                    <h2 className="text-xl font-bold mb-4">Invite Teachers</h2>
                    <button onClick={generateInvite} className="bg-blue-600 text-white px-4 py-2 rounded">Generate Invite Link</button>
                    {inviteLink && (
                        <div className="mt-4 p-2 bg-gray-100 border rounded break-all">
                            <p className="text-sm font-mono">{inviteLink}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SchoolDashboard;

