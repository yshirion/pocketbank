import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export async function login( req: Request, res: Response ): Promise<void>
{
  const { username, password } = req.body as { username: string; password: string };

  if( !username || !password )
  {
    res.status( 400 ).json({ error: 'Username and password are required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if( !user )
  {
    res.status( 401 ).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare( password, user.password );
  if( !valid )
  {
    res.status( 401 ).json({ error: 'Invalid credentials' });
    return;
  }

  if( !user.isConfirmed )
  {
    res.status( 403 ).json({ error: 'pending_approval' });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, isParent: user.isParent },
    process.env.JWT_SECRET as string,
    { expiresIn: '12h' }
  );

  res.cookie( 'token', token, {
    httpOnly: true,
    sameSite: 'strict',
    // No maxAge → session cookie: browser deletes it when the tab/window closes
  });

  const { password: _pw, ...safeUser } = user;
  res.json( safeUser );
}

export async function registerParent( req: Request, res: Response ): Promise<void>
{
  const { firstName, lastName, username, password } = req.body as {
    firstName: string;
    lastName: string;
    username: string;
    password: string;
  };

  if( !firstName || !lastName || !username || !password )
  {
    res.status( 400 ).json({ error: 'All fields are required' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if( existing )
  {
    res.status( 409 ).json({ error: 'Username already exists' });
    return;
  }

  const hashed = await bcrypt.hash( password, SALT_ROUNDS );

  const family = await prisma.family.create({ data: { name: lastName } });
  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      username,
      password: hashed,
      isParent: true,
      familyId: family.id,
    },
  });

  const { password: _pw, ...safeUser } = user;
  res.status( 201 ).json( safeUser );
}

export async function registerChild( req: Request, res: Response ): Promise<void>
{
  const { firstName, lastName, username, password, familyId } = req.body as {
    firstName: string;
    lastName: string;
    username: string;
    password: string;
    familyId: number;
  };

  if( !firstName || !lastName || !username || !password || !familyId )
  {
    res.status( 400 ).json({ error: 'All fields are required' });
    return;
  }

  const family = await prisma.family.findUnique({ where: { id: familyId } });
  if( !family )
  {
    res.status( 404 ).json({ error: 'Family not found' });
    return;
  }
  if( family.name !== lastName )
  {
    res.status( 400 ).json({ error: 'Family ID and last name do not match' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if( existing )
  {
    res.status( 409 ).json({ error: 'Username already exists' });
    return;
  }

  const hashed = await bcrypt.hash( password, SALT_ROUNDS );
  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      username,
      password: hashed,
      isParent: false,
      isConfirmed: false,
      familyId,
    },
  });

  const { password: _pw, ...safeUser } = user;
  res.status( 201 ).json( safeUser );
}

export function logout( _req: Request, res: Response ): void
{
  res.clearCookie( 'token' );
  res.json({ message: 'Logged out' });
}
