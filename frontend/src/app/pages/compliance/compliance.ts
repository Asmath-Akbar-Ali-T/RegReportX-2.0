import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ValidationService } from '../../services/validation.service';
import { finalize } from 'rxjs/operators';
import { DataQualityService } from '../../services/data-quality.service';
import { ReportService } from '../../services/report.service';
import { ExceptionService } from '../../services/exception.service';
import { DataQualityIssue } from '../../models/data-quality.model';
import { RegReport } from '../../models/report.model';
import { ExceptionRecord } from '../../models/exception.model';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-compliance',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './compliance.html',
  styleUrl: './compliance.css'
})
export class ComplianceComponent implements OnInit {
  username = '';
  activeTab: 'validation' | 'quality' | 'submit' = 'validation';
  Math = Math;


  // Data
  issues: DataQualityIssue[] = [];
  draftReports: RegReport[] = [];
  openIssues: DataQualityIssue[] = [];
  openExceptions: ExceptionRecord[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 5;
  chart: any;
  messageChart: any;
  statusChart: any;

  // UI State
  loadingCount = 0;
  get isLoading(): boolean { return this.loadingCount > 0; }
  showResolveModal = false;
  showExceptionModal = false;
  selectedIssue: DataQualityIssue | null = null;
  selectedException: ExceptionRecord | null = null;
  resolutionForm = { correctedValue: '', justification: '' };
  exceptionForm = { justification: '' };
  notification: { message: string, type: 'success' | 'error' } | null = null;

  constructor(
    public authService: AuthService,
    private validationService: ValidationService,
    private dataQualityService: DataQualityService,
    private reportService: ReportService,
    private exceptionService: ExceptionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.username = this.authService.getUsername() || 'Analyst';
  }

  ngOnInit(): void {
    this.switchTab('validation');
    
    // Safety net: Auto-hide spinner after 5 seconds if still stuck
    setTimeout(() => {
      if (this.isLoading) {
        this.loadingCount = 0;
        this.cdr.detectChanges();
        console.warn('Loading safety net triggered: forced counter reset');
      }
    }, 5000);
  }

  private startLoading(): void {
    this.loadingCount++;
    this.cdr.detectChanges();
  }

  private stopLoading(): void {
    if (this.loadingCount > 0) {
      this.loadingCount--;
      this.cdr.detectChanges();
    }
  }

  get paginatedIssues(): DataQualityIssue[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.issues.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.issues.length / this.pageSize) || 1;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  updateChart(): void {
    const ctx = document.getElementById('severityChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    if (this.chart) {
      this.chart.destroy();
    }

    // Dynamically count severities from actual data
    const countMap: Record<string, number> = {};
    this.issues.forEach(issue => {
      const sev = issue.severity || 'UNKNOWN';
      countMap[sev] = (countMap[sev] || 0) + 1;
    });

    const colorMap: Record<string, string> = {
      'CRITICAL': '#dc3545',
      'HIGH': '#fd7e14',
      'WARNING': '#ffc107',
      'MEDIUM': '#ffc107',
      'LOW': '#0dcaf0',
      'INFO': '#6c757d'
    };

    const labels = Object.keys(countMap);
    const data = Object.values(countMap);
    const colors = labels.map(l => colorMap[l.toUpperCase()] || '#6c757d');

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Issues by Severity',
          data: data,
          backgroundColor: colors,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

  updateAllCharts(): void {
    this.updateChart();
    this.updateMessageChart();
    this.updateStatusChart();
  }

  updateMessageChart(): void {
    const ctx = document.getElementById('messageChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.messageChart) {
      this.messageChart.destroy();
    }

    const countMap: Record<string, number> = {};
    this.issues.forEach(issue => {
      const rule = issue.rule?.name || 'Unknown';
      countMap[rule] = (countMap[rule] || 0) + 1;
    });

    const labels = Object.keys(countMap);
    const data = Object.values(countMap);
    const palette = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
    const colors = labels.map((_, i) => palette[i % palette.length]);

    this.messageChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' }
          }
        }
      }
    });
  }

  updateStatusChart(): void {
    const ctx = document.getElementById('statusChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.statusChart) {
      this.statusChart.destroy();
    }

    const countMap: Record<string, number> = {};
    this.issues.forEach(issue => {
      const status = issue.status || 'UNKNOWN';
      countMap[status] = (countMap[status] || 0) + 1;
    });

    const statusColorMap: Record<string, string> = {
      'OPEN': '#dc3545',
      'Open': '#dc3545',
      'RESOLVED': '#1a8a4a',
      'Resolved': '#1a8a4a',
      'WAIVED': '#6c757d',
      'Waived': '#6c757d'
    };

    const labels = Object.keys(countMap);
    const data = Object.values(countMap);
    const colors = labels.map(l => statusColorMap[l] || '#adb5bd');

    this.statusChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' }
          }
        }
      }
    });
  }

  switchTab(tab: 'validation' | 'quality' | 'submit'): void {
    this.activeTab = tab;
    if (tab === 'validation') this.loadValidationIssues();
    if (tab === 'quality') this.loadOpenIssues();
    if (tab === 'submit') {
      this.loadDraftReports();
      this.loadOpenExceptions();
    }
  }

  loadValidationIssues(): void {
    this.startLoading();
    this.validationService.getIssues().pipe(
      finalize(() => this.stopLoading())
    ).subscribe({
      next: (data) => {
        this.issues = data;
        this.currentPage = 1;
        setTimeout(() => this.updateAllCharts());
      },
      error: () => {
        this.showNotification('Failed to load validation issues', 'error');
      }
    });
  }

  runValidationCheck(): void {
    this.startLoading();
    this.validationService.runValidation().pipe(
      finalize(() => this.stopLoading())
    ).subscribe({
      next: (data) => {
        this.issues = data;
        this.currentPage = 1;
        setTimeout(() => this.updateAllCharts());
        this.showNotification('Validation run complete!', 'success');
      },
      error: () => {
        this.showNotification('Validation run failed', 'error');
      }
    });
  }

  loadOpenIssues(): void {
    this.startLoading();
    this.dataQualityService.getOpenIssues().pipe(
      finalize(() => this.stopLoading())
    ).subscribe({
      next: (data) => {
        this.openIssues = data;
      },
      error: () => {
        this.showNotification('Failed to load open issues', 'error');
      }
    });
  }

  loadDraftReports(): void {
    this.startLoading();
    this.reportService.getReports().pipe(
      finalize(() => this.stopLoading())
    ).subscribe({
      next: (data) => {
        this.draftReports = data.filter(r => r.status === 'DRAFT');
      },
      error: () => {
        this.showNotification('Failed to load draft reports', 'error');
      }
    });
  }

  loadOpenExceptions(): void {
    this.startLoading();
    this.exceptionService.getOpenExceptions().pipe(
      finalize(() => this.stopLoading())
    ).subscribe({
      next: (data) => {
        this.openExceptions = data;
      },
      error: () => {
        this.showNotification('Failed to load open report exceptions', 'error');
      }
    });
  }

  openResolveModal(issue: DataQualityIssue): void {
    this.selectedIssue = issue;
    this.resolutionForm = { correctedValue: '', justification: '' };
    this.showResolveModal = true;
  }

  submitResolution(): void {
    if (!this.selectedIssue) return;
    this.startLoading();
    this.dataQualityService.resolveIssue(this.selectedIssue.issueId, this.resolutionForm).pipe(
      finalize(() => this.stopLoading())
    ).subscribe({
      next: () => {
        this.showNotification('Issue resolved successfully', 'success');
        this.showResolveModal = false;
        this.loadOpenIssues();
      },
      error: () => {
        this.showNotification('Failed to resolve issue', 'error');
      }
    });
  }

  openResolveExceptionModal(exception: ExceptionRecord): void {
    this.selectedException = exception;
    this.exceptionForm = { justification: '' };
    this.showExceptionModal = true;
  }

  submitExceptionResolution(): void {
    if (!this.selectedException) return;
    this.startLoading();
    this.exceptionService.resolveException(this.selectedException.exceptionId, this.exceptionForm).pipe(
      finalize(() => this.stopLoading())
    ).subscribe({
      next: () => {
        this.showNotification('Exception resolved successfully', 'success');
        this.showExceptionModal = false;
        this.loadOpenExceptions();
      },
      error: () => {
        this.showNotification('Failed to resolve exception', 'error');
      }
    });
  }

  submitForApproval(reportId: number): void {
    this.startLoading();
    this.reportService.submitReport(reportId).pipe(
      finalize(() => this.stopLoading())
    ).subscribe({
      next: () => {
        this.showNotification('Report submitted for approval', 'success');
        this.loadDraftReports();
      },
      error: () => {
        this.showNotification('Failed to submit report', 'error');
      }
    });
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification = { message, type };
    setTimeout(() => this.notification = null, 4000);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
