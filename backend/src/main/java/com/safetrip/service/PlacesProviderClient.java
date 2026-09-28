package com.safetrip.service;

import com.safetrip.dto.GeocodeResultDto;
import com.safetrip.dto.PlaceDto;

import java.util.List;

public interface PlacesProviderClient {
    List<GeocodeResultDto> geocode(String text);
    GeocodeResultDto reverseGeocode(Double latitude, Double longitude);
    List<PlaceDto> getNearbyPlaces(Double latitude, Double longitude, String category, Integer radiusMeters, Integer limit);
    PlaceDto getPlaceDetails(String placeId);
    byte[] getPhotoBytes(String photoReference, Integer maxWidth);
}
