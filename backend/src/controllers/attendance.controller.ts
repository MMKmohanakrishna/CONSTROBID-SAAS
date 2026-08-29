import { Request, Response } from "express";
import { Attendance } from "../models/Attendance";
import { Project } from "../models/Project";

export const checkIn = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const contractorId = (req as any).user.contractorId;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (
      project.selectedContractor?.toString() !== contractorId &&
      project.contractorId?.toString() !== contractorId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this project.",
      });
    }

    if (!project.contractorSiteVisited) {
      return res.status(400).json({
        success: false,
        message: "Complete the Site Visit before checking in.",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      projectId: project._id,
      contractorId,
      attendanceDate: today,
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for today.",
      });
    }

    const attendance = await Attendance.create({
      projectId: project._id,
      contractorId,
      clientId: project.clientId,

      attendanceDate: today,
      checkInTime: new Date(),

      status: "PRESENT",
    });

    return res.status(201).json({
      success: true,
      message: "Attendance marked successfully.",
      attendance,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTodayAttendance = async (
  req: Request,
  res: Response
) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const contractorId =
      project.selectedContractor || project.contractorId;

    console.log("========== ATTENDANCE DEBUG ==========");
    console.log("Project ID:", project._id);
    console.log("Selected Contractor:", project.selectedContractor);
    console.log("Contractor ID:", project.contractorId);
    console.log("Using Contractor:", contractorId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      projectId: project._id,
      contractorId,
      attendanceDate: today,
    });

    if (!attendance) {
      attendance = await Attendance.findOne({
        projectId: project._id,
        attendanceDate: today,
      });
    }

    console.log("Attendance Found:", attendance);

    return res.status(200).json({
      success: true,
      attendance,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAttendanceHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const { projectId } = req.params;

    const contractorId = (req as any).user.contractorId;

    const attendanceHistory = await Attendance.find({
      projectId,
      contractorId,
    })
      .sort({ attendanceDate: -1 });

    return res.status(200).json({
      success: true,
      attendanceHistory,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProjectAttendance = async (
  req: Request,
  res: Response
) => {
  try {
    const { projectId } = req.params;
    const { from, status, page = '1', limit = '12' } =
  req.query as Record<string, string>;
    const user = (req as any).user;

    const project = await Project.findById(projectId)
      .populate('contractorId', 'name')
      .populate('assignedInspectorId', '_id')
      .lean()
      .exec();

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const extractId = (value: any) => {
      if (!value) return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'object') return String(value._id || value);
      return String(value);
    };

    const allowed = (() => {
      if (user.role === 'ADMIN') return true;
      if (user.role === 'CLIENT') return extractId(project.clientId) === extractId(user.clientId);
      if (user.role === 'CONTRACTOR') {
        const contractorId = extractId(user.contractorId);
        return [extractId(project.contractorId), extractId(project.selectedContractor)].includes(contractorId);
      }
      if (user.role === 'INSPECTION_TEAM' || user.role === 'INSPECTOR') {
        const assignedInspectorId = extractId(project.assignedInspectorId);
        const currentInspectorId = extractId(user.inspectionTeamId);
        return !assignedInspectorId || assignedInspectorId === currentInspectorId;
      }
      return false;
    })();

    if (!allowed) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this attendance data.' });
    }

    const query: any = { projectId: project._id };

    if (status) query.status = status;

    if (from) {
  const startDate = new Date(from);
  startDate.setHours(0, 0, 0, 0);

  query.attendanceDate = {
    $gte: startDate,
  };
}

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(50, parseInt(limit, 10)));
    const totalCount = await Attendance.countDocuments(query);

    const attendance = await Attendance.find(query)
      .sort({ attendanceDate: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean()
      .exec();

    const summaryAggregation = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalHours: {
            $sum: {
              $cond: [
                { $and: ['$checkInTime', '$checkOutTime'] },
                {
                  $divide: [
                    { $subtract: ['$checkOutTime', '$checkInTime'] },
                    1000 * 60 * 60,
                  ],
                },
                0,
              ],
            },
          },
        },
      },
    ]).exec();

    const summary = summaryAggregation.reduce(
      (acc, item) => {
        if (item._id === 'PRESENT') acc.presentDays += item.count;
        if (item._id === 'ABSENT') acc.absentDays += item.count;
        if (item._id === 'HALF_DAY') acc.halfDays += item.count;
        if (item._id === 'LEAVE') acc.leaveDays += item.count;
        acc.totalWorkingHours += item.totalHours || 0;
        return acc;
      },
      { presentDays: 0, absentDays: 0, halfDays: 0, leaveDays: 0, totalWorkingHours: 0 },
    );

    return res.status(200).json({
      success: true,
      project,
      summary,
      attendance,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
        totalRecords: totalCount,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};