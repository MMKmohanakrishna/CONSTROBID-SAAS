import { Request, Response } from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import { getIO } from '../utils/socket';
import { Message, Notification, Project, Client, User } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth';
import { InspectionTeam } from "../models/InspectionTeam";
import { shouldHideBoq, redactBoqAttachments } from '../utils/boqAccess';
import { sendEmail } from '../config/mailer';

const { ObjectId } = mongoose.Types;

/**
 * A client may only touch conversations for their own projects. Inspectors and
 * admins coordinate across projects, so they are not restricted here.
 *
 * Returns null when access is allowed, or the error to send back.
 */
async function denyForeignConversation(
  req: AuthenticatedRequest,
  conversationId: any
): Promise<{ status: number; error: string } | null> {
  if (req.user?.role !== 'CLIENT') return null;

  const project = await Project.findById(conversationId).lean().exec();
  if (!project) return { status: 404, error: 'Conversation not found' };

  const client = await Client.findById((project as any).clientId).lean().exec();
  const clientUserId = (client as any)?.userId;

  if (!clientUserId || String(clientUserId) !== String(req.user?.id)) {
    return { status: 403, error: 'Not authorised for this conversation' };
  }

  return null;
}

// Keep in step with CHANGE_REQUEST_LIMIT in ClientConversation.tsx.
const CHANGE_REQUEST_LIMIT = 3;

function buildChangeRequestEscalationMessage(projectTitle?: string) {
  const project = projectTitle ? `"${projectTitle}"` : "your project";

  return [
    `Thank you for sharing your detailed feedback on the Design and BOQ for ${project}.`,
    "",
    `We have now received ${CHANGE_REQUEST_LIMIT} revision requests on this project. ` +
      "To ensure your requirements are captured accurately and without further delay, " +
      "we are assigning a dedicated ConstroBID project specialist to take this forward personally.",
    "",
    "What happens next:",
    "1. Our specialist will contact you shortly to understand your requirements in detail.",
    "2. Based on that discussion, our team will prepare and finalise the Design and BOQ on your behalf.",
    "3. The confirmed set will be shared with you here for your final approval.",
    "",
    "No further action is required from you at this stage. Should you wish to add anything " +
      "in the meantime, please feel free to reply in this conversation and we will include it " +
      "in our review.",
    "",
    "We appreciate your patience and look forward to finalising this for you.",
    "",
    "Warm regards,",
    "ConstroBID Inspection Team",
  ].join("\n");
}

/**
 * Once the client has sent their allowed number of change requests, the
 * inspection team replies once, automatically, so the thread does not simply go
 * quiet behind a disabled button. Posted from the assigned inspector's account
 * so it reads as a reply in the conversation rather than a UI notice.
 */
async function maybeEscalateChangeRequests(
  convId: InstanceType<typeof ObjectId>,
  projectId: string,
  clientUserId?: string
) {
  const count = await Message.countDocuments({
    conversationId: convId,
    'meta.kind': 'CHANGE_REQUEST',
  });

  // Fire on the threshold only, so repeated calls cannot post it twice.
  if (count !== CHANGE_REQUEST_LIMIT) return;

  const project = await Project.findById(projectId);
  if (!project?.assignedInspectorId) return;

  const inspector = await InspectionTeam.findById(project.assignedInspectorId);
  if (!inspector?.userId) return;

  const content = buildChangeRequestEscalationMessage(project.title);

  const autoMessage = await Message.create({
    conversationId: convId,
    from: inspector.userId,
    to: clientUserId ? new ObjectId(String(clientUserId)) : undefined,
    content,
    meta: { kind: 'CHANGE_REQUEST_ESCALATION', automated: true },
  });

  const populated = await Message.findById(autoMessage._id)
    .populate('from', 'email role')
    .lean();

  try {
    getIO().to(String(convId)).emit('message', populated);
  } catch (e) {}

  if (clientUserId) {
    await Notification.create({
      recipient: new ObjectId(String(clientUserId)),
      title: 'ConstroBID Inspection Team',
      // The bell shows a one-line summary; the full note lives in the thread.
      message:
        'A ConstroBID project specialist will contact you shortly to finalise your Design and BOQ.',
      read: false,
    });
  }
}

export async function sendMessage(req: AuthenticatedRequest, res: Response) {
  try {
    const { to, conversationId, content, attachments, meta } = req.body as any;
    if (!content || (!to && !conversationId)) return res.status(400).json({ error: 'to or conversationId and content required' });

    if (conversationId && ObjectId.isValid(conversationId)) {
      const denied = await denyForeignConversation(req, conversationId);
      if (denied) return res.status(denied.status).json({ error: denied.error });
    }

    const convId = conversationId && ObjectId.isValid(conversationId) ? new ObjectId(conversationId) : new ObjectId();
    let recipientId = to;
  
if (!recipientId && conversationId) {
    const project = await Project.findById(conversationId);

    console.log("PROJECT:", project);

    

    if (project) {
        if (
    req.user?.role === "INSPECTION_TEAM" ||
    req.user?.role === "INSPECTOR"
) {
            const client = await Client.findById(project.clientId);

            console.log("CLIENT:", client);

            if (client?.userId) {
                recipientId = client.userId;
            }
        }

        if (req.user?.role === "CLIENT") {

    const inspector = await InspectionTeam.findById(
        project.assignedInspectorId
    );
    console.log("INSPECTOR DOCUMENT:", inspector);

    if (inspector?.userId) {
        recipientId = inspector.userId;
    console.log("INSPECTOR USER ID:", recipientId);
    }
}
    }
}

console.log("ROLE:", req.user?.role);
console.log("RECIPIENT:", recipientId);

const msg = await Message.create({
    conversationId: convId,
    from: new ObjectId(req.user?.id),
    to: recipientId
        ? new ObjectId(String(recipientId))
        : undefined,
    content,
    attachments: attachments || [],
    meta: meta || undefined,
});
    if (conversationId) {
    const project = await Project.findById(conversationId);

    if (project) {
    console.log("PROJECT:", project);
    console.log("ASSIGNED:", project.assignedInspectorId);
    console.log("CLIENT:", project.clientId)

        // CLIENT NOTIFICATION
        if (project.clientId) {
            const client = await Client.findById(project.clientId);

            if (
                client?.userId &&
                String(client.userId) !== String(req.user?.id)
            ) {
                await Notification.create({
                    recipient: client.userId,
                    title: "New Message",
                    message: content,
                    read: false,
                });

                try {
                    const clientUser = await User.findById(client.userId).lean().exec();
                    const clientEmail = (clientUser as any)?.email;
                    if (clientEmail) {
                        await sendEmail({
                            to: clientEmail,
                            templateType: 'NEW_MESSAGE_CLIENT',
                            context: {
                                clientName: (client as any)?.name || '',
                                projectTitle: project.title || 'Your Project',
                                preview: String(content).slice(0, 140),
                            },
                        });
                    }
                } catch (emailError) {
                    logger.error('sendMessage client email failed', emailError);
                }
            }
        }

        // INSPECTOR NOTIFICATION
        if (project.assignedInspectorId) {

      // Debug logs to help trace notification recipient resolution
      console.log("Logged User:", req.user?.id);
      console.log("Project Inspector:", project.assignedInspectorId);

      const inspectorProfile = await InspectionTeam.findById(project.assignedInspectorId);
      console.log("Inspector Profile:", inspectorProfile);
      console.log("Inspector User:", inspectorProfile?.userId);

      const inspector = inspectorProfile;

      if (
        inspector?.userId &&
        String(inspector.userId) !== String(req.user?.id)
      ) {
        await Notification.create({
          recipient: inspector.userId,
          title: "New Message",
          message: content,
          read: false,
        });
      }
}
    }
}
    await msg.save();

const populatedMessage = await Message.findById(msg._id)
  .populate("from", "email role")
  .lean();

try {
    getIO()
      .to(String(convId))
      .emit("message", populatedMessage);
} catch (e) {}

if (meta?.kind === 'CHANGE_REQUEST' && req.user?.role === 'CLIENT' && conversationId) {
  try {
    await maybeEscalateChangeRequests(convId, String(conversationId), req.user?.id);
  } catch (e) {
    // Best effort: the client's change request itself must still succeed.
    logger.error('changeRequestEscalation', e);
  }
}

return res.status(201).json(populatedMessage);

} catch (error) {
  logger.error("sendMessage", error);
  return res.status(500).json({
    error: "Internal server error",
  });
}

}

export async function listConversations(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    console.log("USER:", req.user);
    const userId = new ObjectId(req.user?.id);

    console.log("USER:", userId);

    // A client must never see another client's project conversations.
    const projectFilter: any = {
      status: {
        $in: [
          "INSPECTION_COMPLETED",
          "PROJECT_PUBLISHED",
        ]
      }
    };

    if (req.user?.role === 'CLIENT') {
      const client = await Client.findOne({ userId }).lean().exec();
      if (!client) return res.json([]);
      projectFilter.clientId = (client as any)._id;
    }

    const projects = await Project.find(projectFilter)
.populate({
  path: "clientId",
  select: "name"
})
.select("title status clientId")
.lean();
    console.log("REQUEST USER:", req.user);
    

    const conversations: any[] = [];

for (const project of projects) {

  const latestMessage = await Message.findOne({
    conversationId: project._id,
  })
    .sort({ createdAt: -1 })
    .lean();

  let chatWith = "Client";

  if (req.user?.role === "CLIENT") {
    chatWith = latestMessage ? "Inspector" : "Inspector";
  } else {
    chatWith = (project.clientId as any)?.name || "Client";
  }

  // Count anything in the thread that this user did not send. Relying on `to`
  // misses uploads (which carry no recipient) and any message whose recipient
  // could not be resolved.
  const unread = latestMessage
    ? await Message.countDocuments({
        conversationId: project._id,
        from: { $ne: userId },
        read: false,
      })
    : 0;

  conversations.push({
    conversationId: project._id,
    projectTitle: project.title,
    projectStatus: project.status,
    chatWith,
    lastMessage:
      latestMessage || {
        content: "No messages yet",
        createdAt: new Date(),
      },
    unreadCount: unread,
  });
}

    for (const c of conversations) {
      console.log(
    "Conversation:",
    c.conversationId,
    "Unread:",
    c.unreadCount
);
    }

    return res.json(conversations);
  } catch (error) {
  logger.error("sendMessage", error);
  return res.status(500).json({
    error: "Internal server error",
  });
}
}


export async function conversationDetail(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid conversation id' });

    const denied = await denyForeignConversation(req, id);
    if (denied) return res.status(denied.status).json({ error: denied.error });

    const msgs = await Message.find({
  conversationId: new ObjectId(id)
})
.populate("from", "email role")
.sort({ createdAt: 1 })
.lean()
.exec();

    // The conversation id is the project id. Clients who have not paid the BOQ
    // unlock get the rows but not the URLs.
    const hideBoq = await shouldHideBoq(id, req.user?.role);

    return res.json(hideBoq ? redactBoqAttachments(msgs) : msgs);
  } catch (error) {
    logger.error('conversationDetail', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function markRead(req: AuthenticatedRequest, res: Response) {
  try {
    const { conversationId } = req.body as any;
    if (!conversationId || !ObjectId.isValid(conversationId)) return res.status(400).json({ error: 'conversationId required' });

    const denied = await denyForeignConversation(req, conversationId);
    if (denied) return res.status(denied.status).json({ error: denied.error });

    const userId = new ObjectId(req.user?.id);
    // Mirrors the unread rule in listConversations: everything in the thread
    // this user did not send is theirs to read.
    await Message.updateMany({ conversationId: new ObjectId(conversationId), from: { $ne: userId }, read: false }, { $set: { read: true } }).exec();
    try {
      getIO().to(String(conversationId)).emit('read', { userId: String(userId) });
    } catch (e) {}
    return res.json({ ok: true });
  } catch (error) {
    logger.error('markRead', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function uploadFiles(req: AuthenticatedRequest, res: Response) {
  try {
    const files = (req as any).files || [];
    const { projectId, fileCategory } = req.body as any;
    console.log("=================================");
console.log("FILE CATEGORY:", fileCategory);
console.log("PROJECT ID:", projectId);
console.log("=================================");
    if (!projectId) return res.status(400).json({ error: 'projectId required' });
    
    const saved: any[] = [];
    for (const f of files) {
      const fileUrl = f.path || f.secure_url || f.url || null;
      const fileType = String(f.mimetype || '').startsWith('image') ? 'IMAGE' : 'DOCUMENT';
      const pf = await (await import('../models/ProjectFile')).ProjectFile.create({
        projectId: new ObjectId(projectId), fileUrl, fileType, uploadedBy: 'INSPECTOR', meta: { originalName: f.originalname, category: fileCategory || 'DESIGN' },
      } as any);
      console.log("Saved File:");
      console.log(pf);
      saved.push(pf);
    }
    

    // create a message to notify client and attach to project conversation
    const convId = ObjectId.isValid(projectId) ? new ObjectId(projectId) : new ObjectId();
    const msg = await Message.create({
  conversationId: convId,
  from: new ObjectId(req.user?.id),
  content: `${files.length} file(s) uploaded`,
  attachments: saved.map((s: any) => ({
    fileId: s._id,

    url: s.fileUrl,

    name: s.meta?.originalName || "File",

    type: (s.meta?.category || "DESIGN").toLowerCase(),
  })),
});
    // Populate before broadcasting: the chat views key off `from.email` to decide
    // which side a bubble belongs on, so a raw ObjectId would misattribute it.
    const populatedMessage = await Message.findById(msg._id)
      .populate("from", "email role")
      .lean();

    // A room broadcast reaches every member, so it cannot carry a BOQ URL: an
    // unpaid client is in that room too. Both sides refetch over HTTP when a BOQ
    // arrives, which applies the per-role rules.
    const broadcastMessage = redactBoqAttachments([populatedMessage])[0];

    try {
      // `message` is what the client and inspector conversation views listen on,
      // so the upload lands in both threads without a refresh. `files.uploaded`
      // stays for RealtimeSyncProvider.
      getIO().to(String(convId)).emit('message', broadcastMessage);
      getIO().to(String(convId)).emit('files.uploaded', { uploaded: saved, message: broadcastMessage });
    } catch (e) {}

    // send email to client (if project has client email) - best effort
    try {
      const Project = (await import('../models/Project')).Project;
      const project = await Project.findById(projectId).lean().exec() as any;
      if (project && project.clientEmail) {
        const { sendEmail } = await import('../config/mailer');
        await sendEmail({ to: project.clientEmail, templateType: 'DESIGN_SUBMITTED', context: { projectTitle: project.title || 'Your Project', message: 'Your Design is ready.' } });
      }
    } catch (e) {
      // swallow
    }

return res.json({
    uploaded: saved,
    message: populatedMessage
});
  } catch (error) {
    logger.error('uploadFiles', error);
    return res.status(500).json({ error: 'upload failed' });
  }
}

export async function requestChanges(req: AuthenticatedRequest, res: Response) {
  try {
    const { projectId, notes } = req.body as any;
    if (!projectId || !notes) return res.status(400).json({ error: 'projectId and notes required' });
    // create message
    const convId = ObjectId.isValid(projectId) ? new ObjectId(projectId) : new ObjectId();
    const msg = await Message.create({ conversationId: convId, from: new ObjectId(req.user?.id), content: `Client requested changes: ${notes}` });
    try { getIO().to(String(convId)).emit('changes.requested', { message: msg }); } catch (e) {}

    // update project status
    try {
      const Project = (await import('../models/Project')).Project;
      await Project.findByIdAndUpdate(projectId, { status: 'CHANGES_REQUESTED' }).exec();
    } catch (e) {}

    // email notification to inspector(s)
    try {
      const proj = (await import('../models/Project')).Project;
      const project = await proj.findById(projectId).lean().exec() as any;
      if (project && project.inspectorEmail) {
        const { sendEmail } = await import('../config/mailer');
        await sendEmail({ to: project.inspectorEmail, templateType: 'CLIENT_REQUESTED_CHANGES', context: { projectTitle: project.title || '', notes } });
      }
    } catch (e) {}

    return res.json({ ok: true, message: msg });
  } catch (error) {
    logger.error('requestChanges', error);
    return res.status(500).json({ error: 'request failed' });
  }
}

export async function approveProject(req: AuthenticatedRequest, res: Response) {
  try {
    const { projectId } = req.body as any;
    if (!projectId) return res.status(400).json({ error: 'projectId required' });
    // update project status
    try {
      const Project = (await import('../models/Project')).Project;
      await Project.findByIdAndUpdate(projectId, { status: 'APPROVED' }).exec();
    } catch (e) {}

    // create message
    const convId = ObjectId.isValid(projectId) ? new ObjectId(projectId) : new ObjectId();
    const msg = await Message.create({ conversationId: convId, from: new ObjectId(req.user?.id), content: `Project approved` });
    try { getIO().to(String(convId)).emit('project.approved', { message: msg }); } catch (e) {}

    // notify inspector
    try {
      const Project = (await import('../models/Project')).Project;
      const project = await Project.findById(projectId).lean().exec() as any;
      if (project && project.inspectorEmail) {
        const { sendEmail } = await import('../config/mailer');
        await sendEmail({ to: project.inspectorEmail, templateType: 'PROJECT_APPROVED', context: { projectTitle: project.title || '' } });
      }
    } catch (e) {}

    return res.json({ ok: true, message: msg });
  } catch (error) {
    logger.error('approveProject', error);
    return res.status(500).json({ error: 'approve failed' });
  }
}
