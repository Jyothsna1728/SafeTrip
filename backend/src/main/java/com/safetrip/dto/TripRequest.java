package com.safetrip.dto;

import javax.validation.constraints.NotBlank;
import java.util.Date;

public class TripRequest {

    @NotBlank(message = "Destination is required")
    private String destination;

    private Date startDate;
    private Date endDate;
    private String notes;

    public TripRequest() {
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public Date getStartDate() {
        return startDate;
    }

    public void setStartDate(Date startDate) {
        this.startDate = startDate;
    }

    public Date getEndDate() {
        return endDate;
    }

    public void setEndDate(Date endDate) {
        this.endDate = endDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
