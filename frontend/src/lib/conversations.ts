/**
 * Project statuses whose conversations are shown in the messages list.
 *
 * The unread badge and the list must agree on this: counting a conversation the
 * list hides leaves a badge the user cannot clear, because they can never open
 * the thread to mark it read.
 */
export const VISIBLE_CONVERSATION_STATUSES = ["INSPECTION_COMPLETED"];

export function filterConversations<T extends { projectStatus?: string }>(data: T[]): T[] {
  if (!Array.isArray(data)) return [];
  return data.filter((item) => VISIBLE_CONVERSATION_STATUSES.includes(item.projectStatus as string));
}
