import React, { useState, useEffect, useRef } from 'react';
import { Option } from '../types';
import { getOutfits, saveOutfits, clearOutfits } from '../services/outfitService';
import { getLogo, saveLogo, removeLogo } from '../services/logoService';
import * as googleDriveService from '../services/googleDriveService';
import { resizeImage } from '../utils/imageUtils';
import EditOutfitModal from './EditOutfitModal';
import { EditIcon } from './icons/EditIcon';
import { UploadIcon } from './icons/UploadIcon';
import { XIcon } from './icons/XIcon';
import { ImageIcon } from './icons/ImageIcon';

const AdminPanel: React.FC = () => {
  const [outfits, setOutfits] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingOutfit, setEditingOutfit] = useState<Option | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [googleClientId, setGoogleClientId] = useState(googleDriveService.getClientId() || '');
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);


  const logoInputRef = useRef<HTMLInputElement>(null);
  const outfitsInputRef = useRef<HTMLInputElement>(null);

  // Load initial data from services on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setOutfits(await getOutfits());
      setLogoPreview(getLogo());
      if (googleClientId) {
         googleDriveService.initClient(googleClientId, (signedIn, gapiLoaded) => {
            setIsGoogleSignedIn(signedIn);
            setIsGapiLoaded(gapiLoaded);
         });
      }
      setIsLoading(false);
    };
    loadData();
  }, [googleClientId]);
  
  const handleGoogleClientIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newId = e.target.value;
    setGoogleClientId(newId);
    googleDriveService.saveClientId(newId);
  }

  const handleConnectGoogleDrive = () => {
    if (googleClientId) {
      googleDriveService.signIn();
    } else {
      setError("Por favor, introduce un ID de cliente de Google primero.");
    }
  };

  const handleDisconnectGoogleDrive = () => {
    googleDriveService.signOut();
  };

  const handleLogoUploadClick = () => {
    logoInputRef.current?.click();
  }

  const handleRemoveLogoClick = () => {
    removeLogo();
    setLogoPreview(null);
  };
  
  const handleOutfitsUploadClick = () => {
    outfitsInputRef.current?.click();
  }
  
  const handleEditOutfitClick = (outfit: Option) => {
    setEditingOutfit(outfit);
  }
  
  const handleRemoveOutfitClick = async (outfitId: string) => {
    const currentOutfits = await getOutfits();
    const updatedOutfits = currentOutfits.filter(o => o.id !== outfitId);
    await saveOutfits(updatedOutfits);
    setOutfits(updatedOutfits);
  }

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const resizedLogo = await resizeImage(file, 200, 200);
        setLogoPreview(resizedLogo);
        saveLogo(resizedLogo);
      } catch (err) {
        setError('No se pudo procesar la imagen del logo.');
      }
    }
  };
  
  const handleOutfitFilesSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
        return;
    }
    setIsLoading(true);
    setError(null);

    try {
        const files = Array.from(event.target.files);
        const newOutfits: Option[] = [];

        await Promise.all(files.map((file: File) => 
            new Promise<void>((resolve, reject) => {
                if (!file.type.startsWith('image/')) {
                    return resolve();
                }
                const reader = new FileReader();
                reader.onload = async () => {
                    const image = await resizeImage(reader.result as string, 512, 512);
                    const name = file.name.substring(0, file.name.lastIndexOf('.'));
                    newOutfits.push({
                        id: `outfit-${Date.now()}-${Math.random()}`,
                        name: name,
                        image: image,
                        tags: [],
                        brand: '',
                        description: '',
                    });
                    resolve();
                };
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(file);
            })
        ));

        const currentOutfits = await getOutfits();
        const combinedOutfits = [...currentOutfits, ...newOutfits];
        combinedOutfits.sort((a, b) => a.name.localeCompare(b.name));
        
        await saveOutfits(combinedOutfits);
        setOutfits(combinedOutfits);

    } catch (err) {
        console.error('Error loading outfits:', err);
        setError(err instanceof Error ? err.message : 'Ocurrió un error al cargar las imágenes.');
    } finally {
        setIsLoading(false);
        if (event.target) {
            event.target.value = '';
        }
    }
  };

  const handleUpdateOutfit = async (updatedOutfit: Option) => {
    const currentOutfits = await getOutfits();
    const updatedOutfits = currentOutfits.map(o => o.id === updatedOutfit.id ? updatedOutfit : o);
    await saveOutfits(updatedOutfits);
    setOutfits(updatedOutfits);
    setEditingOutfit(null);
  };

  const handleClearCatalog = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar TODAS las prendas del catálogo? Esta acción no se puede deshacer.')) {
        await clearOutfits();
        setOutfits([]);
    }
  };

  return (
    <div className="space-y-8">
      {editingOutfit && (
        <EditOutfitModal
          outfit={editingOutfit}
          onClose={() => setEditingOutfit(null)}
          onSave={handleUpdateOutfit}
        />
      )}
      <h2 className="text-3xl font-bold text-gray-800 text-center">Panel de Administración</h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Google Drive Integration */}
      <div className="bg-white p-6 rounded-xl shadow-md border">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Conexión con Google Drive (para Códigos QR)</h3>
        <div className="space-y-4">
           <div>
              <label htmlFor="google-client-id" className="block text-sm font-medium text-gray-700">
                  ID de Cliente de Google
              </label>
              <input
                  id="google-client-id"
                  type="text"
                  value={googleClientId}
                  onChange={handleGoogleClientIdChange}
                  placeholder="Pega tu ID de cliente de OAuth 2.0 aquí"
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {isGoogleSignedIn ? (
              <div className="flex items-center gap-4">
                <p className="text-green-700 font-semibold flex-grow">Conectado a Google Drive.</p>
                <button
                  onClick={handleDisconnectGoogleDrive}
                  className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
                >
                  Desconectar
                </button>
              </div>
            ) : (
               <button
                  onClick={handleConnectGoogleDrive}
                  disabled={!googleClientId || !isGapiLoaded}
                  className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {!isGapiLoaded && googleClientId ? 'Cargando API de Google...' : 'Conectar con Google Drive'}
               </button>
            )}
            <p className="text-xs text-gray-500 mt-2">
              La conexión con Google Drive es necesaria para generar códigos QR de descarga de forma fiable. Las imágenes se guardarán en tu propia cuenta.
            </p>
        </div>
      </div>


      {/* Logo Management Section */}
      <div className="bg-white p-6 rounded-xl shadow-md border">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Gestionar Logo</h3>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center border-2 border-dashed">
            {logoPreview ? (
              <img src={logoPreview} alt="Vista previa del logo" className="object-contain max-w-full max-h-full" />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div className="flex-grow space-y-2">
             <input
              type="file"
              ref={logoInputRef}
              onChange={handleLogoChange}
              accept="image/png, image/jpeg, image/svg+xml"
              className="hidden"
            />
            <button
              onClick={handleLogoUploadClick}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#008e5a] text-white font-semibold rounded-md hover:bg-green-800 transition-colors"
            >
              <UploadIcon className="w-5 h-5" />
              Subir Nuevo Logo
            </button>
            {logoPreview && (
                 <button
                    onClick={handleRemoveLogoClick}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
                >
                    <XIcon className="w-5 h-5" />
                    Eliminar Logo
                </button>
            )}
          </div>
        </div>
      </div>

      {/* Outfits Management Section */}
      <div className="bg-white p-6 rounded-xl shadow-md border">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Gestionar Prendas</h3>
        
        <input
          type="file"
          ref={outfitsInputRef}
          onChange={handleOutfitFilesSelect}
          multiple
          accept="image/*"
          className="hidden"
        />

        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <p className="mb-4 text-gray-600">
                Añade nuevas prendas al catálogo. Las imágenes se agregarán a las ya existentes.
            </p>
            <div className="flex justify-center items-center gap-4">
              <button
                  onClick={handleOutfitsUploadClick}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 py-2 px-6 bg-[#008e5a] text-white font-bold rounded-md shadow-sm hover:bg-green-800 transition-colors disabled:bg-gray-400 disabled:cursor-wait"
              >
                  {isLoading ? 'Cargando...' : <> <UploadIcon className="w-5 h-5" /> Cargar Prendas </> }
              </button>
               <button
                  onClick={handleClearCatalog}
                  disabled={isLoading || outfits.length === 0}
                  className="inline-flex items-center justify-center gap-2 py-2 px-6 bg-red-600 text-white font-bold rounded-md shadow-sm hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                  <XIcon className="w-5 h-5" /> Limpiar Catálogo
              </button>
            </div>
        </div>
        

        <div className="mt-6">
          <h4 className="font-semibold text-gray-600 mb-2">
            Catálogo Actual ({outfits.length} prendas)
          </h4>
          {outfits.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No hay prendas cargadas.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {outfits.map(outfit => (
                <div key={outfit.id} className="relative group border rounded-lg overflow-hidden shadow-sm">
                  <img src={outfit.image} alt={outfit.name} className="w-full h-40 object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                    <p className="text-sm font-bold text-white text-center truncate">{outfit.name}</p>
                  </div>
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditOutfitClick(outfit)}
                        className="p-2 bg-blue-500 rounded-full text-white hover:bg-blue-600"
                        aria-label="Editar prenda"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleRemoveOutfitClick(outfit.id)}
                        className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
                        aria-label="Eliminar prenda"
                      >
                         <XIcon className="w-5 h-5" />
                      </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
