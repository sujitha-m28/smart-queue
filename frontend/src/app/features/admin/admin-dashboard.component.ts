import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatToolbarModule, MatCardModule, MatButtonModule, MatIconModule,
  ],
  template: `
    <mat-toolbar color="warn">
      <mat-icon>admin_panel_settings</mat-icon>
      <span style="margin-left:8px">Admin Panel</span>
      <span class="spacer"></span>
      <button mat-icon-button routerLink="/manager"><mat-icon>bar_chart</mat-icon></button>
      <button mat-icon-button (click)="auth.logout()"><mat-icon>logout</mat-icon></button>
    </mat-toolbar>

    <div class="admin-content">
      <h2>System Administration</h2>

      <div class="admin-grid">
        <mat-card class="admin-card" routerLink="/admin/stores">
          <mat-card-content>
            <mat-icon>store</mat-icon>
            <h3>Store Management</h3>
            <p>Create and manage store locations, QR codes</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="admin-card" routerLink="/admin/rooms">
          <mat-card-content>
            <mat-icon>door_sliding</mat-icon>
            <h3>Trial Room Management</h3>
            <p>Configure trial rooms, capacity, status</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="admin-card" routerLink="/admin/users">
          <mat-card-content>
            <mat-icon>manage_accounts</mat-icon>
            <h3>User Management</h3>
            <p>Manage staff, managers, and admin accounts</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="admin-card" routerLink="/manager">
          <mat-card-content>
            <mat-icon>analytics</mat-icon>
            <h3>Analytics & Reports</h3>
            <p>Queue analytics and AI reports</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .spacer { flex: 1; }
    .admin-content { padding: 24px; max-width: 900px; margin: 0 auto; }
    .admin-content h2 { margin: 0 0 20px; }
    .admin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .admin-card { border-radius: 12px !important; cursor: pointer; transition: transform 0.2s; }
    .admin-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important; }
    .admin-card mat-card-content { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 28px; }
    .admin-card mat-icon { font-size: 48px; width: 48px; height: 48px; color: #c62828; margin-bottom: 12px; }
    .admin-card h3 { margin: 0 0 6px; }
    .admin-card p { margin: 0; color: #666; font-size: 0.85rem; }
  `],
})
export class AdminDashboardComponent {
  auth = inject(AuthService);
}
