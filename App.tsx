
import React, { useState, useEffect } from 'react';
import { User } from './types';
import { db } from './services/database';
import Sidebar from './components/Sidebar';
import DashboardPortal from './components/DashboardPortal';
import NotificationPortal from './components/NotificationPortal';
import AdminPortal from './components/AdminPortal';
import OLTDetailsPortal from './components/OLTDetailsPortal';
import DatabasePortal from './components/DatabasePortal';
import { Menu, Wifi } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Fetch users from DB
    const users = db.getUsers();
    const foundUser = users.find(u => u.email.toLowerCase() === emailInput.toLowerCase() && u.active);
    
    if (foundUser) {
      setUser(foundUser);
      setLoginError('');
      // Update last login in DB
      const updatedUser = { ...foundUser, lastLogin: new Date().toLocaleString() };
      db.saveUser(updatedUser);
      setUser(updatedUser);

      if(foundUser.role === 'USER') setActiveTab('dashboard'); 
    } else {
      setLoginError('Invalid email or account inactive.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setEmailInput('');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-red-700 p-8 text-center">
            <div className="inline-flex bg-white/20 p-4 rounded-full mb-4">
               <Wifi className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">DishHome Fiber Net</h1>
            <p className="text-red-100 mt-2 text-sm">Notification Dashboard Portal</p>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Login Email</label>
                <input 
                  type="email" 
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="admin@dishhome.com.np"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                />
              </div>
              {loginError && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{loginError}</p>}
              
              <button type="submit" className="w-full bg-gray-900 text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20">
                Secure Login
              </button>
            </form>
            
            <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
              <p>Demo accounts:</p>
              <p>admin@dishhome.com.np (Admin)</p>
              <p>support@dishhome.com.np (User)</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between lg:hidden shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-red-600 p-1.5 rounded-lg">
                 <Wifi className="w-5 h-5 text-white" />
             </div>
             <span className="font-bold text-gray-800">Fiber Net</span>
          </div>
          <button onClick={() => setIsMobileOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardPortal />}
            
            {activeTab === 'notifications' && (
              <NotificationPortal 
                userRole={user.role} 
                canCreate={!!user.permissions.canCreateNotifications} 
              />
            )}

            {activeTab === 'olt-details' && (
              <OLTDetailsPortal
                userRole={user.role}
                canManage={!!user.permissions.canManageOLTs}
              />
            )}
            
            {activeTab === 'admin' && <AdminPortal currentUser={user} />}
            
            {activeTab === 'database' && <DatabasePortal />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
