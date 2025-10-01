import { Option } from '../types';
import { get, set } from './idb';

const OUTFITS_KEY = 'catalog-outfits';

/**
 * Retrieves the currently loaded list of outfits from IndexedDB.
 * @returns {Promise<Option[]>} An array of outfit options.
 */
export const getOutfits = async (): Promise<Option[]> => {
    return (await get<Option[]>(OUTFITS_KEY)) || [];
};

/**
 * Saves the provided list of outfits to IndexedDB.
 * @param {Option[]} outfits The array of outfits to save.
 */
export const saveOutfits = async (outfits: Option[]): Promise<void> => {
    await set(OUTFITS_KEY, outfits);
};

/**
 * Clears all outfits from IndexedDB.
 */
export const clearOutfits = async (): Promise<void> => {
    await set(OUTFITS_KEY, []);
};