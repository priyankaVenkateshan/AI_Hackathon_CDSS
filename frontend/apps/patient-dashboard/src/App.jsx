import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, roles } from './context/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import Dashboard from './pages/Dashboard/Dashboard';
import MyAppointments from './pages/MyAppointments/MyAppointments';
import MyMedications from './pages/MyMedications/MyMedications';
import MyRecords from './pages/MyRecords/MyRecords';
import Contact from './pages/Contact/Contact';
import Login from './pages/Login/Login';
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
            <Route path="/" element={<ProtectedRoute requiredRoles={[roles.PATIENT]}><Dashboard /></ProtectedRoute>} />
            <Route path="/appointments" element={<ProtectedRoute requiredRoles={[roles.PATIENT]}><MyAppointments /></ProtectedRoute>} />
            <Route path="/medications" element={<ProtectedRoute requiredRoles={[roles.PATIENT]}><MyMedications /></ProtectedRoute>} />
            <Route path="/records" element={<ProtectedRoute requiredRoles={[roles.PATIENT]}><MyRecords /></ProtectedRoute>} />
            <Route path="/contact" element={<ProtectedRoute requiredRoles={[roles.PATIENT]}><Contact /></ProtectedRoute>} />
            {isDev && <Route path="/debug" element={<ProtectedRoute requiredRoles={[roles.PATIENT]}><Debug /></ProtectedRoute>} />}
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
