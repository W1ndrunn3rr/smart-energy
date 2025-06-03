import { sessionManager } from '../../scripts/session_manager';

const AdminHomePage = () => {
    const userEmail = sessionManager.getUserEmail();

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 text-ars-deepblue">Admin Strona Główna</h1>
            <p className="mb-4">Witaj {userEmail} na stronie głównej panelu administratora.</p>
            <p className="text-ars-darkgrey">
                Tutaj w przyszłości znajdzie się podgląd kluczowych danych systemu,
                np. statystyki dotyczące wody, prądu i gazu z perspektywy administratora.
            </p>
            {/* Możesz tu dodać specyficzne dla admina komponenty lub informacje */}
        </div>
    );
};

export default AdminHomePage;