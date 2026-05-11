import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-login-page',
  imports: [TranslatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  readonly loginForm;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly translateService: TranslateService,
    private readonly router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toastService.error(this.translateService.instant('toast.completeRequiredFields'));
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    sessionStorage.removeItem('ga_post_login_loader');
    this.authService
      .login(email ?? '', password ?? '')
      .subscribe({
        next: () => {
          sessionStorage.setItem('ga_post_login_loader', '1');
          const target = this.authService.isAdmin() ? '/admin/dashboard' : '/menu';
          this.router.navigateByUrl(target);
        },
        error: () => {
          sessionStorage.removeItem('ga_post_login_loader');
          this.toastService.error(this.translateService.instant('auth.loginFailed'));
        }
      });
  }
}
