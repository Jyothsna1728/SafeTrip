package com.safetrip.controller;

import com.safetrip.dto.ApiResponse;
import com.safetrip.dto.EmergencyNotifyRequest;
import com.safetrip.dto.SafetyCheckinNotifyRequest;
import com.safetrip.dto.SafetyCheckinRequest;
import com.safetrip.dto.SafetyReportRequest;
import com.safetrip.service.SafetyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class SafetyController {

    @Autowired
    private SafetyService safetyService;

    @PostMapping("/checkins")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createCheckin(@Valid @RequestBody SafetyCheckinRequest request) {
        Map<String, Object> res = safetyService.createCheckin(request);
        return ResponseEntity.ok(ApiResponse.success("Safety check-in recorded successfully", res));
    }

    @GetMapping("/checkins")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUserCheckins() {
        List<Map<String, Object>> list = safetyService.getUserCheckins();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/checkins/{id}/notify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> notifyCheckin(
            @PathVariable("id") Long id,
            @RequestBody(required = false) SafetyCheckinNotifyRequest notifyRequest) {
        Map<String, Object> res = safetyService.notifyCheckinEmergencyContact(id, notifyRequest);
        return ResponseEntity.ok(ApiResponse.success((String) res.get("message"), res));
    }

    @PostMapping("/checkins/notify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> notifyLatestCheckin(
            @RequestBody(required = false) SafetyCheckinNotifyRequest notifyRequest) {
        Map<String, Object> res = safetyService.notifyCheckinEmergencyContact(null, notifyRequest);
        return ResponseEntity.ok(ApiResponse.success((String) res.get("message"), res));
    }

    @PostMapping("/emergency/notify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> notifyEmergencyAlert(
            @Valid @RequestBody EmergencyNotifyRequest request) {
        Map<String, Object> res = safetyService.notifyEmergencyAlert(request);
        return ResponseEntity.ok(ApiResponse.success((String) res.get("message"), res));
    }

    @PostMapping("/reports")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createReport(@Valid @RequestBody SafetyReportRequest request) {
        Map<String, Object> res = safetyService.createReport(request);
        return ResponseEntity.ok(ApiResponse.success("Safety report submitted to community", res));
    }

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getActiveReports(
            @RequestParam(value = "minLat", required = false) Double minLat,
            @RequestParam(value = "maxLat", required = false) Double maxLat,
            @RequestParam(value = "minLon", required = false) Double minLon,
            @RequestParam(value = "maxLon", required = false) Double maxLon,
            @RequestParam(value = "city", required = false) String city) {
        List<Map<String, Object>> list = safetyService.getActiveReports(minLat, maxLat, minLon, maxLon, city);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/reports/my")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUserReports() {
        List<Map<String, Object>> list = safetyService.getUserReports();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @DeleteMapping("/reports/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReport(@PathVariable("id") Long id) {
        safetyService.deleteReport(id);
        return ResponseEntity.ok(ApiResponse.success("Report deleted successfully", null));
    }
}
