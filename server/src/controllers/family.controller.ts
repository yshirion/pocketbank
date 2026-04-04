import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

async function requireOwnFamily(req: AuthRequest, res: Response, familyId: number): Promise<boolean> {
  const me = await prisma.user.findUnique({ where: { id: req.userId }, select: { familyId: true } });
  if (!me || me.familyId !== familyId) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
}

export async function getFamily(req: AuthRequest, res: Response): Promise<void> {
  const familyId = Number(req.params.id);
  if (!await requireOwnFamily(req, res, familyId)) return;
  const family = await prisma.family.findUnique({ where: { id: familyId } });
  if (!family) { res.status(404).json({ error: 'Family not found' }); return; }
  res.json(family);
}

export async function updateInterests(req: AuthRequest, res: Response): Promise<void> {
  const familyId = Number(req.params.id);
  if (!await requireOwnFamily(req, res, familyId)) return;
  const { loanInterest, investLongInterest, investShortInterest } = req.body as {
    loanInterest: number;
    investLongInterest: number;
    investShortInterest: number;
  };
  const family = await prisma.family.update({
    where: { id: familyId },
    data: { loanInterest, investLongInterest, investShortInterest },
  });
  res.json(family);
}
