import React, { useRef, useState, useCallback, useEffect } from 'react';
import { CameraIcon } from './icons/CameraIcon';
import { ImageIcon } from './icons/ImageIcon';
import { resizeImage } from '../utils/imageUtils';

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara. Revisa los permisos en tu navegador e inténtalo de nuevo.');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const takePicture = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      // Flip the image horizontally for a mirror effect
      context?.translate(video.videoWidth, 0);
      context?.scale(-1, 1);
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      try {
        const resized = await resizeImage(dataUrl, 1024, 1024);
        onCapture(resized);
      } catch (e) {
        setError('No se pudo procesar la imagen capturada.');
      }
    }
  };
  
  const handleCaptureClick = () => {
    if (countdown !== null) return; 
    setCountdown(3);
    countdownIntervalRef.current = window.setInterval(() => {
        setCountdown(prevCountdown => {
            if (prevCountdown === null || prevCountdown <= 1) {
                if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                }
                takePicture();
                return null;
            }
            return prevCountdown - 1;
        });
    }, 1000);
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setError(null);
        const resized = await resizeImage(file, 1024, 1024);
        onCapture(resized);
      } catch (e) {
        console.error("Error processing uploaded file:", e);
        setError("Hubo un error al procesar la imagen. Intenta con otra.");
      }
    }
  }
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">¡Empecemos!</h2>
      <p className="text-gray-600 mb-6 max-w-md">
        Alinea tu cuerpo dentro del óvalo para una foto perfecta. La foto se tomará en 3 segundos.
      </p>

      <div className="relative w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden shadow-lg bg-gray-900 border-4 border-gray-200 mb-6">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-white">
            <p className="font-semibold text-red-400">Error</p>
            <p className="text-center">{error}</p>
            <button onClick={startCamera} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Reintentar</button>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
        )}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div 
            className="w-[85%] h-[95%] rounded-[50%]"
            style={{
              boxShadow: '0 0 0 100vmax rgba(50, 205, 50, 0.4)',
            }}
          />
        </div>

        <canvas ref={canvasRef} className="hidden" />
        {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="text-white font-bold text-9xl" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.5)'}}>{countdown}</span>
            </div>
        )}
      </div>
      
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="flex items-center justify-center gap-4 w-full max-w-md">
        <button
          onClick={handleCaptureClick}
          disabled={!stream || countdown !== null}
          className="flex-grow flex items-center justify-center gap-2 py-4 px-6 bg-[#008e5a] text-white font-bold rounded-xl text-lg shadow-md hover:bg-green-800 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <CameraIcon className="w-6 h-6" />
          {countdown !== null ? `Tomando foto...` : 'Iniciar Captura'}
        </button>
        <button 
            onClick={handleUploadClick}
            className="flex-shrink-0 p-4 bg-white border border-gray-300 text-gray-700 rounded-xl shadow-sm hover:bg-gray-100 transition-colors"
            aria-label="Subir imagen desde archivo"
        >
            <ImageIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default CameraCapture;
