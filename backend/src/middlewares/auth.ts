import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Client, Contractor, InspectionTeam } from '../models';

export enum Role {
    CLIENT = 'CLIENT',
    CONTRACTOR = 'CONTRACTOR',
    INSPECTION_TEAM = 'INSPECTION_TEAM',
    INSPECTOR = 'INSPECTOR',
    ADMIN = 'ADMIN'
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-constrobid-key-change-in-prod';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    clientId?: string;
    contractorId?: string;
    inspectionTeamId?: string;
  };
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: Role;
    };

    // Find profiles corresponding to role for easy access in controllers
    let clientId: string | undefined;
    let contractorId: string | undefined;
    let inspectionTeamId: string | undefined;

    if (decoded.role === Role.CLIENT) {
      const c = await Client.findOne({ userId: decoded.id }).lean().exec() as any;
      clientId = c?._id ? String(c._id) : undefined;
    } else if (decoded.role === Role.CONTRACTOR) {
      const c = await Contractor.findOne({ userId: decoded.id }).lean().exec() as any;
      contractorId = c?._id ? String(c._id) : undefined;
    } else if (
    decoded.role === Role.INSPECTION_TEAM ||
    decoded.role === Role.INSPECTOR
) {
      const i = await InspectionTeam.findOne({ userId: decoded.id }).lean().exec() as any;
      inspectionTeamId = i?._id ? String(i._id) : undefined;
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      clientId,
      contractorId,
      inspectionTeamId,
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function authorizeRoles(...roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}
