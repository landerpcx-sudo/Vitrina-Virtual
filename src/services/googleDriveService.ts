// services/googleDriveService.ts

// Declara la variable global 'gapi' para que TypeScript la reconozca.
declare const gapi: any;

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const CLIENT_ID_KEY = 'google-drive-client-id';

let googleAuth: any = null;

export const saveClientId = (clientId: string) => {
    localStorage.setItem(CLIENT_ID_KEY, clientId);
};

export const getClientId = (): string | null => {
    return localStorage.getItem(CLIENT_ID_KEY);
};

/**
 * Initializes the Google API client.
 * @param onStatusChange Callback function to update the sign-in status.
 */
export const initClient = (clientId: string, onStatusChange: (isSignedIn: boolean, isGapiLoaded: boolean) => void) => {
    gapi.load('client:auth2', async () => {
        try {
            await gapi.client.init({
                clientId: clientId,
                discoveryDocs: DISCOVERY_DOCS,
                scope: SCOPES,
            });
            onStatusChange(false, true); // GAPI is loaded
            googleAuth = gapi.auth2.getAuthInstance();
            // Listen for sign-in state changes.
            googleAuth.isSignedIn.listen((isSignedIn: boolean) => onStatusChange(isSignedIn, true));
            // Handle the initial sign-in state.
            onStatusChange(googleAuth.isSignedIn.get(), true);
        } catch (error) {
            console.error("Error initializing Google API client:", error);
            onStatusChange(false, false);
        }
    });
};

export const signIn = () => {
    if (googleAuth) {
        googleAuth.signIn();
    }
};

export const signOut = () => {
    if (googleAuth) {
        googleAuth.signOut();
    }
};

export const isGoogleSignedIn = (): boolean => {
    return googleAuth?.isSignedIn.get() || false;
};

/**
 * Converts a data URL to a Blob.
 */
const dataURLtoBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

/**
 * Uploads a file to Google Drive and returns a public URL.
 * @param dataUrl The data URL of the image to upload.
 * @returns {Promise<string>} The public webContentLink for the file.
 */
export const uploadFileToGoogleDrive = async (dataUrl: string): Promise<string> => {
    if (!isGoogleSignedIn()) {
        throw new Error("No se ha iniciado sesión en Google Drive.");
    }
    
    const blob = dataURLtoBlob(dataUrl);
    const fileName = `virtual-try-on-${Date.now()}.jpeg`;
    
    const fileMetadata = {
        'name': fileName,
        'mimeType': blob.type,
    };
    
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
    formData.append('file', blob);

    // 1. Upload the file
    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token }),
        body: formData,
    });
    
    if (!uploadResponse.ok) {
        throw new Error(`Error al subir el archivo: ${uploadResponse.statusText}`);
    }

    const fileData = await uploadResponse.json();
    const fileId = fileData.id;

    // 2. Make the file public
    const permissionsResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: new Headers({ 
            'Authorization': 'Bearer ' + gapi.client.getToken().access_token,
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
            'role': 'reader',
            'type': 'anyone',
        }),
    });

    if (!permissionsResponse.ok) {
        throw new Error(`Error al establecer permisos: ${permissionsResponse.statusText}`);
    }
    
    // 3. Get the public URL for the file
    const fileDetailsResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=webContentLink`, {
        headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token }),
    });

    if (!fileDetailsResponse.ok) {
        throw new Error(`Error al obtener detalles del archivo: ${fileDetailsResponse.statusText}`);
    }

    const fileDetails = await fileDetailsResponse.json();
    if (!fileDetails.webContentLink) {
        throw new Error("No se pudo obtener el enlace de descarga pública del archivo.");
    }

    return fileDetails.webContentLink;
};
