import { GoogleGenAI, Modality, Part, Type } from "@google/genai";
import { Option, GeneratedImage } from "../types";
import { resizeImage } from "../utils/imageUtils";
import { POSES } from "../constants";

// Correctly initialize the GoogleGenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface GenerateImagesProps {
  userImage: string;
  outfitImage: string;
  scenario: Option;
  onProgress: (message: string) => void;
}

const dataUrlToPart = (dataUrl: string): Part => {
  const [meta, base64Data] = dataUrl.split(',');
  const mimeType = meta.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
};

const generateSingleImage = async (
  ai: GoogleGenAI,
  userImagePart: Part,
  outfitImagePart: Part,
  scenario: Option,
  pose: Option,
  forcedSize?: string
): Promise<GeneratedImage> => {
  const poseInstruction = `La nueva pose debe ser: ${pose.name} - ${pose.description}`;

  let scenarioInstruction: string;
  if (scenario.id === 'scenario-0') {
    scenarioInstruction = "El fondo debe permanecer **EXACTAMENTE IGUAL** al de la foto original del usuario. No lo alteres, modifiques o reemplaces. La única tarea es cambiar la ropa de la persona, manteniendo su fondo original intacto.";
  } else {
    scenarioInstruction = `El fondo debe ser un escenario de tipo '${scenario.name}': ${scenario.description}`;
  }
  
  let sizeInstruction: string;
  if (forcedSize) {
    sizeInstruction = `
      **Instrucción de Talla Obligatoria:** La talla para esta persona ya ha sido determinada. DEBES usar la siguiente talla y devolverla en tu respuesta de texto sin alterarla: \`${forcedSize}\`.
      Tu respuesta de texto debe contener **ÚNICAMENTE** la talla proporcionada. NO la recalcules.
    `;
  } else {
    sizeInstruction = `
      Primero, analiza la complexión de la persona en la foto original para determinar su talla.
        *   **Lógica de Tallas:** Si la persona es visiblemente esbelta y delgada, sugiere 'S' o 'M'. Si tiene una complexión media, sugiere 'M' o 'L'. Si tiene una figura de talla grande o con sobrepeso, sugiere 'XL', 'XXL' o superior. Sé realista y respetuoso.
    *   **Formato de Respuesta de Texto:** Tu respuesta de texto debe contener **ÚNICAMENTE** la talla que determinaste. Esta talla debe ser la misma para todas las poses.
        *   **Ejemplo:** \`M\`
        *   **Tallas posibles:** \`XS\`, \`S\`, \`M\`, \`L\`, \`XL\`, \`XXL\`, \`3XL\`.
    `;
  }

  const prompt = `
    **Misión Crítica: Reemplazo de Ropa Virtual con Fidelidad Humana Absoluta**

    **Advertencia: El incumplimiento de CUALQUIER regla, especialmente las reglas de IDENTIDAD FACIAL, FIDELIDAD DE PRENDA y CONSISTENCIA DE TALLA, es un fracaso total e inaceptable de la misión.**

    Tu única tarea es tomar a la persona de la **primera imagen (foto del usuario)** y **REEMPLAZAR COMPLETAMENTE** su atuendo con la prenda de la **segunda imagen (foto de la prenda)**. El resultado debe ser una fotografía indistinguishable de la realidad.

    **Proceso Lógico Obligatorio:**
    1.  **Analiza:** Identifica a la persona, su rostro, su cuerpo y la prenda en la foto 2.
    2.  **ELIMINA:** Borra mentalmente TODA la ropa que la persona lleva puesta.
    3.  **VISTE:** Coloca la nueva prenda (de la foto 2) sobre su cuerpo.
    4.  **INTEGRA:** Pon a la persona ya vestida en el escenario final con la pose solicitada.

    ---

    **Reglas Inquebrantables:**

    **1. IDENTIDAD FACIAL INALTERABLE (Regla de Prioridad ABSOLUTA E INNEGOCIABLE):**
        *   **ESTA ES LA REGLA MÁS IMPORTANTE. EL MÁS MÍNIMO CAMBIO EN EL ROSTRO ES UN FRACASO ABSOLUTO.**
        *   El rostro en la imagen final debe ser una **COPIA 1:1, PERFECTA Y EXACTA** del rostro en la foto original.
        *   Conserva CADA DETALLE: forma de la cara, estructura ósea, ojos, nariz, boca, cejas, lunares, pecas, arrugas, textura de la piel y cualquier marca de identidad.
        *   **TERMINANTEMENTE PROHIBIDO:** No rejuvenezcas, embellezcas, simetrices, idealices o alteres el rostro de NINGUNA manera. NO INVENTES RASGOS. NO CAMBIES LA LÍNEA DE LA MANDÍBLA. NO ALTERES LA SONRISA. Si la persona se ve cansada, seria, o no está perfectamente maquillada en la original, DEBE verse exactamente igual en la final. El objetivo es el **realismo crudo**, no la perfección.

    **2. CERO RASTROS DE LA ROPA ORIGINAL (Regla de Prioridad Cero):**
        *   La ropa que la persona usa en la foto original debe **DESAPARECER POR COMPLETO**.
        *   **ESTÁ TERMINANTEMENTE PROHIBIDO** dejar partes, mangas, colores, texturas o cualquier rastro de la ropa original en la imagen final. Si se ve CUALQUIER parte del atuendo original, la tarea ha fracasado.

    **3. FIDELIDAD ABSOLUTA DE LA PRENDA (NUEVA REGLA CRÍTICA):**
        *   La prenda en la imagen generada debe ser una **RÉPLICA EXACTA Y PERFECTA** de la prenda de la segunda imagen.
        *   **PROHIBIDO MODIFICAR LA PRENDA:** Está **TERMINANTEMENTE PROHIBIDO** alterar el diseño, patrón, color, forma, tirantes, lazos o cualquier otro detalle de la prenda. Debe ser idéntica a la original.
    
    **4. VESTIMENTA INFERIOR OBLIGATORIA (PANTALONES/JEANS):**
        *   La persona en la imagen final **DEBE** llevar una prenda inferior (pantalones, jeans, etc.).
        *   Si la prenda inferior original se elimina junto con la superior, o si no es visible, **DEBES generar una prenda inferior apropiada y de aspecto natural** que complemente la nueva prenda y el escenario (por ejemplo, jeans azules o pantalones negros).
        *   **PROHIBIDO TERMINANTEMENTE:** Está **PROHIBIDO** generar una imagen donde la persona parezca estar sin pantalones o cortada por la cintura. El resultado debe ser una imagen de una persona completamente vestida.

    **5. RESPETO Y FIDELIDAD CORPORAL ABSOLUTA (Regla de Prioridad Máxima):**
        *   Mantén **EXACTAMENTE** el tipo de cuerpo, complexión, altura, peso y proporciones del sujeto original. El cuerpo y el rostro son un conjunto inseparable. Mantén ambos idénticos.
        *   **PROHIBIDO ADELGAZAR O ALTERAR LA FIGURA:** Está **TERMINANTEMENTE PROHIBIDO** hacer que la persona se vea más delgada o alterar su figura. Si el usuario tiene sobrepeso, una figura de talla grande, o es muy esbelto, el resultado DEBE reflejarlo con **100% de fidelidad y respeto**. El objetivo es la **positividad corporal** y la **inclusión de tallas**.

    **6. INTEGRACIÓN REALISTA Y AJUSTE DE TALLA DE LA PRENDA:**
        *   El ajuste de la nueva prenda debe ser natural y realista **PARA SU TIPO DE CUERPO ESPECÍFICO**.
        *   **AJUSTE DE TALLA AUTOMÁTICO Y OBLIGATORIO:** Si la prenda parece visualmente pequeña, **DEBES renderizarla en una talla más grande** para que se ajuste de forma cómoda y natural. La ropa no debe verse apretada, estirada o deformada.

    **7. CONSISTENCIA DE TALLA ABSOLUTA E INMUTABLE (REGLA CRÍTICA):**
        *   La talla sugerida debe ser **IDÉNTICA e INMUTABLE** para todas las imágenes generadas para esta persona en esta sesión.
        *   Determina la talla UNA SOLA VEZ basándote en la foto original y **repite esa misma respuesta de texto en todas las variaciones**. Proponer tallas diferentes es un fallo inaceptable.

    **8. POSE Y ESCENARIO:**
        *   **Pose:** ${poseInstruction} La pose solo aplica al cuerpo. El rostro y la apariencia física deben permanecer idénticos a la foto original.
        *   **Escenario/Fondo:** ${scenarioInstruction} Integra al sujeto de manera coherente en el escenario, con iluminación y sombras consistentes.

    **9. CALIDAD FOTOGRÁFICA PROFESIONAL:**
        *   La imagen final debe ser de ultra alta calidad, nítida y fotorrealista. Sin artefactos de IA, sin texto.

    **10. PROHIBICIÓN DE CONTENIDO IRRELEVANTE:**
        *   La imagen final DEBE ser de la persona. Está **TERMINANTEMENTE PROHIBIDO** generar paisajes, edificios, objetos, animales o cualquier contenido que no sea la persona con su nueva ropa.
        *   La imagen DEBE ser a **color** y **rectangular**. NO generes imágenes en blanco y negro, circulares o con formas extrañas.

    ---

    **Tarea Adicional Obligatoria: Sugerencia de Talla (Respuesta de Texto)**

    ${sizeInstruction}

    **Verificación Final Obligatoria:** Antes de generar, responde internamente: ¿El rostro es una copia 1:1 del original? ¿La prenda es una réplica exacta? ¿El cuerpo es idéntico? ¿He eliminado TODA la ropa original? ¿La persona lleva pantalones? ¿La talla que voy a sugerir es la misma que he determinado para las otras poses?
  `;

  const textPart: Part = { text: prompt };

  const contents = {
    parts: [userImagePart, outfitImagePart, textPart],
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: contents,
    config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  let imageUrl = '';
  let suggestedSize: string | undefined;

  // The response can contain multiple parts, one image and one text.
  for (const part of response.candidates[0].content.parts) {
      if (part.text) {
          suggestedSize = part.text.trim().replace(/`/g, ''); // Clean up potential markdown
      } else if (part.inlineData) {
          const base64ImageBytes: string = part.inlineData.data;
          imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
  }
  
  if (!imageUrl) {
      throw new Error('La IA no pudo generar una imagen. Inténtalo de nuevo.');
  }

  return { src: imageUrl, suggestedSize };
};

const LOADING_MESSAGES = [
    'Espera mientras te probamos la ropa...',
    'Ajustando los últimos detalles de tu look...',
    '¡Casi listo! Estamos preparando el espejo virtual.',
    'Creando la pose perfecta para ti...',
    'Aplicando la magia de la IA...',
];

export const generateStyledImages = async ({
  userImage,
  outfitImage,
  scenario,
  onProgress,
}: GenerateImagesProps): Promise<GeneratedImage[]> => {
  onProgress('Preparando el probador virtual...');
  const [resizedUserImage, resizedOutfitImage] = await Promise.all([
    resizeImage(userImage, 1024, 1024),
    resizeImage(outfitImage, 512, 512),
  ]);

  const userImagePart = dataUrlToPart(resizedUserImage);
  const outfitImagePart = dataUrlToPart(resizedOutfitImage);

  // 1. Generate the first image to establish the consistent suggested size.
  onProgress(LOADING_MESSAGES[0]);
  const firstImageResult = await generateSingleImage(
    ai,
    userImagePart,
    outfitImagePart,
    scenario,
    POSES[0]
  );
  
  const determinedSize = firstImageResult.suggestedSize;
  if (!determinedSize) {
    // This is a potential issue, but we shouldn't fail the entire process.
    // The app will proceed, but size consistency isn't guaranteed if this happens.
    console.warn('The model did not suggest a size for the first image.');
  }

  // 2. Prepare promises for the remaining images, forcing the determined size.
  const remainingImagePromises: Promise<GeneratedImage>[] = [];
  for (let i = 1; i < POSES.length; i++) {
    const message = LOADING_MESSAGES[i % LOADING_MESSAGES.length];
    onProgress(message);
    remainingImagePromises.push(
      generateSingleImage(
        ai,
        userImagePart,
        outfitImagePart,
        scenario,
        POSES[i],
        determinedSize // Pass the determined size to subsequent calls
      )
    );
  }

  // 3. Await all remaining images and combine the results.
  onProgress('Compilando tus nuevos looks...');
  const remainingImages = await Promise.all(remainingImagePromises);

  const allImages = [firstImageResult, ...remainingImages];

  // 4. Final safety check: ensure every image object has the determined size.
  // This guards against the model occasionally omitting the text part in later responses.
  return allImages
    .filter(img => img && img.src)
    .map(img => ({
      ...img,
      suggestedSize: determinedSize, // Enforce consistency
    }));
};


export const generateTagsForOutfit = async (outfitImage: string): Promise<string[]> => {
    const resizedImage = await resizeImage(outfitImage, 512, 512);
    const imagePart = dataUrlToPart(resizedImage);
    
    const prompt = `
        Analiza la prenda en la imagen. Describe la prenda con etiquetas cortas y relevantes.
        Proporciona únicamente una lista de etiquetas.
        
        Ejemplos de etiquetas:
        - Tipo: Vestido, Pantalón, Camisa, Abrigo, Falda
        - Estilo: Casual, Formal, Deportivo, Elegante, Bohemio
        - Color: Rojo, Azul, Negro, Estampado Floral, Rayas
        - Material (aparente): Algodón, Jean, Seda, Lana
        - Ocasión: Verano, Invierno, Fiesta, Oficina
        - Largo: Corto, Midi, Largo
        - Manga: Manga corta, Manga larga, Sin mangas
    `;
    
    const textPart = { text: prompt };
    
    const contents = {
        parts: [imagePart, textPart],
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    tags: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING,
                            description: "Una etiqueta descriptiva para la prenda."
                        }
                    }
                },
                required: ["tags"]
            }
        }
    });

    try {
        const jsonResponse = JSON.parse(response.text);
        if (jsonResponse && Array.isArray(jsonResponse.tags)) {
            return jsonResponse.tags;
        }
        return [];
    } catch (e) {
        console.error("Error parsing JSON tags from Gemini:", e);
        // Fallback for non-JSON responses, try to parse from plain text
        const textTags = response.text.split(',').map(tag => tag.trim()).filter(Boolean);
        if (textTags.length > 0) {
            return textTags;
        }
        return [];
    }
};
