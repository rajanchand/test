import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { db } from '../services/database';
import { User as UserIcon, Shield, Clock, Edit2, Trash2, Plus, X } from 'lucide-react';

interface AdminPortalProps {
  currentUser: User;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Simple state for the form - in a real app this would be more robust
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '', email: '', role: 'USER', active: true
  });

  useEffect(() => {
    setUsers(db.getUsers());
  }, []);

  if (currentUser.role === 'USER') {
    return (
      <div className="flex items-center justify-center h-[50vh] text-gray-500 flex-col">
        <Shield className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Access Denied</h2>
        <p>You do not have permission to view this portal.</p>
      </div>
    );
  }

  const handleDelete = (id: string) => {
    if (id === currentUser.id) {
      alert("You cannot delete yourself.");
      return;
    }
    if (confirm('Delete this user?')) {
      const updated = db.deleteUser(id);
      setUsers(updated);
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate ID gen
    const u: User = {
        id: `u${Date.now()}`,
        name: newUser.name!,
        email: newUser.email!,
        role: newUser.role as Role,
        lastLogin: 'Never',
        active: true,
        permissions: {
            canViewDashboard: true,
            canViewNotifications: true,
            canManageUsers: newUser.role === 'SUPER_ADMIN' || newUser.role === 'ADMIN',
            canCreateNotifications: newUser.role === 'SUPER_ADMIN' || newUser.role === 'ADMIN',
            canManageOLTs: newUser.role === 'SUPER_ADMIN' || newUser.role === 'ADMIN',
        }
    };
    
    const updated = db.saveUser(u);
    setUsers(updated);
    setIsModalOpen(false);
    setNewUser({ name: '', email: '', role: 'USER', active: true });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage system access and permissions</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {user.lastLogin}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${user.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    {user.active ? 'Active' : 'Inactive'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                         <Edit2 className="w-4 h-4" />
                       </button>
                       <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

       {/* Add User Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Create New User</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-red-500"
                    value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input required type="email" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-red-500"
                    value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-red-500"
                    value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as Role})}>
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
               </div>
               <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition-colors">
                 Create Account
               </button>
            </form>
          </div>
        </div>
       )}
    </div>
  );
};

export default AdminPortal;