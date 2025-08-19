import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../../environments/environment';
import {
  AuthResponse,
  ArtisanResponse,
  RegisterResponse,
  User
} from '../models/auth.model';
import {ApiResponse} from "../../../shared/models/api-error-response.interface";

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  let localStorageSpy: jasmine.SpyObj<Storage>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    localStorageSpy = jasmine.createSpyObj('localStorage', ['getItem', 'setItem', 'removeItem']);
    Object.defineProperty(window, 'localStorage', { value: localStorageSpy, writable: true });
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Authentication', () => {
    it('should login successfully and store tokens', (done) => {
      const credentials = { email: 'test@test.com', password: 'password' };

      const mockResponse: ApiResponse<AuthResponse> = {
        statusCode: 200,
        message: 'Success',
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          artisan: {
            id: '123',
            email: 'test@test.com',
            nomEntreprise: 'Test Company'
          }
        }
      };

      service.login(credentials).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(service.isAuthenticated$()).toBeTrue();
        expect(service.currentUser$()).toBeTruthy();
        expect(service.currentUser$()?.email).toBe('test@test.com');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockResponse);

      const profileResponse: ApiResponse<ArtisanResponse> = {
        statusCode: 200,
        message: 'Success',
        data: {
          id: '123',
          email: 'test@test.com',
          nomEntreprise: 'Test Company',
          telephone: '0123456789',
          adresse: '123 Test St',
          siret: '12345678901234',
          compteActif: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      const profileReq = httpMock.expectOne(`${environment.apiUrl}/auth/profile`);
      profileReq.flush(profileResponse);
    });

    it('should handle login error', (done) => {
      const credentials = { email: 'test@test.com', password: 'wrong' };

      service.login(credentials).subscribe({
        error: (error) => {
          expect(service.isAuthenticated$()).toBeFalse();
          expect(service.currentUser$()).toBeNull();
          expect(service.loading$()).toBeFalse();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(
        { message: 'Invalid credentials' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });

    it('should logout and clear data', () => {
      const mockUser: User = {
        id: '123',
        email: 'test@test.com',
        nomEntreprise: 'Test',
        telephone: '0123456789',
        adresse: '123 Test St',
        compteActif: true
      };

      service['currentUserSignal'].set(mockUser);
      service['isAuthenticatedSignal'].set(true);

      service.logout();

      expect(service.isAuthenticated$()).toBeFalse();
      expect(service.currentUser$()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/auth']);
    });
  });

  describe('Registration', () => {
    it('should register successfully', (done) => {
      const registerData = {
        email: 'new@test.com',
        password: 'password123',
        nomEntreprise: 'New Company',
        telephone: '0123456789',
        adresse: '456 New St',
        siret: '12345678901234'
      };

      const mockResponse: ApiResponse<RegisterResponse> = {
        statusCode: 201,
        message: 'Created',
        data: {
          artisanId: 'new-123'
        }
      };

      service.register(registerData).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerData);
      req.flush(mockResponse);
    });

    it('should handle registration error for duplicate email', (done) => {
      const registerData = {
        email: 'existing@test.com',
        password: 'password123',
        nomEntreprise: 'Company',
        telephone: '0123456789',
        adresse: '123 St'
      };

      service.register(registerData).subscribe({
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      req.flush(
        { message: 'Email already exists' },
        { status: 409, statusText: 'Conflict' }
      );
    });
  });

  describe('Token Management', () => {
    it('should refresh token successfully', (done) => {
      localStorageSpy.getItem.and.returnValue('old-refresh-token');

      const mockResponse: ApiResponse<AuthResponse> = {
        statusCode: 200,
        message: 'Success',
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          artisan: {
            id: '123',
            email: 'test@test.com',
            nomEntreprise: 'Test Company'
          }
        }
      };

      service.refreshToken().subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'old-refresh-token' });
      req.flush(mockResponse);
    });

    it('should logout if refresh token is missing', (done) => {
      localStorageSpy.getItem.and.returnValue(null);

      service.refreshToken().subscribe({
        error: () => {
          expect(router.navigate).toHaveBeenCalledWith(['/auth']);
          done();
        }
      });
    });

    it('should detect expired token', () => {
      const expiredToken = createMockToken({ exp: Math.floor(Date.now() / 1000) - 3600 });
      expect(service['isTokenExpired'](expiredToken)).toBeTrue();

      const validToken = createMockToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
      expect(service['isTokenExpired'](validToken)).toBeFalse();
    });

    it('should handle invalid token format', () => {
      expect(service['isTokenExpired']('invalid-token')).toBeTrue();
      expect(service['isTokenExpired']('')).toBeTrue();
    });
  });

  describe('Profile Management', () => {
    it('should get profile successfully', (done) => {
      const mockProfile: ApiResponse<ArtisanResponse> = {
        statusCode: 200,
        message: 'Success',
        data: {
          id: '123',
          email: 'test@test.com',
          nomEntreprise: 'Test Company',
          telephone: '0123456789',
          adresse: '123 Test St',
          siret: '12345678901234',
          compteActif: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      service.getProfile().subscribe(response => {
        expect(response).toEqual(mockProfile);
        expect(service.currentUser$()).toBeTruthy();
        expect(service.currentUser$()?.nomEntreprise).toBe('Test Company');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/profile`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProfile);
    });

    it('should logout on 401 when getting profile', (done) => {
      service.getProfile().subscribe({
        error: () => {
          expect(router.navigate).toHaveBeenCalledWith(['/auth']);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/profile`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Initialization', () => {
    it('should check auth status on initialization with valid token', () => {
      const validToken = createMockToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
      const mockUser: User = {
        id: '123',
        email: 'test@test.com',
        nomEntreprise: 'Test Company',
        telephone: '0123456789',
        adresse: '123 Test St',
        compteActif: true
      };

      localStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'access_token') return validToken;
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      service['checkAuthStatus']();

      expect(service.currentUser$()).toEqual(mockUser);
      expect(service.isAuthenticated$()).toBeTrue();

      const profileResponse: ApiResponse<ArtisanResponse> = {
        statusCode: 200,
        message: 'Success',
        data: {
          id: '123',
          email: 'test@test.com',
          nomEntreprise: 'Test Company',
          telephone: '0123456789',
          adresse: '123 Test St',
          compteActif: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/profile`);
      req.flush(profileResponse);
    });

    it('should refresh token if access token is expired', () => {
      const expiredToken = createMockToken({ exp: Math.floor(Date.now() / 1000) - 3600 });

      localStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'access_token') return expiredToken;
        if (key === 'refresh_token') return 'valid-refresh-token';
        return null;
      });

      service['checkAuthStatus']();

      const mockResponse: ApiResponse<AuthResponse> = {
        statusCode: 200,
        message: 'Success',
        data: {
          accessToken: 'new-token',
          refreshToken: 'new-refresh-token',
          artisan: {
            id: '123',
            email: 'test@test.com',
            nomEntreprise: 'Test Company'
          }
        }
      };

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
      req.flush(mockResponse);
    });

    it('should logout if no valid token found', () => {
      localStorageSpy.getItem.and.returnValue(null);

      service['checkAuthStatus']();

      expect(service.isAuthenticated$()).toBeFalse();
      expect(service.currentUser$()).toBeNull();
    });
  });

  describe('Register and Login', () => {
    it('should register and auto-login successfully', (done) => {
      const registerData = {
        email: 'new@test.com',
        password: 'password123',
        nomEntreprise: 'New Company',
        telephone: '0123456789',
        adresse: '456 New St',
        siret: ''
      };

      service.registerAndLogin(registerData).subscribe(() => {
        setTimeout(() => {
          expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
          done();
        }, 600);
      });

      const registerResponse: ApiResponse<RegisterResponse> = {
        statusCode: 201,
        message: 'Created',
        data: { artisanId: 'new-123' }
      };

      const registerReq = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      registerReq.flush(registerResponse);

      setTimeout(() => {
        const loginResponse: ApiResponse<AuthResponse> = {
          statusCode: 200,
          message: 'Success',
          data: {
            accessToken: 'token',
            refreshToken: 'refresh',
            artisan: {
              id: 'new-123',
              email: registerData.email,
              nomEntreprise: registerData.nomEntreprise
            }
          }
        };

        const loginReq = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
        loginReq.flush(loginResponse);

        const profileResponse: ApiResponse<ArtisanResponse> = {
          statusCode: 200,
          message: 'Success',
          data: {
            id: 'new-123',
            email: registerData.email,
            nomEntreprise: registerData.nomEntreprise,
            telephone: registerData.telephone,
            adresse: registerData.adresse,
            compteActif: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };

        const profileReq = httpMock.expectOne(`${environment.apiUrl}/auth/profile`);
        profileReq.flush(profileResponse);
      }, 550);
    });
  });
});

function createMockToken(payload: any): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = 'mock-signature';
  return `${header}.${body}.${signature}`;
}
