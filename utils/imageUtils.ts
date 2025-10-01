export const resizeImage = (fileOrDataUrl: File | string, maxWidth: number, maxHeight: number, quality = 0.9): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = (typeof fileOrDataUrl !== 'string') ? URL.createObjectURL(fileOrDataUrl) : undefined;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                if (objectUrl) URL.revokeObjectURL(objectUrl);
                return reject(new Error('No se pudo obtener el contexto del canvas.'));
            }
            ctx.drawImage(img, 0, 0, width, height);
            
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }

            // Output as JPEG with specified quality for better size efficiency
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        
        img.onerror = (err) => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
            reject(new Error(`No se pudo cargar la imagen: ${err}`));
        };
        
        // FIX: The original code `img.src = objectUrl || fileOrDataUrl;` caused a type error
        // because TypeScript could not infer that `fileOrDataUrl` would be a string when `objectUrl` is undefined.
        // This more explicit check ensures type safety.
        if (typeof fileOrDataUrl === 'string') {
            img.src = fileOrDataUrl;
        } else if (objectUrl) {
            img.src = objectUrl;
        } else {
            // This case should not be reachable due to the logic that creates objectUrl.
            return reject(new Error('Could not create an object URL for the file.'));
        }
    });
};