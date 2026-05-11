import { Component, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  isProfileOpen = false;

  constructor(
    public readonly translationService: TranslationService,
    public readonly cartService: CartService,
    public readonly authService: AuthService,
    private readonly router: Router
  ) {}

  setLanguage(language: string): void {
    this.translationService.switchLanguage(language);
  }

  logout(): void {
    this.isProfileOpen = false;
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

  get profileDisplayName(): string {
    return this.authService.currentUser()?.fullName || 'Profile';
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeProfileMenu();
  }
}
