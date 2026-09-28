package com.safetrip.controller;

import com.safetrip.dto.ApiResponse;
import com.safetrip.dto.PlaceDto;
import com.safetrip.dto.SavedPlaceRequest;
import com.safetrip.service.SavedPlaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/saved-places")
public class SavedPlaceController {

    @Autowired
    private SavedPlaceService savedPlaceService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PlaceDto>>> getUserSavedPlaces(
            @RequestParam(value = "category", required = false) String category) {
        List<PlaceDto> list = savedPlaceService.getUserSavedPlaces(category);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PlaceDto>> savePlace(@Valid @RequestBody SavedPlaceRequest request) {
        PlaceDto saved = savedPlaceService.savePlace(request);
        return ResponseEntity.ok(ApiResponse.success("Place saved successfully", saved));
    }

    @DeleteMapping("/{externalPlaceId}")
    public ResponseEntity<ApiResponse<Void>> removeSavedPlace(@PathVariable("externalPlaceId") String externalPlaceId) {
        savedPlaceService.removeSavedPlace(externalPlaceId);
        return ResponseEntity.ok(ApiResponse.success("Place removed from saved places", null));
    }
}
