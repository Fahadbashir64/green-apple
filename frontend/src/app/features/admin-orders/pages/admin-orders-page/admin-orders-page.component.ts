import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
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

@Component({
  selector: 'app-admin-orders-page',
  imports: [CurrencyPipe, FormsModule, RouterLink],
  templateUrl: './admin-orders-page.component.html',
  styleUrl: './admin-orders-page.component.scss'
})
export class AdminOrdersPageComponent implements OnInit {
  /** Template helper for pizza-only price fields */
  readonly isPizzaCat = isPizzaCategory;

  readonly categories = signal<string[]>([]);
  readonly items = signal<AdminMenuItem[]>([]);

  readonly searchTerm = signal('');
  readonly filterCategory = signal('');
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly currentPage = signal(1);
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

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
  editingId: number | null = null;
  createImageFile: File | null = null;
  editImageFile: File | null = null;
  form: Omit<AdminMenuItem, 'id'> = {
    code: '',
    name: '',
    description: '',
    category: '',
    price: 0,
    priceMedium: null,
    priceLarge: null,
    priceXlarge: null,
    imageUrl: '',
    isActive: true
  };

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
        this.toastService.info('Category deleted.');
        if (this.form.category === category) {
          this.form.category = '';
        }
        this.loadDashboardData();
      },
      error: () => this.toastService.error('Could not delete category.')
    });
  }

  private reloadCategories(preferredCategory?: string): void {
    this.menuService.loadCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        if (preferredCategory && categories.includes(preferredCategory)) {
          this.form.category = preferredCategory;
          return;
        }
        if (!this.form.category && categories.length > 0) {
          this.form.category = categories[0];
        }
      }
    });
  }

  startEdit(item: AdminMenuItem): void {
    this.editingId = item.id;
    this.form = {
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

  closeEditPopup(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.editingId = null;
    this.editImageFile = null;
    this.form = {
      code: '',
      name: '',
      description: '',
      category: this.categories()[0] || '',
      price: 0,
      priceMedium: null,
      priceLarge: null,
      priceXlarge: null,
      imageUrl: '',
      isActive: true
    };
  }

  saveItem(): void {
    if (!this.form.code.trim() || !this.form.name.trim() || !this.form.description.trim() || !this.form.category.trim()) {
      this.toastService.error('Please complete all required fields.');
      return;
    }
    const cat = this.form.category.trim().toLowerCase();
    if (isPizzaCategory(cat)) {
      const pm = Number(this.form.priceMedium);
      const pl = Number(this.form.priceLarge);
      const px = Number(this.form.priceXlarge);
      if (!Number.isFinite(pm) || pm < 0 || !Number.isFinite(pl) || pl < 0 || !Number.isFinite(px) || px < 0) {
        this.toastService.error('Pizza items need valid prices for medium, large, and X-large.');
        return;
      }
    }
    this.saving = true;
    const pizzaPrices = isPizzaCategory(cat)
      ? {
          priceMedium: Number(this.form.priceMedium),
          priceLarge: Number(this.form.priceLarge),
          priceXlarge: Number(this.form.priceXlarge)
        }
      : {};
    const request$ =
      this.editingId === null
        ? this.menuService.createMenuItem({
            code: this.form.code.trim(),
            name: this.form.name.trim(),
            description: this.form.description.trim(),
            category: cat,
            price: Number(this.form.price),
            ...pizzaPrices,
            imageFile: this.createImageFile
          })
        : this.menuService.updateMenuItem(this.editingId, {
            code: this.form.code.trim(),
            name: this.form.name.trim(),
            description: this.form.description.trim(),
            category: cat,
            price: Number(this.form.price),
            ...pizzaPrices,
            imageUrl: this.form.imageUrl?.trim() || '',
            imageFile: this.editImageFile,
            isActive: this.form.isActive
          });

    request$.subscribe({
      next: () => {
        this.toastService.success(this.editingId === null ? 'Item created.' : 'Item updated.');
        this.createImageFile = null;
        this.resetForm();
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
          item.isActive = !item.isActive;
          this.toastService.success(item.isActive ? 'Item activated.' : 'Item disabled.');
        },
        error: () => this.toastService.error('Could not update item status.')
      });
  }

  deleteItem(item: AdminMenuItem): void {
    this.menuService.deleteMenuItem(item.id).subscribe({
      next: () => {
        this.items.set(this.items().filter((entry) => entry.id !== item.id));
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

  goToPage(page: number): void {
    const total = this.totalPages();
    this.currentPage.set(Math.min(Math.max(1, page), total));
  }

  prevPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
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
