package com.safetrip.dto;

import com.safetrip.entity.EmergencyContact;

import java.util.Date;

public class EmergencyContactDto {

    private Long id;
    private String contactName;
    private String relationship;
    private String email;
    private String phone;
    private Date createdAt;
    private Date updatedAt;

    public EmergencyContactDto() {
    }

    public EmergencyContactDto(EmergencyContact contact) {
        if (contact != null) {
            this.id = contact.getId();
            this.contactName = contact.getContactName();
            this.relationship = contact.getRelationship();
            this.email = contact.getEmail();
            this.phone = contact.getPhone();
            this.createdAt = contact.getCreatedAt();
            this.updatedAt = contact.getUpdatedAt();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }

    public String getRelationship() {
        return relationship;
    }

    public void setRelationship(String relationship) {
        this.relationship = relationship;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }
}
