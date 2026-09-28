package com.safetrip.controller;

import com.safetrip.dto.ApiResponse;
import com.safetrip.dto.GeocodeResultDto;
import com.safetrip.dto.PlaceDto;
import com.safetrip.service.PlacesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/places")
public class PlacesController {

    @Autowired
    private PlacesService placesService;

    @GetMapping("/geocode")
    public ResponseEntity<ApiResponse<List<GeocodeResultDto>>> geocodeDestination(@RequestParam("text") String text) {
        List<GeocodeResultDto> results = placesService.searchDestinations(text);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/reverse-geocode")
    public ResponseEntity<ApiResponse<GeocodeResultDto>> reverseGeocode(
            @RequestParam("lat") Double lat,
            @RequestParam("lon") Double lon) {
        GeocodeResultDto result = placesService.reverseGeocode(lat, lon);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<List<PlaceDto>>> getNearbyPlaces(
            @RequestParam("lat") Double lat,
            @RequestParam("lon") Double lon,
            @RequestParam(value = "category", required = false, defaultValue = "all") String category,
            @RequestParam(value = "radius", required = false, defaultValue = "15000") Integer radius,
            @RequestParam(value = "limit", required = false, defaultValue = "35") Integer limit,
            @RequestParam(value = "minRating", required = false) Double minRating,
            @RequestParam(value = "amenity", required = false) String amenity,
            @RequestParam(value = "sort", required = false) String sort) {

        List<PlaceDto> places = placesService.getNearbyPlaces(lat, lon, category, radius, limit, minRating, amenity, sort);
        return ResponseEntity.ok(ApiResponse.success(places));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<PlaceDto>>> searchPlaces(
            @RequestParam("query") String query,
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lon", required = false) Double lon,
            @RequestParam(value = "category", required = false, defaultValue = "all") String category,
            @RequestParam(value = "radius", required = false, defaultValue = "15000") Integer radius,
            @RequestParam(value = "limit", required = false, defaultValue = "35") Integer limit) {

        Double searchLat = lat;
        Double searchLon = lon;
        if (searchLat == null || searchLon == null) {
            List<GeocodeResultDto> geo = placesService.searchDestinations(query);
            if (!geo.isEmpty()) {
                searchLat = geo.get(0).getLatitude();
                searchLon = geo.get(0).getLongitude();
            }
        }
        if (searchLat == null || searchLon == null) {
            return ResponseEntity.ok(ApiResponse.success(Collections.emptyList()));
        }
        List<PlaceDto> places = placesService.getNearbyPlaces(searchLat, searchLon, category, radius, limit, null, null, null);
        return ResponseEntity.ok(ApiResponse.success(places));
    }

    @GetMapping("/photo")
    public ResponseEntity<byte[]> getPlacePhoto(
            @RequestParam("ref") String ref,
            @RequestParam(value = "maxwidth", required = false, defaultValue = "800") Integer maxWidth) {
        byte[] photoBytes = placesService.getPlacePhoto(ref, maxWidth);
        if (photoBytes == null || photoBytes.length == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_JPEG_VALUE)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400, immutable")
                .body(photoBytes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PlaceDto>> getPlaceDetails(@PathVariable("id") String id) {
        PlaceDto place = placesService.getPlaceDetails(id);
        return ResponseEntity.ok(ApiResponse.success(place));
    }
}
