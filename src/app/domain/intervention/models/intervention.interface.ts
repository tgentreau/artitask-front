import { BaseEntity } from '../../../shared/models/base.interface';

export type InterventionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Intervention extends BaseEntity {
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  serviceType: string;
  interventionDate: Date;
  startTime: string;
  endTime?: string;
  status: InterventionStatus;
  description: string;
  isUrgent: boolean;
  notes?: string;
  timeSpent?: number; // en minutes
}

export interface CreateInterventionRequest {
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  serviceType: string;
  interventionDate: Date;
  startTime: string;
  description: string;
  isUrgent: boolean;
}

export interface UpdateInterventionRequest extends Partial<CreateInterventionRequest> {
  status?: InterventionStatus;
  endTime?: string;
  notes?: string;
  timeSpent?: number;
}
