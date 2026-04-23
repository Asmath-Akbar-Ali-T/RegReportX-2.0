import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  /**
   * Runs a callback inside Angular's zone and triggers change detection.
   * Fixes the 'spinner stuck / error never shown' bug caused by HTTP
   * callbacks running outside Angular's zone.
   */
  private run(fn: () => void): void {
    this.ngZone.run(() => {
      fn();
      this.cdr.detectChanges();
    });
  }

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both username and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.run(() => {
          this.isLoading = false;
          const role = this.authService.getRole();
          switch (role) {
            case 'REGTECH_ADMIN': this.router.navigate(['/admin']); break;
            case 'COMPLIANCE_ANALYST': this.router.navigate(['/compliance']); break;
            case 'RISK_ANALYST': this.router.navigate(['/risk']); break;
            case 'REPORTING_OFFICER': this.router.navigate(['/reporting']); break;
            case 'OPERATIONS_OFFICER': this.router.navigate(['/operations']); break;
            default: this.router.navigate(['/']); break;
          }
        });
      },
      error: (err) => {
        this.run(() => {
          this.isLoading = false;
          if (err.status === 401 || err.status === 403) {
            this.errorMessage = 'Invalid username or password.';
          } else if (err.status === 0) {
            this.errorMessage = 'Unable to connect to server. Please try again.';
          } else {
            this.errorMessage = 'Login failed. Incorrect Username or Password.';
          }
        });
      }
    });
  }
}
