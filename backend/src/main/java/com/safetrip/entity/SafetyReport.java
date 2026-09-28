package com.safetrip.entity;

import javax.persistence.*;
import java.util.Date;

@Entity
@Table(name = "safety_reports")
public class SafetyReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "location_name", length = 150)
    private String locationName;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "area", length = 150)
    private String area;

    @Column(name = "exact_place", length = 255)
    private String exactPlace;

    @Column(nullable = false, length = 50)
    private String category; // 'Scam', 'Unsafe Area', 'Road Issue', 'Tourist Trap', 'Other'

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 30)
    private String status; // 'ACTIVE', 'RESOLVED'

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Date createdAt;

    public SafetyReport() {
    }

    public SafetyReport(User user, Double latitude, Double longitude, String locationName,
                        String city, String area, String exactPlace,
                        String category, String description, String status) {
        this.user = user;
        this.latitude = latitude;
        this.longitude = longitude;
        this.locationName = locationName;
        this.city = city;
        this.area = area;
        this.exactPlace = exactPlace;
        this.category = category;
        this.description = description;
        this.status = status != null ? status : "ACTIVE";
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = new Date();
        if (this.status == null) {
            this.status = "ACTIVE";
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
}
