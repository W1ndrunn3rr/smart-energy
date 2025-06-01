import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { useSessionRestore } from './components/UseSessionRestore';
import Login from './pages/(common)/Login'
import Home from './pages/(common)/Home';
import AdminPanel from './pages/(admin)/AdminPanel';
import UserPanel from './pages/(user)/UserPanel';
import ManagerPanel from './pages/(manager)/ManagerPanel';
import TechnicianPanel from './pages/(technician)/TechnicianPanel';
import Unauthorized from './pages/(common)/Unauthorized';

function App() {
  // Przywróć sesję przy ładowaniu aplikacji
  useSessionRestore();
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route path="/Home" element={
          <ProtectedRoute>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Admin - poziom 1 */}
        <Route path="/admin" element={
          <ProtectedRoute requiredAccessLevel={1}>
            <Layout>
              <AdminPanel />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Manager - poziom 2 */}
        <Route path="/manager" element={
          <ProtectedRoute requiredAccessLevel={2}>
            <Layout>
              <ManagerPanel />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Employee - poziom 3 */}
        <Route path="/employee" element={
          <ProtectedRoute requiredAccessLevel={3}>
            <Layout>
              <TechnicianPanel />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Guest - poziom 4 */}
        <Route path="/guest" element={
          <ProtectedRoute requiredAccessLevel={4}>
            <Layout>
              <UserPanel />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;