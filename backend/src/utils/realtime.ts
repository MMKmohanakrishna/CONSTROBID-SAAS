import { Request, Response, NextFunction } from 'express';
import { getIO } from './socket';

type RealtimePayload = {
  type: string;
  domains: string[];
  method: string;
  url: string;
  projectId?: string;
  conversationId?: string;
  actorId?: string;
  actorRole?: string;
  timestamp: string;
};

function getProjectId(url: string, body: any): string | undefined {
  if (body?.projectId) return String(body.projectId);
  if (body?.conversationId) return String(body.conversationId);

  const match = url.match(/^\/api\/projects\/([^/?]+)/);
  if (!match) return undefined;

  const id = match[1];
  if (['approved', 'quotation-summary'].includes(id)) return undefined;
  return id;
}

function inferRealtimeEvent(method: string, url: string, body: any): Pick<RealtimePayload, 'type' | 'domains'> | null {
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return null;

  if (url.startsWith('/api/messages/send')) {
    return { type: 'MESSAGE_SENT', domains: ['messages', 'notifications', 'projects'] };
  }
  if (url.startsWith('/api/messages/upload')) {
    return { type: 'FILE_UPLOADED', domains: ['messages', 'files', 'designs', 'projects', 'notifications'] };
  }
  if (url.startsWith('/api/notifications')) {
    return { type: method === 'POST' ? 'NOTIFICATION_CREATED' : 'NOTIFICATION_UPDATED', domains: ['notifications'] };
  }
  // Generic uploads are often draft form assets before a project exists.
  // Project-specific file/message endpoints below still broadcast.
  if (url.startsWith('/api/uploads')) return null;
  if (url.startsWith('/api/monitoring')) {
    return { type: 'PROJECT_UPDATED', domains: ['projects', 'monitoring', 'reports', 'analytics'] };
  }
  if (url.startsWith('/api/completion')) {
    return { type: 'PROJECT_STATUS_CHANGED', domains: ['projects', 'completion', 'reports', 'analytics'] };
  }
  if (url.startsWith('/api/reports')) {
    return { type: 'REPORT_UPDATED', domains: ['reports', 'projects', 'analytics'] };
  }
  if (url.startsWith('/api/admin')) {
    return { type: 'ADMIN_DATA_UPDATED', domains: ['admin', 'projects', 'contractors', 'reports', 'analytics'] };
  }
  if (url.startsWith('/api/inspection/contractors')) {
    return { type: 'CONTRACTOR_UPDATED', domains: ['contractors', 'profile', 'notifications', 'admin'] };
  }
  if (url.startsWith('/api/inspection/site-inspections')) {
    if (url.endsWith('/complete') || url.includes('/report')) {
      return { type: 'INSPECTION_COMPLETED', domains: ['projects', 'inspections', 'reports', 'analytics'] };
    }
    return { type: 'INSPECTION_SCHEDULED', domains: ['projects', 'inspections', 'notifications'] };
  }
  if (url.startsWith('/api/inspection/design')) {
    return { type: method === 'POST' ? 'FILE_UPLOADED' : 'DESIGN_APPROVED', domains: ['designs', 'projects', 'notifications'] };
  }

  if (!url.startsWith('/api/projects')) return null;

  if (method === 'POST' && url === '/api/projects') {
    return { type: 'PROJECT_CREATED', domains: ['projects', 'notifications', 'analytics'] };
  }
  if (method === 'DELETE') {
    return { type: 'PROJECT_DELETED', domains: ['projects', 'quotations', 'messages', 'notifications', 'reports', 'analytics'] };
  }
  if (url.endsWith('/publish')) {
    return { type: 'PROJECT_PUBLISHED', domains: ['projects', 'quotations', 'notifications', 'analytics'] };
  }
  if (url.endsWith('/assign')) {
    return { type: 'PROJECT_ASSIGNED', domains: ['projects', 'inspections', 'notifications', 'analytics'] };
  }
  if (url.endsWith('/schedule')) {
    return { type: 'INSPECTION_SCHEDULED', domains: ['projects', 'inspections', 'notifications', 'analytics'] };
  }
  if (url.endsWith('/report') || url.endsWith('/visit') || url.endsWith('/complete-verify')) {
    return { type: 'INSPECTION_COMPLETED', domains: ['projects', 'inspections', 'reports', 'analytics', 'notifications'] };
  }
  if (url.endsWith('/design') || url.endsWith('/select-files')) {
    return { type: 'FILE_UPLOADED', domains: ['projects', 'designs', 'files', 'messages', 'notifications'] };
  }
  if (url.endsWith('/design-review')) {
    return { type: body?.approve ? 'DESIGN_APPROVED' : 'PROJECT_UPDATED', domains: ['projects', 'designs', 'notifications', 'analytics'] };
  }
  if (url.includes('/quotes/') && url.endsWith('/select')) {
    return { type: 'CONTRACTOR_SELECTED', domains: ['projects', 'quotations', 'contractors', 'notifications', 'analytics'] };
  }
  if (url.endsWith('/quote')) {
    return { type: 'QUOTATION_CREATED', domains: ['projects', 'quotations', 'notifications', 'analytics'] };
  }
  if (url.includes('/quotations/')) {
    return { type: 'QUOTATION_UPDATED', domains: ['projects', 'quotations', 'notifications', 'analytics'] };
  }
  if (url.endsWith('/accept-project') || url.endsWith('/confirm-contractor')) {
    return { type: 'PROJECT_STATUS_CHANGED', domains: ['projects', 'contractors', 'notifications', 'analytics'] };
  }
  if (url.endsWith('/completion-request') || url.endsWith('/cancel') || url.endsWith('/dispute')) {
    return { type: 'PROJECT_STATUS_CHANGED', domains: ['projects', 'completion', 'reports', 'notifications', 'analytics'] };
  }

  return { type: 'PROJECT_UPDATED', domains: ['projects', 'notifications', 'analytics'] };
}

export function emitRealtimeEvent(payload: RealtimePayload) {
  try {
    getIO().emit('DATA_CHANGED', payload);
    getIO().emit(payload.type, payload);
  } catch {
    // Socket.IO is best-effort; API writes must not fail if realtime is unavailable.
  }
}

export function realtimeBroadcastMiddleware(req: Request, res: Response, next: NextFunction) {
  res.on('finish', () => {
    if (res.statusCode < 200 || res.statusCode >= 400) return;

    const event = inferRealtimeEvent(req.method, req.originalUrl, req.body);
    if (!event) return;

    emitRealtimeEvent({
      ...event,
      method: req.method,
      url: req.originalUrl,
      projectId: getProjectId(req.originalUrl, req.body),
      conversationId: req.body?.conversationId ? String(req.body.conversationId) : undefined,
      actorId: (req as any).user?.id,
      actorRole: (req as any).user?.role,
      timestamp: new Date().toISOString(),
    });
  });

  next();
}
