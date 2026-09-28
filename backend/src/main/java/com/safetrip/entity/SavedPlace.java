package com.safetrip.entity;

import javax.persistence.*;
import java.util.Date;

@Entity
@Table(name = "saved_places")
public class SavedPlace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "external_place_id", nullable = false, length = 150)
    private String externalPlaceId;

    @Column(name = "place_name", nullable = false, length = 200)
    private String placeName;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(length = 300)
    private String address;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(length = 50)
    private String phone;

    @Column(length = 500)
    private String website;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Date createdAt;

    public SavedPlace() {
    }

    public SavedPlace(User user, String externalPlaceId, String placeName, String category,
                      Double latitude, Double longitude, String address, String imageUrl,
                      String phone, String website) {
        this.user = user;
        this.externalPlaceId = externalPlaceId;
        this.placeName = placeName;
        this.category = category;
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
        this.imageUrl = imageUrl;
        this.phone = phone;
        this.website = website;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = new Date();
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

    public String getExternalPlaceId() {
        return externalPlaceId;
    }

    public void setExternalPlaceId(String externalPlaceId) {
        this.externalPlaceId = externalPlaceId;
    }

    public String getPlaceName() {
        return placeName;
    }

    public void setPlaceName(String placeName) {
        this.placeName = placeName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
}
