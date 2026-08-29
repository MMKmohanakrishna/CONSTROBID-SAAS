const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api';

// Safe localStorage access in Next.js (SSR safe)
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set default Content-Type to JSON if not uploading FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const method = (options.method || 'GET').toUpperCase();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  const shouldBroadcastMutation =
    method !== 'GET' &&
    endpoint !== '/messages/conversations/mark-read';

  if (typeof window !== 'undefined' && shouldBroadcastMutation) {
    window.dispatchEvent(
      new CustomEvent('constrobid:data-changed', {
        detail: {
          type: 'LOCAL_MUTATION_COMPLETED',
          domains: inferDomainsForEndpoint(endpoint),
          local: true,
          timestamp: new Date().toISOString(),
        },
      })
    );
  }

  return data;
}

function inferDomainsForEndpoint(endpoint: string): string[] {
  if (endpoint.startsWith('/messages')) return ['messages', 'notifications', 'projects'];
  if (endpoint.startsWith('/notifications')) return ['notifications'];
  if (endpoint.startsWith('/uploads')) return ['upload-drafts'];
  if (endpoint.startsWith('/monitoring')) return ['monitoring', 'projects', 'reports', 'analytics'];
  if (endpoint.startsWith('/completion')) return ['completion', 'projects', 'reports', 'analytics'];
  if (endpoint.startsWith('/admin')) return ['admin', 'projects', 'contractors', 'reports', 'analytics'];
  if (endpoint.startsWith('/inspection/contractors')) return ['contractors', 'profile', 'admin'];
  if (endpoint.startsWith('/inspection/design')) return ['designs', 'projects', 'files'];
  if (endpoint.startsWith('/inspection')) return ['inspections', 'projects', 'reports'];
  if (endpoint.includes('/quote') || endpoint.includes('/quotation')) return ['quotations', 'projects', 'notifications', 'analytics'];
  if (endpoint.includes('/design')) return ['designs', 'projects', 'files', 'notifications'];
  if (endpoint.startsWith('/projects')) return ['projects', 'quotations', 'messages', 'notifications', 'reports', 'designs', 'analytics', 'completion', 'monitoring'];
  return ['projects', 'notifications', 'analytics'];
}

// Authentication API
export const authApi = {
  login: (data: any) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  requestRegistrationOtp: (data: any) => apiRequest('/auth/register/request-otp', { method: 'POST', body: JSON.stringify(data) }),
  verifyRegistrationOtp: (data: { email: string; otp: string }) => apiRequest('/auth/register/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  resendRegistrationOtp: (email: string) => apiRequest('/auth/register/resend-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  forgotPassword: (email: string) => apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data: any) => apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
};

// Projects API
export const projectApi = {
  create: (data: any) => apiRequest('/projects', { method: 'POST', body: JSON.stringify(data) }),
  list: () => apiRequest('/projects'),
  getById: (id: string) => apiRequest(`/projects/${id}`),
  getProjectQuotations: (projectId: string) =>
  apiRequest(`/projects/${projectId}/quotations`),
  
  getQuotationById: (
  projectId: string,
  quoteId: string
) =>
  apiRequest(
    `/projects/${projectId}/quotations/${quoteId}`
  ),
  cancel: (id: string) => apiRequest(`/projects/${id}/cancel`, { method: 'PUT' }),
  submitReview: (id: string, data: any) => apiRequest(`/projects/${id}/reviews`, { method: 'POST', body: JSON.stringify(data) }),
    
  // Inspection Team Action Binders
  assignInspector: (id: string, inspectorId: string) => apiRequest(`/projects/${id}/assign`, { method: 'PUT', body: JSON.stringify({ inspectorId }) }),
  scheduleInspection: (id: string, scheduledDate: string) => apiRequest(`/projects/${id}/schedule`, { method: 'PUT', body: JSON.stringify({ scheduledDate }) }),
  submitReport: (id: string, data: any) => apiRequest(`/projects/${id}/report`, { method: 'POST', body: JSON.stringify(data) }),
  uploadDesign: (id: string, fileUrl: string) => apiRequest(`/projects/${id}/design`, { method: 'POST', body: JSON.stringify({ fileUrl }) }),
  verifyQuotation: (
  projectId: string,
  quoteId: string,
  data: any
) =>
  apiRequest(
    `/projects/${projectId}/quotations/${quoteId}/verify`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  ),
  requestRequote: (
  projectId: string,
  quoteId: string,
  data: any
) =>
  apiRequest(
    `/projects/${projectId}/quotations/${quoteId}/requote`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  ),
  rejectQuotation: (
  projectId: string,
  quoteId: string,
  data: any
) =>
  apiRequest(
    `/projects/${projectId}/quotations/${quoteId}/reject`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  ),
  submitSiteVisit: (id: string, data: any) => apiRequest(`/projects/${id}/visit`, { method: 'POST', body: JSON.stringify(data) }),
  approveHandover: (id: string) => apiRequest(`/projects/${id}/complete-verify`, { method: 'PUT' }),
  publish: (id: string, data: any) =>
    apiRequest(`/projects/${id}/publish`, {
        method: "PUT",
        body: JSON.stringify(data),
    }),
  getQuotationSummary: () =>
  apiRequest("/projects/quotation-summary"),

  // Client actions
  reviewDesign: (id: string, approve: boolean, comments: string) => apiRequest(`/projects/${id}/design-review`, { method: 'PUT', body: JSON.stringify({ approve, comments }) }),
  selectQuote: (projectId: string, quoteId: string) => apiRequest(`/projects/${projectId}/quotes/${quoteId}/select`, { method: 'PUT' }),
  acceptProject: (projectId: string) =>
  apiRequest(`/projects/${projectId}/accept-project`, {
    method: "PUT",
  }),
  declineProject: (projectId: string, reason: string) =>
  apiRequest(`/projects/${projectId}/decline-project`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  }),
  confirmContractor: (projectId: string) => apiRequest(`/projects/${projectId}/confirm-contractor`, { method: 'PUT' }),
  reopenBidding: (projectId: string, quotationDeadline: string) =>
  apiRequest(`/projects/${projectId}/reopen-bidding`, {
    method: "PUT",
    body: JSON.stringify({ quotationDeadline }),
  }),
  raiseDispute: (id: string, reason: string) => apiRequest(`/projects/${id}/dispute`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Contractor actions
  submitQuotation: (id: string, data: any) => apiRequest(`/projects/${id}/quote`, { method: 'POST', body: JSON.stringify(data) }),
  saveDraft: (id: string, data: any) =>
  apiRequest(`/projects/${id}/draft`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),

getDraft: (id: string) =>
  apiRequest(`/projects/${id}/draft`),
  submitDailyUpdate: (id: string, data: any) => apiRequest(`/projects/${id}/update`, { method: 'POST', body: JSON.stringify(data) }),
  requestCompletion: (id: string) => apiRequest(`/projects/${id}/completion-request`, { method: 'POST' }),
  // Get approved/assigned projects for the current user
  getApprovedProjects: () => apiRequest('/projects/approved'),
};

export const attendanceApi = {
  getProjectAttendance: (projectId: string, params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/attendance/project/${projectId}${query ? `?${query}` : ''}`);
  },
};

// end projectApi

// Common/Metadata API
export const commonApi = {
  getServices: () => apiRequest('/common/services'),
  getCities: () => apiRequest('/common/cities'),
  getCategories: () => apiRequest('/common/categories'),
  searchContractors: (city?: string, category?: string) => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (category) params.set('category', category);
    return apiRequest(`/common/contractors?${params.toString()}`);
  },
  getContractorProfile: (id: string) => apiRequest(`/common/contractors/${id}`),
};

// Admin API
export const adminApi = {
  getUsers: () => apiRequest('/admin/users'),
  updateUser: (id: string, data: any) => apiRequest(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (userId: string) => apiRequest(`/admin/users/${userId}`, { method: 'DELETE' }),
  getRevenue: () => apiRequest('/admin/revenue'),
  updateCommission: (commissionPercent: number) => apiRequest('/admin/commission', { method: 'PUT', body: JSON.stringify({ commissionPercent }) }),
  getAuditLogs: () => apiRequest('/admin/logs'),
  getEmailTemplates: () => apiRequest('/admin/templates'),
  updateEmailTemplate: (id: string, data: any) => apiRequest(`/admin/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  resolveDispute: (disputeId: string, data: any) => apiRequest(`/admin/disputes/${disputeId}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// Monitoring API
export const monitoringApi = {
  summary: () => apiRequest('/monitoring/summary'),
  listUpdates: (params?: any) => apiRequest(`/monitoring/updates${params ? `?${new URLSearchParams(params).toString()}` : ''}`),
  createUpdate: (data: any) => apiRequest('/monitoring/updates', { method: 'POST', body: JSON.stringify(data) }),
  listVisits: (params?: any) => apiRequest(`/monitoring/visits${params ? `?${new URLSearchParams(params).toString()}` : ''}`),
  createVisit: (data: any) => apiRequest('/monitoring/visits', { method: 'POST', body: JSON.stringify(data) }),
  flagDelay: (projectId: string, reason?: string) => apiRequest(`/monitoring/projects/${projectId}/delay`, { method: 'POST', body: JSON.stringify({ reason }) }),
  qualityCheck: (projectId: string, score?: number, notes?: string) => apiRequest(`/monitoring/projects/${projectId}/quality`, { method: 'POST', body: JSON.stringify({ score, notes }) }),
};

// Completion API
export const completionApi = {
  createRequest: (data: any) => apiRequest('/completion/requests', { method: 'POST', body: JSON.stringify(data) }),
  listRequests: (params?: any) => apiRequest(`/completion/requests${params ? `?${new URLSearchParams(params).toString()}` : ''}`),
  getRequest: (id: string) => apiRequest(`/completion/requests/${id}`),
  updateRequest: (id: string, data: any) => apiRequest(`/completion/requests/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  createPunchList: (data: any) => apiRequest('/completion/punchlists', { method: 'POST', body: JSON.stringify(data) }),
  getPunchLists: (params?: any) => apiRequest(`/completion/punchlists${params ? `?${new URLSearchParams(params).toString()}` : ''}`),
  updatePunchItem: (id: string, itemId: string, data: any) => apiRequest(`/completion/punchlists/${id}/items/${itemId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  createVerification: (data: any) => apiRequest('/completion/verifications', { method: 'POST', body: JSON.stringify(data) }),
  listVerifications: (params?: any) => apiRequest(`/completion/verifications${params ? `?${new URLSearchParams(params).toString()}` : ''}`),

  createHandover: (data: any) => apiRequest('/completion/handovers', { method: 'POST', body: JSON.stringify(data) }),
  signHandover: (id: string, data: any) => apiRequest(`/completion/handovers/${id}/sign`, { method: 'POST', body: JSON.stringify(data) }),
  getHandover: (id: string) => apiRequest(`/completion/handovers/${id}`),
};

export const inspectionApi = {
  getContractors: (status?: string) =>
    apiRequest(
      `/inspection/contractors${
        status ? `?status=${status}` : ""
      }`
    ),

  getContractorById: (id: string) =>
    apiRequest(`/inspection/contractors/${id}`),

  approveContractor: (id: string) =>
    apiRequest(`/inspection/contractors/${id}/approve`, {
      method: "POST",
    }),

  rejectContractor: (
    id: string,
    reason: string
  ) =>
    apiRequest(`/inspection/contractors/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  blockContractor: (
    id: string,
    reason: string
  ) =>
    apiRequest(`/inspection/contractors/${id}/block`, {
      method: "POST",
      body: JSON.stringify({
        reason,
      }),
    }),
};

export const variationApi = {
  create: (projectId: string, data: any) =>
    apiRequest(`/projects/${projectId}/variations`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  list: (projectId: string) =>
    apiRequest(`/projects/${projectId}/variations`),

  approveByInspector: (variationId: string, remarks?: string) =>
    apiRequest(`/variations/${variationId}/inspector-approve`, {
      method: "PUT",
      body: JSON.stringify({ remarks }),
    }),

  rejectByInspector: (variationId: string, remarks?: string) =>
    apiRequest(`/variations/${variationId}/inspector-reject`, {
      method: "PUT",
      body: JSON.stringify({ remarks }),
    }),
};

/** Project Finance — the contractor's private books. */
export const financeApi = {
  overview: () => apiRequest("/finance/overview"),

  listProjects: (deleted = false) =>
    apiRequest(`/finance/projects${deleted ? "?deleted=true" : ""}`),

  linkable: () => apiRequest("/finance/projects/linkable"),

  getProject: (id: string) => apiRequest(`/finance/projects/${id}`),

  createProject: (data: any) =>
    apiRequest("/finance/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProject: (id: string, data: any) =>
    apiRequest(`/finance/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteProject: (id: string) =>
    apiRequest(`/finance/projects/${id}`, { method: "DELETE" }),

  restoreProject: (id: string) =>
    apiRequest(`/finance/projects/${id}/restore`, { method: "POST" }),

  subscription: () => apiRequest("/finance/subscription"),

  createSubscriptionOrder: () =>
    apiRequest("/finance/subscription/order", { method: "POST" }),

  verifySubscription: (payload: any) =>
    apiRequest("/finance/subscription/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

/** Materials and Labour share one shape, so one client serves both. */
export const financeLedgerApi = {
  list: (kind: "materials" | "labour", projectId: string) =>
    apiRequest(`/finance/projects/${projectId}/${kind}`),

  create: (kind: "materials" | "labour", projectId: string, data: any) =>
    apiRequest(`/finance/projects/${projectId}/${kind}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (kind: "materials" | "labour", id: string, data: any) =>
    apiRequest(`/finance/${kind}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  remove: (kind: "materials" | "labour", id: string) =>
    apiRequest(`/finance/${kind}/${id}`, { method: "DELETE" }),

  addUpdate: (kind: "materials" | "labour", id: string, data: any) =>
    apiRequest(`/finance/${kind}/${id}/updates`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  removeUpdate: (kind: "materials" | "labour", id: string, updateId: string) =>
    apiRequest(`/finance/${kind}/${id}/updates/${updateId}`, { method: "DELETE" }),

  attach: (form: FormData) =>
    apiRequest("/finance/files", { method: "POST", body: form }),

  removeFile: (id: string) =>
    apiRequest(`/finance/files/${id}`, { method: "DELETE" }),
};

/** Daily logs, client payments and the P&L. */
export const financeRecordsApi = {
  listLogs: (projectId: string) => apiRequest(`/finance/projects/${projectId}/logs`),

  createLog: (projectId: string, data: any) =>
    apiRequest(`/finance/projects/${projectId}/logs`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateLog: (id: string, data: any) =>
    apiRequest(`/finance/logs/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteLog: (id: string) => apiRequest(`/finance/logs/${id}`, { method: "DELETE" }),

  listPayments: (projectId: string) => apiRequest(`/finance/projects/${projectId}/payments`),

  createPayment: (projectId: string, data: any) =>
    apiRequest(`/finance/projects/${projectId}/payments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deletePayment: (id: string) => apiRequest(`/finance/payments/${id}`, { method: "DELETE" }),

  pnl: (projectId: string) => apiRequest(`/finance/projects/${projectId}/pnl`),
};

/** The contractor's private site diary. */
export const financeDiaryApi = {
  list: (projectId: string) => apiRequest(`/finance/projects/${projectId}/diary`),

  create: (projectId: string, data: any) =>
    apiRequest(`/finance/projects/${projectId}/diary`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  remove: (id: string) => apiRequest(`/finance/diary/${id}`, { method: "DELETE" }),
};

/** Inspector oversight — read-only, and never includes the site diary. */
export const financeAdminApi = {
  contractors: () => apiRequest("/finance/admin/contractors"),
  contractor: (contractorId: string) => apiRequest(`/finance/admin/contractors/${contractorId}`),
  project: (projectId: string) => apiRequest(`/finance/admin/projects/${projectId}`),
};
