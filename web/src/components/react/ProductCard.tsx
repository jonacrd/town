import { useState } from 'react';

interface ProductCardProps {
  title: string;
  priceCents: number;
  stock: number;
  imageUrl?: string;
  category?: string;
  onAsk?: () => void;
  onAdd?: () => void;
  loading?: boolean;
}

export default function ProductCard({
  title,
  priceCents,
  stock,
  imageUrl,
  category,
  onAsk,
  onAdd,
  loading = false
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Formatear precio en CLP
  const formatPriceCLP = (cents: number) => {
    return (cents / 100).toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    });
  };

  // Skeleton loader
  if (loading) {
    return (
      <div className="bg-surface rounded-soft shadow-soft overflow-hidden border border-gray-100 animate-pulse">
        <div className="aspect-square bg-gray-200"></div>
        <div className="p-4">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
          <div className="flex justify-between items-center mb-3">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-8 bg-gray-200 rounded-soft"></div>
            <div className="flex-1 h-8 bg-gray-200 rounded-soft"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-soft shadow-soft hover:shadow-soft-lg overflow-hidden border border-gray-100 transition-all duration-200 group">
      {/* Imagen */}
      <div className="aspect-square bg-bg relative overflow-hidden">
        {imageUrl && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
              onLoad={() => setImageLoading(false)}
              loading="lazy"
              width="300"
              height="300"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="w-16 h-16 bg-gray-200 rounded-soft flex items-center justify-center">
              <svg className="w-8 h-8 text-muted" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
        
        {/* Badge de stock */}
        {stock === 0 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-soft text-xs font-medium shadow-sm">
            Agotado
          </div>
        )}
        {stock > 0 && stock <= 5 && (
          <div className="absolute top-3 right-3 bg-warm text-white px-2 py-1 rounded-soft text-xs font-medium shadow-sm">
            ¡Últimas {stock}!
          </div>
        )}

        {/* Badge de categoría */}
        {category && (
          <div className="absolute top-3 left-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded-soft text-xs font-medium">
            {category}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4">
        <h3 
          className="font-semibold text-ink text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors cursor-pointer" 
          title={title}
        >
          {title}
        </h3>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-bold text-ink">
            {formatPriceCLP(priceCents)}
          </span>
          <span className="text-xs text-muted bg-gray-100 px-2 py-1 rounded-full">
            Stock: {stock}
          </span>
        </div>

        {/* Botones mejorados */}
        <div className="flex gap-2">
          <button
            onClick={onAsk}
            className="flex-1 border border-accent text-accent hover:bg-accent hover:text-white py-2.5 px-3 rounded-soft text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 flex items-center justify-center gap-1.5"
            aria-label={`Contactar por WhatsApp para ${title}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.309"/>
            </svg>
            WhatsApp
          </button>
          
          {stock > 0 ? (
            <button
              onClick={onAdd}
              className="flex-1 bg-accent hover:bg-green-600 text-white py-2.5 px-3 rounded-soft text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 flex items-center justify-center gap-1.5"
              aria-label={`Agregar ${title} al carrito`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Agregar
            </button>
          ) : (
            <button
              disabled
              className="flex-1 bg-gray-200 text-muted py-2.5 px-3 rounded-soft text-sm font-medium cursor-not-allowed flex items-center justify-center gap-1.5"
              aria-label="Producto agotado"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM4 10a6 6 0 1112 0A6 6 0 014 10z" clipRule="evenodd" />
              </svg>
              Agotado
            </button>
          )}
        </div>
      </div>
    </div>
  );
}