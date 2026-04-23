package com.cts.regreportx.controller;

import com.cts.regreportx.dto.DataQualityIssueDTO;
import com.cts.regreportx.model.DataQualityIssue;
import com.cts.regreportx.service.AuditService;
import com.cts.regreportx.service.NotificationService;
import com.cts.regreportx.service.ValidationService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/validation")
@PreAuthorize("hasAnyRole('COMPLIANCE_ANALYST', 'REGTECH_ADMIN')")
public class ValidationController {

    private final ValidationService validationService;
    private final ModelMapper modelMapper;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Autowired
    public ValidationController(ValidationService validationService, ModelMapper modelMapper, AuditService auditService, NotificationService notificationService) {
        this.validationService = validationService;
        this.modelMapper = modelMapper;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @GetMapping("/run")
    public ResponseEntity<List<DataQualityIssueDTO>> runValidation() {
        List<DataQualityIssue> issues = validationService.runValidation();
        auditService.logAction("RAN_VALIDATION", "Validation", "Found " + issues.size() + " issues");
        notificationService.notifyRole("COMPLIANCE_ANALYST", "Validation complete — " + issues.size() + " issues found", "Validation");
        if (!issues.isEmpty()) {
            notificationService.notifyRole("OPERATIONS_OFFICER", "Validation found " + issues.size() + " issues — please re-check source data", "Validation");
        }
        return ResponseEntity.ok(issues.stream()
                .map(issue -> modelMapper.map(issue, DataQualityIssueDTO.class))
                .collect(Collectors.toList()));
    }

    @GetMapping("/issues")
    public ResponseEntity<List<DataQualityIssueDTO>> getIssues() {
        List<DataQualityIssue> issues = validationService.getAllIssues();
        auditService.logAction("VIEWED_VALIDATION_ISSUES", "Validation", "Total issues: " + issues.size());
        notificationService.notifyRole("OPERATIONS_OFFICER", "Data quality issues require review", "Validation");
        return ResponseEntity.ok(issues.stream()
                .map(issue -> modelMapper.map(issue, DataQualityIssueDTO.class))
                .collect(Collectors.toList()));
    }
}
