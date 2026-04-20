import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-risk',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './risk.html',
  styleUrl: './risk.css'
})
export class RiskComponent {
  username = '';

  constructor(public authService: AuthService, private router: Router) {
    this.username = this.authService.getUsername() || 'Analyst';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
