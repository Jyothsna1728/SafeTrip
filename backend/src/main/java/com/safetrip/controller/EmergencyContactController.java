package com.safetrip.controller;

import com.safetrip.dto.ApiResponse;
import com.safetrip.dto.EmergencyContactDto;
import com.safetrip.dto.EmergencyContactRequest;
import com.safetrip.entity.User;
import com.safetrip.service.AuthService;
import com.safetrip.service.EmergencyContactService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/emergency-contact")
public class EmergencyContactController {

    @Autowired
    private EmergencyContactService emergencyContactService;

    @Autowired
    private AuthService authService;

    @GetMapping
    public ResponseEntity<ApiResponse<EmergencyContactDto>> getEmergencyContact() {
        User user = authService.getAuthenticatedUser();
        EmergencyContactDto dto = emergencyContactService.getEmergencyContact(user);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EmergencyContactDto>> saveEmergencyContact(@Valid @RequestBody EmergencyContactRequest request) {
        User user = authService.getAuthenticatedUser();
        EmergencyContactDto dto = emergencyContactService.saveOrUpdateEmergencyContact(user, request);
        return ResponseEntity.ok(ApiResponse.success("Emergency contact saved successfully", dto));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<EmergencyContactDto>> updateEmergencyContact(@Valid @RequestBody EmergencyContactRequest request) {
        User user = authService.getAuthenticatedUser();
        EmergencyContactDto dto = emergencyContactService.saveOrUpdateEmergencyContact(user, request);
        return ResponseEntity.ok(ApiResponse.success("Emergency contact updated successfully", dto));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteEmergencyContact() {
        User user = authService.getAuthenticatedUser();
        emergencyContactService.deleteEmergencyContact(user);
        return ResponseEntity.ok(ApiResponse.success("Emergency contact deleted successfully", null));
    }
}
