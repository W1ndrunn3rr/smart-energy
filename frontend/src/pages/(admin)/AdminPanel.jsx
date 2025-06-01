import { sessionManager } from '../../scripts/session_manager';

const AdminPanel = () => {
    const userEmail = sessionManager.getUserEmail();

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 text-ars-deepblue">Panel Administratora</h1>
            <p className="mb-4">Witaj {userEmail}! To jest strona tylko dla administratorów (poziom 1).</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-bold mb-2">Zarządzanie użytkownikami</h3>
                    <p>Dodawaj, edytuj i usuwaj użytkowników systemu</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-bold mb-2">Ustawienia systemu</h3>
                    <p>Konfiguruj parametry globalnego systemu</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-bold mb-2">Logi systemu</h3>
                    <p>Przeglądaj szczegółowe logi działania systemu</p>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;