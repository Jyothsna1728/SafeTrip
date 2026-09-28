package com.safetrip.dto;

public class SafetyCheckinNotifyRequest {

    private Double latitude;
    private Double longitude;
    private String locationName;

    public SafetyCheckinNotifyRequest() {
    }

    public SafetyCheckinNotifyRequest(Double latitude, Double longitude, String locationName) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.locationName = locationName;
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
}
