package com.cts.regreportx.controller;

import com.cts.regreportx.dto.UploadResponse;
import com.cts.regreportx.service.CsvUploadService;
import com.cts.regreportx.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ingestion/csv")
@PreAuthorize("hasAnyRole('OPERATIONS_OFFICER', 'REGTECH_ADMIN')")
public class CsvUploadController {

    private final CsvUploadService csvUploadService;
    private final NotificationService notificationService;

    public CsvUploadController(CsvUploadService csvUploadService, NotificationService notificationService) {
        this.csvUploadService = csvUploadService;
        this.notificationService = notificationService;
    }

    @PostMapping("/deposits/upload")
    public ResponseEntity<UploadResponse> uploadDeposits(@RequestParam("file") MultipartFile file) {
        UploadResponse response = csvUploadService.uploadDeposits(file);
        notificationService.notifyRole("COMPLIANCE_ANALYST", "New deposits data uploaded — ready for ingestion", "Data Upload");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/loans/upload")
    public ResponseEntity<UploadResponse> uploadLoans(@RequestParam("file") MultipartFile file) {
        UploadResponse response = csvUploadService.uploadLoans(file);
        notificationService.notifyRole("COMPLIANCE_ANALYST", "New loans data uploaded — ready for ingestion", "Data Upload");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/general-ledger/upload")
    public ResponseEntity<UploadResponse> uploadGeneralLedger(@RequestParam("file") MultipartFile file) {
        UploadResponse response = csvUploadService.uploadGeneralLedger(file);
        notificationService.notifyRole("COMPLIANCE_ANALYST", "New general ledger data uploaded — ready for ingestion", "Data Upload");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/treasury/upload")
    public ResponseEntity<UploadResponse> uploadTreasury(@RequestParam("file") MultipartFile file) {
        UploadResponse response = csvUploadService.uploadTreasury(file);
        notificationService.notifyRole("COMPLIANCE_ANALYST", "New treasury data uploaded — ready for ingestion", "Data Upload");
        return ResponseEntity.ok(response);
    }
}
