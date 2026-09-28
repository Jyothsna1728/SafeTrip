package com.safetrip.service;

import com.safetrip.dto.*;
import com.safetrip.entity.User;
import com.safetrip.exception.BadRequestException;
import com.safetrip.exception.ResourceNotFoundException;
import com.safetrip.repository.UserRepository;
import com.safetrip.security.JwtUtils;
import com.safetrip.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private EmailService emailService;
   private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered: " + request.getEmail());
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());

        User savedUser = userRepository.save(user);

        String token = jwtUtils.generateTokenFromEmail(savedUser.getEmail(), savedUser.getId());
        UserDto userDto = toUserDto(savedUser);

        return new AuthResponse(token, userDto);
    }

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim().toLowerCase(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return new AuthResponse(token, toUserDto(user));
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        java.util.Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Generate secure 6-digit numeric OTP code
            java.security.SecureRandom random = new java.security.SecureRandom();
            String otpCode = String.format("%06d", random.nextInt(1000000));
            // 10-minute expiry (600,000 ms)
            Date expiryDate = new Date(System.currentTimeMillis() + 600000L);

            user.setResetToken(otpCode);
            user.setResetTokenExpiry(expiryDate);
            userRepository.save(user);

            // Send real verification OTP email
            emailService.sendPasswordResetOtp(user.getEmail(), otpCode);
        } else {
            // Log for debugging but return generic success to avoid email enumeration
            logger.info("Password reset requested for non-existent email: {}", email);
        }
    }

    public boolean verifyOtp(VerifyOtpRequest request) {
        if (request == null || request.getEmail() == null || request.getCode() == null) {
            return false;
        }
        String email = request.getEmail().trim().toLowerCase();
        String code = request.getCode().trim();

        return userRepository.findByEmail(email)
                .map(user -> code.equals(user.getResetToken()) &&
                             user.getResetTokenExpiry() != null &&
                             user.getResetTokenExpiry().after(new Date()))
                .orElse(false);
    }

    @Transactional
    public void resetPasswordWithOtp(ResetPasswordOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String code = request.getCode().trim();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid or expired verification code."));

        if (!code.equals(user.getResetToken())) {
            throw new BadRequestException("Invalid verification code. Please check the code sent to your email.");
        }

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().before(new Date())) {
            throw new BadRequestException("Verification code has expired. Please request a new code.");
        }

        if (request.getNewPassword().length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters.");
        }

        // Hash new password using BCrypt
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        // Invalidate single-use OTP
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    public boolean validateResetToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }
        return userRepository.findByResetToken(token.trim())
                .map(user -> user.getResetTokenExpiry() != null && user.getResetTokenExpiry().after(new Date()))
                .orElse(false);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String token = request.getToken() != null ? request.getToken().trim() : "";
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired password reset token."));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().before(new Date())) {
            throw new BadRequestException("Password reset token has expired. Please request a new password reset.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return toUserDto(user);
    }

    @Transactional
    public UserDto updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            user.setName(request.getName().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }
        if (request.getEmergencyContactName() != null) {
            user.setEmergencyContactName(request.getEmergencyContactName().trim());
        }
        if (request.getEmergencyContactPhone() != null) {
            user.setEmergencyContactPhone(request.getEmergencyContactPhone().trim());
        }

        User updated = userRepository.save(user);
        return toUserDto(updated);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        // Validate current password with BCrypt
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password does not match your existing password.");
        }

        if (request.getNewPassword().length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters.");
        }

        // Hash new password using BCrypt
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public UserDto updateEmergencyContact(String email, String name, String phone) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        user.setEmergencyContactName(name);
        user.setEmergencyContactPhone(phone);
        User updated = userRepository.save(user);
        return toUserDto(updated);
    }

    public User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl)) {
            throw new BadRequestException("User is not authenticated");
        }
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    private UserDto toUserDto(User user) {
        return new UserDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getEmergencyContactName(),
                user.getEmergencyContactPhone(),
                user.getCreatedAt()
        );
    }
}
