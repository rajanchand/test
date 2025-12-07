
import React, { useState, useEffect } from 'react';
import { NotificationData, Role } from '../types';
import { db } from '../services/database';
import { Bell, AlertTriangle, CheckCircle, Clock, Trash2, Download, Plus, X, Wand2, Edit, FileSpreadsheet, UserCheck } from 'lucide-react';
import { generateNotificationDraft } from '../services/geminiService';

interface NotificationPortalProps {
  userRole: Role;
  canCreate: boolean;
}

const NotificationPortal: React.FC<NotificationPortalProps> = ({ userRole, canCreate }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load from DB
  useEffect(() => {
    setNotifications(db.getNotifications());
  }, []);

  // Form State
  const [formData, setFormData] = useState<any>({
    title: '',
    mastersDownCount: 0,
    affectedMasters: '',
    oltsDownCount: 0,
    downOltsList: '',
    impactedCustomers: 0,
    reason: '',
    estimatedTime: '',
    status: 'WARNING'
  });

  const resetForm = () => {
    setFormData({
      title: '', mastersDownCount: 0, affectedMasters: '', oltsDownCount: 0, 
      downOltsList: '', impactedCustomers: 0, reason: '', estimatedTime: '', status: 'WARNING'
    });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      const updated = db.deleteNotification(id);
      setNotifications(updated);
    }
  };

  const handleEdit = (n: NotificationData) => {
    setFormData({
      title: n.title,
      mastersDownCount: n.mastersDownCount,
      affectedMasters: n.affectedMasters.join(', '),
      oltsDownCount: n.oltsDownCount,
      downOltsList: n.downOltsList.join(', '),
      impactedCustomers: n.impactedCustomers,
      reason: n.reason,
      estimatedTime: n.estimatedTime,
      status: n.status
    });
    setEditingId(n.id);
    setShowForm(true);
  };

  const handleDownload = (n: NotificationData) => {
    alert(`Downloading Report for: ${n.title}\nFormat: PDF`);
  };

  const handleExportLogs = () => {
    // Generate CSV Header
    const headers = [
      "Notification ID", "Title / Area", "Current Status", 
      "Investigation Started (Down Time)", "Maintenance Started", 
      "Resolved Time", "Masters Down", "OLTs Down", 
      "Impacted Customers", "Reason", "Notified Staff"
    ];

    // Generate CSV Rows
    const rows = notifications.map(n => [
      n.id,
      `"${n.title.replace(/"/g, '""')}"`, // Escape quotes
      n.status,
      `"${n.alertTime}"`,
      `"${n.maintenanceStartTime || 'N/A'}"`,
      `"${n.resolvedTime || 'N/A'}"`,
      n.mastersDownCount,
      n.oltsDownCount,
      n.impactedCustomers,
      `"${n.reason.replace(/"/g, '""')}"`,
      `"${(n.notifiedPersons || []).join(', ')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create Download Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `system_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAiDraft = async () => {
    if (!formData.reason || !formData.title) {
      alert("Please enter a Title (Area) and Reason first to generate a draft.");
      return;
    }
    setIsGenerating(true);
    const draft = await generateNotificationDraft(
      formData.reason, 
      formData.title, // Using title as area proxy
      formData.estimatedTime || "Unknown"
    );
    setFormData((prev: any) => ({...prev, reason: `${prev.reason}\n\n[AI Draft]: ${draft}`}));
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toLocaleString();
    
    const affectedMastersArray = typeof formData.affectedMasters === 'string' 
      ? formData.affectedMasters.split(',').map((s: string) => s.trim()).filter(Boolean) 
      : [];
      
    const downOltsArray = typeof formData.downOltsList === 'string'
      ? formData.downOltsList.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    // --- LOOKUP RESPONSIBLE PERSONS ---
    const allOlts = db.getOLTs();
    const responsiblePersons = new Set<string>();
    
    downOltsArray.forEach((downOltCode: string) => {
        // Case insensitive match for OLT Code
        const match = allOlts.find(o => o.oltCode.toLowerCase() === downOltCode.toLowerCase());
        if (match && match.responsiblePerson) {
            responsiblePersons.add(match.responsiblePerson);
        }
    });
    const notifiedList = Array.from(responsiblePersons);

    let notificationToSave: NotificationData;

    if (editingId) {
      const existing = notifications.find(n => n.id === editingId);
      if (!existing) return;

      // Logic to update timestamps based on status change
      let maintenanceStart = existing.maintenanceStartTime;
      let resolved = existing.resolvedTime;

      // If moving to RUNNING (Maintenance) for the first time
      if (formData.status === 'RUNNING' && existing.status !== 'RUNNING' && !maintenanceStart) {
        maintenanceStart = now;
      }
      // If moving to COMPLETED (Resolved)
      if (formData.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
        resolved = now;
      }

      notificationToSave = {
        ...existing,
        title: formData.title,
        mastersDownCount: Number(formData.mastersDownCount),
        affectedMasters: affectedMastersArray,
        oltsDownCount: Number(formData.oltsDownCount),
        downOltsList: downOltsArray,
        impactedCustomers: Number(formData.impactedCustomers),
        reason: formData.reason,
        estimatedTime: formData.estimatedTime,
        status: formData.status as any,
        maintenanceStartTime: maintenanceStart,
        resolvedTime: resolved,
        notifiedPersons: notifiedList.length > 0 ? notifiedList : existing.notifiedPersons
      };
    } else {
      notificationToSave = {
        id: Date.now().toString(),
        title: formData.title || 'Untitled Outage',
        mastersDownCount: Number(formData.mastersDownCount),
        affectedMasters: affectedMastersArray,
        oltsDownCount: Number(formData.oltsDownCount),
        downOltsList: downOltsArray,
        impactedCustomers: Number(formData.impactedCustomers),
        reason: formData.reason || '',
        estimatedTime: formData.estimatedTime || 'Unknown',
        alertTime: now,
        status: (formData.status as any) || 'WARNING',
        createdBy: userRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin',
        notifiedPersons: notifiedList
      };
    }

    // Save to DB and update state
    const updatedList = db.saveNotification(notificationToSave);
    setNotifications(updatedList);

    if (notifiedList.length > 0) {
        alert(`Alert Created. Notifications sent to responsible staff: \n${notifiedList.join(', ')}`);
    }

    setShowForm(false);
    resetForm();
  };

  const handleClose = () => {
    setShowForm(false);
    resetForm();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">System Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">Live updates on network status and downtime</p>
        </div>
        <div className="flex items-center gap-2">
           {/* Export Logs Button for Admin/Super Admin */}
           {canCreate && (
            <button 
              onClick={handleExportLogs}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg transition-colors shadow-sm text-sm"
              title="Download All Logs to CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Master Log
            </button>
           )}
           {canCreate && (
            <button 
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm text-sm"
            >
              <Plus className="w-4 h-4" />
              Create Alert
            </button>
           )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Alert & Update Status' : 'Broadcast New Alert'}</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alert Title / Area</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none" 
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Fiber Cut in Bhaktapur" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Masters Down (Count)</label>
                  <input type="number" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none" 
                    value={formData.mastersDownCount} onChange={e => setFormData({...formData, mastersDownCount: Number(e.target.value)})} />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OLTs Down (Count)</label>
                  <input type="number" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none" 
                    value={formData.oltsDownCount} onChange={e => setFormData({...formData, oltsDownCount: Number(e.target.value)})} />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Affected Masters (Comma separated)</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none" 
                    value={formData.affectedMasters}
                    onChange={e => setFormData({...formData, affectedMasters: e.target.value})} placeholder="Core-01, Core-02" />
                </div>

                <div className="col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Down OLTs (Comma separated)</label>
                   <input type="text" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none" 
                    value={formData.downOltsList}
                    onChange={e => setFormData({...formData, downOltsList: e.target.value})} placeholder="KTM-OLT-01, BKT-OLT-05" />
                   <p className="text-xs text-gray-500 mt-1">Responsible persons for these OLTs will be auto-notified if found in OLT Database.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Impacted Customers</label>
                  <input type="number" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none" 
                    value={formData.impactedCustomers} onChange={e => setFormData({...formData, impactedCustomers: Number(e.target.value)})} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Resolution</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none" 
                    value={formData.estimatedTime} onChange={e => setFormData({...formData, estimatedTime: e.target.value})} placeholder="e.g. 2 Hours" />
                </div>
                
                <div className="col-span-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-bold text-gray-800 mb-2">Workflow Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, status: 'WARNING'})}
                      className={`py-2 px-3 rounded-md text-sm font-medium transition-all ${
                        formData.status === 'WARNING' 
                        ? 'bg-red-600 text-white shadow-md' 
                        : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 inline-block mr-1" />
                      Investigate
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, status: 'RUNNING'})}
                      className={`py-2 px-3 rounded-md text-sm font-medium transition-all ${
                        formData.status === 'RUNNING' 
                        ? 'bg-yellow-500 text-white shadow-md' 
                        : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Clock className="w-4 h-4 inline-block mr-1" />
                      Maintenance
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, status: 'COMPLETED'})}
                      className={`py-2 px-3 rounded-md text-sm font-medium transition-all ${
                        formData.status === 'COMPLETED' 
                        ? 'bg-green-600 text-white shadow-md' 
                        : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4 inline-block mr-1" />
                      Resolved
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Changing status will automatically log the timestamp for that stage.
                  </p>
                </div>

                <div className="col-span-2">
                   <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Detailed Reason</label>
                    <button type="button" onClick={handleAiDraft} disabled={isGenerating} 
                      className="text-xs flex items-center text-purple-600 hover:text-purple-800 font-medium">
                      <Wand2 className="w-3 h-3 mr-1" />
                      {isGenerating ? 'Drafting...' : 'AI Assist'}
                    </button>
                   </div>
                   <textarea rows={3} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none" 
                    value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="Cause of outage..." />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={handleClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md transition-colors">
                  {editingId ? 'Update & Log' : 'Broadcast Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification List */}
      <div className="grid gap-6">
        {notifications.map((notification) => (
          <div key={notification.id} className={`relative bg-white rounded-xl shadow-sm border-l-4 overflow-hidden transition-all hover:shadow-md ${
            notification.status === 'WARNING' ? 'border-red-500' : 
            notification.status === 'RUNNING' ? 'border-yellow-500' : 'border-green-500'
          }`}>
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full shrink-0 ${
                     notification.status === 'WARNING' ? 'bg-red-100 text-red-600' : 
                     notification.status === 'RUNNING' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {notification.status === 'WARNING' ? <AlertTriangle className="w-6 h-6" /> :
                     notification.status === 'RUNNING' ? <Clock className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-800">{notification.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        notification.status === 'WARNING' ? 'bg-red-50 border-red-200 text-red-700' : 
                        notification.status === 'RUNNING' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-green-50 border-green-200 text-green-700'
                      }`}>
                        {notification.status === 'WARNING' ? 'Investigation' : 
                         notification.status === 'RUNNING' ? 'Maintenance' : 'Resolved'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3 text-sm">{notification.reason}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-8 text-sm text-gray-500">
                       <div>
                         <span className="font-semibold block text-gray-700">Down Time</span>
                         {notification.alertTime}
                       </div>
                       {notification.maintenanceStartTime && (
                         <div>
                           <span className="font-semibold block text-gray-700">Maint. Start</span>
                           {notification.maintenanceStartTime}
                         </div>
                       )}
                       {notification.resolvedTime && (
                         <div>
                           <span className="font-semibold block text-gray-700">Resolved At</span>
                           {notification.resolvedTime}
                         </div>
                       )}
                       {!notification.resolvedTime && (
                         <div>
                           <span className="font-semibold block text-gray-700">Est. Resolution</span>
                           {notification.estimatedTime}
                         </div>
                       )}
                       <div>
                         <span className="font-semibold block text-gray-700">Impacted Users</span>
                         {notification.impactedCustomers.toLocaleString()}
                       </div>
                    </div>

                    {/* Display Notified Staff */}
                    {notification.notifiedPersons && notification.notifiedPersons.length > 0 && (
                        <div className="mt-3 flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                            <UserCheck className="w-4 h-4 text-green-600 mt-0.5" />
                            <div>
                                <span className="font-semibold text-gray-700">Alert Sent To: </span>
                                {notification.notifiedPersons.join(', ')}
                            </div>
                        </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start mt-2 md:mt-0">
                  <button 
                    onClick={() => handleDownload(notification)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download Report">
                    <Download className="w-5 h-5" />
                  </button>
                  {canCreate && (
                    <>
                      <button 
                        onClick={() => handleEdit(notification)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Edit Notification">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(notification.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Notification">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            {notification.status === 'WARNING' && (
              <div className="bg-red-50 px-6 py-2 text-xs font-medium text-red-800 flex items-center justify-center animate-pulse">
                Critical Alert: Investigation in progress
              </div>
            )}
            {notification.status === 'RUNNING' && (
              <div className="bg-yellow-50 px-6 py-2 text-xs font-medium text-yellow-800 flex items-center justify-center">
                Maintenance in progress: Expect intermittent connectivity
              </div>
            )}
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-500 font-medium">No active notifications</h3>
            <p className="text-gray-400 text-sm">Everything is running smoothly.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPortal;
