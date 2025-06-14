import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { useSessionRestore } from './components/UseSessionRestore';
import Login from './pages/(common)/Login'
import AdminHomePage from './pages/(admin)/AdminHomePage';
import AdminAccountsPage from './pages/(admin)/AdminAccountsPage';
import AdminMetersPage from './pages/(admin)/AdminMetersPage';
import AdminObjectsPage from './pages/(admin)/AdminObjectsPage';
import AdminReportsPage from './pages/(admin)/AdminReportsPage';
import ManagerHomePage from './pages/(manager)/ManagerHomePage';
import ManagerMetersPage from './pages/(manager)/ManagerMetersPage';
import ManagerReportsPage from './pages/(manager)/ManagerReportsPage';
import TechnicianHomePage from './pages/(technician)/TechnicianHomePage';
import TechnicianDataEntryPage from './pages/(technician)/TechnicianDataEntryPage';
import UserHomePage from './pages/(user)/UserHomePage';
import UserMetersPage from './pages/(user)/UserMetersPage';
import Unauthorized from './pages/(common)/Unauthorized';

/**
 * @function App
 * @returns {JSX.Element} Główny komponent aplikacji, obsługuje routing i layout.
 */
function App() {
  useSessionRestore();
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/admin/home" element={
          <ProtectedRoute requiredAccessLevel={1}>
            <Layout>
              <AdminHomePage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/accounts" element={
          <ProtectedRoute requiredAccessLevel={1}>
            <Layout>
              <AdminAccountsPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/meters" element={
          <ProtectedRoute requiredAccessLevel={1}>
            <Layout>
              <AdminMetersPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/objects" element={
          <ProtectedRoute requiredAccessLevel={1}>
            <Layout>
              <AdminObjectsPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute requiredAccessLevel={1}>
            <Layout>
              <AdminReportsPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/manager/home" element={
          <ProtectedRoute requiredAccessLevel={2}>
            <Layout>
              <ManagerHomePage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/manager/meters" element={
          <ProtectedRoute requiredAccessLevel={2}>
            <Layout>
              <ManagerMetersPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/manager/reports" element={
          <ProtectedRoute requiredAccessLevel={2}>
            <Layout>
              <ManagerReportsPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/technician/home" element={
          <ProtectedRoute requiredAccessLevel={3}>
            <Layout>
              <TechnicianHomePage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/technician/addmetter" element={
          <ProtectedRoute requiredAccessLevel={3}>
            <Layout>
              <TechnicianDataEntryPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/user/home" element={
          <ProtectedRoute requiredAccessLevel={4}>
            <Layout>
              <UserHomePage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/user/metters" element={
          <ProtectedRoute requiredAccessLevel={4}>
            <Layout>
              <UserMetersPage />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;