package com.safetrip.service;

import com.safetrip.dto.GeocodeResultDto;
import com.safetrip.dto.PlaceDto;
import com.safetrip.entity.User;
import com.safetrip.repository.SavedPlaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PlacesService {

    @Autowired
    private PlacesProviderClient placesProviderClient;

    @Autowired
    private SavedPlaceRepository savedPlaceRepository;

    @Autowired
    private AuthService authService;

    public List<GeocodeResultDto> searchDestinations(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return placesProviderClient.geocode(query.trim());
    }

    public GeocodeResultDto reverseGeocode(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            return null;
        }
        return placesProviderClient.reverseGeocode(latitude, longitude);
    }

    public List<PlaceDto> getNearbyPlaces(Double latitude, Double longitude, String category,
                                         Integer radiusMeters, Integer limit, Double minRating,
                                         String requiredAmenity, String sort) {
        List<PlaceDto> places = placesProviderClient.getNearbyPlaces(latitude, longitude, category, radiusMeters, limit);

        // Populate isSaved status if user is logged in
        try {
            User user = authService.getAuthenticatedUser();
            if (user != null) {
                for (PlaceDto place : places) {
                    boolean isSaved = savedPlaceRepository.existsByUserIdAndExternalPlaceId(user.getId(), place.getId());
                    place.setIsSaved(isSaved);
                }
            }
        } catch (Exception ignored) {
            // Unauthenticated requests are normal for public places search
        }

        // Apply client filters only when reliable data exists
        if (minRating != null && minRating > 0) {
            places = places.stream()
                    .filter(p -> p.getRating() != null && p.getRating() >= minRating)
                    .collect(Collectors.toList());
        }

        if (requiredAmenity != null && !requiredAmenity.trim().isEmpty()) {
            String filterAmenity = requiredAmenity.trim().toLowerCase();
            places = places.stream()
                    .filter(p -> p.getAmenities() != null &&
                            p.getAmenities().stream().anyMatch(a -> a.toLowerCase().contains(filterAmenity)))
                    .collect(Collectors.toList());
        }

        // Sort if requested and applicable
        if ("rating".equalsIgnoreCase(sort)) {
            places.sort((a, b) -> {
                Double r1 = a.getRating() != null ? a.getRating() : 0.0;
                Double r2 = b.getRating() != null ? b.getRating() : 0.0;
                return Double.compare(r2, r1);
            });
        }

        return places;
    }

    public PlaceDto getPlaceDetails(String placeId) {
        PlaceDto place = placesProviderClient.getPlaceDetails(placeId);
        try {
            User user = authService.getAuthenticatedUser();
            if (user != null) {
                boolean isSaved = savedPlaceRepository.existsByUserIdAndExternalPlaceId(user.getId(), place.getId());
                place.setIsSaved(isSaved);
            }
        } catch (Exception ignored) {
        }
        return place;
    }

    public byte[] getPlacePhoto(String photoReference, Integer maxWidth) {
        if (photoReference == null || photoReference.trim().isEmpty()) {
            return null;
        }
        return placesProviderClient.getPhotoBytes(photoReference.trim(), maxWidth);
    }
}
