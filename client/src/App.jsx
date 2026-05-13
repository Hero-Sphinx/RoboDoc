import { useState } from 'react'

function App() {
  const [patientName, setPatientName] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTriage = async () => {
    if (!symptoms) return alert("Please enter symptoms");
    setLoading(true);
    setResult(null); // Clear previous result so the user sees it's working
    
    try {
      const response = await fetch('http://localhost:5000/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          patient: patientName,  
          symptoms, 
          urgency 
        }),
      });
      
      const data = await response.json();
      console.log("Backend Response:", data);

      // We check for 'analysis' OR 'diagnosis' based on what your backend sends
      const aiResponse = data.analysis || data.diagnosis || (data.data && data.data.diagnosis);
      
      setResult(aiResponse); 
    } catch (error) {
      console.error("Error:", error);
      setResult("Error connecting to server. Is the backend running?");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-700 p-6 text-white">
          <h1 className="text-2xl font-bold">AI Triage Portal</h1>
          <p className="text-blue-100 text-sm">Built with Heart • Hustle • Passion • Purpose</p>
        </div>

        <div className="p-8 space-y-6">
          {/* Patient Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Patient Name</label>
              <input 
                type="text" 
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="Enter patient name..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Initial Urgency (Self-Reported)</label>
              <select 
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              >
                <option value="normal">Normal / Routine</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>

          {/* Symptoms Box */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Symptoms & Notes</label>
            <textarea 
              rows="4"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="Describe symptoms in detail (e.g., chest pain, duration, severity)..."
            ></textarea>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleTriage}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-lg transition shadow-lg ${
              loading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Analyzing Symptoms...' : 'Run AI Triage Assessment'} 
          </button>

          {/* Result Area */}
          {/* Result Area */}
{result && (
  <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
    <h3 className="text-blue-800 font-bold mb-2 uppercase text-xs tracking-wider">AI Assessment Result:</h3>
    {/* 'whitespace-pre-wrap' preserves the spacing from Gemini */}
    <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
      {result}
    </div>
  </div>
)}
        </div>
      </div>
      
      <footer className="text-center mt-8 text-slate-400 text-xs uppercase tracking-widest">
        Built by Salami | AI Triage Backend v1.0
      </footer>
    </div>
  );
}

export default App;