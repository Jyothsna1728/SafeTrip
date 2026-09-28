package com.safetrip.entity;

import javax.persistence.*;
import java.util.Date;

@Entity
@Table(name = "safety_checkins")
public class SafetyCheckin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "location_name", length = 150)
    private String locationName;

    @Column(nullable = false, length = 50)
    private String status; // e.g. "SAFE", "CHECKED_IN"

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "checked_at", nullable = false, updatable = false)
    private Date checkedAt;

    public SafetyCheckin() {
    }

    public SafetyCheckin(User user, Trip trip, Double latitude, Double longitude, String locationName, String status) {
        this.user = user;
        this.trip = trip;
        this.latitude = latitude;
        this.longitude = longitude;
        this.locationName = locationName;
        this.status = status;
    }

    @PrePersist
    protected void onCreate() {
        this.checkedAt = new Date();
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

    public Trip getTrip() {
        return trip;
    }

    public void setTrip(Trip trip) {
        this.trip = trip;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Date getCheckedAt() {
        return checkedAt;
    }

    public void setCheckedAt(Date checkedAt) {
        this.checkedAt = checkedAt;
    }
}
