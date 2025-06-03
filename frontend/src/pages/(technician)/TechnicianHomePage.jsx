import { sessionManager } from '../../scripts/session_manager';

const TechnicianHomePage = () => {
    const userEmail = sessionManager.getUserEmail();
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 text-ars-deepblue">Technik Strona Główna</h1>
            <p className="mb-4">Witaj {userEmail} na stronie głównej technika.</p>
            <p className="text-ars-darkgrey">Szybki dostęp do zadań i wprowadzania danych.</p>
        </div>
    );
};
export default TechnicianHomePage;