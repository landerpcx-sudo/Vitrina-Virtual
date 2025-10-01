import React, { useState, useCallback, useEffect } from 'react';
import { GeneratedImage, Step, Option, View } from './types';
import { SCENARIOS } from './constants';
import CameraCapture from './components/CameraCapture';
import CustomizationPanel from './components/CustomizationPanel';
import ImageGallery from './components/ImageGallery';
import LoadingSpinner from './components/LoadingSpinner';
import AdminPanel from './components/AdminPanel';
import { generateStyledImages } from './services/geminiService';
import { getLogo } from './services/logoService';
import { MoreVerticalIcon } from './components/icons/MoreVerticalIcon';
import { ChevronLeftIcon } from './components/icons/ChevronLeftIcon';

function App() {
  const [currentStep, setCurrentStep] = useState<Step>('capture');
  const [view, setView] = useState<View>('user');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<Option | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Option>(SCENARIOS[0]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('Iniciando IA...');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  // A key to force re-mounting of components when switching views
  const [viewKey, setViewKey] = useState(Date.now());

  useEffect(() => {
    setLogoUrl(getLogo());
  }, []);

  const handleCapture = (image: string) => {
    setUserImage(image);
    setCurrentStep('customize');
  };

  const handleGenerate = useCallback(async () => {
    if (!userImage || !selectedOutfit?.image) {
      setError('Por favor, captura una imagen y selecciona una prenda de nuestro catálogo.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setLoadingMessage('Preparando imágenes para la IA...');
      
      setLoadingMessage('Generando tu nuevo look... Esto puede tardar un momento.');
      const images = await generateStyledImages({
        userImage,
        outfitImage: selectedOutfit.image,
        scenario: selectedScenario,
        onProgress: setLoadingMessage,
      });

      setGeneratedImages(images);
      setCurrentStep('results');
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          // biome-ignore lint/style/noUselessTernary: <explanation>
          : 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [userImage, selectedOutfit, selectedScenario]);

  const handleReset = () => {
    setCurrentStep('capture');
    setUserImage(null);
    setGeneratedImages([]);
    setError(null);
    setSelectedOutfit(null);
    setSelectedScenario(SCENARIOS[0]);
  };

  const handleAdminToggle = () => {
    if (view === 'admin') {
      // When leaving the admin panel, update the user view state
      setView('user');
      // Re-fetch the logo in case it was changed
      setLogoUrl(getLogo());
      // Force the CustomizationPanel to re-mount and fetch the new outfits
      setViewKey(Date.now()); 
    } else {
      setView('admin');
    }
  };

  const renderUserContent = () => {
    switch (currentStep) {
      case 'capture':
        return <CameraCapture onCapture={handleCapture} />;
      case 'customize':
        return (
          <CustomizationPanel
            key={viewKey} // Use the key here
            userImage={userImage!}
            selectedOutfit={selectedOutfit}
            onOutfitChange={setSelectedOutfit}
            selectedScenario={selectedScenario}
            onScenarioChange={setSelectedScenario}
            onGenerate={handleGenerate}
            onBack={handleReset}
          />
        );
      case 'results':
        return (
          <ImageGallery images={generatedImages} onReset={handleReset} />
        );
      default:
        return <CameraCapture onCapture={handleCapture} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col items-center p-4 md:p-8">
      {isLoading && <LoadingSpinner message={loadingMessage} />}
      <header className="w-full max-w-6xl text-center pt-8 pb-4">
        <div className="flex flex-col justify-center items-center gap-4">
          {logoUrl && <img src={logoUrl} alt="Logo de la tienda" className="h-16 object-contain" />}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#008e5a]">
            Probador Virtual
          </h1>
        </div>
      </header>

      <main className="w-full max-w-6xl">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg mb-4 text-center">
            <p>
              <strong>¡Uy!</strong> {error}
            </p>
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 w-full">
          {view === 'user' ? renderUserContent() : <AdminPanel />}
        </div>
      </main>

      <button
        onClick={handleAdminToggle}
        className="fixed bottom-5 right-5 z-20 flex items-center justify-center bg-white text-gray-600 w-12 h-12 rounded-full shadow-lg border border-gray-200 hover:text-[#008e5a] hover:bg-gray-50 transition-all duration-300"
        aria-label={view === 'user' ? 'Acceder al panel de administración' : 'Volver a la tienda'}
      >
        {view === 'user' 
          ? <MoreVerticalIcon className="w-6 h-6" /> 
          : <ChevronLeftIcon className="w-6 h-6" />
        }
      </button>

      <footer className="mt-8 text-gray-500 text-sm text-center">
        <p>Potenciado por Falabella con tecnología Gemini AI</p>
      </footer>
    </div>
  );
}

export default App;