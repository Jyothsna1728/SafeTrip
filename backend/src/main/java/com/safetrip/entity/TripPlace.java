package com.safetrip.entity;

import javax.persistence.*;

@Entity
@Table(name = "trip_places")
public class TripPlace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

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

    public TripPlace() {
    }

    public TripPlace(Trip trip, String externalPlaceId, String placeName, String category,
                     Double latitude, Double longitude, String address) {
        this.trip = trip;
        this.externalPlaceId = externalPlaceId;
        this.placeName = placeName;
        this.category = category;
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Trip getTrip() {
        return trip;
    }

    public void setTrip(Trip trip) {
        this.trip = trip;
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
}
