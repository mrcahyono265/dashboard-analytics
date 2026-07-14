import type { Response } from 'express';

const clients = new Map<string, Set<Response>>();

export function addSSEClient(userId: string, res: Response): void {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId)!.add(res);

  res.on('close', () => {
    clients.get(userId)?.delete(res);
    if (clients.get(userId)?.size === 0) clients.delete(userId);
  });
}

export function notifyDataUpdated(userId: string): void {
  const userClients = clients.get(userId);
  if (!userClients) return;
  for (const client of userClients) {
    client.write(`event: data-updated\ndata: {}\n\n`);
  }
}
