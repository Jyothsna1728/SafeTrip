package com.safetrip.service;

import com.safetrip.dto.EmergencyContactDto;
import com.safetrip.dto.EmergencyContactRequest;
import com.safetrip.entity.EmergencyContact;
import com.safetrip.entity.User;
import com.safetrip.exception.ResourceNotFoundException;
import com.safetrip.repository.EmergencyContactRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class EmergencyContactService {

    @Autowired
    private EmergencyContactRepository emergencyContactRepository;

    @Transactional(readOnly = true)
    public EmergencyContactDto getEmergencyContact(User user) {
        Optional<EmergencyContact> contactOpt = emergencyContactRepository.findByUser(user);
        return contactOpt.map(EmergencyContactDto::new).orElse(null);
    }

    @Transactional
    public EmergencyContactDto saveOrUpdateEmergencyContact(User user, EmergencyContactRequest request) {
        Optional<EmergencyContact> existingOpt = emergencyContactRepository.findByUser(user);
        EmergencyContact contact;
        if (existingOpt.isPresent()) {
            contact = existingOpt.get();
            contact.setContactName(request.getContactName().trim());
            contact.setRelationship(request.getRelationship().trim());
            contact.setEmail(request.getEmail().trim());
            contact.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        } else {
            contact = new EmergencyContact(
                    user,
                    request.getContactName().trim(),
                    request.getRelationship().trim(),
                    request.getEmail().trim(),
                    request.getPhone() != null ? request.getPhone().trim() : null
            );
        }
        EmergencyContact saved = emergencyContactRepository.save(contact);
        return new EmergencyContactDto(saved);
    }

    @Transactional
    public void deleteEmergencyContact(User user) {
        Optional<EmergencyContact> contactOpt = emergencyContactRepository.findByUser(user);
        if (!contactOpt.isPresent()) {
            throw new ResourceNotFoundException("No emergency contact found for this user.");
        }
        emergencyContactRepository.delete(contactOpt.get());
    }
}
