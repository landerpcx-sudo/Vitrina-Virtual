import React, { useState, useEffect, useRef } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { ShareIcon } from './icons/ShareIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { GeneratedImage } from '../types';
import { BodyOutlineIcon } from './icons/BodyOutlineIcon';
import { QrCodeIcon } from './icons/QrCodeIcon';
import { uploadFileToGoogleDrive, isGoogleSignedIn } from '../services/googleDriveService';

// Declara la variable global 'qrcode' para que TypeScript la reconozca.
declare const qrcode: any;

interface ImageGalleryProps {
  images: GeneratedImage[];
  onReset: () => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onReset }) => {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(images[0] || null);
  const [notification, setNotification] = useState<string>('');
  const [qrCodeStatus, setQrCodeStatus] = useState<'loading' | 'error' | 'success' | 'info'>('loading');
  const [qrMessage, setQrMessage] = useState('Generando QR...');
  const qrCodeContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (images.length > 0 && !selectedImage) {
      setSelectedImage(images[0]);
    }
  }, [images, selectedImage]);

  useEffect(() => {
    if (!selectedImage || !qrCodeContainerRef.current) return;

    const generateUrlQrCode = async () => {
        setQrCodeStatus('loading');
        if (qrCodeContainerRef.current) {
            qrCodeContainerRef.current.innerHTML = '';
        }

        if (!isGoogleSignedIn()) {
            setQrCodeStatus('info');
            setQrMessage('El administrador necesita conectar Google Drive para generar códigos QR.');
            return;
        }

        try {
            // 1. Subir la imagen a Google Drive para obtener una URL.
            setQrMessage('Subiendo a Google Drive...');
            const imageUrl = await uploadFileToGoogleDrive(selectedImage.src);
            
            // 2. Usar la URL para generar el QR.
            setQrMessage('Generando QR...');
            const qr = qrcode(0, 'M'); // 'M' for medium error correction
            qr.addData(imageUrl);
            qr.make();
            
            // 3. Renderizar el QR.
            const qrImgTag = qr.createImgTag(4, 8); // cell size 4, margin 8

            if (qrCodeContainerRef.current) {
                qrCodeContainerRef.current.innerHTML = qrImgTag;
                const img = qrCodeContainerRef.current.querySelector('img');
                if (img) {
                    img.style.width = '100%';
                    img.style.height = 'auto';
                    img.alt = 'Escanea para descargar la imagen en tu móvil';
                }
            }
            setQrCodeStatus('success');

        } catch (error) {
            console.error("Error al generar el código QR con Google Drive:", error);
            setQrCodeStatus('error');
            setQrMessage("Hubo un problema al subir la imagen a Google Drive. Revisa la conexión en el panel de admin.");
        }
    };

    generateUrlQrCode();

  }, [selectedImage]);

  const handleDownload = () => {
    if (!selectedImage) return;
    const link = document.createElement('a');
    link.href = selectedImage.src;
    link.download = `falabella-virtual-try-on-${Date.now()}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleShare = async () => {
    if (!selectedImage) return;
    
    try {
      const response = await fetch(selectedImage.src);
      const blob = await response.blob();
      const file = new File([blob], `falabella-virtual-try-on.jpeg`, { type: blob.type });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Mi Nuevo Look de Falabella',
          text: '¡Mira el nuevo look que creé con el Probador Virtual de Falabella!',
          files: [file],
        });
      } else {
        setNotification('La función de compartir no está soportada en este navegador.');
        setTimeout(() => setNotification(''), 4000);
      }
    } catch (error) {
      console.info('Share action was cancelled or failed:', error);
    }
  };

  const handleImageSelect = (image: GeneratedImage) => {
    setSelectedImage(image);
  };
  
  const handleReset = () => {
    onReset();
  }

  const renderQrContent = () => {
    switch(qrCodeStatus) {
      case 'loading':
        return <div className="text-sm text-gray-500 animate-pulse">{qrMessage}</div>;
      case 'error':
        return (
          <div className="text-center text-sm p-2">
            <p className="font-bold text-red-600">No se pudo generar el código QR</p>
            <p className="text-gray-600 mt-1">{qrMessage}</p>
          </div>
        );
      case 'info':
         return (
          <div className="text-center text-sm p-2">
            <p className="font-bold text-blue-600">Función no disponible</p>
            <p className="text-gray-600 mt-1">{qrMessage}</p>
          </div>
        );
      case 'success':
        return <div ref={qrCodeContainerRef} className="w-full h-full flex items-center justify-center" />;
      default:
        return null;
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      {notification && (
          <div className="fixed top-5 bg-blue-500 text-white py-2 px-4 rounded-lg shadow-lg z-50 animate-pulse">
              {notification}
          </div>
      )}
      <h2 className="text-3xl font-bold text-gray-800 mb-4">¡Aquí está tu nuevo look!</h2>
      <p className="text-gray-600 mb-8">Guarda y comparte tu imagen favorita.</p>
      
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col items-center">
            {selectedImage ? (
                <img src={selectedImage.src} alt="Generated look" className="w-full rounded-lg shadow-xl object-contain" />
            ) : (
                <div className="w-full aspect-w-3 aspect-h-4 bg-gray-200 rounded-lg flex items-center justify-center">
                    <p>No hay imagen para mostrar.</p>
                </div>
            )}
        </div>

        <div className="flex flex-col space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Opciones</h3>
            {selectedImage?.suggestedSize && (
              <div className="flex items-center gap-3 bg-blue-50 border-l-4 border-blue-400 p-3 rounded-md mb-4">
                <BodyOutlineIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-blue-800">Talla Sugerida</h4>
                  <p className="text-xl font-extrabold text-blue-900">{selectedImage.suggestedSize}</p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-3 text-gray-700 font-semibold">
                <QrCodeIcon className="w-5 h-5" />
                <span>Descargar en tu Móvil</span>
              </div>
              <div className="flex items-center justify-center w-full h-40 bg-white rounded-md border-2 border-dashed p-2">
                {renderQrContent()}
              </div>
              <p className="text-xs text-gray-500 text-center pt-2">
                  Escanea para guardar la imagen en tu celular.
              </p>
            </div>
            
            <div className="flex flex-col space-y-3 pt-4 mt-4 border-t">
               <button
                  onClick={handleDownload}
                  disabled={!selectedImage}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#008e5a] text-white font-bold rounded-md border-2 border-transparent hover:bg-green-800 transition-colors disabled:opacity-50"
                >
                  <DownloadIcon className="w-5 h-5" />
                  Descargar (Alta Calidad)
                </button>
                <button
                  onClick={handleShare}
                  disabled={!selectedImage}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white text-gray-700 font-bold rounded-md border-2 border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <ShareIcon className="w-5 h-5" />
                  Compartir
                </button>
            </div>
          </div>
          
           {images.length > 1 && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Variaciones</h3>
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, index) => (
                  <button key={index} onClick={() => handleImageSelect(img)}>
                    <img
                      src={img.src}
                      alt={`Generated look ${index + 1}`}
                      className={`w-full aspect-square object-cover rounded-md border-4 transition-all ${
                        selectedImage?.src === img.src ? 'border-green-500' : 'border-transparent'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#008e5a] text-white font-bold rounded-md text-lg shadow-md hover:bg-green-800 transition-all duration-300"
            >
              <ChevronLeftIcon className="w-6 h-6" />
              Probar Otro Look
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageGallery;