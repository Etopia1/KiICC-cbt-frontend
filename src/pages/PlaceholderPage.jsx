import AdminLayout from '../components/AdminLayout';

const PlaceholderPage = ({ title }) => {
    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    <p className="text-gray-500">Manage your school {title.toLowerCase()}.</p>
                </div>

                <div className="bg-white p-12 text-center rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500">{title} module is under development.</p>
                </div>
            </div>
        </AdminLayout>
    );
};

export default PlaceholderPage;
