// Utilidades para optimización de performance

/**
 * Función de debounce para limitar la frecuencia de ejecución
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Función de throttle para limitar la frecuencia de ejecución
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Lazy loading de módulos con dynamic import
 */
export async function lazyLoadModule<T>(
  importFn: () => Promise<T>
): Promise<T> {
  try {
    return await importFn();
  } catch (error) {
    console.error('Error loading module:', error);
    throw error;
  }
}

/**
 * Preload de imágenes críticas
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Optimización de imágenes con diferentes tamaños
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  width?: number,
  quality: number = 80
): string {
  // Si la URL ya contiene parámetros de optimización, devolverla tal como está
  if (originalUrl.includes('w=') || originalUrl.includes('q=')) {
    return originalUrl;
  }

  // Para servicios como Cloudinary, ImageKit, etc.
  if (originalUrl.includes('cloudinary.com')) {
    const parts = originalUrl.split('/upload/');
    if (parts.length === 2) {
      const transforms = [];
      if (width) transforms.push(`w_${width}`);
      transforms.push(`q_${quality}`);
      transforms.push('f_auto'); // Formato automático
      
      return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
    }
  }

  // Para URLs genéricas, intentar agregar parámetros query
  const url = new URL(originalUrl);
  if (width) url.searchParams.set('w', width.toString());
  url.searchParams.set('q', quality.toString());
  
  return url.toString();
}

/**
 * Intersection Observer para lazy loading
 */
export function createLazyObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  return new IntersectionObserver(callback, defaultOptions);
}

/**
 * Medición de performance
 */
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();

  static startMark(name: string): void {
    this.marks.set(name, performance.now());
  }

  static endMark(name: string): number | null {
    const startTime = this.marks.get(name);
    if (!startTime) return null;

    const duration = performance.now() - startTime;
    this.marks.delete(name);
    
    console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    return duration;
  }

  static measureFunction<T extends (...args: any[]) => any>(
    fn: T,
    name?: string
  ): T {
    return ((...args: Parameters<T>) => {
      const markName = name || fn.name || 'anonymous';
      this.startMark(markName);
      const result = fn(...args);
      this.endMark(markName);
      return result;
    }) as T;
  }
}

/**
 * Cache simple en memoria para datos
 */
export class SimpleCache<T = any> {
  private cache: Map<string, { data: T; timestamp: number; ttl: number }> = new Map();

  set(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Detección de conexión lenta
 */
export function isSlowConnection(): boolean {
  const connection = (navigator as any).connection;
  if (!connection) return false;

  // Considerar conexión lenta si es 2G o effective type es slow-2g
  return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
}

/**
 * Prefetch de recursos
 */
export function prefetchResource(href: string, as: string = 'fetch'): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Preconnect a dominios externos
 */
export function preconnectToDomain(domain: string): void {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = domain;
  document.head.appendChild(link);
}

/**
 * Chunk de arrays para procesamiento en lotes
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Procesamiento de arrays grandes sin bloquear el hilo principal
 */
export async function processLargeArray<T, R>(
  array: T[],
  processor: (item: T) => R,
  chunkSize: number = 100
): Promise<R[]> {
  const chunks = chunkArray(array, chunkSize);
  const results: R[] = [];

  for (const chunk of chunks) {
    const chunkResults = chunk.map(processor);
    results.push(...chunkResults);
    
    // Permitir que el navegador procese otros eventos
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return results;
}
