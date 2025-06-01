import Navigation from './Navigation';

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