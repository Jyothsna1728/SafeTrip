package com.safetrip.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
public class PlacesApiException extends RuntimeException {
    public PlacesApiException(String message) {
        super(message);
    }

    public PlacesApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
