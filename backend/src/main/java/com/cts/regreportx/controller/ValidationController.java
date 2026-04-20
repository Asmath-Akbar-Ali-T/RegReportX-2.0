package com.cts.regreportx.controller;

import com.cts.regreportx.dto.DataQualityIssueDTO;
import com.cts.regreportx.model.DataQualityIssue;
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

    @Autowired
    public ValidationController(ValidationService validationService, ModelMapper modelMapper) {
        this.validationService = validationService;
        this.modelMapper = modelMapper;
    }

    @GetMapping("/run")
    public ResponseEntity<List<DataQualityIssueDTO>> runValidation() {
        return ResponseEntity.ok(validationService.runValidation().stream()
                .map(issue -> modelMapper.map(issue, DataQualityIssueDTO.class))
                .collect(Collectors.toList()));
    }

    @GetMapping("/issues")
    public ResponseEntity<List<DataQualityIssueDTO>> getIssues() {
        return ResponseEntity.ok(validationService.getAllIssues().stream()
                .map(issue -> modelMapper.map(issue, DataQualityIssueDTO.class))
                .collect(Collectors.toList()));
    }
}
