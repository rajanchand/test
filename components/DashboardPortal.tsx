
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Server, Users, Activity, AlertOctagon, Search, MapPin } from 'lucide-react';
import { User, OLTDetail } from '../types';
import { db } from '../services/database';

interface DashboardPortalProps {
  currentUser: User;
}

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between transition-transform hover:scale-105">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h3 className="text-3xl font-bold mt-2 text-gray-800">{value.toLocaleString()}</h3>
    </div>
    <div className={`p-4 rounded-full ${color} bg-opacity-10`}>
      <Icon className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
    </div>
  </div>
);

const DashboardPortal: React.FC<DashboardPortalProps> = ({ currentUser }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  // 1. Fetch OLTs from DB
  const allOLTs = db.getOLTs();

  // 2. Filter OLTs based on User Region
  const regionFilteredOLTs = useMemo(() => {
    if (!currentUser.region || currentUser.region === 'All') {
      return allOLTs;
    }
    return allOLTs.filter(olt => olt.region === currentUser.region);
  }, [allOLTs, currentUser.region]);

  // 3. Filter based on Search Term
  const displayOLTs = regionFilteredOLTs.filter(olt => 
    olt.podName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    olt.masterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    olt.oltCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 4. Calculate Stats dynamically based on filtered data
  const stats = useMemo(() => {
    const total = regionFilteredOLTs.length;
    // Mock customer count per OLT since Detail doesn't have it, we randomize slightly for "realism" or use average
    const totalCustomers = regionFilteredOLTs.length * 850; 
    const active = regionFilteredOLTs.filter(o => o.status === 'ACTIVE').length;
    const inactive = regionFilteredOLTs.filter(o => o.status === 'INACTIVE' || o.status === 'MAINTENANCE').length;
    
    // Region Distribution
    const regionMap = new Map<string, number>();
    regionFilteredOLTs.forEach(o => {
      const count = regionMap.get(o.region) || 0;
      regionMap.set(o.region, count + 1);
    });
    const regionDistribution = Array.from(regionMap.entries()).map(([name, count]) => ({ name, count }));

    return { total, totalCustomers, active, inactive, regionDistribution };
  }, [regionFilteredOLTs]);

  const userRegionLabel = currentUser.region && currentUser.region !== 'All' ? currentUser.region : 'All Regions';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Network Overview</h1>
          <div className="flex items-center gap-2 mt-1">
             <p className="text-gray-500 text-sm">Real-time stats from DishHome Fiber Net</p>
             <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs border border-gray-200 flex items-center gap-1">
               <MapPin className="w-3 h-3" /> {userRegionLabel}
             </span>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 mr-2 bg-green-500 rounded-full animate-pulse"></span>
            System Operational
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total OLTs" value={stats.total} icon={Server} color="bg-blue-500" />
        <StatCard title="Est. Customers" value={stats.totalCustomers} icon={Users} color="bg-green-500" />
        <StatCard title="Active OLTs" value={stats.active} icon={Activity} color="bg-indigo-500" />
        <StatCard title="Issues / Inactive" value={stats.inactive} icon={AlertOctagon} color="bg-red-500" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Region-wise OLT Distribution</h3>
          <div className="h-64">
             {stats.regionDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.regionDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f3f4f6'}} />
                    <Bar dataKey="count" fill="#dc2626" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
                </ResponsiveContainer>
             ) : (
                 <div className="h-full flex items-center justify-center text-gray-400 text-sm">No Data available for chart</div>
             )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
           <h3 className="text-lg font-semibold text-gray-800 mb-4 self-start">Network Health</h3>
           <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Active', value: stats.active },
                    { name: 'Inactive', value: stats.inactive }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
           </div>
           <div className="flex gap-4 text-sm">
              <div className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>Active</div>
              <div className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>Inactive</div>
           </div>
        </div>
      </div>

      {/* POD List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-800">Master POD List ({userRegionLabel})</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text"
              placeholder="Search Master or OLT..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">OLT Name</th>
                <th className="px-6 py-4">Master Name</th>
                <th className="px-6 py-4">Region</th>
                <th className="px-6 py-4">Responsible</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayOLTs.map((pod) => (
                <tr key={pod.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{pod.oltCode || pod.podName}</td>
                  <td className="px-6 py-4">{pod.masterName}</td>
                  <td className="px-6 py-4">{pod.region}</td>
                  <td className="px-6 py-4">{pod.responsiblePerson}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      pod.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {pod.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayOLTs.length === 0 && (
            <div className="p-8 text-center text-gray-500">No OLTs found matching your search criteria.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPortal;
