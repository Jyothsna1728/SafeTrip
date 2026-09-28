package com.safetrip.service;

import com.safetrip.dto.PlaceDto;
import com.safetrip.dto.SavedPlaceRequest;
import com.safetrip.entity.SavedPlace;
import com.safetrip.entity.User;
import com.safetrip.exception.BadRequestException;
import com.safetrip.exception.ResourceNotFoundException;
import com.safetrip.repository.SavedPlaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SavedPlaceService {

    @Autowired
    private SavedPlaceRepository savedPlaceRepository;

    @Autowired
    private AuthService authService;

    @Transactional(readOnly = true)
    public List<PlaceDto> getUserSavedPlaces(String category) {
        User user = authService.getAuthenticatedUser();
        List<SavedPlace> list;
        if (category != null && !category.trim().isEmpty() && !"all".equalsIgnoreCase(category)) {
            list = savedPlaceRepository.findByUserIdAndCategoryOrderByCreatedAtDesc(user.getId(), category.trim().toLowerCase());
        } else {
            list = savedPlaceRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        }
        return list.stream().map(this::toPlaceDto).collect(Collectors.toList());
    }

    @Transactional
    public PlaceDto savePlace(SavedPlaceRequest request) {
        User user = authService.getAuthenticatedUser();

        // Check if already saved
        Optional<SavedPlace> existing = savedPlaceRepository.findByUserIdAndExternalPlaceId(user.getId(), request.getExternalPlaceId());
        if (existing.isPresent()) {
            return toPlaceDto(existing.get());
        }

        SavedPlace place = new SavedPlace();
        place.setUser(user);
        place.setExternalPlaceId(request.getExternalPlaceId());
        place.setPlaceName(request.getPlaceName());
        place.setCategory(request.getCategory().toLowerCase());
        place.setLatitude(request.getLatitude());
        place.setLongitude(request.getLongitude());
        place.setAddress(request.getAddress());
        place.setImageUrl(request.getImageUrl());
        place.setPhone(request.getPhone());
        place.setWebsite(request.getWebsite());

        SavedPlace saved = savedPlaceRepository.save(place);
        return toPlaceDto(saved);
    }

    @Transactional
    public void removeSavedPlace(String externalPlaceId) {
        User user = authService.getAuthenticatedUser();
        SavedPlace place = savedPlaceRepository.findByUserIdAndExternalPlaceId(user.getId(), externalPlaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Saved place not found with id: " + externalPlaceId));
        savedPlaceRepository.delete(place);
    }

    private PlaceDto toPlaceDto(SavedPlace sp) {
        PlaceDto p = new PlaceDto();
        p.setId(sp.getExternalPlaceId());
        p.setName(sp.getPlaceName());
        p.setCategory(sp.getCategory());
        p.setLatitude(sp.getLatitude());
        p.setLongitude(sp.getLongitude());
        p.setAddress(sp.getAddress());
        p.setImageUrl(sp.getImageUrl());
        p.setPhone(sp.getPhone());
        p.setWebsite(sp.getWebsite());
        p.setIsSaved(true);
        return p;
    }
}
