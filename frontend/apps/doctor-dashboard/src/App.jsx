import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import AuthApiBridge from './components/Auth/AuthApiBridge';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import Dashboard from './pages/Dashboard/Dashboard';
import Patients from './pages/Patients/Patients';
import PatientConsultation from './pages/PatientConsultation/PatientConsultation';
import AIChat from './pages/AIChat/AIChat';
import Surgery from './pages/Surgery/Surgery';
import SurgeryPlanning from './pages/SurgeryPlanning/SurgeryPlanning';
import Medications from './pages/Medications/Medications';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminAudit from './pages/Admin/AdminAudit';
import AdminConfig from './pages/Admin/AdminConfig';
import AdminAnalytics from './pages/Admin/AdminAnalytics';
import AdminResources from './pages/Admin/AdminResources';
import PatientPortal from './pages/PatientModule/PatientPortal';
import Settings from './pages/Settings/Settings';
import Login from './pages/Login/Login';
import PatientPortalGuard from './components/Auth/PatientPortalGuard';
import PatientPortalLayout from './components/PatientPortal/PatientPortalLayout';
import PatientPortalHome from './pages/PatientPortal/PatientPortalHome';
import PatientPortalSummary from './pages/PatientPortal/PatientPortalSummary';
import PatientPortalMedications from './pages/PatientPortal/PatientPortalMedications';
import PatientPortalAppointments from './pages/PatientPortal/PatientPortalAppointments';
import PatientPortalHistory from './pages/PatientPortal/PatientPortalHistory';
import Reports from './pages/Reports/Reports';
import Profile from './pages/Profile/Profile';
import Debug from './pages/Debug/Debug';
import './App.css';

const isDev = import.meta.env.DEV;

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-content">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
            <Route path="/patient/:patientId" element={<ProtectedRoute><PatientConsultation /></ProtectedRoute>} />
            <Route path="/ai" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
            <Route path="/surgery" element={
              <ProtectedRoute requiredRoles={['surgeon', 'admin']}>
                <Surgery />
              </ProtectedRoute>
            } />
            <Route path="/surgery-planning/:surgeryId" element={
              <ProtectedRoute requiredRoles={['surgeon', 'admin']}>
                <SurgeryPlanning />
              </ProtectedRoute>
            } />
            <Route path="/patient-home" element={<ProtectedRoute requiredRoles={['patient']}><PatientPortal /></ProtectedRoute>} />
            <Route path="/medications" element={<ProtectedRoute><Medications /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute requiredRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requiredRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/audit" element={<ProtectedRoute requiredRoles={['admin']}><AdminAudit /></ProtectedRoute>} />
            <Route path="/admin/config" element={<ProtectedRoute requiredRoles={['admin']}><AdminConfig /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute requiredRoles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/admin/resources" element={<ProtectedRoute requiredRoles={['admin']}><AdminResources /></ProtectedRoute>} />
            <Route path="/settings" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Settings />
              </ProtectedRoute>
            } />
            {isDev && (
              <Route path="/debug" element={<ProtectedRoute><Debug /></ProtectedRoute>} />
            )}
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  // #region agent log
  fetch('http://127.0.0.1:7803/ingest/454ee95e-546b-4257-becf-08e4fe56dd25',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4da93a'},body:JSON.stringify({sessionId:'4da93a',location:'App:render',message:'App component rendering',data:{},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
  // #endregion
  return (
    <AuthProvider>
      <ThemeProvider>
        <AuthApiBridge>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/patient-portal" element={<PatientPortalGuard><PatientPortalLayout /></PatientPortalGuard>}>
                <Route index element={<PatientPortalHome />} />
                <Route path="summary" element={<PatientPortalSummary />} />
                <Route path="medication-tracker" element={<PatientPortalMedications />} />
                <Route path="appointments" element={<PatientPortalAppointments />} />
                <Route path="history" element={<PatientPortalHistory />} />
              </Route>
              <Route path="/*" element={<AppLayout />} />
            </Routes>
          </BrowserRouter>
        </AuthApiBridge>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
