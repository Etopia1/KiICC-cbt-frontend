import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children, role }) => {
    const { user, loading, _persist } = useSelector((state) => state.auth);
    // redux-persist injects _persist into the persisted slice (state.auth._persist)
    // Wait for rehydration to prevent false login redirect after full-page navigation (e.g. Stripe return)
    const rehydrated = _persist?.rehydrated ?? true;

    if (!rehydrated || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FCFBFA]">
                <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (role && user.role !== role) return <Navigate to="/" replace />;

    return children;
};

export default PrivateRoute;
