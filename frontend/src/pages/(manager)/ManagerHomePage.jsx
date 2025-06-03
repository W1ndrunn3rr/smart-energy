import { sessionManager } from '../../scripts/session_manager';

const ManagerHomePage = () => {
    const userEmail = sessionManager.getUserEmail();

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 text-ars-deepblue">Manager Strona Główna</h1>
            <p className="mb-4">Witaj {userEmail} na stronie głównej panelu managera.</p>
            <p className="text-ars-darkgrey">
                Podgląd kluczowych wskaźników, status liczników i dostęp do raportów.
            </p>
        </div>
    );
};

export default ManagerHomePage;