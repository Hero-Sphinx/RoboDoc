import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, LogIn, Search, ClipboardPlus } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl mb-2">
            <Stethoscope className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">HHPP Triage Portal</h1>
          <p className="text-slate-500 text-sm">Heart, Hustle, Passion, Purpose</p>
        </div>

        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-md">
          <CardContent className="p-6 space-y-3">
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="w-full h-14 text-base font-semibold border-slate-300"
            >
              <LogIn className="mr-2 h-5 w-5" /> I'm a Doctor — Log In
            </Button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-slate-400 uppercase tracking-wide">Or, as a patient</span>
              </div>
            </div>

            <Button
              onClick={() => navigate('/queue')}
              className="w-full h-14 text-base font-semibold bg-blue-600 hover:bg-blue-700"
            >
              <Search className="mr-2 h-5 w-5" /> Check My Queue Position
            </Button>

            <Button
              onClick={() => navigate('/triage')}
              variant="secondary"
              className="w-full h-14 text-base font-semibold"
            >
              <ClipboardPlus className="mr-2 h-5 w-5" /> New Patient — Start Assessment
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-slate-400 uppercase tracking-tighter">
          Health & Hospital Privacy Protocol (HHPP) v2.0
        </p>
      </div>
    </div>
  );
};

export default Landing;
