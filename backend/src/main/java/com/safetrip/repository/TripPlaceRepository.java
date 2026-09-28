package com.safetrip.repository;

import com.safetrip.entity.TripPlace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface TripPlaceRepository extends JpaRepository<TripPlace, Long> {
    List<TripPlace> findByTripId(Long tripId);
    boolean existsByTripIdAndExternalPlaceId(Long tripId, String externalPlaceId);

    @Transactional
    @Modifying
    @Query("DELETE FROM TripPlace tp WHERE tp.trip.id = :tripId AND (CAST(tp.id AS string) = :placeId OR tp.externalPlaceId = :placeId)")
    void deleteByTripIdAndPlaceIdentifier(@Param("tripId") Long tripId, @Param("placeId") String placeId);

    void deleteByTripIdAndId(Long tripId, Long id);
}
