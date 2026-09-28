package com.safetrip.service;

import com.safetrip.dto.PlaceDto;
import com.safetrip.dto.TripDto;
import com.safetrip.dto.TripRequest;
import com.safetrip.entity.Trip;
import com.safetrip.entity.TripPlace;
import com.safetrip.entity.User;
import com.safetrip.exception.ResourceNotFoundException;
import com.safetrip.repository.TripPlaceRepository;
import com.safetrip.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TripService {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private TripPlaceRepository tripPlaceRepository;

    @Autowired
    private AuthService authService;

    @Transactional(readOnly = true)
    public List<TripDto> getUserTrips() {
        User user = authService.getAuthenticatedUser();
        List<Trip> trips = tripRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return trips.stream().map(this::toTripDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TripDto getTripById(Long id) {
        User user = authService.getAuthenticatedUser();
        Trip trip = tripRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));
        return toTripDto(trip);
    }

    @Transactional
    public TripDto createTrip(TripRequest request) {
        User user = authService.getAuthenticatedUser();
        Trip trip = new Trip();
        trip.setUser(user);
        trip.setDestination(request.getDestination());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        trip.setNotes(request.getNotes());

        Trip saved = tripRepository.save(trip);
        return toTripDto(saved);
    }

    @Transactional
    public TripDto updateTrip(Long id, TripRequest request) {
        User user = authService.getAuthenticatedUser();
        Trip trip = tripRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));

        trip.setDestination(request.getDestination());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        trip.setNotes(request.getNotes());

        Trip updated = tripRepository.save(trip);
        return toTripDto(updated);
    }

    @Transactional
    public void deleteTrip(Long id) {
        User user = authService.getAuthenticatedUser();
        Trip trip = tripRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));
        tripRepository.delete(trip);
    }

    @Transactional
    public TripDto addPlaceToTrip(Long tripId, PlaceDto placeDto) {
        User user = authService.getAuthenticatedUser();
        Trip trip = tripRepository.findByIdAndUserId(tripId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + tripId));

        if (placeDto.getId() != null && !tripPlaceRepository.existsByTripIdAndExternalPlaceId(tripId, placeDto.getId())) {
            TripPlace tripPlace = new TripPlace();
            tripPlace.setTrip(trip);
            tripPlace.setExternalPlaceId(placeDto.getId());
            tripPlace.setPlaceName(placeDto.getName());
            tripPlace.setCategory(placeDto.getCategory());
            tripPlace.setLatitude(placeDto.getLatitude());
            tripPlace.setLongitude(placeDto.getLongitude());
            tripPlace.setAddress(placeDto.getAddress());

            tripPlaceRepository.save(tripPlace);
        }
        return getTripById(tripId);
    }

    @Transactional
    public TripDto removePlaceFromTrip(Long tripId, String placeId) {
        User user = authService.getAuthenticatedUser();
        Trip trip = tripRepository.findByIdAndUserId(tripId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + tripId));

        tripPlaceRepository.deleteByTripIdAndPlaceIdentifier(tripId, placeId);
        return getTripById(tripId);
    }

    private TripDto toTripDto(Trip trip) {
        TripDto dto = new TripDto();
        dto.setId(trip.getId());
        dto.setUserId(trip.getUser().getId());
        dto.setDestination(trip.getDestination());
        dto.setStartDate(trip.getStartDate());
        dto.setEndDate(trip.getEndDate());
        dto.setNotes(trip.getNotes());
        dto.setCreatedAt(trip.getCreatedAt());

        List<PlaceDto> places = new ArrayList<>();
        if (trip.getPlaces() != null) {
            for (TripPlace tp : trip.getPlaces()) {
                PlaceDto p = new PlaceDto();
                p.setId(tp.getExternalPlaceId());
                p.setName(tp.getPlaceName());
                p.setCategory(tp.getCategory());
                p.setLatitude(tp.getLatitude());
                p.setLongitude(tp.getLongitude());
                p.setAddress(tp.getAddress());
                places.add(p);
            }
        }
        dto.setPlaces(places);
        return dto;
    }
}
