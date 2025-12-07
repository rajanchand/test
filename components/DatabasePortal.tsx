
import React, { useState } from 'react';
import { db } from '../services/database';
import { Database, Download, RefreshCw, Trash2, HardDrive, CheckCircle } from 'lucide-react';

const DatabasePortal: React.FC = () => {
  const [stats, setStats] = useState(db.getStats());
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'olts' | 'notifications'>('stats');

  const refreshStats = () => {
    setStats(db.getStats());
  };

  const handleBackup = () => {
    const backup = db.getFullBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dishhome_db_backup_${new Date().toISOString()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    if (confirm('WARNING: This will delete ALL data and restore default mock data. This cannot be undone. Are you sure?')) {
      db.resetDatabase();
      refreshStats();
      alert('Database reset successful.');
      window.location.reload(); // Reload to reflect changes
    }
  };

  const renderJsonView = (data: any[]) => (
    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
      <pre className="text-xs text-green-400 font-mono">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Database className="w-6 h-6 text-gray-600" />
            System Database
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage system records, backups, and persistence.</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={handleReset}
             className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
           >
             <Trash2 className="w-4 h-4" />
             Reset DB
           </button>
           <button 
             onClick={handleBackup}
             className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm"
           >
             <Download className="w-4 h-4" />
             Download DB Link
           </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
               <HardDrive className="w-6 h-6 text-green-600" />
            </div>
            <div>
               <h3 className="font-bold text-gray-800">Connection Status</h3>
               <p className="text-sm text-gray-500 flex items-center gap-1">
                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                 Connected to Local Storage Provider
               </p>
            </div>
         </div>
         <div className="text-right">
            <p className="text-xs text-gray-400">Last Synced</p>
            <p className="font-mono text-sm text-gray-700">{stats.lastBackup}</p>
         </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['stats', 'users', 'olts', 'notifications'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                 activeTab === tab
                   ? 'border-red-500 text-red-600'
                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
               }`}
             >
               {tab}
             </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
         {activeTab === 'stats' && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-gray-50 rounded-xl text-center">
                 <h4 className="text-gray-500 text-sm font-medium mb-2">Total Users</h4>
                 <p className="text-4xl font-bold text-gray-800">{stats.users}</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-xl text-center">
                 <h4 className="text-gray-500 text-sm font-medium mb-2">Total OLT Records</h4>
                 <p className="text-4xl font-bold text-gray-800">{stats.olts}</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-xl text-center">
                 <h4 className="text-gray-500 text-sm font-medium mb-2">Total Logged Notifications</h4>
                 <p className="text-4xl font-bold text-gray-800">{stats.notifications}</p>
              </div>
           </div>
         )}
         
         {activeTab === 'users' && (
            <div>
               <h3 className="font-bold text-gray-800 mb-4">Raw User Data (JSON)</h3>
               {renderJsonView(db.getUsers())}
            </div>
         )}
         
         {activeTab === 'olts' && (
            <div>
               <h3 className="font-bold text-gray-800 mb-4">Raw OLT Inventory (JSON)</h3>
               {renderJsonView(db.getOLTs())}
            </div>
         )}
         
         {activeTab === 'notifications' && (
            <div>
               <h3 className="font-bold text-gray-800 mb-4">Raw Notification Logs (JSON)</h3>
               {renderJsonView(db.getNotifications())}
            </div>
         )}
      </div>
    </div>
  );
};

export default DatabasePortal;
