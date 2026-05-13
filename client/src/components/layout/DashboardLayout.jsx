import React from 'react';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tighter text-primary-foreground">
            HHPP <span className="text-primary font-light">Triage</span>
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <div className="p-3 bg-primary/10 text-primary rounded-lg font-medium cursor-pointer">
            New Assessment
          </div>
          <div className="p-3 text-slate-400 hover:text-white transition-colors cursor-pointer">
            Patient History
          </div>
          <div className="p-3 text-slate-400 hover:text-white transition-colors cursor-pointer">
            Settings
          </div>
        </nav>
        <div className="p-6 text-xs text-slate-500 border-t border-slate-800">
          Heart, Hustle, Passion, Purpose
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8">
          <div className="text-sm font-medium text-slate-500 italic">
            "Your purpose is to serve through technology."
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
              AS
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;