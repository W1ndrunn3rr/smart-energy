import { sessionManager } from '../../scripts/session_manager';


const UserPanel = () => {
    const userData = sessionManager.getUserData();

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 text-ars-deepblue">Panel Gościa</h1>
            <p className="mb-4">Witaj {userData?.email}! To jest strona dla gości (poziom 4).</p>

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-bold mb-2">Informacje publiczne</h3>
                    <p>Przeglądaj ogólne informacje o systemie</p>
                </div>
            </div>
        </div>
    );
};

export default UserPanel;