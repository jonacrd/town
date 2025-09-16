import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-primary-50 to-white py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Bienvenido a{' '}
          <span className="text-primary-600">Town</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Una aplicación web moderna construida con Astro, React y TypeScript.
          Rápida, accesible y lista para producción.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
            Comenzar
          </button>
          <button className="border border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-3 rounded-lg font-medium transition-colors">
            Aprender más
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
