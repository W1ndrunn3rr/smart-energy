import Navigation from './Navigation';

/**
 * @function Layout
 * @param {object} props
 * @param {React.ReactNode} props.children - Komponenty potomne do wyświetlenia w layoucie.
 * @returns {JSX.Element} Layout aplikacji z nawigacją i główną treścią.
 */
const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-ars-whitegrey">
            <Navigation />
            <main>
                {children}
            </main>
        </div>
    );
};

export default Layout;