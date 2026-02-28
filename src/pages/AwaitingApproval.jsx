const AwaitingApproval = () => {
    return (
        <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded shadow-lg max-w-md text-center">
                <div className="text-yellow-500 text-6xl mb-4">⏳</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Account Pending Approval</h1>
                <p className="text-gray-600 mb-6">
                    Your account has been created but requires verification from your School Admin.
                    Please contact your administrator to approve your access.
                </p>
                <a href="/login" className="text-blue-600 hover:underline">Back to Login</a>
            </div>
        </div>
    );
};

export default AwaitingApproval;
