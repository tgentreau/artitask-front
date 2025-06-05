import { TestBed } from '@angular/core/testing';
import { InterventionService } from './intervention.service';
import { CreateInterventionRequest } from '../models/intervention.interface';

describe('InterventionService', () => {
  let service: InterventionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InterventionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have mock data on init', () => {
    const interventions = service.interventions$();
    expect(interventions.length).toBeGreaterThan(0);
  });

  it('should create intervention with valid data', (done) => {
    const request: CreateInterventionRequest = {
      clientName: 'Test Client',
      clientPhone: '06 12 34 56 78',
      clientAddress: 'Test Address',
      serviceType: 'Test Service',
      interventionDate: new Date(),
      startTime: '10:00',
      description: 'Test description',
      isUrgent: false
    };

    service.createIntervention(request).subscribe({
      next: (intervention) => {
        expect(intervention.clientName).toBe(request.clientName);
        expect(intervention.status).toBe('scheduled');
        done();
      },
      error: done.fail
    });
  });

  it('should validate required fields', (done) => {
    const invalidRequest: CreateInterventionRequest = {
      clientName: '', // Invalid: empty
      clientPhone: '06 12 34 56 78',
      clientAddress: 'Test Address',
      serviceType: 'Test Service',
      interventionDate: new Date(),
      startTime: '10:00',
      description: 'Test description',
      isUrgent: false
    };

    service.createIntervention(invalidRequest).subscribe({
      next: () => done.fail('Should have failed validation'),
      error: (error) => {
        expect(error.message).toContain('Client name');
        done();
      }
    });
  });

  it('should calculate stats correctly', () => {
    const stats = service.interventionsByStatus();
    expect(stats.scheduled).toBeGreaterThanOrEqual(0);
    expect(stats.completed).toBeGreaterThanOrEqual(0);
  });
});
