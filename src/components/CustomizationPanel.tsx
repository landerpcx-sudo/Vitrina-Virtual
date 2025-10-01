import React, { useEffect, useState } from 'react';
import { Option } from '../types';
import { SCENARIOS } from '../constants';
import { getOutfits } from '../services/outfitService';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface CustomizationPanelProps {
  userImage: string;
  selectedOutfit: Option | null;
  onOutfitChange: (outfit: Option | null) => void;
  selectedScenario: Option;
  onScenarioChange: (scenario: Option) => void;
  onGenerate: () => void;
  onBack: () => void;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  userImage,
  selectedOutfit,
  onOutfitChange,
  selectedScenario,
  onScenarioChange,
  onGenerate,
  onBack,
}) => {
  const [outfits, setOutfits] = useState<Option[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    const loadOutfits = async () => {
      // This now fetches outfits from persistent storage (IndexedDB)
      const allOutfits = await getOutfits();
      setOutfits(allOutfits);

      const tags = new Set<string>();
      allOutfits.forEach(outfit => {
          outfit.tags?.forEach(tag => tags.add(tag));
      });
      setAllTags(Array.from(tags).sort());

      // If the currently selected outfit is no longer in the list, deselect it.
      if (selectedOutfit && !allOutfits.find(o => o.id === selectedOutfit.id)) {
          onOutfitChange(null);
      }
    };
    
    loadOutfits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const filteredOutfits = selectedTag
    ? outfits.filter(outfit => outfit.tags?.includes(selectedTag))
    : outfits;
    
  const handleOutfitClick = (outfit: Option) => {
    onOutfitChange(outfit);
  }
  
  const handleScenarioClick = (scenario: Option) => {
    onScenarioChange(scenario);
  }

  const handleTagClick = (tag: string | null) => {
    setSelectedTag(tag);
  }
  
  const handleGenerateClick = () => {
    onGenerate();
  }

  const handleBackClick = () => {
    onBack();
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 self-start lg:self-center">Tu Foto</h2>
            <div className="relative w-full max-w-md">
              <img
                src={userImage}
                alt="Usuario"
                className="w-full rounded-xl shadow-lg object-contain"
              />
              <button
                onClick={handleBackClick}
                className="absolute top-4 left-4 flex items-center gap-1 bg-white/80 backdrop-blur-sm text-gray-700 px-3 py-1.5 rounded-full shadow-md hover:bg-white transition-colors"
                aria-label="Volver a tomar foto"
              >
                <ChevronLeftIcon className="w-5 h-5" />
                <span className="font-semibold">Volver</span>
              </button>
            </div>
        </div>

        <div className="flex flex-col space-y-6">
          <div className="bg-gray-50 p-4 sm:p-6 rounded-xl space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">1. Elige una Prenda</h3>
            {outfits.length > 0 ? (
              <>
                {allTags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button 
                      onClick={() => handleTagClick(null)}
                      className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${!selectedTag ? 'bg-[#008e5a] text-white' : 'bg-white text-gray-700 hover:bg-gray-200 border'}`}
                    >
                      Todos
                    </button>
                    {allTags.map(tag => (
                       <button 
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${selectedTag === tag ? 'bg-[#008e5a] text-white' : 'bg-white text-gray-700 hover:bg-gray-200 border'}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4">
                  {filteredOutfits.map((outfit) => (
                    <button
                      key={outfit.id}
                      onClick={() => handleOutfitClick(outfit)}
                      className={`flex-shrink-0 w-32 h-40 rounded-lg overflow-hidden border-4 focus:outline-none transition-all duration-200 ${
                        selectedOutfit?.id === outfit.id
                          ? 'border-green-500 shadow-xl scale-105'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={outfit.image} alt={outfit.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                 {filteredOutfits.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No hay prendas con la etiqueta seleccionada.</p>
                )}
              </>
            ) : (
                <div className="text-center p-6 bg-white rounded-lg border-2 border-dashed">
                    <p className="text-gray-600">No hay prendas en el catálogo.</p>
                    <p className="text-sm text-gray-500 mt-1">Un administrador necesita añadir prendas en el panel.</p>
                </div>
            )}
          </div>
          
          <div className="bg-gray-50 p-4 sm:p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">2. Elige un Escenario</h3>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
              {SCENARIOS.map(scenario => (
                <button
                  key={scenario.id}
                  onClick={() => handleScenarioClick(scenario)}
                  className={`relative p-2 rounded-lg text-left border-2 transition-all group ${
                    selectedScenario.id === scenario.id ? 'border-green-500 bg-white' : 'border-transparent bg-white hover:border-gray-300'
                  }`}
                >
                  <img src={scenario.image} alt={scenario.name} className="w-full h-16 object-cover rounded-md mb-2" />
                  <span className="font-semibold text-sm text-gray-700">{scenario.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={handleGenerateClick}
            disabled={!selectedOutfit}
            className="w-full flex items-center justify-center gap-3 py-4 bg-[#008e5a] text-white font-bold rounded-xl text-xl shadow-lg hover:bg-green-800 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <SparklesIcon className="w-6 h-6" />
            Generar Looks
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationPanel;
