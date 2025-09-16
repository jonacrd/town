import { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function LazyImage({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjUgMTI1SDE3NVYxNzVIMTI1VjEyNVoiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+',
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer para lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Cargar imagen 50px antes de que sea visible
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const imageProps = {
    ref: imgRef,
    alt,
    className: `${className} transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`,
    onLoad: handleLoad,
    onError: handleError,
    ...(width && { width }),
    ...(height && { height })
  };

  return (
    <div className="relative overflow-hidden">
      {/* Placeholder mientras carga */}
      {isLoading && (
        <img
          src={placeholder}
          alt=""
          className={`${className} absolute inset-0 animate-pulse`}
          {...(width && { width })}
          {...(height && { height })}
          aria-hidden="true"
        />
      )}

      {/* Imagen principal o error */}
      {hasError ? (
        <div className={`${className} bg-gray-100 flex items-center justify-center`}>
          <div className="text-center p-4">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-gray-500">Imagen no disponible</span>
          </div>
        </div>
      ) : (
        isInView && (
          <img
            {...imageProps}
            src={src}
            loading="lazy"
            decoding="async"
          />
        )
      )}
    </div>
  );
}
