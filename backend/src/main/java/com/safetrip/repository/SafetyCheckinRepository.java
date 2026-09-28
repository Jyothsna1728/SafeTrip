package com.safetrip.repository;

import com.safetrip.entity.SafetyCheckin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SafetyCheckinRepository extends JpaRepository<SafetyCheckin, Long> {
    List<SafetyCheckin> findByUserIdOrderByCheckedAtDesc(Long userId);
    List<SafetyCheckin> findByTripIdOrderByCheckedAtDesc(Long tripId);
}
