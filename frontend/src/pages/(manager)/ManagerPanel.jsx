import { sessionManager } from '../../scripts/session_manager';

const ManagerPanel = () => {
    const userData = sessionManager.getUserData();

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 text-ars-deepblue">Panel Managera</h1>
            <p className="mb-4">Witaj {userData?.email}! To jest strona dla managerów (poziom 2).</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-bold mb-2">Raporty zespołu</h3>
                    <p>Przeglądaj raporty z działalności zespołu</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-bold mb-2">Zarządzanie projektami</h3>
                    <p>Nadzoruj postęp projektów</p>
                </div>
            </div>
        </div>
    );
};

export default ManagerPanel;