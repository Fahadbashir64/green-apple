import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

const API_BASE_URL = environment.apiUrl;
const TOKEN_KEY = 'ga_auth_token';
const USER_KEY = 'ga_auth_user';

interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role?: 'admin' | 'customer' | 'sub_admin';
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly userSignal = signal<AuthUser | null>(this.readStoredUser());

  readonly token = this.tokenSignal.asReadonly();
  readonly currentUser = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => Boolean(this.tokenSignal()));
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly isSubAdmin = computed(() => this.currentUser()?.role === 'sub_admin');
  /** Customers only: browse menu, cart, and checkout (not admin or sub-admin). */
  readonly canShopAsCustomer = computed(() => {
    const role = this.currentUser()?.role;
    return role !== 'admin' && role !== 'sub_admin';
  });
  /** Same order-management API and UI as admin (admin or sub-admin). */
  readonly canManageAllOrders = computed(() => this.isAdmin() || this.isSubAdmin());

  constructor(private readonly http: HttpClient) {}

  register(payload: { fullName: string; email: string; phone: string; password: string }): Observable<void> {
    return this.http.post(`${API_BASE_URL}/auth/register`, payload).pipe(map(() => void 0));
  }

  login(email: string, password: string): Observable<void> {
    return this.http.post<LoginResponse>(`${API_BASE_URL}/auth/login`, { email, password }).pipe(
      tap((response) => this.persistSession(response.token, response.user)),
      map(() => void 0)
    );
  }

  fetchProfile(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${API_BASE_URL}/auth/me`, { headers: this.authHeaders() }).pipe(
      tap((user) => {
        const currentToken = this.tokenSignal();
        if (currentToken) {
          this.persistSession(currentToken, user);
        } else {
          this.userSignal.set(user);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
      })
    );
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  authHeaders(): Record<string, string> {
    const token = this.tokenSignal();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private persistSession(token: string, user: AuthUser): void {
    this.tokenSignal.set(token);
    this.userSignal.set(user);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
