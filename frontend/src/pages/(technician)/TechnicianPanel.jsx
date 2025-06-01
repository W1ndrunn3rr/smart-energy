import { sessionManager } from '../../scripts/session_manager';

const TechnicianPanel = () => {
    const userEmail = sessionManager.getUserEmail();

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 text-ars-deepblue">Panel Pracownika</h1>
            <p className="mb-4">Witaj {userEmail}! To jest strona dla pracowników (poziom 3).</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-bold mb-2">Moje zadania</h3>
                    <p>Przeglądaj i zarządzaj swoimi zadaniami</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-bold mb-2">Timesheet</h3>
                    <p>Rejestruj czas pracy</p>
                </div>
            </div>
        </div>
    );
};

export default TechnicianPanel;