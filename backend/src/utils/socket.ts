import { Server as IOServer } from 'socket.io';

let io: IOServer | null = null;

export function initSocket(server: any) {
  if (io) return io;
  io = new IOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    // join a project room
    socket.on('join', (room: string) => {
      if (!room) return;
      socket.join(room);
    });

    socket.on('leave', (room: string) => {
      if (!room) return;
      socket.leave(room);
    });

    socket.on('typing', (payload: any) => {
      const { room, user } = payload || {};
      if (room) socket.to(room).emit('typing', { user });
    });

    socket.on('read', (payload: any) => {
      const { room, user } = payload || {};
      if (room) socket.to(room).emit('read', { user });
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

/**
 * Tells every connected client that something in one of these domains
 * changed, so RealtimeSyncProvider (frontend) can decide whether the page
 * it's looking at needs a re-fetch. A plain io.emit (not room-scoped) —
 * clients aren't joined to per-project rooms outside of chat, and the
 * frontend already filters by domain per page, so a global broadcast is
 * cheap and correct here. Never throws: a missing socket server must not
 * fail the request that triggered the change.
 */
export function broadcastDataChanged(domains: string[], extra: Record<string, any> = {}) {
  try {
    getIO().emit('DATA_CHANGED', { domains, ...extra });
  } catch {
    // Socket.io not initialized (e.g. a script run outside the server) — fine to skip.
  }
}
