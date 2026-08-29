import { Project } from '../models';

/**
 * The BOQ paywall has to hold on the server, not just in the UI: a client who
 * has not paid must never receive the file URL, or they could read it straight
 * out of the API response.
 *
 * Only clients are gated. Inspectors, contractors and admins always see the BOQ.
 */
export async function shouldHideBoq(projectId: any, role?: string) {
  if (role !== 'CLIENT') return false;
  if (!projectId) return false;

  const project = await Project.findById(projectId).select('boqUnlocked').lean().exec();
  return !(project as any)?.boqUnlocked;
}

/** Replaces the URL with a locked marker, keeping the row visible in the UI. */
function lockFile<T extends Record<string, any>>(file: T) {
  return { ...file, fileUrl: '', url: '', locked: true };
}

export function redactBoqFiles(files: any[] = []) {
  return files.map((file) => lockFile(file));
}

/** Strips BOQ URLs from chat attachments while leaving Design attachments alone. */
export function redactBoqAttachments(messages: any[] = []) {
  return messages.map((message) => {
    const attachments = message?.attachments;
    if (!Array.isArray(attachments) || attachments.length === 0) return message;

    let changed = false;

    const next = attachments.map((attachment: any) => {
      if (String(attachment?.type || '').toLowerCase() !== 'boq') return attachment;
      changed = true;
      return lockFile(attachment);
    });

    return changed ? { ...message, attachments: next } : message;
  });
}
