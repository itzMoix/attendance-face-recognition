import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/common/MainLayout';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ProfessorDashboard from './pages/ProfessorDashboard';
import StudentPortal from './pages/StudentPortal';
import LiveAttendance from './pages/LiveAttendance';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/login" replace />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="professor" element={<ProfessorDashboard />} />
            <Route path="student" element={<StudentPortal />} />
            <Route path="live" element={<LiveAttendance />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>

  );
}

export default App;
