import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UserCheck, LogOut, UserPlus, FileText, Search, Activity } from "lucide-react";

const socket = io('http://localhost:5000');

const PatientHistory = () => {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("all");
  
  // Registration States
  const [showRegister, setShowRegister] = useState(false);
  const [regData, setRegData] = useState({ name: '', email: '', password: '' });
  const [regStatus, setRegStatus] = useState(null);

  // Get current doctor details from storage
  const currentDoctorName = localStorage.getItem('doctorName') || 'Physician';
  const userRole = localStorage.getItem('userRole');

  const getAuthHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  useEffect(() => {
    // 1. Initial Fetch
    fetch('http://localhost:5000/api/triage/history', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setRecords(data))
      .catch(err => console.error("Fetch error:", err));

    // 2. Socket Listeners
    socket.on('new_patient', (newPatient) => {
      // --- AUDIO ALERT LOGIC ---
      const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      
      notificationSound.play().catch(err => {
        // Browsers block audio until the user clicks SOMETHING on the page.
        // This catch prevents the console from exploding if that happens.
        console.log("Audio playback waiting for user interaction.");
      });

      setRecords(prev => [newPatient, ...prev]);
    });

    socket.on('patient_updated', (updated) => {
      setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
    });

    // 3. Cleanup
    return () => {
      socket.off('new_patient');
      socket.off('patient_updated');
    };
  }, []);

  const handleRegisterDoctor = async (e) => {
    e.preventDefault();
    setRegStatus("Processing...");
    try {
      const res = await fetch('http://localhost:5000/api/triage/register', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(regData)
      });
      const data = await res.json();
      if (res.ok) {
        setRegStatus("✅ Doctor registered successfully!");
        setTimeout(() => { setShowRegister(false); setRegStatus(null); setRegData({name:'', email:'', password:''}); }, 2000);
      } else {
        setRegStatus(`❌ ${data.error}`);
      }
    } catch (err) {
      setRegStatus("❌ Connection error");
    }
  };

  const handleStatusUpdate = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Seen' ? 'Pending' : 'Seen';
    
    try {
      await fetch(`http://localhost:5000/api/triage/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ 
            status: newStatus,
            doctorName: currentDoctorName // <--- PASSING THE LOGGED IN DOCTOR
        })
      });
    } catch (err) { console.error(err); }
  };

  const handleNotesUpdate = async (id, notes) => {
    if (notes === undefined) return;
    try {
      const response = await fetch(`http://localhost:5000/api/triage/${id}/notes`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ notes })
      });
      if (response.ok) console.log(`Autosaved: ${id}`);
    } catch (err) { console.error(err); }
  };

  const downloadPDF = (record) => {
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(30, 58, 138);
      doc.text("HHPP CLINICAL TRIAGE REPORT", 105, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Report ID: ${record.id || 'N/A'}-${record.medical_id || 'N/A'}`, 105, 27, { align: "center" });
      doc.line(20, 32, 190, 32);
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("PATIENT PROFILE", 20, 42);
      doc.setFont("helvetica", "normal");
      doc.text(`Full Name: ${record.patient || 'Unknown'}`, 20, 50);
      doc.text(`Medical ID: ${record.medical_id || 'N/A'}`, 20, 56);
      doc.text(`Age/Gender: ${record.age || 'N/A'} Y/O | ${record.gender || 'N/A'}`, 120, 50);
      doc.text(`Attending: Dr. ${record.seenBy || 'N/A'}`, 120, 56);

      autoTable(doc, {
        startY: 65,
        head: [['Clinical Metric', 'Measurement / Detail']],
        body: [
          ['Primary Symptoms', record.symptoms || 'None reported'],
          ['Heart Rate', `${record.heartRate || '--'} BPM`],
          ['Blood Pressure', record.bloodPressure || '--'],
          ['Body Temperature', `${record.temperature || '--'}°C`],
          ['Urgency Classification', (record.urgency || 'Normal').toUpperCase()],
          ['Clinical Notes', record.doctorNotes || 'No clinical notes provided'],
          ['Status', record.status || 'Pending'],
          ['Finalized By', record.seenBy ? `Dr. ${record.seenBy}` : 'Unassigned']
        ],
        headStyles: { fillColor: [30, 58, 138] },
        theme: 'striped'
      });

      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFont("helvetica", "bold").text("AI CLINICAL ASSESSMENT", 20, finalY);
      doc.setFont("helvetica", "italic").setFontSize(10).setTextColor(50);
      const splitDiagnosis = doc.splitTextToSize(record.diagnosis || "No AI assessment.", 170);
      doc.text(splitDiagnosis, 20, finalY + 8);
      doc.save(`Triage_${record.patient.replace(/\s+/g, '_')}.pdf`);
    } catch (error) { alert("PDF Error"); }
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.patient?.toLowerCase().includes(searchTerm.toLowerCase()) || r.medical_id?.includes(searchTerm);
    const matchesUrgency = filterUrgency === "all" || r.urgency === filterUrgency;
    return matchesSearch && matchesUrgency;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 relative">
      
      {/* Registration Modal Overlay */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-xl font-bold">Onboard New Doctor</h2>
                <button onClick={() => setShowRegister(false)} className="text-slate-400 hover:text-black">✕</button>
              </div>
              <form onSubmit={handleRegisterDoctor} className="space-y-3">
                <Input placeholder="Full Name" required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} />
                <Input type="email" placeholder="Email Address" required value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} />
                <Input type="password" placeholder="Temporary Password" required value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} />
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Create Account</Button>
                {regStatus && <p className="text-center text-sm font-medium animate-pulse">{regStatus}</p>}
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="font-bold text-lg leading-tight">HHPP Dashboard</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Clinical Management System</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {userRole === 'ADMIN' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex border-slate-700 text-slate-300 hover:bg-slate-800" 
              onClick={() => setShowRegister(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" /> Add Colleague
            </Button>
          )}
          
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-white">Dr. {currentDoctorName}</span>
            <span className="text-[9px] text-blue-400 font-bold uppercase">{userRole}</span>
          </div>
          <Button variant="destructive" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-full max-w-md relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input placeholder="Search Patient or Medical ID..." className="pl-10 h-11" onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
          <Button variant={filterUrgency === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setFilterUrgency('all')}>All Cases</Button>
          <Button variant={filterUrgency === 'high' ? 'destructive' : 'ghost'} size="sm" onClick={() => setFilterUrgency('high')}>Emergencies</Button>
        </div>
      </div>

      {/* Records List */}
      <div className="grid gap-6">
        {filteredRecords.length === 0 ? (
          <div className="text-center p-20 text-slate-400 italic">No clinical records found.</div>
        ) : (
          filteredRecords.map((record) => (
            <Card key={record.id} className={`transition-all border-l-[12px] ${record.urgency === 'high' ? 'border-l-red-600 bg-red-50/10' : 'border-l-blue-600'}`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold text-2xl text-slate-900">{record.patient}</h3>
                      <Badge variant="outline" className="font-mono">{record.medical_id}</Badge>
                      <Badge className={record.status === 'Seen' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}>
                        {record.status || 'Pending'}
                      </Badge>
                      
                      {/* --- SEEN BY BADGE --- */}
                      {record.seenBy && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                          <UserCheck className="w-3 h-3 mr-1" /> Seen by Dr. {record.seenBy}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {record.age} Y/O | {record.gender} | Received: {new Date(record.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" onClick={() => downloadPDF(record)}>
                      <FileText className="w-4 h-4 mr-2" /> PDF
                    </Button>
                    <Button 
                        variant={record.status === 'Seen' ? "secondary" : "default"}
                        onClick={() => handleStatusUpdate(record.id, record.status)}
                        className={record.status !== 'Seen' ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                      {record.status === 'Seen' ? 'Re-open' : 'Mark Seen'}
                    </Button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-6">
                  <div className="md:col-span-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Vitals Scan</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="border p-2 rounded bg-slate-50">
                        <p className="text-[10px] text-slate-500">Heart Rate</p>
                        <p className="font-bold text-red-600">{record.heartRate} <span className="text-[9px]">BPM</span></p>
                      </div>
                      <div className="border p-2 rounded bg-slate-50">
                        <p className="text-[10px] text-slate-500">Temp</p>
                        <p className="font-bold text-orange-600">{record.temperature}°C</p>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">AI Clinical Assessment</p>
                    <p className="text-sm italic bg-blue-50/50 p-3 rounded border border-blue-100 min-h-[60px] text-slate-700">
                      {record.diagnosis}
                    </p>
                  </div>
                  <div className="md:col-span-3 mt-4 border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Clinical Progress Notes</p>
                      <span className="text-[9px] text-slate-400 italic font-medium uppercase tracking-tighter italic">Secured & Autosaving</span>
                    </div>
                    <textarea
                      className="w-full p-3 text-sm border rounded-md bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all resize-none shadow-inner"
                      rows="3"
                      placeholder="Enter clinical observations, treatment plans, or follow-up instructions..."
                      defaultValue={record.doctorNotes || ""}
                      onBlur={(e) => handleNotesUpdate(record.id, e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientHistory;