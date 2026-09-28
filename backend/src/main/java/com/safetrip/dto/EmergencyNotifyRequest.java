package com.safetrip.dto;

import javax.validation.constraints.NotBlank;

public class EmergencyNotifyRequest {

    @NotBlank(message = "Location type is required (CURRENT_GPS or EXPLORE_DESTINATION)")
    private String locationType; // "CURRENT_GPS" or "EXPLORE_DESTINATION"

    private Double latitude;
    private Double longitude;
    private String locationName;
    private String destination;

    public EmergencyNotifyRequest() {
    }

    public EmergencyNotifyRequest(String locationType, Double latitude, Double longitude, String locationName, String destination) {
        this.locationType = locationType;
        this.latitude = latitude;
        this.longitude = longitude;
        this.locationName = locationName;
        this.destination = destination;
    }

    public String getLocationType() {
        return locationType;
    }

    public void setLocationType(String locationType) {
        this.locationType = locationType;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }
}
