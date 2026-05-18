import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export interface AuthRequest extends express.Request {
  user?: {
    id: string;
    role: string;
    workspaceId: string | null;
    departmentId: string | null;
    permissions: string[];
  };
}

export const authMiddleware = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/auth') || req.path.startsWith('/health')) {
    return next();
  }

  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT workspace_id, department_id, role, role_id FROM users WHERE id = ?').get(decoded.id) as any;
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    let permissions: string[] = [];
    if (user.role === 'Owner') {
      permissions = ['switch_workspace']; // Owner bypass
    } else if (user.role_id) {
      const roleObj = db.prepare('SELECT permissions FROM roles WHERE id = ?').get(user.role_id) as any;
      if (roleObj && roleObj.permissions) {
        try {
          permissions = JSON.parse(roleObj.permissions);
        } catch (e) {}
      }
    }

    req.user = {
      id: decoded.id,
      role: user.role,
      workspaceId: user.workspace_id || null,
      departmentId: user.department_id || null,
      permissions
    };
    return next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const checkPermission = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
