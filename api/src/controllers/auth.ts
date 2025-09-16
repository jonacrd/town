import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

interface WhatsAppAuthRequest {
  phone: string;
  name: string;
}

// POST /auth/whatsapp - Registro/login con WhatsApp
export const whatsappAuth = async (req: Request, res: Response) => {
  try {
    const { phone, name }: WhatsAppAuthRequest = req.body;

    if (!phone || !name) {
      return res.status(400).json({
        success: false,
        error: 'Phone and name are required'
      });
    }

    // Normalizar número de teléfono
    const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;

    // Buscar usuario existente o crear uno nuevo
    let user = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });

    if (user) {
      // Usuario existe, actualizar nombre si es diferente
      if (user.name !== name) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name }
        });
      }
      
      logger.info({ userId: user.id, phone: normalizedPhone }, 'User login');
    } else {
      // Crear nuevo usuario
      user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          name,
          role: 'CUSTOMER'
        }
      });
      
      logger.info({ userId: user.id, phone: normalizedPhone }, 'New user registered');
    }

    res.json({
      success: true,
      data: {
        userId: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    logger.error(error, 'Error in WhatsApp auth');
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// POST /auth/toggle-seller - Cambiar a vendedor
export const toggleSeller = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { seller: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.seller) {
      // Ya es vendedor
      return res.json({
        success: true,
        data: {
          userId: user.id,
          role: user.role,
          seller: user.seller
        }
      });
    }

    // Actualizar rol a SELLER
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: 'SELLER' }
    });

    // Crear perfil de vendedor
    const seller = await prisma.seller.create({
      data: {
        userId: user.id,
        storeName: `Tienda de ${user.name}`,
        tower: 'Sin especificar'
      }
    });

    logger.info({ userId, sellerId: seller.id }, 'User became seller');

    res.json({
      success: true,
      data: {
        userId: updatedUser.id,
        role: updatedUser.role,
        seller
      }
    });

  } catch (error) {
    logger.error(error, 'Error toggling seller');
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
