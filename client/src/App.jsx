import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TriageForm from './components/TriageForm';
import PatientHistory from './components/PatientHistory';
import PatientQueue from './components/PatientQueue'; // 1. Import the new component
import Login from './pages/Login';
import Landing from './pages/Landing';
import DashboardLayout from "@/components/layout/DashboardLayout";
import DoctorNotifications from './components/DoctorNotifications';
import { Toaster } from "@/components/ui/toaster";

// The "Bouncer" for the History page
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Login is full screen, no DashboardLayout */}
        <Route path="/login" element={<Login />} />

        {/* Landing/home: patients choose to log in (doctor), check queue, or start a new assessment */}
        <Route path="/" element={<Landing />} />

        {/* 2. Public Queue Portal (No DashboardLayout to keep it clean for patients) */}
        <Route path="/queue" element={<PatientQueue />} />

        {/* Triage form is public so patients can use it - no doctor chrome */}
        <Route path="/triage" element={<TriageForm />} />

        {/* History is protected and uses DashboardLayout */}
        <Route 
          path="/history" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PatientHistory />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DoctorNotifications />
      <Toaster />
    </Router>
  );
}

export default App;