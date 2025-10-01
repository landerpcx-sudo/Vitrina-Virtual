import { Option } from '../types';
import { get, set } from './idb';

const DIRECTORY_HANDLE_KEY = 'outfits-directory-handle';

/**
 * Checks if the app has read permission for a given directory handle.
 * This function only queries the permission status and does not request it,
 * making it safe to call outside of a direct user gesture.
 * @param fileHandle The directory handle to check.
 * @returns {Promise<boolean>} True if permission is granted, false otherwise.
 */
async function checkPermission(fileHandle: FileSystemDirectoryHandle): Promise<boolean> {
  const options = { mode: 'read' as const };
  // Check if permission was already granted
  // FIX: Cast to any to access experimental 'queryPermission' API
  if ((await (fileHandle as any).queryPermission(options)) === 'granted') {
    return true;
  }
  return false;
}

// Function to read a file as a Data URL
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

/**
 * Loads outfit images from a directory selected by the user.
 * @param {boolean} usePicker - If true, forces the directory picker to show. If false, tries to use a stored handle.
 * @returns {Promise<Option[] | null>} A list of outfits, or null if the user cancelled the picker.
 */
export const loadOutfitsFromDirectory = async (usePicker = false): Promise<Option[] | null> => {
  let dirHandle: FileSystemDirectoryHandle | undefined;

  // FIX: Cast to any to access experimental 'showDirectoryPicker' API
  if (!(window as any).showDirectoryPicker) {
    throw new Error('Tu navegador no soporta la API de Acceso al Sistema de Archivos. Prueba con Chrome o Edge.');
  }

  // If the user explicitly wants to pick a new/different directory
  if (usePicker) {
    try {
      // FIX: Cast to any to access experimental 'showDirectoryPicker' API
      dirHandle = await (window as any).showDirectoryPicker();
      await set(DIRECTORY_HANDLE_KEY, dirHandle);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled the picker. Return null to signal the caller to do nothing.
        return null;
      }
      // For any other error, report it.
      console.error('Error selecting directory:', err);
      throw new Error('No se pudo seleccionar el directorio.');
    }
  } else {
    // If we are reloading, use the stored handle.
    dirHandle = await get<FileSystemDirectoryHandle>(DIRECTORY_HANDLE_KEY);
  }

  // If we don't have a handle at this point, there's nothing to load.
  if (!dirHandle) {
    return [];
  }

  // Verify we still have permission. If not, the user must re-select the directory.
  const hasPermission = await checkPermission(dirHandle);
  if (!hasPermission) {
    // Clear the stale handle because we no longer have access.
    await set(DIRECTORY_HANDLE_KEY, undefined);
    throw new Error('El permiso para acceder a la carpeta ha expirado. Por favor, selecciona la carpeta de nuevo usando el botón "Cambiar Carpeta".');
  }
  
  const outfits: Option[] = [];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  for await (const entry of (dirHandle as any).values()) {
    if (entry.kind === 'file' && allowedExtensions.some(ext => entry.name.toLowerCase().endsWith(ext))) {
      try {
        // FIX: Cast to any to access experimental 'getFile' API on FileSystemFileHandle
        const file = await (entry as any).getFile();
        const image = await readFileAsDataURL(file);
        
        // Use filename without extension as the name
        const name = entry.name.substring(0, entry.name.lastIndexOf('.'));
        
        outfits.push({
          id: `outfit-${Date.now()}-${Math.random()}`, // Simple unique ID
          name: name,
          image: image,
          tags: [],
          brand: '',
          description: '',
        });
      } catch (err) {
        console.warn(`Could not read file ${entry.name}:`, err);
      }
    }
  }
  
  return outfits;
};

// Check if a directory handle is already stored
export const isDirectoryHandleStored = async (): Promise<boolean> => {
  const handle = await get<FileSystemDirectoryHandle>(DIRECTORY_HANDLE_KEY);
  return !!handle;
};
