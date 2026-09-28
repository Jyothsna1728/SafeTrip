package com.safetrip.service;

import com.safetrip.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${safetrip.mail.from:noreply@safetrip.com}")
    private String mailFrom;

    @Value("${safetrip.contact.email:support@safetrip.com}")
    private String contactSupportEmail;

    private final SimpleDateFormat dateFormat = new SimpleDateFormat("dd MMMM yyyy, hh:mm a", Locale.ENGLISH);

    public void sendPasswordResetOtp(String toEmail, String otpCode) {
        validateMailSender();

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(toEmail);
            message.setSubject("SafeTrip Password Verification");
            message.setText(
                "SafeTrip Password Verification\n\n" +
                "Your SafeTrip verification code is:\n\n" +
                otpCode + "\n\n" +
                "This code expires in 10 minutes.\n\n" +
                "If you did not request this, you can safely ignore this email.\n\n" +
                "SafeTrip Support Team\n" +
                "Explore. Travel. Stay Safe."
            );

            mailSender.send(message);
            logger.info("Password reset OTP code successfully dispatched to {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send verification OTP email to {}: {}", toEmail, e.getMessage());
            throw new BadRequestException("Unable to send verification code email. Please check your SMTP settings.");
        }
    }

    public void sendSafetyCheckinEmail(String toEmail, String userName, String locationName, Double lat, Double lon, Date timestamp) {
        validateMailSender();

        try {
            String timeStr = timestamp != null ? dateFormat.format(timestamp) : dateFormat.format(new Date());
            String mapUrl = (lat != null && lon != null)
                    ? String.format(Locale.US, "https://www.google.com/maps?q=%.6f,%.6f", lat, lon)
                    : null;

            StringBuilder body = new StringBuilder();
            body.append("Hello,\n\n");
            body.append(userName).append(" has checked in safely using SafeTrip.\n\n");
            body.append("Status:\nSAFE\n\n");

            if (StringUtils.hasText(locationName)) {
                body.append("Current Location:\n").append(locationName.trim()).append("\n\n");
            }

            if (lat != null && lon != null) {
                body.append("Coordinates:\n").append(String.format(Locale.US, "%.6f, %.6f", lat, lon)).append("\n\n");
            }

            body.append("Time:\n").append(timeStr).append("\n\n");

            if (mapUrl != null) {
                body.append("View Current Location on Map:\n").append(mapUrl).append("\n\n");
            }

            body.append("The traveler has marked themselves as safe.\n\n");
            body.append("---\nSafeTrip\nExplore. Travel. Stay Safe.");

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(toEmail);
            message.setSubject("SafeTrip — Safety Check-in (" + userName + ")");
            message.setText(body.toString());

            mailSender.send(message);
            logger.info("Safety Check-in email successfully dispatched to {} for user {}", toEmail, userName);
        } catch (Exception e) {
            logger.error("Failed to send safety check-in email to {}: {}", toEmail, e.getMessage());
            throw new BadRequestException("Unable to send the notification right now. Please try again.");
        }
    }

    public void sendEmergencyNotificationEmail(String toEmail, String userName, String locationType, String locationNameOrDest, Double lat, Double lon, Date timestamp) {
        validateMailSender();

        try {
            String timeStr = timestamp != null ? dateFormat.format(timestamp) : dateFormat.format(new Date());
            boolean isGps = "CURRENT_GPS".equalsIgnoreCase(locationType);

            StringBuilder body = new StringBuilder();
            body.append("EMERGENCY ALERT\n\n");
            body.append(userName).append(" has requested that you check on them through SafeTrip.\n\n");

            if (isGps) {
                body.append("Location Type:\nCurrent GPS Location\n\n");
                if (StringUtils.hasText(locationNameOrDest)) {
                    body.append("Current Location:\n").append(locationNameOrDest.trim()).append("\n\n");
                }
                if (lat != null && lon != null) {
                    body.append("Coordinates:\n").append(String.format(Locale.US, "%.6f, %.6f", lat, lon)).append("\n\n");
                    body.append("View Current Location on Map:\n")
                        .append(String.format(Locale.US, "https://www.google.com/maps?q=%.6f,%.6f", lat, lon))
                        .append("\n\n");
                }
            } else {
                body.append("Location Type:\nSelected Explore Destination\n\n");
                body.append("Destination:\n").append(StringUtils.hasText(locationNameOrDest) ? locationNameOrDest : "Unknown").append("\n\n");
                body.append("IMPORTANT:\nThis is the destination selected in SafeTrip and may not represent the traveler's current physical location.\n\n");
            }

            body.append("Time:\n").append(timeStr).append("\n\n");
            body.append("Nearby assistance available through SafeTrip:\n- Hospitals\n- Police Stations\n\n");
            body.append("Please contact the traveler as soon as possible.\n\n");
            body.append("---\nSafeTrip\nExplore. Travel. Stay Safe.");

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(toEmail);
            message.setSubject("SafeTrip — Emergency Alert (" + userName + ")");
            message.setText(body.toString());

            mailSender.send(message);
            logger.info("Emergency notification email successfully dispatched to {} for user {}", toEmail, userName);
        } catch (Exception e) {
            logger.error("Failed to send emergency alert email to {}: {}", toEmail, e.getMessage());
            throw new BadRequestException("Unable to send the notification right now. Please try again.");
        }
    }

    public void sendContactMessage(String fromName, String fromEmail, String subject, String messageContent) {
        validateMailSender();

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(contactSupportEmail);
            message.setReplyTo(fromEmail);
            message.setSubject("SafeTrip Support / Feedback: " + subject);
            message.setText(
                "New Support / Feedback Message Received:\n\n" +
                "From: " + fromName + " (" + fromEmail + ")\n" +
                "Subject: " + subject + "\n\n" +
                "Message:\n" +
                messageContent + "\n\n" +
                "---\nSent from SafeTrip Web Application"
            );

            mailSender.send(message);
            logger.info("Contact form email successfully dispatched from {} to {}", fromEmail, contactSupportEmail);
        } catch (Exception e) {
            logger.error("Failed to send contact email from {}: {}", fromEmail, e.getMessage());
            throw new BadRequestException("Unable to send your message right now. Please try again later.");
        }
    }

    private void validateMailSender() {
        if (!StringUtils.hasText(mailUsername) || mailSender == null) {
            logger.warn("Email service is not configured on the backend (spring.mail.username is empty).");
            throw new BadRequestException("Email notification service is not configured.");
        }
    }
}
