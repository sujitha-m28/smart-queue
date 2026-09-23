import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, JwtPayload, LoginRequest, RegisterRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private _currentUser$ = new BehaviorSubject<AuthResponse | null>(this.loadUser());
  readonly currentUser$ = this._currentUser$.asObservable();

  // ── HTTP calls ──────────────────────────────────────────────
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials).pipe(
      tap(res => this.persistAuth(res))
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', data).pipe(
      tap(res => this.persistAuth(res))
    );
  }

  // ── Session helpers ─────────────────────────────────────────
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._currentUser$.next(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  hasRole(...roles: string[]): boolean {
    const user = this._currentUser$.value;
    if (!user) return false;
    return roles.some(r => user.roles.includes(r));
  }

  getRoles(): string[] {
    return this._currentUser$.value?.roles ?? [];
  }

  getCurrentUser(): AuthResponse | null {
    return this._currentUser$.value;
  }

  getFullName(): string {
    return this._currentUser$.value?.fullName ?? '';
  }

  getUsername(): string {
    return this._currentUser$.value?.username ?? '';
  }

  /** Redirect user to the correct default route for their role. */
  redirectByRole(): void {
    const roles = this.getRoles();
    if (roles.includes('ADMIN'))    { this.router.navigate(['/admin']);   return; }
    if (roles.includes('MANAGER'))  { this.router.navigate(['/manager']); return; }
    if (roles.includes('STAFF'))    { this.router.navigate(['/staff']);   return; }
    this.router.navigate(['/customer/join']);
  }

  // ── Private helpers ─────────────────────────────────────────
  private persistAuth(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res));
    this._currentUser$.next(res);
  }

  private loadUser(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? (JSON.parse(raw) as AuthResponse) : null;
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodePayload(token);
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  private decodePayload(token: string): JwtPayload {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as JwtPayload;
  }
}
