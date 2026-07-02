import { Component, HostListener, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map, startWith } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { OpeningHoursService } from '../../../core/services/opening-hours.service';
import { TranslationService } from '../../../core/services/translation.service';
import { SITE_LOGO } from '../../../core/utils/media-url';
import { ClosedNoticePopupComponent } from '../../ui/closed-notice-popup/closed-notice-popup.component';
import { ContactPopupComponent } from '../../ui/contact-popup/contact-popup.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, ClosedNoticePopupComponent, ContactPopupComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  readonly siteLogoSrc = SITE_LOGO;
  isProfileOpen = false;
  isMobileMenuOpen = false;
  isContactOpen = false;

  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly showClosedNotice = computed(() => {
    const url = this.currentUrl() ?? '';
    const onShopRoute = url.startsWith('/menu') || url.startsWith('/cart') || url.startsWith('/checkout');
    const isStaff = this.authService.isAdmin() || this.authService.isSubAdmin();
    return onShopRoute && !isStaff && this.openingHours.shouldShowNotice();
  });

  readonly isMenuCartLayout = computed(() => {
    const url = this.currentUrl() ?? '';
    return url.startsWith('/menu') && this.authService.canShopAsCustomer();
  });

  constructor(
    public readonly translationService: TranslationService,
    public readonly cartService: CartService,
    public readonly authService: AuthService,
    public readonly openingHours: OpeningHoursService
  ) {}

  setLanguage(language: string): void {
    this.translationService.switchLanguage(language);
    this.closeMobileMenu();
  }

  toggleMobileMenu(event: Event): void {
    event.stopPropagation();
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (!this.isMobileMenuOpen) {
      this.closeProfileMenu();
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    this.closeProfileMenu();
  }

  logout(): void {
    this.isProfileOpen = false;
    this.isMobileMenuOpen = false;
    sessionStorage.setItem('ga_post_login_loader', '1');
    window.dispatchEvent(new Event('ga-menu-loader'));
    this.authService.logout();
    this.router.navigateByUrl('/menu');
  }

  toggleProfileMenu(): void {
    this.isProfileOpen = !this.isProfileOpen;
  }

  closeProfileMenu(): void {
    this.isProfileOpen = false;
  }

  openContact(): void {
    this.isContactOpen = true;
    this.closeMobileMenu();
    this.closeProfileMenu();
  }

  closeContact(): void {
    this.isContactOpen = false;
  }

  get profileDisplayName(): string {
    return this.authService.currentUser()?.fullName || 'Profile';
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeProfileMenu();
    this.closeMobileMenu();
  }
}
