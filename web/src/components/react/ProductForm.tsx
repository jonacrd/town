import { useState } from 'react';

interface ProductFormData {
  title: string;
  priceCents: number;
  stock: number;
  imageUrl: string;
  category: string;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const CATEGORIES = [
  'Tecnología',
  'Ropa',
  'Hogar',
  'Deportes',
  'Libros',
  'Belleza',
  'Comida',
  'Otros'
];

export default function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    title: initialData?.title || '',
    priceCents: initialData?.priceCents || 0,
    stock: initialData?.stock || 1,
    imageUrl: initialData?.imageUrl || '',
    category: initialData?.category || CATEGORIES[0]
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es obligatorio';
    } else if (formData.title.length < 3) {
      newErrors.title = 'El título debe tener al menos 3 caracteres';
    }

    if (formData.priceCents <= 0) {
      newErrors.priceCents = 'El precio debe ser mayor a 0';
    }

    if (formData.stock < 0) {
      newErrors.stock = 'El stock no puede ser negativo';
    }

    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = 'La URL de la imagen no es válida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const price = parseFloat(e.target.value) || 0;
    setFormData(prev => ({ ...prev, priceCents: Math.round(price * 100) }));
  };

  const formatPrice = (cents: number): string => {
    return (cents / 100).toFixed(0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Título */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-ink mb-2">
          Título del producto *
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Ej: iPhone 14 Pro Max 256GB"
          maxLength={100}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600" role="alert">{errors.title}</p>
        )}
      </div>

      {/* Precio */}
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-ink mb-2">
          Precio (COP) *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-3 text-muted">$</span>
          <input
            type="number"
            id="price"
            value={formatPrice(formData.priceCents)}
            onChange={handlePriceChange}
            className={`w-full pl-8 pr-4 py-3 border rounded-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
              errors.priceCents ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0"
            min="1"
            step="1"
          />
        </div>
        {errors.priceCents && (
          <p className="mt-1 text-sm text-red-600" role="alert">{errors.priceCents}</p>
        )}
      </div>

      {/* Stock */}
      <div>
        <label htmlFor="stock" className="block text-sm font-medium text-ink mb-2">
          Stock disponible *
        </label>
        <input
          type="number"
          id="stock"
          value={formData.stock}
          onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
          className={`w-full px-4 py-3 border rounded-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
            errors.stock ? 'border-red-500' : 'border-gray-300'
          }`}
          min="0"
        />
        {errors.stock && (
          <p className="mt-1 text-sm text-red-600" role="alert">{errors.stock}</p>
        )}
      </div>

      {/* Categoría */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-ink mb-2">
          Categoría
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
        >
          {CATEGORIES.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* URL de imagen */}
      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium text-ink mb-2">
          URL de imagen (opcional)
        </label>
        <input
          type="url"
          id="imageUrl"
          value={formData.imageUrl}
          onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
            errors.imageUrl ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="https://ejemplo.com/imagen.jpg"
        />
        {errors.imageUrl && (
          <p className="mt-1 text-sm text-red-600" role="alert">{errors.imageUrl}</p>
        )}
        
        {/* Preview de imagen */}
        {formData.imageUrl && !errors.imageUrl && (
          <div className="mt-3">
            <p className="text-sm text-muted mb-2">Vista previa:</p>
            <div className="w-32 h-32 bg-bg border border-gray-200 rounded-soft overflow-hidden">
              <img
                src={formData.imageUrl}
                alt="Vista previa"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-ink rounded-soft hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1 transition-colors"
            disabled={isLoading}
          >
            Cancelar
          </button>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-primary hover:bg-blue-700 text-primary-fg py-3 px-6 rounded-soft font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Guardando...' : initialData ? 'Actualizar' : 'Publicar'}
        </button>
      </div>
    </form>
  );
}
