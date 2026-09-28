package com.safetrip.repository;

import com.safetrip.entity.SafetyReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SafetyReportRepository extends JpaRepository<SafetyReport, Long> {
    List<SafetyReport> findByStatusOrderByCreatedAtDesc(String status);
    List<SafetyReport> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Find nearby reports within bounding box or coordinates
    @Query("SELECT r FROM SafetyReport r WHERE r.status = 'ACTIVE' AND " +
           "r.latitude BETWEEN :minLat AND :maxLat AND " +
           "r.longitude BETWEEN :minLon AND :maxLon " +
           "ORDER BY r.createdAt DESC")
    List<SafetyReport> findActiveInBounds(@Param("minLat") Double minLat,
                                         @Param("maxLat") Double maxLat,
                                         @Param("minLon") Double minLon,
                                         @Param("maxLon") Double maxLon);
}
