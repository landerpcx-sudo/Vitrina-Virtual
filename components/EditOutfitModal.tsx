import React, { useState, useEffect } from 'react';
import { Option } from '../types';
import { XIcon } from './icons/XIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { generateTagsForOutfit } from '../services/geminiService';

interface EditOutfitModalProps {
  outfit: Option | null;
  onClose: () => void;
  onSave: (updatedOutfit: Option) => void;
}

const EditOutfitModal: React.FC<EditOutfitModalProps> = ({ outfit, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [taggingError, setTaggingError] = useState<string | null>(null);

  useEffect(() => {
    if (outfit) {
      setName(outfit.name || '');
      setBrand(outfit.brand || '');
      setDescription(outfit.description || '');
      setTags(outfit.tags?.join(', ') || '');
      // Reset suggestions when outfit changes
      setSuggestedTags([]);
      setTaggingError(null);
    }
  }, [outfit]);

  if (!outfit) {
    return null;
  }
  
  const handleSuggestTags = async () => {
    if (!outfit?.image) return;
    setIsSuggestingTags(true);
    setTaggingError(null);
    setSuggestedTags([]);
    try {
        const tagsFromAI = await generateTagsForOutfit(outfit.image);
        setSuggestedTags(tagsFromAI);
    } catch (error) {
        setTaggingError(error instanceof Error ? error.message : 'Error al sugerir etiquetas.');
    } finally {
        setIsSuggestingTags(false);
    }
  };

  const addSuggestedTag = (tagToAdd: string) => {
    const currentTags = new Set(tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean));
    const lowerCaseTag = tagToAdd.trim().toLowerCase();
    
    // Create a new set with original casing for display
    const originalCaseTags = new Set(tags.split(',').map(t => t.trim()).filter(Boolean));

    if (!currentTags.has(lowerCaseTag)) {
        originalCaseTags.add(tagToAdd.trim());
        setTags(Array.from(originalCaseTags).join(', '));
    }
};


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedOutfit: Option = {
      ...outfit,
      name,
      brand,
      description,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
    };
    onSave(updatedOutfit);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 max-w-lg w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar modal"
        >
          <XIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Editar Prenda</h2>
        
        <div className="flex flex-col sm:flex-row items-start gap-6">
            <img src={outfit.image} alt={outfit.name} className="w-24 h-32 object-cover rounded-md flex-shrink-0" />
            <form onSubmit={handleSubmit} className="flex-grow space-y-4 w-full">
                <div>
                    <label htmlFor="outfit-name" className="block text-sm font-medium text-gray-700">Nombre</label>
                    <input
                        id="outfit-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="outfit-brand" className="block text-sm font-medium text-gray-700">Marca (Opcional)</label>
                    <input
                        id="outfit-brand"
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                </div>
                 <div>
                    <label htmlFor="outfit-description" className="block text-sm font-medium text-gray-700">Descripción (Opcional)</label>
                    <textarea
                        id="outfit-description"
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="outfit-tags" className="block text-sm font-medium text-gray-700">Etiquetas (separadas por comas)</label>
                      <button
                        type="button"
                        onClick={handleSuggestTags}
                        disabled={isSuggestingTags}
                        className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors"
                      >
                          <SparklesIcon className="w-4 h-4" />
                          {isSuggestingTags ? 'Analizando...' : 'Sugerir con IA'}
                      </button>
                    </div>
                    <input
                        id="outfit-tags"
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    {(suggestedTags.length > 0 || taggingError || isSuggestingTags) && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-md border text-sm">
                          {isSuggestingTags && <p className="text-gray-600 animate-pulse">Buscando sugerencias...</p>}
                          {taggingError && <p className="text-red-600 font-semibold">{taggingError}</p>}
                          {suggestedTags.length > 0 && (
                              <div>
                                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Sugerencias (haz clic para añadir):</h4>
                                  <div className="flex flex-wrap gap-2">
                                      {suggestedTags.map(tag => (
                                          <button
                                              type="button"
                                              key={tag}
                                              onClick={() => addSuggestedTag(tag)}
                                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full hover:bg-blue-200 transition-colors"
                                          >
                                              + {tag}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 pt-4">
                     <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white text-gray-700 font-bold rounded-md border-2 border-gray-300 hover:bg-gray-100"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-[#008e5a] text-white font-bold rounded-md hover:bg-green-800"
                    >
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default EditOutfitModal;