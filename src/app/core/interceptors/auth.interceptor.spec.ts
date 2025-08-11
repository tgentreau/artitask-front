import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../auth/services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('AuthInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getAccessToken',
      'refreshToken',
      'logout'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
        },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Token Handling', () => {
    it('should add Bearer token to requests when token exists', () => {
      const mockToken = 'mock-access-token';
      authService.getAccessToken.and.returnValue(mockToken);

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });

    it('should not add token to public endpoints', () => {
      authService.getAccessToken.and.returnValue('mock-token');

      httpClient.post('/api/auth/login', {}).subscribe();

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });

    it('should not add token when no token exists', () => {
      authService.getAccessToken.and.returnValue(null);

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 error and refresh token', (done) => {
      authService.getAccessToken.and.returnValue('old-token');
      authService.refreshToken.and.returnValue(
        of({
          statusCode: 200,
          message: 'Token refreshed',
          data: {
            accessToken: 'new-token',
            refreshToken: 'new-refresh-token'
          }
        } as any)
      );

      httpClient.get('/api/test').subscribe({
        next: () => done(),
        error: () => fail('Should not error after refresh')
      });

      const req1 = httpMock.expectOne('/api/test');
      req1.flush(null, { status: 401, statusText: 'Unauthorized' });

      setTimeout(() => {
        const req2 = httpMock.expectOne('/api/test');
        expect(req2.request.headers.get('Authorization')).toBe('Bearer new-token');
        req2.flush({});
      }, 100);
    });

    it('should logout on 401 if refresh fails', (done) => {
      authService.getAccessToken.and.returnValue('old-token');
      authService.refreshToken.and.returnValue(
        throwError(() => new Error('Refresh failed'))
      );

      httpClient.get('/api/test').subscribe({
        error: (error) => {
          expect(authService.logout).toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 403 error and logout', (done) => {
      authService.getAccessToken.and.returnValue('token');

      httpClient.get('/api/test').subscribe({
        error: (error) => {
          expect(error.message).toContain('Accès refusé');
          expect(authService.logout).toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(null, { status: 403, statusText: 'Forbidden' });
    });

    it('should handle network error (status 0)', (done) => {
      authService.getAccessToken.and.returnValue('token');

      httpClient.get('/api/test').subscribe({
        error: (error) => {
          expect(error.message).toContain('connexion au serveur');
          done();
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(null, { status: 0, statusText: 'Unknown Error' });
    });

    it('should handle 500+ server errors', (done) => {
      authService.getAccessToken.and.returnValue('token');

      httpClient.get('/api/test').subscribe({
        error: (error) => {
          expect(error.message).toContain('Erreur serveur');
          done();
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('Concurrent Requests', () => {
    it('should queue requests during token refresh', (done) => {
      authService.getAccessToken.and.returnValue('old-token');
      let refreshCallCount = 0;

      authService.refreshToken.and.callFake(() => {
        refreshCallCount++;
        return of({
          statusCode: 200,
          message: 'Token refreshed',
          data: {
            accessToken: 'new-token',
            refreshToken: 'new-refresh-token'
          }
        } as any);
      });

      let completedRequests = 0;
      const checkComplete = () => {
        completedRequests++;
        if (completedRequests === 3) {
          expect(refreshCallCount).toBe(1);
          done();
        }
      };

      httpClient.get('/api/test1').subscribe({ next: checkComplete });
      httpClient.get('/api/test2').subscribe({ next: checkComplete });
      httpClient.get('/api/test3').subscribe({ next: checkComplete });

      const req1 = httpMock.expectOne('/api/test1');
      req1.flush(null, { status: 401, statusText: 'Unauthorized' });

      const req2 = httpMock.expectOne('/api/test2');
      req2.flush(null, { status: 401, statusText: 'Unauthorized' });

      const req3 = httpMock.expectOne('/api/test3');
      req3.flush(null, { status: 401, statusText: 'Unauthorized' });

      setTimeout(() => {
        const retryReq1 = httpMock.expectOne('/api/test1');
        retryReq1.flush({});

        const retryReq2 = httpMock.expectOne('/api/test2');
        retryReq2.flush({});

        const retryReq3 = httpMock.expectOne('/api/test3');
        retryReq3.flush({});
      }, 100);
    });
  });
});
