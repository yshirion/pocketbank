import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function gapMonths( from: Date, to: Date ): number
{
  return ( to.getFullYear() - from.getFullYear() ) * 12 + ( to.getMonth() - from.getMonth() );
}

export function compound( principal: number, ratePercent: number, months: number ): number
{
  return principal * Math.pow( 1 + ratePercent / 100, months );
}

export async function sameFamily( requesterId: number, targetUserId: number ): Promise<boolean>
{
  const [me, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: requesterId }, select: { familyId: true } }),
    prisma.user.findUnique({ where: { id: targetUserId }, select: { familyId: true } }),
  ]);
  return !!me && !!target && me.familyId === target.familyId;
}
