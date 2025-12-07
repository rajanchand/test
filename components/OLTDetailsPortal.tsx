
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { OLTDetail, User } from '../types';
import { db } from '../services/database';
import { Search, Database, Plus, Upload, Trash2, FileSpreadsheet, X, Download, Edit, MapPin } from 'lucide-react';

interface OLTDetailsPortalProps {
  currentUser: User;
  canManage: boolean;
}

const OLTDetailsPortal: React.FC<OLTDetailsPortalProps> = ({ currentUser, canManage }) => {
  const [olts, setOlts] = useState<OLTDetail[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOlts(db.getOLTs());
  }, []);

  // Filter based on User Region
  const regionFilteredOLTs = useMemo(() => {
      if (!currentUser.region || currentUser.region === 'All') {
          return olts;
      }
      return olts.filter(o => o.region === currentUser.region);
  }, [olts, currentUser.region]);

  // Form State
  const [formData, setFormData] = useState<Partial<OLTDetail>>({
    vendorName: '',
    podName: '',
    oltCode: '',
    masterName: '',
    responsiblePerson: '',
    region: currentUser.region !== 'All' ? currentUser.region : 'Kathmandu',
    status: 'ACTIVE'
  });

  // Filter Logic (Search + Region)
  const filteredOLTs = regionFilteredOLTs.filter(olt => 
    olt.oltCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
    olt.masterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    olt.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
    olt.responsiblePerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this OLT record?')) {
      const updated = db.deleteOLT(id);
      setOlts(updated);
    }
  };

  const handleEdit = (olt: OLTDetail) => {
    setEditingId(olt.id);
    setFormData({
      vendorName: olt.vendorName,
      podName: olt.podName,
      oltCode: olt.oltCode,
      masterName: olt.masterName,
      responsiblePerson: olt.responsiblePerson,
      region: olt.region,
      status: olt.status || 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ 
        vendorName: '', podName: '', oltCode: '', masterName: '', responsiblePerson: '', 
        region: currentUser.region !== 'All' ? currentUser.region : 'Kathmandu', 
        status: 'ACTIVE' 
    });
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ 
        vendorName: '', podName: '', oltCode: '', masterName: '', responsiblePerson: '', 
        region: currentUser.region !== 'All' ? currentUser.region : 'Kathmandu', 
        status: 'ACTIVE' 
    });
    setIsModalOpen(true);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let newOLT: OLTDetail;

    if (editingId) {
      // Update existing record
      const existing = olts.find(o => o.id === editingId);
      if(!existing) return;
      newOLT = {
        ...existing,
        vendorName: formData.vendorName!,
        podName: formData.podName!,
        oltCode: formData.oltCode!,
        masterName: formData.masterName!,
        responsiblePerson: formData.responsiblePerson!,
        region: formData.region!,
        status: formData.status as 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
      };
    } else {
      // Create new record
      newOLT = {
        id: `olt_${Date.now()}`,
        vendorName: formData.vendorName!,
        podName: formData.podName!,
        oltCode: formData.oltCode!,
        masterName: formData.masterName!,
        responsiblePerson: formData.responsiblePerson!,
        region: formData.region!,
        status: formData.status as 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' || 'ACTIVE',
        addedAt: new Date().toISOString().split('T')[0]
      };
    }

    const updated = db.saveOLT(newOLT);
    setOlts(updated);
    handleCloseModal();
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      // Simple CSV Parse: Assumes headers: Vendor, POD, OLT Code, Master, Person, Region
      // Skip header row if it exists
      const lines = text.split('\n');
      const newEntries: OLTDetail[] = [];
      
      lines.forEach((line, index) => {
        const cleanLine = line.trim();
        if (!cleanLine) return; // Skip empty lines
        
        // Basic detection to skip header row containing "Vendor"
        if (index === 0 && cleanLine.toLowerCase().includes('vendor')) return;

        const cols = cleanLine.split(',');
        if (cols.length >= 6) {
          const importedRegion = cols[5].trim();
          
          // Security check: Don't allow importing data for other regions if user is restricted
          if (currentUser.region && currentUser.region !== 'All' && importedRegion !== currentUser.region) {
              console.warn(`Skipping record for ${importedRegion} due to permission restrictions.`);
              return; 
          }

          newEntries.push({
            id: `csv_${Date.now()}_${index}`,
            vendorName: cols[0].trim(),
            podName: cols[1].trim(),
            oltCode: cols[2].trim(),
            masterName: cols[3].trim(),
            responsiblePerson: cols[4].trim(),
            region: importedRegion,
            status: 'ACTIVE', // Default status for bulk import
            addedAt: new Date().toISOString().split('T')[0]
          });
        }
      });

      if (newEntries.length > 0) {
        const updated = db.bulkSaveOLTs(newEntries);
        setOlts(updated);
        alert(`Successfully imported ${newEntries.length} records from CSV.`);
      } else {
        alert("No valid records found or CSV format is incorrect (or permission denied for regions). Expected format: Vendor, POD Name, OLT Code, Master Name, Responsible Person, Region");
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
      const csvContent = "data:text/csv;charset=utf-8,Vendor Name,POD Name,OLT Code,Master Name,Responsible Person,Region\nHuawei,KTM-POD-99,KTM-TEST-01,KTM-CORE-01,John Doe,Kathmandu";
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "olt_upload_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'ACTIVE': return 'bg-green-500';
      case 'INACTIVE': return 'bg-red-500';
      case 'MAINTENANCE': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">OLT Details Database</h1>
          <div className="flex items-center gap-2">
            <p className="text-gray-500 text-sm mt-1">Master inventory of Optical Line Terminals</p>
             {currentUser.region && currentUser.region !== 'All' && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full border border-red-200">
                    Region: {currentUser.region}
                </span>
            )}
          </div>
        </div>
        
        {canManage && (
          <div className="flex items-center gap-3">
            <button 
              onClick={downloadTemplate}
              className="hidden md:flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 px-3 py-2"
              title="Download CSV Template"
            >
                <Download className="w-4 h-4" /> Template
            </button>
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef}
              onChange={handleCSVUpload} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add OLT
            </button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Search by OLT Code, Master Name, Region, or Responsible Person..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">OLT Code</th>
                <th className="px-6 py-4">Master Name</th>
                <th className="px-6 py-4">Region</th>
                <th className="px-6 py-4">POD Name</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Responsible Person</th>
                {canManage && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOLTs.map((olt) => (
                <tr key={olt.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-3">
                    <div 
                      className={`w-2.5 h-2.5 rounded-full ${getStatusColor(olt.status)}`} 
                      title={`Status: ${olt.status || 'ACTIVE'}`}
                    />
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-gray-400" />
                      {olt.oltCode}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{olt.masterName}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {olt.region}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{olt.podName}</td>
                  <td className="px-6 py-4 text-gray-600">{olt.vendorName}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                        {olt.responsiblePerson.charAt(0)}
                      </div>
                      {olt.responsiblePerson}
                    </div>
                  </td>
                  {canManage && (
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                         <button 
                          onClick={() => handleEdit(olt)}
                          className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                          title="Edit Record"
                         >
                           <Edit className="w-4 h-4" />
                         </button>
                         <button 
                          onClick={() => handleDelete(olt.id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete Record"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredOLTs.length === 0 && (
                 <tr>
                    <td colSpan={canManage ? 7 : 6} className="px-6 py-12 text-center text-gray-400">
                       <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                       <p>No OLT records found matching your search.</p>
                       {canManage && <p className="text-xs mt-2">Try importing a CSV file or adding a new record.</p>}
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex justify-between">
           <span>Total Records: {filteredOLTs.length}</span>
           <span>Last Updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Add/Edit OLT Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Edit OLT Record' : 'Add New OLT Record'}</h3>
              <button onClick={handleCloseModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                   <input required className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                     value={formData.vendorName} onChange={e => setFormData({...formData, vendorName: e.target.value})} placeholder="e.g. Huawei" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                   <select 
                     className={`w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-red-500 ${currentUser.region !== 'All' ? 'bg-gray-100' : ''}`}
                     value={formData.region} 
                     onChange={e => setFormData({...formData, region: e.target.value})}
                     disabled={currentUser.region !== 'All'} // Lock region for restricted users
                   >
                     <option value="">Select Region</option>
                     <option value="Kathmandu">Kathmandu</option>
                     <option value="Lalitpur">Lalitpur</option>
                     <option value="Bhaktapur">Bhaktapur</option>
                     <option value="Pokhara">Pokhara</option>
                     <option value="Chitwan">Chitwan</option>
                     <option value="Butwal">Butwal</option>
                     <option value="Other">Other</option>
                   </select>
                </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">OLT Code (Unique ID)</label>
                 <input required className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                   value={formData.oltCode} onChange={e => setFormData({...formData, oltCode: e.target.value})} placeholder="e.g. KTM-OLT-99" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Master Name</label>
                   <input required className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                     value={formData.masterName} onChange={e => setFormData({...formData, masterName: e.target.value})} placeholder="e.g. KTM-CORE-01" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">POD Name</label>
                   <input required className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                     value={formData.podName} onChange={e => setFormData({...formData, podName: e.target.value})} placeholder="e.g. KTM-POD-01" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsible Person</label>
                    <input required className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.responsiblePerson} onChange={e => setFormData({...formData, responsiblePerson: e.target.value})} placeholder="Full Name" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                   <select className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                     value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                     <option value="ACTIVE">Active</option>
                     <option value="INACTIVE">Inactive</option>
                     <option value="MAINTENANCE">Maintenance</option>
                   </select>
                </div>
              </div>

              <div className="pt-2">
                 <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition-colors">
                   {editingId ? 'Update Record' : 'Save Record'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OLTDetailsPortal;
