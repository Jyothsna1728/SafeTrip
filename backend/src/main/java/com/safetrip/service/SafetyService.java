package com.safetrip.service;

import com.safetrip.dto.EmergencyNotifyRequest;
import com.safetrip.dto.SafetyCheckinNotifyRequest;
import com.safetrip.dto.SafetyCheckinRequest;
import com.safetrip.dto.SafetyReportRequest;
import com.safetrip.entity.EmergencyContact;
import com.safetrip.entity.SafetyCheckin;
import com.safetrip.entity.SafetyReport;
import com.safetrip.entity.Trip;
import com.safetrip.entity.User;
import com.safetrip.exception.BadRequestException;
import com.safetrip.exception.ResourceNotFoundException;
import com.safetrip.repository.EmergencyContactRepository;
import com.safetrip.repository.SafetyCheckinRepository;
import com.safetrip.repository.SafetyReportRepository;
import com.safetrip.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SafetyService {

    @Autowired
    private SafetyCheckinRepository safetyCheckinRepository;

    @Autowired
    private SafetyReportRepository safetyReportRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private EmergencyContactRepository emergencyContactRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private AuthService authService;

    @Transactional
    public Map<String, Object> createCheckin(SafetyCheckinRequest request) {
        User user = authService.getAuthenticatedUser();
        Trip trip = null;
        if (request.getTripId() != null) {
            trip = tripRepository.findByIdAndUserId(request.getTripId(), user.getId()).orElse(null);
        }

        SafetyCheckin checkin = new SafetyCheckin();
        checkin.setUser(user);
        checkin.setTrip(trip);
        checkin.setLatitude(request.getLatitude());
        checkin.setLongitude(request.getLongitude());
        checkin.setLocationName(request.getLocationName());
        checkin.setStatus(request.getStatus() != null ? request.getStatus() : "SAFE");

        SafetyCheckin saved = safetyCheckinRepository.save(checkin);

        Map<String, Object> res = new HashMap<>();
        res.put("id", saved.getId());
        res.put("status", saved.getStatus());
        res.put("latitude", saved.getLatitude());
        res.put("longitude", saved.getLongitude());
        res.put("locationName", saved.getLocationName());
        res.put("checkedAt", saved.getCheckedAt());
        return res;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserCheckins() {
        User user = authService.getAuthenticatedUser();
        List<SafetyCheckin> list = safetyCheckinRepository.findByUserIdOrderByCheckedAtDesc(user.getId());
        return list.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("status", c.getStatus());
            map.put("latitude", c.getLatitude());
            map.put("longitude", c.getLongitude());
            map.put("locationName", c.getLocationName());
            map.put("checkedAt", c.getCheckedAt());
            if (c.getTrip() != null) {
                map.put("tripDestination", c.getTrip().getDestination());
            }
            return map;
        }).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> notifyCheckinEmergencyContact(Long checkinId, SafetyCheckinNotifyRequest notifyRequest) {
        User user = authService.getAuthenticatedUser();
        Optional<EmergencyContact> contactOpt = emergencyContactRepository.findByUser(user);
        if (!contactOpt.isPresent()) {
            throw new BadRequestException("Please add an Emergency Contact in your profile or Safety page first.");
        }

        EmergencyContact contact = contactOpt.get();
        Double lat = null;
        Double lon = null;
        String locationName = null;
        Date timestamp = new Date();

        if (notifyRequest != null && notifyRequest.getLatitude() != null && notifyRequest.getLongitude() != null) {
            // Fresh GPS coordinates
            lat = notifyRequest.getLatitude();
            lon = notifyRequest.getLongitude();
            locationName = notifyRequest.getLocationName();
        } else if (checkinId != null) {
            SafetyCheckin checkin = safetyCheckinRepository.findById(checkinId)
                    .filter(c -> c.getUser().getId().equals(user.getId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Check-in record not found."));
            lat = checkin.getLatitude();
            lon = checkin.getLongitude();
            locationName = checkin.getLocationName();
            timestamp = checkin.getCheckedAt();
        }

        emailService.sendSafetyCheckinEmail(
                contact.getEmail(),
                user.getName(),
                locationName,
                lat,
                lon,
                timestamp
        );

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("recipient", contact.getEmail());
        res.put("contactName", contact.getContactName());
        res.put("message", "Safety Check-in notification sent to " + contact.getContactName() + " (" + contact.getEmail() + ").");
        return res;
    }

    @Transactional
    public Map<String, Object> notifyEmergencyAlert(EmergencyNotifyRequest request) {
        User user = authService.getAuthenticatedUser();
        Optional<EmergencyContact> contactOpt = emergencyContactRepository.findByUser(user);
        if (!contactOpt.isPresent()) {
            throw new BadRequestException("Please add an Emergency Contact in your profile or Safety page first.");
        }

        EmergencyContact contact = contactOpt.get();
        String locationType = request.getLocationType();
        String locOrDest = "CURRENT_GPS".equalsIgnoreCase(locationType)
                ? (request.getLocationName() != null ? request.getLocationName() : "Current Location")
                : (request.getDestination() != null ? request.getDestination() : "Selected Destination");

        emailService.sendEmergencyNotificationEmail(
                contact.getEmail(),
                user.getName(),
                locationType,
                locOrDest,
                request.getLatitude(),
                request.getLongitude(),
                new Date()
        );

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("recipient", contact.getEmail());
        res.put("contactName", contact.getContactName());
        res.put("message", "Emergency notification sent to " + contact.getContactName() + " (" + contact.getEmail() + ").");
        return res;
    }

    @Autowired
    private PlacesProviderClient placesProviderClient;

    @Transactional
    public Map<String, Object> createReport(SafetyReportRequest request) {
        User user = authService.getAuthenticatedUser();

        Double lat = request.getLatitude();
        Double lon = request.getLongitude();

        String city = request.getCity() != null ? request.getCity().trim() : "";
        String area = request.getArea() != null ? request.getArea().trim() : "";
        String exactPlace = request.getExactPlace() != null ? request.getExactPlace().trim() : "";

        // Auto-geocode if coordinates not provided or (0,0)
        if (lat == null || lon == null || (lat == 0.0 && lon == 0.0)) {
            StringBuilder queryBuilder = new StringBuilder();
            if (!exactPlace.isEmpty()) queryBuilder.append(exactPlace).append(", ");
            if (!area.isEmpty()) queryBuilder.append(area).append(", ");
            if (!city.isEmpty()) queryBuilder.append(city);
            if (queryBuilder.length() == 0 && request.getLocationName() != null) {
                queryBuilder.append(request.getLocationName());
            }

            String geocodeTarget = queryBuilder.toString().trim();
            if (!geocodeTarget.isEmpty()) {
                try {
                    List<com.safetrip.dto.GeocodeResultDto> geo = placesProviderClient.geocode(geocodeTarget);
                    if (geo != null && !geo.isEmpty()) {
                        lat = geo.get(0).getLatitude();
                        lon = geo.get(0).getLongitude();
                        if (city.isEmpty() && geo.get(0).getCity() != null) {
                            city = geo.get(0).getCity();
                        }
                    }
                } catch (Exception e) {
                    // Ignore geocode error
                }
            }
        }

        // Default fallback if geocoding yields nothing
        if (lat == null || lon == null) {
            lat = 17.385044;
            lon = 78.486671;
        }

        String locationName = request.getLocationName();
        if (locationName == null || locationName.trim().isEmpty()) {
            StringBuilder locNameBuilder = new StringBuilder();
            if (!exactPlace.isEmpty()) locNameBuilder.append(exactPlace);
            if (!area.isEmpty()) {
                if (locNameBuilder.length() > 0) locNameBuilder.append(", ");
                locNameBuilder.append(area);
            }
            if (!city.isEmpty()) {
                if (locNameBuilder.length() > 0) locNameBuilder.append(", ");
                locNameBuilder.append(city);
            }
            locationName = locNameBuilder.length() > 0 ? locNameBuilder.toString() : "Reported Location";
        }

        SafetyReport report = new SafetyReport();
        report.setUser(user);
        report.setLatitude(lat);
        report.setLongitude(lon);
        report.setLocationName(locationName);
        report.setCity(city);
        report.setArea(area);
        report.setExactPlace(exactPlace);
        report.setCategory(request.getCategory());
        report.setDescription(request.getDescription());
        report.setStatus("ACTIVE");

        SafetyReport saved = safetyReportRepository.save(report);

        Map<String, Object> res = toReportMap(saved);
        return res;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getActiveReports(Double minLat, Double maxLat, Double minLon, Double maxLon, String city) {
        List<SafetyReport> list;
        if (minLat != null && maxLat != null && minLon != null && maxLon != null) {
            list = safetyReportRepository.findActiveInBounds(minLat, maxLat, minLon, maxLon);
        } else {
            list = safetyReportRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
        }

        if (city != null && !city.trim().isEmpty() && !"India".equalsIgnoreCase(city.trim())) {
            String cLower = city.trim().toLowerCase();
            List<SafetyReport> cityFiltered = list.stream()
                    .filter(r -> (r.getCity() != null && r.getCity().toLowerCase().contains(cLower)) ||
                            (r.getLocationName() != null && r.getLocationName().toLowerCase().contains(cLower)) ||
                            (r.getArea() != null && r.getArea().toLowerCase().contains(cLower)))
                    .collect(Collectors.toList());

            if (!cityFiltered.isEmpty()) {
                return cityFiltered.stream().map(this::toReportMap).collect(Collectors.toList());
            }
        }

        return list.stream().map(this::toReportMap).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserReports() {
        User user = authService.getAuthenticatedUser();
        List<SafetyReport> list = safetyReportRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return list.stream().map(this::toReportMap).collect(Collectors.toList());
    }

    @Transactional
    public void deleteReport(Long reportId) {
        User user = authService.getAuthenticatedUser();
        SafetyReport report = safetyReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));

        if (!report.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You can only delete reports submitted by your account.");
        }
        safetyReportRepository.delete(report);
    }

    private Map<String, Object> toReportMap(SafetyReport r) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", r.getId());
        map.put("latitude", r.getLatitude());
        map.put("longitude", r.getLongitude());
        map.put("locationName", r.getLocationName());
        map.put("city", r.getCity());
        map.put("area", r.getArea());
        map.put("exactPlace", r.getExactPlace());
        map.put("category", r.getCategory());
        map.put("description", r.getDescription());
        map.put("status", r.getStatus());
        map.put("createdAt", r.getCreatedAt());

        if (r.getUser() != null) {
            map.put("userId", r.getUser().getId());
            String displayName = r.getUser().getName();
            if (displayName == null || displayName.trim().isEmpty()) {
                if (r.getUser().getEmail() != null && r.getUser().getEmail().contains("@")) {
                    displayName = r.getUser().getEmail().split("@")[0];
                } else {
                    displayName = "Traveler";
                }
            }
            map.put("username", displayName);
            map.put("userFullName", r.getUser().getName() != null ? r.getUser().getName() : displayName);
            map.put("userEmail", r.getUser().getEmail());
        }
        return map;
    }
}
