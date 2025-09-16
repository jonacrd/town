import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// POST /auth/otp/start - Generar y enviar OTP
router.post('/start', async (req, res, next) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'phone requerido' });
    }

    // Generar código OTP de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Expiración en 10 minutos
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Limpiar OTPs anteriores para este teléfono
    await prisma.otp.deleteMany({
      where: { phone }
    });

    // Crear nuevo OTP
    await prisma.otp.create({
      data: {
        phone,
        code,
        expiresAt,
        tries: 0
      }
    });

    // Enviar OTP según proveedor
    const whatsappProvider = process.env.WHATSAPP_PROVIDER || 'mock';
    
    if (whatsappProvider === 'mock') {
      // Enmascarar número para logs (mostrar solo últimos 4 dígitos)
      const maskedPhone = phone.replace(/(\+\d{1,3})\d+(\d{4})/, '$1****$2');
      console.log(`📱 OTP ${code} para ${maskedPhone}`);
    } else {
      // Aquí se integraría con Meta/Twilio en el futuro
      console.log(`🚀 Enviar OTP ${code} a ${phone} via ${whatsappProvider}`);
    }

    res.json({ 
      success: true, 
      message: 'Código OTP enviado',
      expiresIn: 600 // 10 minutos en segundos
    });

  } catch (error) {
    next(error);
  }
});

// POST /auth/otp/verify - Verificar OTP y autenticar usuario
router.post('/verify', async (req, res, next) => {
  try {
    const { phone, code, name } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: 'phone y code requeridos' });
    }

    // Buscar OTP válido
    const otp = await prisma.otp.findFirst({
      where: {
        phone,
        expiresAt: {
          gte: new Date() // No expirado
        }
      },
      orderBy: {
        createdAt: 'desc' // Más reciente
      }
    });

    if (!otp) {
      return res.status(400).json({ error: 'Código expirado o inválido' });
    }

    // Verificar número de intentos
    if (otp.tries >= 3) {
      return res.status(400).json({ error: 'Demasiados intentos. Solicita un nuevo código' });
    }

    // Incrementar intentos
    await prisma.otp.update({
      where: { id: otp.id },
      data: { tries: otp.tries + 1 }
    });

    // Verificar código
    if (otp.code !== code) {
      return res.status(400).json({ 
        error: 'Código incorrecto',
        triesLeft: 3 - (otp.tries + 1)
      });
    }

    // Código correcto - eliminar OTP usado
    await prisma.otp.delete({
      where: { id: otp.id }
    });

    // Crear o actualizar usuario
    const user = await prisma.user.upsert({
      where: { phone },
      update: name ? { name } : {},
      create: {
        phone,
        name: name || null,
        role: 'CUSTOMER'
      }
    });

    console.log(`✅ Usuario autenticado: ${user.name || 'Sin nombre'} (${user.phone}) -> ${user.id}`);

    res.json({ 
      success: true,
      userId: user.id,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    next(error);
  }
});

export default router;
