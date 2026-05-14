import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TriageForm from './components/TriageForm';
import PatientHistory from './components/PatientHistory'; // Ensure it's in src/components/
import Login from './pages/Login'; // Ensure it's in src/pages/
import DashboardLayout from "@/components/layout/DashboardLayout";
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

        {/* Form is public so patients can use it */}
        <Route path="/" element={
          <DashboardLayout>
            <TriageForm />
          </DashboardLayout>
        } />

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
      <Toaster />
    </Router>
  );
}

export default App;