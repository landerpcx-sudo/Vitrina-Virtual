import { Option } from './types';

// Se deja vacío para permitir que el usuario suba sus propias prendas o use un link.
export const OUTFITS: Option[] = [];

export const SCENARIOS: Option[] = [
  {
    id: 'scenario-0',
    name: 'Original',
    description: 'Un fondo neutro de una tienda moderna sin marca.',
    image: 'https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=800',
  },
  {
    id: 'scenario-1',
    name: 'Urbano',
    description: 'Una concurrida calle de ciudad con arquitectura moderna.',
    image: 'https://images.unsplash.com/photo-1581456495146-65a71b2c8e52?q=80&w=800',
  },
  {
    id: 'scenario-2',
    name: 'Verano',
    description: 'Una escena veraniega y soleada en la playa.',
    image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?q=80&w=800',
  },
  {
    id: 'scenario-3',
    name: 'Otoño',
    description: 'Un hermoso parque durante el otoño con hojas de colores.',
    image: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?q=80&w=800',
  },
  {
    id: 'scenario-4',
    name: 'Deporte',
    description: 'Modelando la prenda en una cancha deportiva moderna.',
    image: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'scenario-5',
    name: 'Senderismo',
    description: 'Una aventura de trekking en un paisaje montañoso.',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800',
  },
];

export const POSES: Option[] = [
  {
    id: 'pose-1',
    name: 'Fotografía de Estudio',
    description: 'Una pose de cuerpo completo, mirando a la cámara, similar a una sesión de fotos profesional. El sujeto debe mantener su apariencia y rostro originales.',
  },
  {
    id: 'pose-2',
    name: 'Pose de Tres Cuartos',
    description: 'Una pose de tres cuartos, con el cuerpo ligeramente girado, mostrando una postura segura. El sujeto debe mantener su apariencia y rostro originales.',
  },
  {
    id: 'pose-3',
    name: 'Pose Relajada',
    description: 'Una pose informal y relajada, con una expresión natural y cómoda. El sujeto debe mantener su apariencia y rostro originales.',
  },
];
