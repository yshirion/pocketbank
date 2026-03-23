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
