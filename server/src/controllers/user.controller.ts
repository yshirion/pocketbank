import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  const { password: _pw, ...safeUser } = user;
  res.json(safeUser);
}

export async function getFamilyChildren(req: AuthRequest, res: Response): Promise<void> {
  const children = await prisma.user.findMany({
    where: { familyId: Number(req.params.familyId), isParent: false },
    select: { id: true, firstName: true, lastName: true, username: true, balance: true, familyId: true, isParent: true },
  });
  res.json(children);
}

export async function getFamilyParents(req: AuthRequest, res: Response): Promise<void> {
  const parents = await prisma.user.findMany({
    where: { familyId: Number(req.params.familyId), isParent: true },
    select: { id: true, firstName: true, lastName: true, username: true, balance: true, familyId: true, isParent: true },
  });
  res.json(parents);
}

export async function promoteToParent(req: AuthRequest, res: Response): Promise<void> {
  const id = Number(req.params.id);
  await prisma.$transaction([
    prisma.action.deleteMany({ where: { userId: id } }),
    prisma.loan.deleteMany({ where: { userId: id } }),
    prisma.invest.deleteMany({ where: { userId: id } }),
    prisma.user.update({ where: { id }, data: { isParent: true, balance: 0 } }),
  ]);
  res.json({ message: 'User promoted to parent' });
}

export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  await prisma.user.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: 'User deleted' });
}
