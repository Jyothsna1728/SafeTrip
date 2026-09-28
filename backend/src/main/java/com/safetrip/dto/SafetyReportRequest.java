package com.safetrip.dto;

import javax.validation.constraints.NotBlank;

public class SafetyReportRequest {

    private Double latitude;
    private Double longitude;
    private String locationName;
    private String city;
    private String area;
    private String exactPlace;

    @NotBlank(message = "Category is required")
    private String category; // 'Scam', 'Unsafe Area', 'Road Issue', 'Tourist Trap', 'Other'

    @NotBlank(message = "Description is required")
    private String description;

    public SafetyReportRequest() {
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

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getArea() {
        return area;
    }

    public void setArea(String area) {
        this.area = area;
    }

    public String getExactPlace() {
        return exactPlace;
    }

    public void setExactPlace(String exactPlace) {
        this.exactPlace = exactPlace;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
