package com.safetrip.repository;

import com.safetrip.entity.SavedPlace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedPlaceRepository extends JpaRepository<SavedPlace, Long> {
    List<SavedPlace> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<SavedPlace> findByUserIdAndCategoryOrderByCreatedAtDesc(Long userId, String category);
    Optional<SavedPlace> findByIdAndUserId(Long id, Long userId);
    Optional<SavedPlace> findByUserIdAndExternalPlaceId(Long userId, String externalPlaceId);
    boolean existsByUserIdAndExternalPlaceId(Long userId, String externalPlaceId);
    void deleteByIdAndUserId(Long id, Long userId);
}
