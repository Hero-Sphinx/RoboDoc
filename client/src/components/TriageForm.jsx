import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

// Utility to generate unique IDs
const generateMedicalID = (name) => {
  if (!name || name.length < 2) return "XX0000000";
  const prefix = name.substring(0, 2).toUpperCase();
  const numbers = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix}${numbers}`;
};

function TriageForm() {
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    patient: '',
    age: '',
    gender: 'Other',
    heartRate: '',
    bloodPressure: '',
    temperature: '',
    symptoms: '',
    medications: '',
    history: '',
    urgency: 'normal'
  })

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleTriage = async () => {
    if (!formData.symptoms || !formData.patient) {
      return toast({
        variant: "destructive",
        title: "Incomplete Form",
        description: "Please provide at least a name and symptoms.",
      })
    }

    setLoading(true)
    setResult(null)

    const medID = generateMedicalID(formData.patient);

    try {
      // UPDATED URL TO MATCH NEW BACKEND ROUTE
      const response = await fetch('http://localhost:5000/api/triage/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, medical_id: medID }),
      })

      const data = await response.json()
      setResult(data.diagnosis || "AI failed to generate a response.")

      toast({
        title: "Assessment Saved",
        description: `ID: ${medID} stored for ${formData.patient}.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "The backend server is not responding.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 pb-20">
      <Card className="border-t-4 border-primary shadow-lg bg-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">New Triage Entry</CardTitle>
              <CardDescription>Input clinical data for priority analysis.</CardDescription>
            </div>
            <Badge variant={loading ? "outline" : "secondary"}>
              {loading ? "AI Processing..." : "System Ready"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Patient Name</label>
              <Input value={formData.patient} onChange={(e) => handleChange('patient', e.target.value)} placeholder="Full Name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Age</label>
              <Input type="number" value={formData.age} onChange={(e) => handleChange('age', e.target.value)} placeholder="Years" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Gender</label>
              <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vitals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-red-600">Heart Rate (BPM)</label>
              <Input value={formData.heartRate} onChange={(e) => handleChange('heartRate', e.target.value)} placeholder="e.g. 75" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-blue-600">Blood Pressure</label>
              <Input value={formData.bloodPressure} onChange={(e) => handleChange('bloodPressure', e.target.value)} placeholder="120/80" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-orange-600">Temp (°C)</label>
              <Input type="number" step="0.1" value={formData.temperature} onChange={(e) => handleChange('temperature', e.target.value)} placeholder="36.6" />
            </div>
          </div>

          {/* Clinical Details */}
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Medical History</label>
                <Textarea value={formData.history} onChange={(e) => handleChange('history', e.target.value)} placeholder="Relevant history..." className="h-24" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-purple-600">Current Medications</label>
                <Textarea value={formData.medications} onChange={(e) => handleChange('medications', e.target.value)} placeholder="List meds..." className="h-24" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Current Symptoms</label>
              <Textarea value={formData.symptoms} onChange={(e) => handleChange('symptoms', e.target.value)} placeholder="Patient complaints..." className="h-24" />
            </div>
          </div>

          <Button onClick={handleTriage} disabled={loading} className="w-full h-14 text-xl font-bold">
            {loading ? "Generating Medical Report..." : "Submit to AI Portal"}
          </Button>
        </CardContent>
      </Card>

      {/* Result Display */}
      {result && (
        <Card className="bg-blue-50 border-blue-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle className="text-blue-800 text-sm font-black uppercase tracking-widest">AI Clinical Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-6 rounded-lg border text-slate-800 whitespace-pre-wrap text-lg leading-relaxed font-medium">
              {result}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default TriageForm;