package com.safetrip.controller;

import com.safetrip.dto.ApiResponse;
import com.safetrip.dto.ContactRequest;
import com.safetrip.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    @Autowired
    private EmailService emailService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> sendContactMessage(@Valid @RequestBody ContactRequest request) {
        emailService.sendContactMessage(
                request.getName().trim(),
                request.getEmail().trim(),
                request.getSubject().trim(),
                request.getMessage().trim()
        );
        return ResponseEntity.ok(ApiResponse.success("Thanks! Your message has been sent.", null));
    }
}
