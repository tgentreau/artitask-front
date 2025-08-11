/**
 * RegisterArtisanDto backend
 */
export interface RegisterRequest {
  email: string;
  password: string;  // Min 8 chars, 1 min, 1 maj, 1 chiffre
  nomEntreprise: string;
  telephone: string;
  adresse: string;
  siret?: string;  // Optionnel, 14 chiffres
}

/**
 * AuthenticateDto backend
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * RefreshTokenDto backend
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}


/**
 * Structure standard de réponse backend
 */
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

/**
 * ArtisanResponseDto backend
 */
export interface ArtisanResponse {
  id: string;
  email: string;
  nomEntreprise: string;
  telephone: string;
  adresse: string;
  siret?: string;
  compteActif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AuthResponseDto backend
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  artisan: {
    id: string;
    email: string;
    nomEntreprise: string;
  };
}

/**
 * Response du register
 */
export interface RegisterResponse {
  artisanId: string;
}


/**
 * User pour l'état local (transformé depuis ArtisanResponse)
 */
export interface User {
  id: string;
  email: string;
  nomEntreprise: string;
  telephone: string;
  adresse: string;
  siret?: string;
  compteActif: boolean;
}

/**
 * Token décodé JWT
 */
export interface DecodedToken {
  sub: string;  // artisanId
  email: string;
  iat: number;
  exp: number;
}
