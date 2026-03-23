import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export async function getFamily(req: AuthRequest, res: Response): Promise<void> {
  const family = await prisma.family.findUnique({ where: { id: Number(req.params.id) } });
  if (!family) { res.status(404).json({ error: 'Family not found' }); return; }
  res.json(family);
}

export async function updateInterests(req: AuthRequest, res: Response): Promise<void> {
  const { loanInterest, investLongInterest, investShortInterest } = req.body as {
    loanInterest: number;
    investLongInterest: number;
    investShortInterest: number;
  };
  const family = await prisma.family.update({
    where: { id: Number(req.params.id) },
    data: { loanInterest, investLongInterest, investShortInterest },
  });
  res.json(family);
}
