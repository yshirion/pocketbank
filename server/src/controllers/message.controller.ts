import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export async function getInbox(req: AuthRequest, res: Response): Promise<void> {
  const messages = await prisma.message.findMany({
    where: { receiverId: Number(req.params.userId) },
    orderBy: { createdAt: 'desc' },
  });
  res.json(messages);
}

export async function getSent(req: AuthRequest, res: Response): Promise<void> {
  const messages = await prisma.message.findMany({
    where: { senderId: Number(req.params.userId) },
    orderBy: { createdAt: 'desc' },
  });
  res.json(messages);
}

export async function sendMessage(req: AuthRequest, res: Response): Promise<void> {
  const { receiverId, content } = req.body as { receiverId: number; content: string };

  const sender = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!sender) { res.status(404).json({ error: 'Sender not found' }); return; }

  const message = await prisma.message.create({
    data: {
      senderId: sender.id,
      receiverId,
      senderName: sender.firstName,
      content,
    },
  });

  res.status(201).json(message);
}

export async function markRead(req: AuthRequest, res: Response): Promise<void> {
  const ids = (req.body as { ids: number[] }).ids;
  await prisma.message.updateMany({ where: { id: { in: ids } }, data: { isRead: true } });
  res.json({ message: 'Marked as read' });
}

export async function getConversation(req: AuthRequest, res: Response): Promise<void> {
  const myId = req.userId!;
  const otherId = Number(req.params.otherUserId);

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  res.json(messages);
}

export async function getChildThread(req: AuthRequest, res: Response): Promise<void> {
  const childId = Number(req.params.childId);

  const child = await prisma.user.findUnique({ where: { id: childId } });
  if (!child) { res.status(404).json({ error: 'Not found' }); return; }

  const requester = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!requester || requester.familyId !== child.familyId) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: childId }, { receiverId: childId }] },
    orderBy: { createdAt: 'asc' },
  });

  res.json(messages);
}

export async function getUnreadCounts(req: AuthRequest, res: Response): Promise<void> {
  const myId = req.userId!;

  const rows = await prisma.message.groupBy({
    by: ['senderId'],
    where: { receiverId: myId, isRead: false },
    _count: { id: true },
  });

  const counts: Record<number, number> = {};
  for (const row of rows) counts[row.senderId] = row._count.id;

  res.json(counts);
}
