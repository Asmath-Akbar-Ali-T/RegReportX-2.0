import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reporting',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './reporting.html',
  styleUrl: './reporting.css'
})
export class ReportingComponent {
  username = '';

  constructor(public authService: AuthService, private router: Router) {
    this.username = this.authService.getUsername() || 'Officer';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
