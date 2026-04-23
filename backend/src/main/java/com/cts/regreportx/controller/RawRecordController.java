package com.cts.regreportx.controller;

import com.cts.regreportx.dto.RawRecordDTO;
import com.cts.regreportx.model.RawRecord;
import com.cts.regreportx.service.NotificationService;
import com.cts.regreportx.service.RawRecordService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/raw-records")
@PreAuthorize("hasAnyRole('OPERATIONS_OFFICER', 'REGTECH_ADMIN')")
public class RawRecordController {

    private final RawRecordService rawRecordService;
    private final ModelMapper modelMapper;
    private final NotificationService notificationService;

    @Autowired
    public RawRecordController(RawRecordService rawRecordService, ModelMapper modelMapper, NotificationService notificationService) {
        this.rawRecordService = rawRecordService;
        this.modelMapper = modelMapper;
        this.notificationService = notificationService;
    }

    @PostMapping("/load/{batchId}")
    public ResponseEntity<Map<String, Object>> loadRawRecords(@PathVariable Integer batchId) {
        int recordsInserted = rawRecordService.loadRawRecords(batchId);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Raw records loaded successfully");
        response.put("recordsInserted", recordsInserted);
        notificationService.notifyRole("COMPLIANCE_ANALYST", "Raw records loaded for batch #" + batchId + " — validation can start", "Raw Records");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/batch/{batchId}")
    public ResponseEntity<List<RawRecordDTO>> getRecordsByBatch(@PathVariable Integer batchId) {
        List<RawRecord> records = rawRecordService.getRecordsByBatch(batchId);
        List<RawRecordDTO> dtos = records.stream()
                .map(record -> modelMapper.map(record, RawRecordDTO.class))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}
