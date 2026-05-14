import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PatientHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/triage/history')
      .then(res => res.json())
      .then(data => {
        setRecords(data);
        setLoading(false);
      })
      .catch(err => console.error("Error:", err));
  }, []);

  if (loading) return <div className="p-10 text-center font-bold">Accessing Patient Database...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">Clinical History Portal</h2>
          <p className="text-slate-500 text-sm mt-1">Reviewing active and past triage assessments</p>
        </div>
        <div className="text-right">
          <Badge variant="outline" className="text-xs">{records.length} Total Records</Badge>
        </div>
      </div>

      <div className="grid gap-6">
        {records.map((record) => (
          <Card 
            key={record.id} 
            className={`transition-all shadow-sm ${
              record.urgency === 'high' 
                ? 'border-l-8 border-l-red-600 border-red-100 bg-red-50/30' 
                : 'border-l-8 border-l-blue-600'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-xl text-slate-900">{record.patient}</span>
                    <Badge variant="outline" className="bg-white font-mono text-xs">{record.medical_id}</Badge>
                  </div>
                  <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">
                    {new Date(record.createdAt).toLocaleString()} | {record.age} Y/O | {record.gender}
                  </p>
                </div>
                
                {/* DYNAMIC BADGE COLOR */}
                <Badge className={`px-4 py-1 text-xs font-black shadow-sm ${
                  record.urgency === 'high' 
                    ? 'bg-red-600 text-white animate-pulse' 
                    : 'bg-emerald-600 text-white'
                }`}>
                  {record.urgency === 'high' ? '⚠️ EMERGENCY' : 'NORMAL'}
                </Badge>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/60 p-4 rounded-lg border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Patient Symptoms</p>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">{record.symptoms}</p>
                </div>
                
                <div className="bg-white/60 p-4 rounded-lg border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Vitals Dashboard</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-red-600">{record.heartRate}</span>
                      <span className="text-[9px] text-slate-400 uppercase">BPM</span>
                    </div>
                    <div className="flex flex-col border-x">
                      <span className="text-xs font-bold text-blue-600">{record.bloodPressure}</span>
                      <span className="text-[9px] text-slate-400 uppercase">BP</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-orange-600">{record.temperature}°C</span>
                      <span className="text-[9px] text-slate-400 uppercase">Temp</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <p className="font-bold text-blue-900 text-[10px] uppercase tracking-tighter">AI Clinical Insight</p>
                </div>
                <p className="text-sm text-slate-600 italic leading-relaxed">
                  {record.diagnosis}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PatientHistory;