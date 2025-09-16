import { useState, useEffect } from 'react';
import { api, formatPrice, createWhatsAppLink, type CreateOrderData } from '../../utils/fetcher';

interface OrderItem {
  id: string;
  title: string;
  priceCents: number;
  quantity: number;
  imageUrl?: string;
}

interface OrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  minimumOrderCents?: number;
}

export default function OrderDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  minimumOrderCents = 2000000 // $20,000 COP por defecto
}: OrderDrawerProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');

  const totalCents = items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const isMinimumMet = totalCents >= minimumOrderCents;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white px-4 py-3 rounded-lg shadow-lg`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleCreateOrder = async () => {
    if (isSubmitting || !isMinimumMet) return;

    setIsSubmitting(true);

    try {
      // Crear usuario demo para el pedido (en una app real sería el usuario autenticado)
      const orderData: CreateOrderData = {
        userId: 'demo-user-id', // En una app real sería el ID del usuario autenticado
        items: items.map(item => ({
          productId: item.id,
          qty: item.quantity
        })),
        payment: paymentMethod,
        address: address.trim() || undefined,
        note: note.trim() || undefined
      };

      const response = await api.orders.create(orderData);

      if (response.success && response.data) {
        showToast('¡Pedido creado exitosamente!', 'success');
        
        // Crear mensaje de WhatsApp con detalles del pedido
        const orderDetails = items.map(item => 
          `• *${item.title}* x${item.quantity} - ${formatPrice(item.priceCents * item.quantity)}`
        ).join('\n');
        
        let whatsappText = `Hola 👋 quiero hacer este pedido:\n\n${orderDetails}\n\n💰 *Total: ${formatPrice(totalCents)}*\n\n`;
        
        if (address) {
          whatsappText += `📍 Mi dirección: ${address}\n`;
        }
        
        if (note) {
          whatsappText += `📝 Nota: ${note}\n`;
        }
        
        whatsappText += `💳 Método de pago: ${paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia'}`;
        
        // Usar número genérico para WhatsApp (en una app real sería el número del vendedor)
        const whatsappUrl = createWhatsAppLink('+56900000000', whatsappText);
        window.open(whatsappUrl, '_blank');
        
        // Limpiar carrito y cerrar drawer
        onCheckout();
        handleClose();
      } else {
        throw new Error(response.error || 'Error al crear pedido');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      let errorMessage = 'Error al crear pedido';
      
      if (error.status === 400) {
        errorMessage = 'Datos del pedido inválidos';
      } else if (error.status === 404) {
        errorMessage = 'Algunos productos no están disponibles';
      } else if (error.status === 0) {
        errorMessage = 'Error de conexión. Verifica tu internet.';
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 lg:hidden"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className={`absolute inset-0 bg-black transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-50'
      }`} />

      {/* Drawer */}
      <div className={`absolute bottom-0 left-0 right-0 bg-surface rounded-t-lg shadow-soft-lg transform transition-transform duration-200 max-h-[80vh] flex flex-col ${
        isClosing ? 'translate-y-full' : 'translate-y-0'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-ink">Mi Pedido</h2>
            {totalItems > 0 && (
              <span className="bg-primary text-primary-fg text-sm px-2 py-1 rounded-full">
                {totalItems}
              </span>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-soft transition-colors"
            aria-label="Cerrar carrito"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-muted" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zM8 6a2 2 0 114 0v1H8V6zm0 3a1 1 0 012 0 1 1 0 11-2 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-ink mb-2">Tu carrito está vacío</h3>
              <p className="text-muted">Agrega productos para comenzar tu pedido</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-bg p-3 rounded-soft">
                  {/* Imagen */}
                  <div className="w-12 h-12 bg-gray-200 rounded-soft flex-shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-muted" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Información */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-ink truncate" title={item.title}>
                      {item.title}
                    </h4>
                    <p className="text-sm text-muted">
                      {formatPrice(item.priceCents)} c/u
                    </p>
                  </div>

                  {/* Controles de cantidad */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-soft flex items-center justify-center transition-colors"
                      aria-label={`Reducir cantidad de ${item.title}`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-soft flex items-center justify-center transition-colors"
                      aria-label={`Aumentar cantidad de ${item.title}`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  {/* Botón eliminar */}
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-soft transition-colors"
                    aria-label={`Eliminar ${item.title} del carrito`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Resumen */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal ({totalItems} productos)</span>
                <span className="font-medium">{formatPrice(totalCents)}</span>
              </div>
              
              {!isMinimumMet && (
                <div className="text-sm text-warm">
                  Pedido mínimo: {formatPrice(minimumOrderCents)}
                  <br />
                  Te faltan: {formatPrice(minimumOrderCents - totalCents)}
                </div>
              )}
            </div>

            {/* Formulario de pedido */}
            <div className="space-y-4">
              {/* Método de pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de pago
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      paymentMethod === 'CASH'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TRANSFER')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      paymentMethod === 'TRANSFER'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Transferencia
                  </button>
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección de entrega (opcional)
                </label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej: Calle 123 #45-67, Torre A, Apt 101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Nota */}
              <div>
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                  Nota adicional (opcional)
                </label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej: Entregar en portería, llamar al llegar..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                />
              </div>
            </div>

            {/* Botón de checkout */}
            <button
              onClick={handleCreateOrder}
              disabled={!isMinimumMet || isSubmitting}
              className={`w-full py-3 px-4 rounded-soft font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                isMinimumMet && !isSubmitting
                  ? 'bg-accent hover:bg-green-600 text-white focus:ring-accent'
                  : 'bg-gray-200 text-muted cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Creando pedido...' : isMinimumMet ? 'Crear Pedido' : 'Pedido mínimo no alcanzado'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
