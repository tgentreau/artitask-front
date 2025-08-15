/**
 * Types de services disponibles
 */
export const SERVICE_TYPES = [
  {
    value: 'maintenance',
    label: 'Maintenance',
    icon: '🔧',
    description: 'Maintenance préventive et entretien régulier'
  },
  {
    value: 'reparation',
    label: 'Réparation',
    icon: '🔨',
    description: 'Réparation de pannes et dysfonctionnements'
  },
  {
    value: 'installation',
    label: 'Installation',
    icon: '⚙️',
    description: 'Installation de nouveaux équipements'
  },
  {
    value: 'urgence',
    label: 'Urgence',
    icon: '🚨',
    description: 'Intervention d\'urgence 24/7'
  },
  {
    value: 'diagnostic',
    label: 'Diagnostic',
    icon: '🔍',
    description: 'Diagnostic et expertise technique'
  },
  {
    value: 'conseil',
    label: 'Conseil',
    icon: '💡',
    description: 'Conseil et accompagnement technique'
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
 * Tarifs par défaut par type de service
 */
interface TarifDefaults {
  horaire?: number;
  fixe?: number;
  deplacement?: number;
}

interface DefaultTarifsMap {
  [key: string]: TarifDefaults;
}

export const DEFAULT_TARIFS: DefaultTarifsMap = {
  maintenance: { horaire: 45, deplacement: 30 },
  reparation: { horaire: 50, deplacement: 35 },
  installation: { horaire: 55, deplacement: 40 },
  urgence: { horaire: 80, deplacement: 50 },
  diagnostic: { fixe: 150, deplacement: 25 },
  conseil: { fixe: 100, deplacement: 20 }
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
