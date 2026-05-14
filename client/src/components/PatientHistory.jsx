import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; // Updated import style for better reliability
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const socket = io('http://localhost:5000');

const PatientHistory = () => {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("all");

  useEffect(() => {
    fetch('http://localhost:5000/api/triage/history')
      .then(res => res.json())
      .then(data => setRecords(data))
      .catch(err => console.error("Fetch error:", err));

    socket.on('new_patient', (newPatient) => {
      setRecords(prev => [newPatient, ...prev]);
    });

    socket.on('patient_updated', (updated) => {
      setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
    });

    return () => socket.off();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await fetch(`http://localhost:5000/api/triage/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const downloadPDF = (record) => {
    try {
      const doc = new jsPDF();
      
      // Header Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(30, 58, 138); 
      doc.text("HHPP CLINICAL TRIAGE REPORT", 105, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Report ID: ${record.id || 'N/A'}-${record.medical_id || 'N/A'}`, 105, 27, { align: "center" });
      doc.line(20, 32, 190, 32);

      // Patient Info Section
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("PATIENT PROFILE", 20, 42);
      
      doc.setFont("helvetica", "normal");
      doc.text(`Full Name: ${record.patient || 'Unknown'}`, 20, 50);
      doc.text(`Medical ID: ${record.medical_id || 'N/A'}`, 20, 56);
      doc.text(`Age/Gender: ${record.age || 'N/A'} Y/O | ${record.gender || 'N/A'}`, 120, 50);
      doc.text(`Date: ${record.createdAt ? new Date(record.createdAt).toLocaleString() : 'N/A'}`, 120, 56);

      // Clinical Data Table
      // Note: We use the autoTable function directly imported at the top
      autoTable(doc, {
        startY: 65,
        head: [['Clinical Metric', 'Measurement / Detail']],
        body: [
          ['Primary Symptoms', record.symptoms || 'None reported'],
          ['Heart Rate', `${record.heartRate || '--'} BPM`],
          ['Blood Pressure', record.bloodPressure || '--'],
          ['Body Temperature', `${record.temperature || '--'}°C`],
          ['Urgency Classification', (record.urgency || 'Normal').toUpperCase()],
          ['Current Status', record.status || 'Pending'],
        ],
        headStyles: { fillColor: [30, 58, 138] },
        theme: 'striped'
      });

      // AI Analysis Section
      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFont("helvetica", "bold");
      doc.text("AI CLINICAL ASSESSMENT", 20, finalY);
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(50);
      
      const diagnosisText = record.diagnosis || "No AI assessment available for this record.";
      const splitDiagnosis = doc.splitTextToSize(diagnosisText, 170);
      doc.text(splitDiagnosis, 20, finalY + 8);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Automated Clinical Document - HHPP Systems", 105, 285, { align: "center" });

      doc.save(`Triage_${record.patient.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Could not generate PDF. Check the browser console for details.");
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.patient.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.medical_id.includes(searchTerm);
    const matchesUrgency = filterUrgency === "all" || r.urgency === filterUrgency;
    return matchesSearch && matchesUrgency;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-full max-w-md">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Search Records</label>
          <Input 
            placeholder="Search by Patient Name or Medical ID..." 
            className="h-11"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col items-end gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase mr-1 mb-1 block">Priority Filter</label>
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
            <Button variant={filterUrgency === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setFilterUrgency('all')}>All</Button>
            <Button variant={filterUrgency === 'high' ? 'destructive' : 'ghost'} size="sm" onClick={() => setFilterUrgency('high')}>Emergencies</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredRecords.length === 0 ? (
          <div className="text-center p-20 text-slate-400 italic">No clinical records found.</div>
        ) : (
          filteredRecords.map((record) => (
            <Card key={record.id} className={`transition-all border-l-[12px] ${record.urgency === 'high' ? 'border-l-red-600 bg-red-50/20' : 'border-l-blue-600'}`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-2xl text-slate-900">{record.patient}</h3>
                      <Badge variant="outline">{record.medical_id}</Badge>
                      <Badge className={record.status === 'Seen' ? 'bg-emerald-500' : 'bg-slate-400'}>
                        {record.status || 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      {record.age} Y/O | {record.gender} | Triage: {new Date(record.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => downloadPDF(record)}>📄 PDF</Button>
                    <Button onClick={() => handleStatusUpdate(record.id, record.status === 'Seen' ? 'Pending' : 'Seen')}>
                      {record.status === 'Seen' ? 'Re-open' : 'Mark Seen'}
                    </Button>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-6">
                  <div className="md:col-span-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Vitals</p>
                    <div className="flex gap-2">
                      <div className="border p-2 rounded text-center w-1/2">
                        <p className="text-xs">Heart</p>
                        <p className="font-bold text-red-600">{record.heartRate} <span className="text-[9px]">BPM</span></p>
                      </div>
                      <div className="border p-2 rounded text-center w-1/2">
                        <p className="text-xs">Temp</p>
                        <p className="font-bold text-orange-600">{record.temperature}°C</p>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">AI Assessment</p>
                    <p className="text-sm italic bg-blue-50 p-3 rounded border border-blue-100">{record.diagnosis}</p>
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