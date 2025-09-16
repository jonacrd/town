import { useState, useEffect, useCallback } from 'react';

interface SearchFiltersProps {
  onSearch: (query: string) => void;
  onCategoryFilter: (category: string) => void;
  onSortChange: (sort: string) => void;
  categories?: string[];
  initialQuery?: string;
  initialCategory?: string;
  initialSort?: string;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'name-asc', label: 'Nombre: A-Z' },
  { value: 'stock', label: 'Más disponibles' }
];

const DEFAULT_CATEGORIES = [
  'Tecnología',
  'Ropa',
  'Hogar',
  'Deportes',
  'Libros',
  'Belleza',
  'Comida',
  'Otros'
];

export default function SearchFilters({
  onSearch,
  onCategoryFilter,
  onSortChange,
  categories = DEFAULT_CATEGORIES,
  initialQuery = '',
  initialCategory = '',
  initialSort = 'newest'
}: SearchFiltersProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce para la búsqueda
  const debounceSearch = useCallback(
    debounce((searchQuery: string) => {
      onSearch(searchQuery);
    }, 300),
    [onSearch]
  );

  useEffect(() => {
    debounceSearch(query);
  }, [query, debounceSearch]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    onCategoryFilter(category);
  };

  const handleSortChange = (sort: string) => {
    setSelectedSort(sort);
    onSortChange(sort);
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedCategory('');
    setSelectedSort('newest');
    onSearch('');
    onCategoryFilter('');
    onSortChange('newest');
  };

  const hasActiveFilters = query || selectedCategory || selectedSort !== 'newest';

  return (
    <div className="bg-surface border-b border-gray-200 sticky top-0 z-10">
      <div className="p-4 space-y-4">
        {/* Barra de búsqueda */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-muted" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            aria-label="Buscar productos"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-ink"
              aria-label="Limpiar búsqueda"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {/* Botón de filtros móvil */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-soft hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-colors"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
            Filtros
            {hasActiveFilters && (
              <span className="bg-primary text-primary-fg text-xs px-2 py-1 rounded-full">
                {[query, selectedCategory, selectedSort !== 'newest'].filter(Boolean).length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary hover:text-blue-700 font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Filtros - siempre visible en desktop, toggleable en móvil */}
        <div className={`space-y-4 lg:block ${showFilters ? 'block' : 'hidden'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Filtro por categoría */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-ink mb-2">
                Categoría
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                <option value="">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Ordenar por */}
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-ink mb-2">
                Ordenar por
              </label>
              <select
                id="sort"
                value={selectedSort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Función helper para debounce
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
