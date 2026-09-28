package com.safetrip.dto;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;

public class EmergencyContactRequest {

    @NotBlank(message = "Contact name is required")
    private String contactName;

    @NotBlank(message = "Relationship is required")
    private String relationship;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    private String phone;

    public EmergencyContactRequest() {
    }

    public EmergencyContactRequest(String contactName, String relationship, String email, String phone) {
        this.contactName = contactName;
        this.relationship = relationship;
        this.email = email;
        this.phone = phone;
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
}
