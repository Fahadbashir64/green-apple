import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap } from 'rxjs';

import { MenuCategory, MenuItem } from '../models/menu-item.model';
import { allergensForMenuItem } from '../constants/menu-allergens';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const API_BASE_URL = environment.apiUrl;

/** Not shown as a section on the public menu (admin API still lists it). */
function isPublicMenuCategorySlug(c: string): boolean {
  const s = String(c ?? '').trim().toLowerCase();
  return Boolean(s) && s !== 'uncategorized';
}

/** Pizza first, drinks last; middle keeps merge order (matches API created_at sort). */
function pinPizzaFirstDrinksLast(categories: MenuCategory[]): MenuCategory[] {
  const pizza: MenuCategory[] = [];
  const drinks: MenuCategory[] = [];
  const middle: MenuCategory[] = [];
  for (const c of categories) {
    if (c === 'pizza') {
      pizza.push(c);
    } else if (c === 'drinks') {
      drinks.push(c);
    } else {
      middle.push(c);
    }
  }
  return [...pizza, ...middle, ...drinks];
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly menuItemsSignal = signal<MenuItem[]>([]);
  /** Category slugs from DB (menu_categories + items), same order as API */
  private readonly menuCategoriesSignal = signal<MenuCategory[]>([]);
  readonly menuItems = computed(() => this.menuItemsSignal());

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  loadItems(): Observable<MenuItem[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/menu-items`).pipe(
      map((items) =>
        items.map((item) => {
          const code = item.code || item.id;
          return this.toSafeItem({
            id: code,
            category: item.category,
            name: item.name,
            description: item.description,
            price: Number(item.price),
            priceMedium: item.priceMedium,
            priceLarge: item.priceLarge,
            priceXlarge: item.priceXlarge,
            isBestseller: Boolean(item.isBestseller),
            allergens: allergensForMenuItem({
              code,
              id: code,
              name: item.name,
              allergens: item.allergens
            })
          } as MenuItem);
        })
      ),
      tap((items) => this.menuItemsSignal.set(items))
    );
  }

  getItems(): MenuItem[] {
    return this.menuItemsSignal();
  }

  getItemsByCategory(category: MenuCategory): MenuItem[] {
    const key = String(category ?? '').trim().toLowerCase();
    return this.getItems().filter((item) => String(item.category ?? '').trim().toLowerCase() === key);
  }

  getBestsellerItems(): MenuItem[] {
    return this.getItems().filter((item) => item.isBestseller);
  }

  /** Categories that exist on at least one item, in first-seen order (matches API order). */
  getDistinctCategories(): MenuCategory[] {
    const seen = new Set<string>();
    const order: MenuCategory[] = [];
    for (const item of this.getItems()) {
      const c = String(item.category ?? '').trim().toLowerCase();
      if (!isPublicMenuCategorySlug(c) || seen.has(c)) {
        continue;
      }
      seen.add(c);
      order.push(c);
    }
    return order;
  }

  /** Public: all categories from DB (including empty), then any item-only categories. */
  loadPublicCategories(): Observable<MenuCategory[]> {
    return this.http.get<string[]>(`${API_BASE_URL}/menu-items/categories`).pipe(
      map((list) =>
        (list ?? [])
          .map((c) => String(c ?? '').trim().toLowerCase())
          .filter(isPublicMenuCategorySlug)
      ),
      tap((normalized) => this.menuCategoriesSignal.set(normalized)),
      catchError(() => {
        this.menuCategoriesSignal.set([]);
        return of([]);
      })
    );
  }

  /** Order sections on the menu page: DB categories first, then item categories not in DB list. */
  getCategoryOrderForMenu(): MenuCategory[] {
    const fromDb = this.menuCategoriesSignal();
    const fromItems = this.getDistinctCategories();
    const seen = new Set<string>();
    const order: MenuCategory[] = [];
    for (const c of fromDb) {
      if (isPublicMenuCategorySlug(c) && !seen.has(c)) {
        seen.add(c);
        order.push(c);
      }
    }
    for (const c of fromItems) {
      if (isPublicMenuCategorySlug(c) && !seen.has(c)) {
        seen.add(c);
        order.push(c);
      }
    }
    return pinPizzaFirstDrinksLast(order);
  }

  loadAdminItems(): Observable<Array<MenuItem & { id: number; code: string; isActive: boolean }>> {
    return this.http
      .get<Array<MenuItem & { id: number; code: string; isActive: boolean }>>(`${API_BASE_URL}/menu-items/admin`, {
        headers: this.authService.authHeaders()
      })
      .pipe(
        map((items) => items)
      );
  }

  loadCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${API_BASE_URL}/menu-items/categories`, { headers: this.authService.authHeaders() });
  }

  createCategory(name: string): Observable<{ name: string }> {
    return this.http.post<{ name: string }>(
      `${API_BASE_URL}/menu-items/categories`,
      { name },
      { headers: this.authService.authHeaders() }
    );
  }

  deleteCategory(name: string): Observable<void> {
    return this.http
      .delete(`${API_BASE_URL}/menu-items/categories/${encodeURIComponent(name)}`, {
        headers: this.authService.authHeaders()
      })
      .pipe(map(() => void 0));
  }

  createMenuItem(payload: {
    code: string;
    name: string;
    description: string;
    category: string;
    price: number;
    priceMedium?: number | null;
    priceLarge?: number | null;
    priceXlarge?: number | null;
    isBestseller?: boolean;
  }): Observable<void> {
    const formData = new FormData();
    formData.append('code', payload.code);
    formData.append('name', payload.name);
    formData.append('description', payload.description);
    formData.append('category', payload.category);
    formData.append('price', String(payload.price));
    const isPizza = payload.category.trim().toLowerCase() === 'pizza';
    formData.append('priceMedium', isPizza && payload.priceMedium != null ? String(payload.priceMedium) : '');
    formData.append('priceLarge', isPizza && payload.priceLarge != null ? String(payload.priceLarge) : '');
    formData.append('priceXlarge', isPizza && payload.priceXlarge != null ? String(payload.priceXlarge) : '');
    formData.append('isBestseller', String(Boolean(payload.isBestseller)));
    return this.http
      .post(`${API_BASE_URL}/menu-items`, formData, {
        headers: this.authService.authHeaders()
      })
      .pipe(map(() => void 0));
  }

  updateMenuItem(
    id: number,
    payload: {
      code: string;
      name: string;
      description: string;
      category: string;
      price: number;
      priceMedium?: number | null;
      priceLarge?: number | null;
      priceXlarge?: number | null;
      isActive: boolean;
      isBestseller?: boolean;
    }
  ): Observable<void> {
    const formData = new FormData();
    formData.append('code', payload.code);
    formData.append('name', payload.name);
    formData.append('description', payload.description);
    formData.append('category', payload.category);
    formData.append('price', String(payload.price));
    const isPizza = payload.category.trim().toLowerCase() === 'pizza';
    formData.append('priceMedium', isPizza && payload.priceMedium != null ? String(payload.priceMedium) : '');
    formData.append('priceLarge', isPizza && payload.priceLarge != null ? String(payload.priceLarge) : '');
    formData.append('priceXlarge', isPizza && payload.priceXlarge != null ? String(payload.priceXlarge) : '');
    formData.append('isActive', String(payload.isActive));
    formData.append('isBestseller', String(Boolean(payload.isBestseller)));
    return this.http
      .patch(`${API_BASE_URL}/menu-items/${id}`, formData, {
        headers: this.authService.authHeaders()
      })
      .pipe(map(() => void 0));
  }

  deleteMenuItem(id: number): Observable<void> {
    return this.http
      .delete(`${API_BASE_URL}/menu-items/${id}`, { headers: this.authService.authHeaders() })
      .pipe(map(() => void 0));
  }

  loadMinOrderPrice(): Observable<number> {
    return this.http
      .get<{ minOrderPrice: number }>(`${API_BASE_URL}/orders/settings/min-order-price`, {
        headers: this.authService.authHeaders()
      })
      .pipe(map((response) => Number(response.minOrderPrice) || 0));
  }

  updateMinOrderPrice(minOrderPrice: number): Observable<number> {
    return this.http
      .put<{ minOrderPrice: number }>(
        `${API_BASE_URL}/orders/settings/min-order-price`,
        { minOrderPrice },
        { headers: this.authService.authHeaders() }
      )
      .pipe(map((response) => Number(response.minOrderPrice) || 0));
  }

  private toSafeItem(item: MenuItem): MenuItem {
    const n = (v: unknown): number | null => {
      if (v === undefined || v === null || v === '') {
        return null;
      }
      const x = Number(v);
      return Number.isFinite(x) ? x : null;
    };
    return {
      id: item.id,
      category: item.category,
      name: item.name?.trim() || '',
      description: item.description?.trim() || '',
      price: Number.isFinite(item.price) ? item.price : 0,
      priceMedium: n(item.priceMedium),
      priceLarge: n(item.priceLarge),
      priceXlarge: n(item.priceXlarge),
      badge: item.badge,
      isBestseller: Boolean(item.isBestseller),
      allergens: allergensForMenuItem({ code: item.id, id: item.id, name: item.name, allergens: item.allergens })
    };
  }
}
