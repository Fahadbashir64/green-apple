import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { adminOnlyGuard, customerShopGuard } from './core/guards/role.guards';
import { MainLayoutComponent } from './shared/layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'menu'
      },
      {
        path: 'menu',
        canActivate: [customerShopGuard],
        loadComponent: () => import('./features/menu/pages/menu-page/menu-page.component').then((m) => m.MenuPageComponent)
      },
      {
        path: 'cart',
        canActivate: [customerShopGuard],
        loadComponent: () => import('./features/cart/pages/cart-page/cart-page.component').then((m) => m.CartPageComponent)
      },
      {
        path: 'checkout',
        canActivate: [customerShopGuard],
        loadComponent: () => import('./features/checkout/pages/checkout-page/checkout-page.component').then((m) => m.CheckoutPageComponent)
      },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/pages/login-page/login-page.component').then((m) => m.LoginPageComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/pages/register-page/register-page.component').then((m) => m.RegisterPageComponent)
      },
      {
        path: 'admin/dashboard',
        canActivate: [authGuard, adminOnlyGuard],
        loadComponent: () =>
          import('./features/admin-orders/pages/admin-orders-page/admin-orders-page.component').then(
            (m) => m.AdminOrdersPageComponent
          )
      },
      {
        path: 'admin/delivery-areas',
        canActivate: [authGuard, adminOnlyGuard],
        loadComponent: () =>
          import('./features/admin-delivery-areas/pages/admin-delivery-areas-page/admin-delivery-areas-page.component').then(
            (m) => m.AdminDeliveryAreasPageComponent
          )
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/pages/my-orders-page/my-orders-page.component').then((m) => m.MyOrdersPageComponent)
      },
      {
        path: 'my-orders',
        pathMatch: 'full',
        redirectTo: 'orders'
      },
      {
        path: 'terms-of-usage',
        loadComponent: () =>
          import('./features/legal/pages/privacy-policy-page/privacy-policy-page.component').then(
            (m) => m.PrivacyPolicyPageComponent
          )
      },
      {
        path: 'data-protection-policy',
        loadComponent: () =>
          import('./features/legal/pages/terms-and-conditions-page/terms-and-conditions-page.component').then(
            (m) => m.TermsAndConditionsPageComponent
          )
      },
      {
        path: 'privacy-policy',
        pathMatch: 'full',
        redirectTo: 'data-protection-policy'
      },
      {
        path: 'terms-and-conditions',
        pathMatch: 'full',
        redirectTo: 'data-protection-policy'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'menu'
  }
];
