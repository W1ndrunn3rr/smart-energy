import { Navigate } from 'react-router-dom';
import { getSecureCookie } from '../utils/Cookies';

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = getSecureCookie('isAuthenticated') === 'true';
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    return children;
};

export default ProtectedRoute;