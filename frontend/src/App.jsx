import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MainLayout from './components/common/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import ProfessorDashboard from './pages/ProfessorDashboard';
import StudentPortal from './pages/StudentPortal';
import LiveAttendance from './pages/LiveAttendance';
import ReportsDashboard from './pages/ReportsDashboard';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/login" replace />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="professor"
              element={
                <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN']}>
                  <ProfessorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="student"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="live"
              element={
                <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN']}>
                  <LiveAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'PROFESSOR']}>
                  <ReportsDashboard />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </Router>
    </ThemeProvider>

  );
}

export default App;
