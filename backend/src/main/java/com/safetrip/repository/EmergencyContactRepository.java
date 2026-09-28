package com.safetrip.repository;

import com.safetrip.entity.EmergencyContact;
import com.safetrip.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, Long> {
    Optional<EmergencyContact> findByUser(User user);
    void deleteByUser(User user);
}
