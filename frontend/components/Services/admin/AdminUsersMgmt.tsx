import React, { useState, useEffect } from 'react';
import { Role, User, RepairRequest, RepairRequestStatus } from '../../../types';
import { Icons } from '../../../constants';
import { adminApi } from '../../../services/adminApi';
import { repairApi } from '../../../services/repairApi';

const mapUser = (u: any): User => ({
  ...u,
  role: u.role.toUpperCase() as Role,
  status: (u.status || 'active').toUpperCase() as 'ACTIVE' | 'SUSPENDED',
  createdAt: new Date(u.createdAt).getTime(),
} as User);

const mapRequest = (r: any): RepairRequest => ({
  ...r,
  createdAt: new Date(r.createdAt).getTime(),
  updatedAt: new Date(r.updatedAt).getTime(),
} as RepairRequest);

export const AdminUsersMgmt: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, reqRes] = await Promise.all([
        adminApi.listUsers(),
        repairApi.list(),
      ]);
      const allUsers = userRes.data.map(mapUser);
      const allRequests = reqRes.data.map(mapRequest);
      setUsers(allUsers);
      setRequests(allRequests);
      
      // Keep selected user reference fresh if open
      if (selectedUser) {
        const freshUser = allUsers.find(u => u.id === selectedUser.id);
        if (freshUser) {
          setSelectedUser(freshUser);
        }
      }
    } catch (err) {
      console.error('Error loading Admin Users:', err);
      setError('Failed to load user registry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (userToUpdate: User) => {
    const currentStatus = userToUpdate.status || 'ACTIVE';
    const newStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    
    const updatedUser: User = {
      ...userToUpdate,
      status: newStatus
    };

    try {
      await adminApi.updateUserStatus(userToUpdate.id, newStatus === 'SUSPENDED' ? 'suspended' : 'active');
      await loadData();
    } catch (err) {
      console.error('Error updating user status:', err);
      alert('Failed to update user status. Please try again.');
    }
  };

  // Activity summaries logic
  const getUserStats = (userId: string, role: Role) => {
    if (role === Role.TECHNICIAN) {
      const assigned = requests.filter(r => r.technicianId === userId);
      const completed = assigned.filter(r => r.status === RepairRequestStatus.COMPLETED).length;
      const active = assigned.filter(r => r.status !== RepairRequestStatus.COMPLETED && r.status !== RepairRequestStatus.CANCELLED).length;
      return { label: 'Technician', main: `${completed} Completed`, sub: `${active} Active Jobs` };
    } else {
      const userReqs = requests.filter(r => r.userId === userId);
      const completed = userReqs.filter(r => r.status === RepairRequestStatus.COMPLETED).length;
      return { label: 'Client', main: `${userReqs.length} Submitted`, sub: `${completed} Solved` };
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const uStatus = u.status || 'ACTIVE';
    const matchesStatus = statusFilter === 'ALL' || uStatus === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white tracking-tight">Users & Identity Management</h2>
        <p className="text-slate-400 font-medium font-sans">
          Audit system-wide accounts, review client activity payloads, and manage soft access-suspension clearances.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: List and Filters */}
        <div className="xl:col-span-2 space-y-4">
          {/* Controls Bar */}
          <div className="glass p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row gap-3 justify-between items-center">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                {Icons.search}
              </span>
              <input
                type="text"
                placeholder="Search name or registry email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/50 border border-white/5 rounded-lg text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition-colors"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 bg-slate-950/50 border border-white/5 rounded-lg text-xs font-semibold text-slate-300 focus:outline-none focus:border-rose-500/50"
              >
                <option value="ALL">All Roles</option>
                <option value={Role.USER}>Clients (USER)</option>
                <option value={Role.TECHNICIAN}>Technicians</option>
                <option value={Role.ADMIN}>Administrators</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 bg-slate-950/50 border border-white/5 rounded-lg text-xs font-semibold text-slate-300 focus:outline-none focus:border-rose-500/50"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Clearances</option>
                <option value="SUSPENDED">Suspended Accounts</option>
              </select>
            </div>
          </div>

          {/* Users List Grid */}
          {loading ? (
            <div className="p-8 text-center text-slate-500 font-medium">Opening secure registry directories...</div>
          ) : error ? (
            <div className="p-12 text-center glass rounded-xl border border-rose-500/20">
              <p className="text-rose-400 text-sm font-medium mb-3">{error}</p>
              <button onClick={loadData} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors">
                Retry
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center glass rounded-xl border border-white/5 space-y-2">
              <p className="text-sm text-slate-500 font-medium">No matching entities found in identity cache.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredUsers.map(u => {
                const uStatus = u.status || 'ACTIVE';
                const activity = getUserStats(u.id, u.role);
                const isSelected = selectedUser?.id === u.id;

                return (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`glass p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row gap-4 justify-between items-start md:items-center ${
                      isSelected 
                        ? 'bg-rose-500/5 border-rose-500/30 shadow-[0_0_15px_-3px_rgba(244,63,94,0.15)]' 
                        : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-bold text-slate-200 text-sm leading-tight">{u.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          u.role === Role.ADMIN 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' 
                            : u.role === Role.TECHNICIAN 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                        }`}>
                          {u.role}
                        </span>
                        
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide border ${
                          uStatus === 'SUSPENDED' 
                            ? 'bg-rose-600/10 text-rose-500 border-rose-600/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {uStatus}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-400 font-medium truncate mt-1">{u.email}</p>
                      
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-2 font-medium">
                        <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">UID: ...{u.id.substring(5, 11)}</span>
                        <span>•</span>
                        <span>Registered {new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 w-full md:w-auto mt-2 md:mt-0 border-t md:border-0 border-white/5 pt-2 md:pt-0 justify-between">
                      {/* Activity metrics */}
                      <div className="text-left md:text-right">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Activity Log Summary</span>
                        <span className="text-xs font-bold text-white block">{activity.main}</span>
                        <span className="text-[10px] font-medium text-slate-400 block">{activity.sub}</span>
                      </div>

                      {/* Control keys */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(u);
                        }}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold tracking-widest uppercase transition-all border ${
                          uStatus === 'SUSPENDED'
                            ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600 hover:text-white'
                            : 'bg-rose-950/20 text-rose-400 border-rose-500/20 hover:bg-rose-700 hover:text-white'
                        }`}
                      >
                        {uStatus === 'SUSPENDED' ? 'RE-ACTIVATE' : 'SUSPEND'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Pane */}
        <div>
          {selectedUser ? (
            <div className="glass rounded-xl border border-white/10 p-5 sticky top-6 space-y-6">
              <div className="border-b border-white/5 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white font-sans">{selectedUser.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedUser.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {Icons.close}
                  </button>
                </div>
                
                <div className="flex gap-2 mt-3.5">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-white/5 text-slate-300">
                    {selectedUser.role}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                    (selectedUser.status || 'ACTIVE') === 'SUSPENDED'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {selectedUser.status || 'ACTIVE'}
                  </span>
                </div>
              </div>

              {/* Comprehensive payload parameters */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Identity Directory Data</h4>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block font-medium">DATABASE ID</span>
                    <span className="font-mono text-slate-300 font-semibold break-all">{selectedUser.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">REGISTRY TIMESTAMP</span>
                    <span className="text-slate-300 font-semibold">{new Date(selectedUser.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-[#020617]/50 rounded-lg p-3.5 border border-white/5 space-y-2">
                  <span className="text-[9px] uppercase font-mono font-bold text-slate-500 block">Workspace Activity Telemetry</span>
                  {selectedUser.role === Role.TECHNICIAN ? (
                    <div className="text-xs space-y-1.5 text-slate-300">
                      <p>• Assigned Repair Tickets: <strong className="text-white">{requests.filter(r => r.technicianId === selectedUser.id).length}</strong></p>
                      <p>• SLA Closed Gigs: <strong className="text-emerald-400">{requests.filter(r => r.technicianId === selectedUser.id && r.status === RepairRequestStatus.COMPLETED).length}</strong></p>
                      <p>• Active Backlogs Under Workshop: <strong className="text-amber-400">{requests.filter(r => r.technicianId === selectedUser.id && r.status !== RepairRequestStatus.COMPLETED && r.status !== RepairRequestStatus.CANCELLED).length}</strong></p>
                    </div>
                  ) : (
                    <div className="text-xs space-y-1.5 text-slate-300">
                      <p>• Support Tickets Logged: <strong className="text-white">{requests.filter(r => r.userId === selectedUser.id).length}</strong></p>
                      <p>• SLA Handover Resolved: <strong className="text-emerald-400">{requests.filter(r => r.userId === selectedUser.id && r.status === RepairRequestStatus.COMPLETED).length}</strong></p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex gap-2">
                <button
                  onClick={() => handleToggleStatus(selectedUser)}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all border ${
                    (selectedUser.status || 'ACTIVE') === 'SUSPENDED'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent'
                      : 'bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border-rose-500/20'
                  }`}
                >
                  {(selectedUser.status || 'ACTIVE') === 'SUSPENDED' ? 'Activate User Clearance' : 'Suspend User Clearance'}
                </button>
              </div>
            </div>
          ) : (
            <div className="glass rounded-xl border border-white/5 p-8 text-center text-slate-500 space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center mx-auto text-slate-400">
                {Icons.user}
              </div>
              <p className="text-xs font-medium max-w-[200px] mx-auto">Select any registrant workspace row from the table list to run detail analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
