import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const r = Router();

r.post('/whatsapp', async (req, res, next) => {
  try {
    const { phone, name } = req.body as { phone: string; name?: string };
    if (!phone) return res.status(400).json({ error: 'phone requerido' });
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({ data: { phone, name: name || null, role: 'CUSTOMER' } });
    }
    res.json({ userId: user.id });
  } catch (e) { next(e); }
});

export default r;
