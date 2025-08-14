/**
 * Types de services disponibles
 */
export const SERVICE_TYPES = [
  {
    value: 'plomberie',
    label: 'Plomberie',
    icon: '🔧',
    description: 'Travaux de plomberie générale'
  },
  {
    value: 'electricite',
    label: 'Électricité',
    icon: '⚡',
    description: 'Installation et dépannage électrique'
  },
  {
    value: 'chauffage',
    label: 'Chauffage',
    icon: '🔥',
    description: 'Installation et entretien de chauffage'
  },
  {
    value: 'climatisation',
    label: 'Climatisation',
    icon: '❄️',
    description: 'Installation et maintenance de climatisation'
  },
  {
    value: 'diagnostic',
    label: 'Diagnostic',
    icon: '🔍',
    description: 'Diagnostic technique et expertise'
  },
  {
    value: 'urgence',
    label: 'Urgence',
    icon: '🚨',
    description: 'Intervention d\'urgence 24/7'
  },
  {
    value: 'maintenance',
    label: 'Maintenance',
    icon: '🛠️',
    description: 'Maintenance préventive et curative'
  },
  {
    value: 'renovation',
    label: 'Rénovation',
    icon: '🏗️',
    description: 'Travaux de rénovation'
  },
  {
    value: 'autre',
    label: 'Autre',
    icon: '📋',
    description: 'Autres services'
  }
] as const;

/**
 * Majorations par défaut
 */
export const DEFAULT_MAJORATIONS = {
  urgence: 1.5,
  weekend: 1.2,
  jourFerie: 1.5,
  nuit: 1.3
};

/**
 * Tarifs par défaut par type de service (indicatif)
 */
export const DEFAULT_TARIFS = {
  plomberie: { horaire: 45, deplacement: 30 },
  electricite: { horaire: 50, deplacement: 30 },
  chauffage: { horaire: 55, deplacement: 35 },
  climatisation: { horaire: 60, deplacement: 35 },
  diagnostic: { fixe: 150, deplacement: 25 },
  urgence: { horaire: 80, deplacement: 50 },
  maintenance: { horaire: 40, deplacement: 25 },
  renovation: { horaire: 35, deplacement: 20 },
  autre: { horaire: 40, deplacement: 25 }
};

/**
 * Messages de validation
 */
export const SERVICE_VALIDATION_MESSAGES = {
  nom: {
    required: 'Le nom du service est requis',
    minlength: 'Le nom doit contenir au moins 3 caractères',
    maxlength: 'Le nom ne peut pas dépasser 100 caractères'
  },
  description: {
    required: 'La description est requise',
    minlength: 'La description doit contenir au moins 10 caractères',
    maxlength: 'La description ne peut pas dépasser 500 caractères'
  },
  type: {
    required: 'Le type de service est requis'
  },
  tarif: {
    required: 'Vous devez spécifier un tarif horaire OU un tarif fixe',
    conflict: 'Vous ne pouvez pas spécifier à la fois un tarif horaire ET un tarif fixe',
    min: 'Le tarif doit être positif',
    max: 'Le tarif semble trop élevé'
  },
  majoration: {
    min: 'La majoration doit être au minimum de 1 (pas de majoration)',
    max: 'La majoration ne peut pas dépasser 3 (300%)'
  },
  fraisDeplacement: {
    min: 'Les frais de déplacement doivent être positifs ou nuls'
  }
};

/**
 * États des services
 */
export enum ServiceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived'
}

/**
 * Icônes pour les états
 */
export const STATUS_ICONS = {
  [ServiceStatus.ACTIVE]: '✅',
  [ServiceStatus.INACTIVE]: '⏸️',
  [ServiceStatus.ARCHIVED]: '📦'
};

/**
 * Couleurs pour les badges de statut
 */
export const STATUS_COLORS = {
  [ServiceStatus.ACTIVE]: 'bg-green-100 text-green-800',
  [ServiceStatus.INACTIVE]: 'bg-gray-100 text-gray-800',
  [ServiceStatus.ARCHIVED]: 'bg-red-100 text-red-800'
};
