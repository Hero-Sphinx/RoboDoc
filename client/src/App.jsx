import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TriageForm from './components/TriageForm';
import PatientHistory from './components/PatientHistory';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <Router>
      <DashboardLayout>
        <Routes>
          {/* Default page is the form */}
          <Route path="/" element={<TriageForm />} />
          
          {/* History page */}
          <Route path="/history" element={<PatientHistory />} />
        </Routes>
      </DashboardLayout>
      <Toaster />
    </Router>
  );
}

export default App;