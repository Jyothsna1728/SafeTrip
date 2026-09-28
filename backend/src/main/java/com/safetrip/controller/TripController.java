package com.safetrip.controller;

import com.safetrip.dto.ApiResponse;
import com.safetrip.dto.PlaceDto;
import com.safetrip.dto.TripDto;
import com.safetrip.dto.TripRequest;
import com.safetrip.service.TripService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    @Autowired
    private TripService tripService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TripDto>>> getUserTrips() {
        List<TripDto> trips = tripService.getUserTrips();
        return ResponseEntity.ok(ApiResponse.success(trips));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TripDto>> getTripById(@PathVariable("id") Long id) {
        TripDto trip = tripService.getTripById(id);
        return ResponseEntity.ok(ApiResponse.success(trip));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TripDto>> createTrip(@Valid @RequestBody TripRequest request) {
        TripDto trip = tripService.createTrip(request);
        return ResponseEntity.ok(ApiResponse.success("Trip created successfully", trip));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TripDto>> updateTrip(@PathVariable("id") Long id, @Valid @RequestBody TripRequest request) {
        TripDto trip = tripService.updateTrip(id, request);
        return ResponseEntity.ok(ApiResponse.success("Trip updated successfully", trip));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTrip(@PathVariable("id") Long id) {
        tripService.deleteTrip(id);
        return ResponseEntity.ok(ApiResponse.success("Trip deleted successfully", null));
    }

    @PostMapping("/{id}/places")
    public ResponseEntity<ApiResponse<TripDto>> addPlaceToTrip(@PathVariable("id") Long id, @RequestBody PlaceDto placeDto) {
        TripDto trip = tripService.addPlaceToTrip(id, placeDto);
        return ResponseEntity.ok(ApiResponse.success("Place added to trip", trip));
    }

    @DeleteMapping("/{id}/places/{placeId}")
    public ResponseEntity<ApiResponse<TripDto>> removePlaceFromTrip(
            @PathVariable("id") Long id,
            @PathVariable("placeId") String placeId) {
        TripDto trip = tripService.removePlaceFromTrip(id, placeId);
        return ResponseEntity.ok(ApiResponse.success("Place removed from trip", trip));
    }
}
