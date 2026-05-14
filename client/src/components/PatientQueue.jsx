import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, Users, Clock, CheckCircle, FileText } from "lucide-react";

const socket = io('http://localhost:5000');

const PatientQueue = () => {
  const [medicalId, setMedicalId] = useState("");
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStatus = async (e) => {
    if (e) e.preventDefault();
    if (!medicalId) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:5000/api/triage/public/status/${medicalId}`);
      const data = await res.json();
      
      if (res.ok) {
        setStatusData(data);
      } else {
        setError(data.error || "ID not found. Please check and try again.");
        setStatusData(null);
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!statusData || !statusData.recordData) return;
    const record = statusData.recordData;
    const doc = new jsPDF();
    
    // 1. Header styling
    doc.setFillColor(37, 99, 235); // Blue-600
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("HHPP CLINICAL REPORT", 105, 25, { align: "center" });
    
    // 2. Patient & Meta Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Patient: ${record.patient}`, 14, 50);
    doc.text(`Medical ID: ${record.medical_id}`, 14, 56);
    doc.text(`Date: ${new Date(record.createdAt).toLocaleDateString()}`, 140, 50);
    doc.text(`Attending: Dr. ${record.seenBy || 'Staff'}`, 140, 56);

    // 3. Vitals & Data Table
    autoTable(doc, {
      startY: 65,
      head: [['Assessment Metric', 'Details']],
      body: [
        ['Status', record.status],
        ['Urgency Level', record.urgency.toUpperCase()],
        ['Primary Symptoms', record.symptoms],
        ['Vitals Check', `Temp: ${record.temperature}°C | HR: ${record.heartRate} BPM | BP: ${record.bloodPressure}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }
    });

    let currentY = doc.lastAutoTable.finalY + 15;

    // 4. AI Preliminary Analysis
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("AI Preliminary Analysis:", 14, currentY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const aiText = record.diagnosis || "Analysis pending...";
    const splitAi = doc.splitTextToSize(aiText, 180);
    doc.text(splitAi, 14, currentY + 8);
    
    // Dynamically calculate next Y position based on AI text length
    currentY += (splitAi.length * 5) + 15;

    // 5. OFFICIAL PHYSICIAN'S NOTES (Human Input)
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.rect(12, currentY - 7, 186, 45); // Decorative border for doctor notes

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Physician's Official Notes:", 18, currentY);
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    
    // Placeholder logic for Human Doctor notes
    const physNote = record.doctorNotes 
      ? record.doctorNotes 
      : "The physician has not added additional specific comments yet. Please consult the attending staff if you have questions.";
    
    const splitNote = doc.splitTextToSize(physNote, 175);
    doc.text(splitNote, 18, currentY + 10);

    // 6. Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("This document is a confidential digital triage record generated via HHPP v2.0", 105, 285, { align: "center" });

    doc.save(`Clinical_Report_${record.medical_id}.pdf`);
  };

  useEffect(() => {
    socket.on('patient_updated', (updatedRecord) => {
      if (statusData && updatedRecord.medical_id === medicalId) {
        fetchStatus();
      }
    });
    return () => socket.off('patient_updated');
  }, [statusData, medicalId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl mb-2">
            <Users className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">HHPP Patient Portal</h1>
          <p className="text-slate-500 text-sm">Check your live triage status & queue position</p>
        </div>

        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-md">
          <CardContent className="p-6">
            <form onSubmit={fetchStatus} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Enter Medical ID (e.g. PA-12345)" 
                  className="pl-10 h-12 text-lg border-slate-200 focus:ring-blue-500"
                  value={medicalId}
                  onChange={(e) => setMedicalId(e.target.value.toUpperCase())}
                />
              </div>
              <Button 
                disabled={loading} 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg font-semibold transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Check My Status"}
              </Button>
            </form>
            {error && (
              <p className="mt-4 text-center text-sm font-medium text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        {statusData && (
          <Card className="border-none shadow-2xl bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`h-2 ${statusData.status === 'Seen' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
            <CardContent className="p-8 text-center space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Patient Name</p>
                <h2 className="text-2xl font-bold text-slate-800">{statusData.patientName}</h2>
              </div>

              <div className="flex justify-center gap-8 py-4">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mx-auto mb-2">
                    <Clock className="text-slate-600 w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                  <p className="font-bold text-slate-700">{statusData.status}</p>
                </div>

                <div className="text-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-2 ${statusData.position === 0 ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                    {statusData.position === 0 ? <CheckCircle className="text-emerald-600 w-6 h-6" /> : <Users className="text-blue-600 w-6 h-6" />}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Position</p>
                  <p className={`font-black text-xl ${statusData.position === 0 ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {statusData.position === 0 ? "READY" : `#${statusData.position}`}
                  </p>
                </div>
              </div>

              {statusData.status === 'Pending' ? (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm text-blue-700 leading-relaxed">
                    Please stay in the waiting area. A physician will call your ID <strong>{medicalId}</strong> shortly.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <p className="text-sm text-emerald-700 font-medium">
                      The doctor has completed your assessment.
                    </p>
                  </div>
                  <Button 
                    onClick={downloadReport}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <FileText className="mr-2 h-4 w-4" /> Download My Report (PDF)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <p className="text-center text-[10px] text-slate-400 uppercase tracking-tighter">
          Health & Hospital Privacy Protocol (HHPP) v2.0
        </p>
      </div>
    </div>
  );
};

export default PatientQueue;