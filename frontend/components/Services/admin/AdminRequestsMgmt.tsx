import React, { useState, useEffect } from 'react';
import { Role, User, RepairRequest } from '../../../types';
import { Icons } from '../../../constants';
import { ServiceSummaryView } from '../common/ServiceSummaryView';
import { AdminRequestDetailsPane } from './AdminRequestDetailsPane';
import { AdminRequestRow } from './AdminRequestRow';
import { repairApi } from '../../../services/repairApi';
import { adminApi } from '../../../services/adminApi';

const mapRequest = (r: any): RepairRequest => ({
  ...r,
  createdAt: new Date(r.createdAt).getTime(),
  updatedAt: new Date(r.updatedAt).getTime(),
} as RepairRequest);

// The admin API returns lowercase roles ('technician') while the app enum
// uses uppercase ('TECHNICIAN') — normalize so role filters and dropdowns work.
const mapUser = (u: any): User => ({
  ...u,
  role: (u.role || '').toUpperCase() as Role,
  status: ((u.status || 'active').toUpperCase()) as 'ACTIVE' | 'SUSPENDED',
  createdAt: new Date(u.createdAt).getTime(),
} as User);

export const AdminRequestsMgmt: React.FC = () => {
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<RepairRequest | null>(null);
  const [viewingSummary, setViewingSummary] = useState<RepairRequest | null>(null);

  // Load requests & technicians
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, userRes] = await Promise.all([
        repairApi.list(),
        adminApi.listUsers(),
      ]);
      const allRequests = reqRes.data.map(mapRequest);
      const allUsers = (userRes.data as unknown as any[]).map(mapUser);
      
      setRequests(allRequests.sort((a, b) => b.createdAt - a.createdAt));
      setTechnicians(allUsers.filter(u => u.role === Role.TECHNICIAN));

      if (selectedRequest) {
        const freshReq = allRequests.find(r => r.id === selectedRequest.id);
        if (freshReq) {
          setSelectedRequest(freshReq);
        }
      }
    } catch (err) {
      console.error('Error fetching admin requests metadata:', err);
      setError('Failed to load service requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePriorityChange = async (req: RepairRequest, newPriority: 'LOW' | 'MEDIUM' | 'HIGH') => {
    try {
      await repairApi.updateStatus(
        req.id,
        req.status,
        `Admin modified priority dispatch factor to ${newPriority}`,
        newPriority.toLowerCase() as 'low' | 'medium' | 'high'
      );

      await loadData();
    } catch (err) {
      console.error('Error updating severity priority factor:', err);
      alert('Failed to update priority. Please try again.');
    }
  };

  const handleReassignTechnician = async (req: RepairRequest, newTechId: string) => {
    const selectedTech = technicians.find(t => t.id === newTechId);
    if (!selectedTech) return;

    const oldTechName = req.technicianId 
      ? (technicians.find(t => t.id === req.technicianId)?.name || 'Default Tech')
      : 'Unassigned';

    try {
      await repairApi.assign(
        req.id,
        newTechId,
        `AI Triage Routing Overridden: Reassigned from ${oldTechName} to ${selectedTech.name}`
      );

      await loadData();
    } catch (err) {
      console.error('Error reassigning technician:', err);
      alert('Failed to reassign technician. Please try again.');
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesSearch = (r.gigTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.issueDescription || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || (r.severityLevel || 'MEDIUM') === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (viewingSummary) {
    return (
      <ServiceSummaryView 
        req={viewingSummary} 
        onBack={() => setViewingSummary(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white tracking-tight">Service Requests Dispatch Manager</h2>
        <p className="text-slate-400 font-medium font-sans">
          Override diagnostic priority indexes, reassign hardware triage technicians, and analyze deep system telemetry payloads.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column grid */}
        <div className="xl:col-span-2 space-y-4">
          {/* Controls */}
          <div className="glass p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row gap-3 justify-between items-center">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                {Icons.search}
              </span>
              <input
                type="text"
                placeholder="Search ticket text, users, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/50 border border-white/5 rounded-lg text-xs font-semibold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition-colors"
              />
            </div>
            
            {/* Dropdown Filters */}
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 bg-slate-950/50 border border-white/5 rounded-lg text-xs font-semibold text-slate-300 focus:outline-none focus:border-rose-500/50"
              >
                <option value="ALL">All Status</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="TECHNICIAN_ASSIGNED">Assigned Tech</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed SLA</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 bg-slate-950/50 border border-white/5 rounded-lg text-xs font-semibold text-slate-300 focus:outline-none focus:border-rose-500/50"
              >
                <option value="ALL">All Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          {/* List display */}
          {loading ? (
            <div className="p-8 text-center text-slate-500 font-medium">Downloading SLA ledger queues...</div>
          ) : error ? (
            <div className="p-12 text-center glass rounded-xl border border-rose-500/20">
              <p className="text-rose-400 text-sm font-medium mb-3">{error}</p>
              <button onClick={loadData} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors">
                Retry
              </button>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center glass rounded-xl border border-white/5">
              <p className="text-sm text-slate-500 font-medium">No service tickets matching filters exist on current node.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map(req => (
                <AdminRequestRow
                  key={req.id}
                  req={req}
                  isSelected={selectedRequest?.id === req.id}
                  assignedTech={technicians.find(t => t.id === req.technicianId)}
                  onSelect={() => setSelectedRequest(req)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Detail Overrides Pane */}
        <div>
          {selectedRequest ? (
            <AdminRequestDetailsPane
              selectedRequest={selectedRequest}
              onClear={() => setSelectedRequest(null)}
              onPriorityChange={handlePriorityChange}
              onReassignTechnician={handleReassignTechnician}
              onViewSummary={setViewingSummary}
              technicians={technicians}
              requests={requests}
            />
          ) : (
            <div className="glass rounded-xl border border-white/5 p-8 text-center text-slate-500 space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center mx-auto text-slate-400">
                {Icons.settings}
              </div>
              <p className="text-xs font-medium max-w-[200px] mx-auto font-sans">
                Select a service ticket request row to overwrite automated AI dispatches, adjust ticket priority weightings, or examine deep diagnostic Snapshots.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
