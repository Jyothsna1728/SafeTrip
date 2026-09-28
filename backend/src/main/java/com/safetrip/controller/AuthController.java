package com.safetrip.controller;

import com.safetrip.dto.*;
import com.safetrip.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("User registered successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("If an account exists for this email, a verification code has been sent.", null));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        boolean isValid = authService.verifyOtp(request);
        Map<String, Boolean> res = new HashMap<>();
        res.put("valid", isValid);
        if (isValid) {
            return ResponseEntity.ok(ApiResponse.success("Verification code verified successfully.", res));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid or expired verification code. Please try again."));
        }
    }

    @PostMapping("/reset-password-otp")
    public ResponseEntity<ApiResponse<Void>> resetPasswordOtp(@Valid @RequestBody ResetPasswordOtpRequest request) {
        authService.resetPasswordWithOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Your password has been successfully reset. You may now log in.", null));
    }

    @GetMapping("/validate-reset-token")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> validateResetToken(@RequestParam("token") String token) {
        boolean isValid = authService.validateResetToken(token);
        Map<String, Boolean> res = new HashMap<>();
        res.put("valid", isValid);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Your password has been successfully reset. You may now log in.", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.ok(ApiResponse.error("Not authenticated"));
        }
        UserDto user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserDto>> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.ok(ApiResponse.error("Not authenticated"));
        }
        UserDto user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        if (userDetails == null) {
            return ResponseEntity.ok(ApiResponse.error("Not authenticated"));
        }
        UserDto updated = authService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully.", updated));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        if (userDetails == null) {
            return ResponseEntity.ok(ApiResponse.error("Not authenticated"));
        }
        authService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully.", null));
    }

    @PutMapping("/emergency-contact")
    public ResponseEntity<ApiResponse<UserDto>> updateEmergencyContact(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        String name = body.get("name");
        String phone = body.get("phone");
        UserDto user = authService.updateEmergencyContact(userDetails.getUsername(), name, phone);
        return ResponseEntity.ok(ApiResponse.success("Emergency contact updated", user));
    }
}
