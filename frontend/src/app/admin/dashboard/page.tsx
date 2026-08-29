'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building, 
  FileSpreadsheet, 
  MapPin, 
  Activity, 
  Clock, 
  Layout, 
  CheckCircle2, 
  Eye, 
  X, 
  User, 
  Trash2, 
  Edit,
  Sliders, 
  FileText,
  TrendingUp, 
  Percent, 
  ShieldAlert, 
  Mail,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { adminApi, projectApi, apiRequest } from '@/lib/api';
const logoPng = new URL('../../../../assets/Logo-B&W.png', import.meta.url);

export default function AdminDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<any>({ clients: [], contractors: [], inspectors: [] });
  const [projects, setProjects] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>({ commissionPercent: 10.0, totalProjectRevenue: 0, totalCommissionsEarned: 0, projects: [] });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'projects' | 'revenue' | 'reviews' | 'templates'>('overview');

  // Input states
  const [commissionPercent, setCommissionPercent] = useState('10');
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  
  // Project inspector assign state
  const [assignProjectId, setAssignProjectId] = useState('');
  const [assignInspectorId, setAssignInspectorId] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/auth/login');
    } else if (user) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch full users object (clients, contractors, inspectors) from Admin API
      const usersData = await adminApi.getUsers();
      setUsers(usersData || { clients: [], contractors: [], inspectors: [] });

      const projectsData = await projectApi.list();
      setProjects(projectsData);

      //const revData = await apiRequest('/inspection/dashboard');
      //setRevenue(revData);
      //setCommissionPercent(revData.commissionPercent.toString());

      const logsData = await adminApi.getAuditLogs();
      setAuditLogs(logsData);

      const templatesData = await adminApi.getEmailTemplates();
      setEmailTemplates(templatesData);
    } catch (err) {
      console.error('Admin dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserStatus = async (contractorId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await adminApi.updateUser(contractorId, { role: 'CONTRACTOR', status });
      await fetchData();
      alert('Contractor verification status updated.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user account? This cannot be undone.')) return;
    try {
      await adminApi.deleteUser(userId);
      await fetchData();
      alert('User account deleted.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenAssign = (projId: string) => {
    setAssignProjectId(projId);
    setShowAssignModal(true);
  };

  const handleAssignInspectorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await projectApi.assignInspector(assignProjectId, assignInspectorId);
      setShowAssignModal(false);
      setAssignProjectId('');
      setAssignInspectorId('');
      await fetchData();
      alert('Inspector assigned to project successfully.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.updateCommission(parseFloat(commissionPercent));
      await fetchData();
      alert('Global commission rate updated successfully.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenTemplateEdit = (tpl: any) => {
    setEditingTemplate(tpl);
    setTemplateSubject(tpl.subject);
    setTemplateBody(tpl.body);
  };

  const handleUpdateTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    try {
      await adminApi.updateEmailTemplate(editingTemplate.id, {
        subject: templateSubject,
        body: templateBody,
      });
      setEditingTemplate(null);
      await fetchData();
      alert('Email notification template updated.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Moderate reviews helper
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to remove this contractor review?')) return;
    alert('Review moderated and deleted from database.');
  };

  const stats = {
    clients: users.clients?.length || 0,
    contractors: users.contractors?.length || 0,
    activeProjects: projects.filter(p => !['PROJECT_COMPLETED', 'REVIEW_SUBMITTED', 'CANCELLED'].includes(p.status)).length,
    revenue: revenue.totalCommissionsEarned || 0,
    disputes: revenue.openDisputesCount || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row font-sans">
      
      {/* DESKTOP DARK SIDEBAR */}
      <aside className="hidden lg:flex w-64 bg-gradient-to-b from-primary via-primary to-primary text-white flex-col justify-between p-5 fixed top-0 bottom-0 left-0">
        <div className="space-y-8">
          <Link href="/" className="block">
            <img
              src={logoPng.href}
              alt="ConstroBID"
              className="mx-auto w-[210px] max-w-full object-contain"
            />
          </Link>

          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Console Overview', icon: Layout },
              { id: 'users', label: 'User Directory', icon: User },
              { id: 'projects', label: 'Manage Projects', icon: Building },
              { id: 'revenue', label: 'Revenue & Commission', icon: TrendingUp },
              { id: 'templates', label: 'Email Templates', icon: Mail },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setActiveTab(btn.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === btn.id 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <btn.icon size={16} />
                {btn.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-4 pt-6 border-t border-white/10">
          <div className="truncate px-2">
            <span className="text-xs font-bold block truncate">Super Admin</span>
            <span className="text-[10px] text-gray-400 block truncate">{user?.email}</span>
          </div>
          <button
            onClick={logout}
            className="w-full py-2.5 bg-white/10 text-xs font-bold rounded-lg hover:bg-white/20 transition-colors"
          >
            Logout Console
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-brand-dark text-gray-400 border-t border-gray-800 flex justify-around py-3.5 z-50 shadow-2xl">
        {[
          { id: 'overview', label: 'Overview', icon: Layout },
          { id: 'users', label: 'Users', icon: User },
          { id: 'projects', label: 'Projects', icon: Building },
          { id: 'revenue', label: 'Revenue', icon: TrendingUp },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setActiveTab(btn.id as any)}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
              activeTab === btn.id ? 'text-secondary' : 'text-gray-500'
            }`}
          >
            <btn.icon size={18} />
            {btn.label}
          </button>
        ))}
        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 text-[10px] font-bold text-gray-500"
        >
          <X size={18} />
          Logout
        </button>
      </nav>

      {/* DASHBOARD BODY */}
      <main className="flex-1 lg:ml-64 px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8 text-brand-dark">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary font-serif">Super Admin Console</h1>
            <p className="text-xs text-gray-500 mt-1">Global settings, client accounts directory, project workflows assignments, commission triggers, and system audit logs.</p>
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto" />
            <p className="text-xs text-gray-500 font-bold font-serif">Connecting console pipelines...</p>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Widgets */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { label: 'Total Clients', value: stats.clients, icon: User, color: 'text-primary bg-primary/5 border-primary/10' },
                    { label: 'Total Contractors', value: stats.contractors, icon: Building, color: 'text-green-600 bg-green-50 border-green-100' },
                    { label: 'Active Projects', value: stats.activeProjects, icon: Activity, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                    { label: 'Revenue Earned', value: `₹${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: 'text-secondary-hover bg-yellow-50 border-yellow-100' },
                    { label: 'Open Disputes', value: stats.disputes, icon: ShieldAlert, color: 'text-red-650 bg-red-50 border-red-100' },
                  ].map((st, i) => (
                    <div key={i} className={`p-5 rounded-xl border ${st.color} shadow-sm`}>
                      <span className="text-[10px] font-bold block uppercase tracking-tight opacity-75">{st.label}</span>
                      <h3 className="text-lg font-extrabold mt-3">{st.value}</h3>
                    </div>
                  ))}
                </div>

                {/* Audit Logs Table */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-primary font-serif">System Audit Trails</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-150 text-gray-400 text-[10px] uppercase font-bold">
                          <th className="py-2.5 px-4">Timestamp</th>
                          <th className="py-2.5 px-4">Action Type</th>
                          <th className="py-2.5 px-4">Details log</th>
                          <th className="py-2.5 px-4">Trigger User</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-xs">
                        {auditLogs.map((log) => (
                          <tr key={log._id}>
                            <td className="py-3 px-4 text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                            <td className="py-3 px-4 font-sans font-semibold text-primary">{log.action}</td>
                            <td className="py-3 px-4 text-gray-650 font-medium">{log.details}</td>
                            <td className="py-3 px-4 font-sans text-gray-500">{log.user?.email || 'System'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* USER MANAGEMENT TAB */}
            {activeTab === 'users' && (
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-primary font-serif">User Administration Directory</h3>
                  <p className="text-xs text-gray-500 mt-1">Moderate client accounts, builder credentials, and field inspection managers.</p>
                </div>

                {/* Contractors Directory Table */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-primary border-b border-gray-100 pb-2">Contractors / Partners Directory</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-150 text-gray-400 text-[10px] uppercase font-bold">
                          <th className="py-2.5 px-4">Company Name</th>
                          <th className="py-2.5 px-4">Email</th>
                          <th className="py-2.5 px-4">Exp</th>
                          <th className="py-2.5 px-4">Verification</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {users.contractors?.map((c: any) => (
                          <tr key={c._id}>
                            <td className="py-3 px-4 font-bold text-primary">{c.companyName}</td>
                            <td className="py-3 px-4 font-semibold text-gray-500">{c.user?.email || "No Email"}</td>
                            <td className="py-3 px-4 text-gray-500">{c.experience} Yrs</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                c.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right flex justify-end gap-2">
                              {c.status !== 'VERIFIED' && (
                                <button
                                  onClick={() => handleUpdateUserStatus(c.id, 'VERIFIED')}
                                  className="px-2.5 py-1 bg-green-650 hover:bg-green-700 text-white text-[10px] font-bold rounded"
                                >
                                  Verify
                                </button>
                              )}
                              <button title="Delete contractor"
                                onClick={() => handleDeleteUser(c.userId)}
                                aria-label="Delete contractor"
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={14} />
                                <span className="sr-only">Delete contractor {c.companyName}</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Clients Directory */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-primary border-b border-gray-100 pb-2">Homeowners / Clients Directory</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-150 text-gray-400 text-[10px] uppercase font-bold">
                          <th className="py-2.5 px-4">Client Name</th>
                          <th className="py-2.5 px-4">Email</th>
                          <th className="py-2.5 px-4">City</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {users.clients?.map((cl: any) => (
                          <tr key={cl.id}>
                            <td className="py-3 px-4 font-bold text-primary">{cl.name}</td>
                            <td className="py-3 px-4 font-semibold text-gray-500">{cl.user?.email}</td>
                            <td className="py-3 px-4 text-gray-500">{cl.city}</td>
                            <td className="py-3 px-4 text-right">
                              <button title="Delete client"
                                onClick={() => handleDeleteUser(cl.userId)}
                                aria-label="Delete client"
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded inline-flex"
                              >
                                <Trash2 size={14} />
                                <span className="sr-only">Delete client {cl.name}</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PROJECT MANAGEMENT & INSPECTOR ASSIGN TAB */}
            {activeTab === 'projects' && (
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-primary font-serif">Global Project Portfolio</h3>
                  <p className="text-xs text-gray-500 mt-1">Assign inspectors to verify dimensions and oversee structural handovers.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-150 text-gray-400 text-[10px] uppercase font-bold">
                        <th className="py-2.5 px-4">Project Name</th>
                        <th className="py-2.5 px-4">Category</th>
                        <th className="py-2.5 px-4">City</th>
                        <th className="py-2.5 px-4">Assigned Inspector</th>
                        <th className="py-2.5 px-4">Workflow Status</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {projects.map((p) => (
                        <tr key={p.id || p._id}>
                          <td className="py-3 px-4 font-bold text-primary">{p.title}</td>
                          <td className="py-3 px-4 font-semibold text-gray-500">{p.category}</td>
                          <td className="py-3 px-4 text-gray-500">{p.city}</td>
                          <td className="py-3 px-4 text-gray-600 font-bold">{p.assignedInspector?.name || 'Unassigned'}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">
                              {p.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {(!p.assignedInspectorId || p.status === 'PENDING_INSPECTION') && (
                              <button
                                onClick={() => handleOpenAssign(p.id)}
                                className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded"
                              >
                                Assign Inspector
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REVENUE & COMMISSION MANAGEMENT TAB */}
            {activeTab === 'revenue' && (
              <div className="space-y-8">
                {/* Edit Commission Percent Form */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-primary font-serif">Global Commission Rates</h3>
                  <form onSubmit={handleUpdateCommission} className="flex items-end gap-4 text-xs">
                    <div className="space-y-1">
                      <label htmlFor="commission-percent" className="text-[10px] font-bold text-gray-500">ConstroBID Commission percentage (%)</label>
                      <div className="relative">
                        <input title="ConstroBID commission percentage"
                          id="commission-percent"
                          type="number"
                          step="0.1"
                          required
                          placeholder="10"
                          value={commissionPercent}
                          onChange={(e) => setCommissionPercent(e.target.value)}
                          className="pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <Percent size={14} />
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-3 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover shadow"
                    >
                      Update Commission
                    </button>
                  </form>
                </div>

                {/* Financial Ledger grid */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-primary font-serif">Revenue & Commission Ledger</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-150 text-gray-400 text-[10px] uppercase font-bold">
                          <th className="py-2.5 px-4">Project Title</th>
                          <th className="py-2.5 px-4">Assigned Builder</th>
                          <th className="py-2.5 px-4">Contractor Bid Cost</th>
                          <th className="py-2.5 px-4">Commission Rate</th>
                          <th className="py-2.5 px-4">Revenue Earned</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {revenue.projects?.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-3.5 px-4 font-bold text-primary">{item.projectTitle}</td>
                            <td className="py-3.5 px-4 font-semibold text-gray-500">{item.contractorName}</td>
                            <td className="py-3.5 px-4 text-gray-500">₹{item.bidCost.toLocaleString()}</td>
                            <td className="py-3.5 px-4 text-gray-500">{revenue.commissionPercent}%</td>
                            <td className="py-3.5 px-4 text-green-600 font-extrabold">₹{item.commissionEarned.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* EMAIL TEMPLATES MANAGEMENT TAB */}
            {activeTab === 'templates' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-primary font-serif">Notification Templates</h3>
                  <p className="text-xs text-gray-500">Configure the database template files sent out by email triggers.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Templates listings */}
                  <div className="space-y-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-fit">
                    <h4 className="text-sm font-bold text-[#70153a]">Template Files</h4>
                    <div className="space-y-2">
                      {emailTemplates.map((tpl) => (
                        <button
                          key={tpl.id}
                          onClick={() => handleOpenTemplateEdit(tpl)}
                          className="w-full text-left p-3.5 bg-gray-50 border border-gray-200 rounded hover:border-primary transition-all flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-primary">{tpl.type.replace(/_/g, ' ')}</span>
                          <Edit size={14} className="text-gray-400" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Editing Panel */}
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    {editingTemplate ? (
                      <form onSubmit={handleUpdateTemplateSubmit} className="space-y-4 text-xs">
                        <h4 className="text-sm font-bold text-[#70153a]">Edit Email template: {editingTemplate.type}</h4>
                        <div className="space-y-1">
                          <label htmlFor="template-subject" className="text-[10px] font-bold text-gray-500">Email Subject Line</label>
                          <input title="Email subject line"
                            id="template-subject"
                            type="text"
                            required
                            placeholder="Enter email subject line"
                            value={templateSubject}
                            onChange={(e) => setTemplateSubject(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-brand-dark focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="template-body" className="text-[10px] font-bold text-gray-500">Body Content (Use placeholders like &#123;&#123;name&#125;&#125;)</label>
                          <textarea title="Email body content"
                            id="template-body"
                            rows={10}
                            required
                            placeholder="Enter email body content"
                            value={templateBody}
                            onChange={(e) => setTemplateBody(e.target.value)}
                            className="w-full p-3 bg-white border border-gray-200 rounded focus:outline-none text-brand-dark resize-none font-mono"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded"
                        >
                          Save Email Template Changes
                        </button>
                      </form>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-20">Click on a template file on the left side to edit subject or body layouts.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ASSIGN INSPECTOR MODAL */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl max-w-md w-full shadow-2xl p-6 border border-gray-150 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-primary font-serif">Assign Field Inspector</h3>
                <button title="Close assign inspector modal"
                  onClick={() => setShowAssignModal(false)}
                  aria-label="Close assign inspector modal"
                  className="text-gray-450 hover:text-gray-650"
                >
                  <X size={18} />
                  <span className="sr-only">Close assign inspector modal</span>
                </button>
              </div>

              <form onSubmit={handleAssignInspectorSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label htmlFor="assign-inspector" className="text-[10px] font-bold text-gray-500">Choose Certified Inspector</label>
                  <select title="Choose certified inspector"
                    id="assign-inspector"
                    required
                    aria-label="Choose certified inspector"
                    value={assignInspectorId}
                    onChange={(e) => setAssignInspectorId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded text-sm text-brand-dark focus:outline-none"
                  >
                    <option value="">-- Select Inspector Account --</option>
                    {users.inspectors?.map((ins: any) => (
                      <option key={ins.id} value={ins.id}>{ins.name} ({ins.user.email})</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded shadow transition-all"
                >
                  Assign Inspector to Project
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
