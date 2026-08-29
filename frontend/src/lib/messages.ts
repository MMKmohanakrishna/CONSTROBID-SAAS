/**
 * Append a message to a thread, ignoring one we already have.
 *
 * The sender is in the socket room too, so every message they send comes back
 * as a `message` event. Without this guard the send response and the echo both
 * append and the bubble shows twice.
 */
export function appendMessage(current: any[], message: any) {
  if (!message?._id) return [...current, message];
  if (current.some((item) => item?._id === message._id)) return current;
  return [...current, message];
}
