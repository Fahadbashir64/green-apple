import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-register-page',
  imports: [TranslatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss'
})
export class RegisterPageComponent {
  readonly registerForm;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly translateService: TranslateService,
    private readonly router: Router
  ) {
    this.registerForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.minLength(6)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.toastService.error(this.translateService.instant('toast.completeRequiredFields'));
      return;
    }

    const { password, confirmPassword } = this.registerForm.getRawValue();
    if (password !== confirmPassword) {
      this.toastService.error(this.translateService.instant('auth.passwordMismatch'));
      return;
    }

    const { fullName, email, phone, password: formPassword } = this.registerForm.getRawValue();
    this.authService
      .register({
        fullName: fullName ?? '',
        email: email ?? '',
        phone: phone ?? '',
        password: formPassword ?? ''
      })
      .subscribe({
        next: () => {
          this.toastService.success(this.translateService.instant('auth.registerSuccess'));
          this.router.navigateByUrl('/login');
        },
        error: () => this.toastService.error(this.translateService.instant('auth.registerFailed'))
      });
  }
}
