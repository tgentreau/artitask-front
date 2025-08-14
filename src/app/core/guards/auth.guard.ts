import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');

  if (token && !isTokenExpired(token)) {
    return true;
  }

  const refreshToken = localStorage.getItem('refresh_token');

  if (refreshToken) {
    localStorage.setItem('returnUrl', state.url);
    return true;
  }

  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true;
    }

    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);

    return payload.exp < currentTime;
  } catch {
    return true;
  }
}
