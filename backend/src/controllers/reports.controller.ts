import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { InspectionReport, MonitoringReport, CompletionVerification } from '../models';
import logger from '../utils/logger';

function toCsv(rows: any[], columns: string[]) {
  const header = columns.join(',');
  const lines = rows.map(r => columns.map(c => { const v = r[c]; if (v === undefined || v === null) return ''; return String(v).replace(/"/g,'""'); }).map(v => `"${v}"`).join(','));
  return ["\uFEFF" + header, ...lines].join('\n');
}

export async function inspectionCsv(req: AuthenticatedRequest, res: Response) {
  try {
    const rows = await InspectionReport.find({}).lean().exec();
    const columns = ['_id','projectId','inspectorId','scheduledDate','completedDate','status'];
    const csv = toCsv(rows as any, columns);
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition','attachment; filename="inspection_report.csv"');
    return res.send(csv);
  } catch (error) {
    logger.error('inspectionCsv', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function monitoringCsv(req: AuthenticatedRequest, res: Response) {
  try {
    const rows = await MonitoringReport.find({}).lean().exec();
    const columns = ['_id','projectId','summary','createdAt'];
    const csv = toCsv(rows as any, columns);
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition','attachment; filename="monitoring_report.csv"');
    return res.send(csv);
  } catch (error) {
    logger.error('monitoringCsv', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function completionCsv(req: AuthenticatedRequest, res: Response) {
  try {
    const rows = await CompletionVerification.find({}).lean().exec();
    const columns = ['_id','projectId','inspectorId','verificationDate','outcome'];
    const csv = toCsv(rows as any, columns);
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition','attachment; filename="completion_report.csv"');
    return res.send(csv);
  } catch (error) {
    logger.error('completionCsv', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
