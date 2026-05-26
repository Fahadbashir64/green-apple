import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { MenuService } from '../../../../core/services/menu.service';
import { ToastService } from '../../../../core/services/toast.service';
import { isPizzaCategory } from '../../../../core/utils/menu-pricing';

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface AdminMenuItem {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  price: number;
  priceMedium?: number | null;
  priceLarge?: number | null;
  priceXlarge?: number | null;
  imageUrl?: string;
  isActive: boolean;
}

interface MenuItemDraft {
  code: string;
  name: string;
  description: string;
  category: string;
  price: number;
  priceMedium: number | null;
  priceLarge: number | null;
  priceXlarge: number | null;
  imageUrl: string;
  isActive: boolean;
}

function emptyDraft(category = ''): MenuItemDraft {
  return {
    code: '',
    name: '',
    description: '',
    category,
    price: 0,
    priceMedium: null,
    priceLarge: null,
    priceXlarge: null,
    imageUrl: '',
    isActive: true
  };
}

function draftFromItem(item: AdminMenuItem): MenuItemDraft {
  return {
    code: item.code,
    name: item.name,
    description: item.description,
    category: item.category,
    price: Number(item.price),
    priceMedium: item.priceMedium ?? null,
    priceLarge: item.priceLarge ?? null,
    priceXlarge: item.priceXlarge ?? null,
    imageUrl: item.imageUrl || '',
    isActive: item.isActive
  };
}

@Component({
  selector: 'app-admin-orders-page',
  imports: [CurrencyPipe, FormsModule, RouterLink],
  templateUrl: './admin-orders-page.component.html',
  styleUrl: './admin-orders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminOrdersPageComponent implements OnInit {
  readonly categories = signal<string[]>([]);
  readonly items = signal<AdminMenuItem[]>([]);

  readonly searchTerm = signal('');
  readonly filterCategory = signal('');
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly currentPage = signal(1);
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  /** Create panel only — never shared with edit popup. */
  readonly createDraft = signal<MenuItemDraft>(emptyDraft());
  readonly showPizzaPricesCreate = computed(() =>
    isPizzaCategory(this.createDraft().category)
  );

  /** Edit popup only. */
  readonly editingId = signal<number | null>(null);
  readonly editDraft = signal<MenuItemDraft | null>(null);
  readonly showPizzaPricesEdit = computed(() => {
    const draft = this.editDraft();
    return draft ? isPizzaCategory(draft.category) : false;
  });

  readonly filteredItems = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const cat = this.filterCategory().trim().toLowerCase();
    return this.items().filter((item) => {
      if (cat && item.category.toLowerCase() !== cat) {
        return false;
      }
      if (!term) {
        return true;
      }
      return (
        item.name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        (item.description || '').toLowerCase().includes(term)
      );
    });
  });

  readonly totalPages = computed(() => {
    const size = Math.max(1, this.pageSize());
    return Math.max(1, Math.ceil(this.filteredItems().length / size));
  });

  readonly pagedItems = computed(() => {
    const size = Math.max(1, this.pageSize());
    const total = this.totalPages();
    const page = Math.min(Math.max(1, this.currentPage()), total);
    const start = (page - 1) * size;
    return this.filteredItems().slice(start, start + size);
  });

  readonly pageStart = computed(() => {
    if (this.filteredItems().length === 0) {
      return 0;
    }
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly pageEnd = computed(() => {
    const end = this.currentPage() * this.pageSize();
    return Math.min(end, this.filteredItems().length);
  });

  newCategory = '';
  minOrderPrice = 0;
  saving = false;
  createImageFile: File | null = null;
  editImageFile: File | null = null;

  constructor(
    private readonly menuService: MenuService,
    private readonly authService: AuthService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }
    this.loadDashboardData();
    this.menuService.loadMinOrderPrice().subscribe({
      next: (value) => {
        this.minOrderPrice = value;
      }
    });
  }

  patchCreateDraft(partial: Partial<MenuItemDraft>): void {
    this.createDraft.update((draft) => ({ ...draft, ...partial }));
  }

  patchEditDraft(partial: Partial<MenuItemDraft>): void {
    this.editDraft.update((draft) => (draft ? { ...draft, ...partial } : draft));
  }

  loadDashboardData(): void {
    this.reloadCategories();
    this.menuService.loadAdminItems().subscribe({
      next: (items) => {
        this.items.set(
          items.map((item) => ({
            id: Number(item.id),
            code: item.code,
            name: item.name,
            description: item.description,
            category: item.category,
            price: Number(item.price),
            priceMedium: item.priceMedium != null ? Number(item.priceMedium) : null,
            priceLarge: item.priceLarge != null ? Number(item.priceLarge) : null,
            priceXlarge: item.priceXlarge != null ? Number(item.priceXlarge) : null,
            imageUrl: item.imageUrl,
            isActive: Boolean(item.isActive)
          }))
        );
      }
    });
  }

  addCategory(): void {
    const name = this.newCategory.trim().toLowerCase();
    if (!name) {
      return;
    }
    this.menuService.createCategory(name).subscribe({
      next: () => {
        this.reloadCategories(name);
        this.newCategory = '';
        this.toastService.success('Category created.');
      },
      error: () => this.toastService.error('Could not create category.')
    });
  }

  deleteCategory(category: string): void {
    this.menuService.deleteCategory(category).subscribe({
      next: () => {
        this.loadDashboardData();
        this.toastService.info('Category deleted.');
      },
      error: () => this.toastService.error('Could not delete category.')
    });
  }

  private resolveCategory(
    current: string,
    categories: string[],
    preferred?: string
  ): string {
    if (preferred && categories.includes(preferred)) {
      return preferred;
    }
    if (current && categories.includes(current)) {
      return current;
    }
    return categories[0] ?? '';
  }

  private reloadCategories(preferredCategory?: string): void {
    this.menuService.loadCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.createDraft.update((draft) => ({
          ...draft,
          category: this.resolveCategory(draft.category, categories, preferredCategory)
        }));
        const edit = this.editDraft();
        if (edit && this.editingId() !== null) {
          this.editDraft.set({
            ...edit,
            category: this.resolveCategory(edit.category, categories)
          });
        }
      }
    });
  }

  private resetCreateDraft(): void {
    const category = this.categories()[0] || '';
    this.createDraft.set(emptyDraft(category));
    this.createImageFile = null;
  }

  startEdit(item: AdminMenuItem): void {
    this.editingId.set(item.id);
    this.editDraft.set(draftFromItem(item));
    this.editImageFile = null;
  }

  closeEditPopup(): void {
    this.editingId.set(null);
    this.editDraft.set(null);
    this.editImageFile = null;
  }

  saveItem(): void {
    const editingId = this.editingId();
    const draft = editingId === null ? this.createDraft() : this.editDraft();
    if (!draft) {
      return;
    }

    if (!draft.code.trim() || !draft.name.trim() || !draft.description.trim() || !draft.category.trim()) {
      this.toastService.error('Please complete all required fields.');
      return;
    }

    const cat = draft.category.trim().toLowerCase();
    if (isPizzaCategory(cat)) {
      const pm = Number(draft.priceMedium);
      const pl = Number(draft.priceLarge);
      const px = Number(draft.priceXlarge);
      if (!Number.isFinite(pm) || pm < 0 || !Number.isFinite(pl) || pl < 0 || !Number.isFinite(px) || px < 0) {
        this.toastService.error('Pizza items need valid prices for medium, large, and X-large.');
        return;
      }
    }

    this.saving = true;
    const pizzaPrices = isPizzaCategory(cat)
      ? {
          priceMedium: Number(draft.priceMedium),
          priceLarge: Number(draft.priceLarge),
          priceXlarge: Number(draft.priceXlarge)
        }
      : {};

    const request$ =
      editingId === null
        ? this.menuService.createMenuItem({
            code: draft.code.trim(),
            name: draft.name.trim(),
            description: draft.description.trim(),
            category: cat,
            price: Number(draft.price),
            ...pizzaPrices,
            imageFile: this.createImageFile
          })
        : this.menuService.updateMenuItem(editingId, {
            code: draft.code.trim(),
            name: draft.name.trim(),
            description: draft.description.trim(),
            category: cat,
            price: Number(draft.price),
            ...pizzaPrices,
            imageUrl: draft.imageUrl?.trim() || '',
            imageFile: this.editImageFile,
            isActive: draft.isActive
          });

    request$.subscribe({
      next: () => {
        if (editingId === null) {
          this.resetCreateDraft();
          this.toastService.success('Item created.');
        } else {
          this.closeEditPopup();
          this.toastService.success('Item updated.');
        }
        this.loadDashboardData();
      },
      error: () => this.toastService.error('Could not save menu item.'),
      complete: () => {
        this.saving = false;
      }
    });
  }

  toggleActive(item: AdminMenuItem): void {
    this.menuService
      .updateMenuItem(item.id, {
        code: item.code,
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        priceMedium: item.priceMedium ?? null,
        priceLarge: item.priceLarge ?? null,
        priceXlarge: item.priceXlarge ?? null,
        imageUrl: item.imageUrl || '',
        isActive: !item.isActive
      })
      .subscribe({
        next: () => {
          const nowActive = !item.isActive;
          this.items.update((list) =>
            list.map((row) =>
              row.id === item.id ? { ...row, isActive: nowActive } : row
            )
          );
          this.toastService.success(nowActive ? 'Item activated.' : 'Item disabled.');
        },
        error: () => this.toastService.error('Could not update item status.')
      });
  }

  deleteItem(item: AdminMenuItem): void {
    this.menuService.deleteMenuItem(item.id).subscribe({
      next: () => {
        this.items.update((list) => list.filter((entry) => entry.id !== item.id));
        this.toastService.info('Item deleted.');
      },
      error: () => this.toastService.error('Could not delete item.')
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  onCategoryFilterChange(value: string): void {
    this.filterCategory.set(value);
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.filterCategory.set('');
    this.currentPage.set(1);
  }

  setPageSize(size: number | string): void {
    const next = Math.max(1, Number(size) || DEFAULT_PAGE_SIZE);
    this.pageSize.set(next);
    this.currentPage.set(1);
  }

  prevPage(): void {
    const total = this.totalPages();
    this.currentPage.set(Math.min(Math.max(1, this.currentPage() - 1), total));
  }

  nextPage(): void {
    const total = this.totalPages();
    this.currentPage.set(Math.min(this.currentPage() + 1, total));
  }

  onCreateImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.createImageFile = input.files?.[0] || null;
  }

  onEditImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editImageFile = input.files?.[0] || null;
  }

  saveMinOrderPrice(): void {
    if (!Number.isFinite(this.minOrderPrice) || this.minOrderPrice < 0) {
      this.toastService.error('Please enter a valid minimum order price.');
      return;
    }
    this.menuService.updateMinOrderPrice(this.minOrderPrice).subscribe({
      next: (value) => {
        this.minOrderPrice = value;
        this.toastService.success('Minimum order price updated.');
      },
      error: () => this.toastService.error('Could not update minimum order price.')
    });
  }
}
