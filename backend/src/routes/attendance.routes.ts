import { Router } from "express";
import { checkIn, getTodayAttendance, getAttendanceHistory, getProjectAttendance } from "../controllers/attendance.controller";
import {
  authenticateToken,
  authorizeRoles,
  Role,
} from "../middlewares/auth";
const router = Router();

router.post(
  "/:projectId/check-in",
  authenticateToken,
  authorizeRoles(Role.CONTRACTOR),
  checkIn
);

router.get(
  "/:projectId/today",
  authenticateToken,
  getTodayAttendance
);

router.get(
  "/:projectId/history",
  authenticateToken,
  getAttendanceHistory
);

router.get(
  "/project/:projectId",
  authenticateToken,
  getProjectAttendance
);

export default router;