package com.QueueEase.backend.core.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    // Handles @Valid validation failures
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }
        
        ErrorResponse response = ErrorResponse.buildError(
                "VALID-001",
                "Validation failed",
                errors
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    // Handles general exceptions like invalid credentials
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralExceptions(Exception ex) {
        String message = ex.getMessage();
        String code = "SYSTEM-001";
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;

        if (message != null && (message.contains("Invalid credentials") || message.contains("Authentication Failed"))) {
            code = "AUTH-001";
            status = HttpStatus.UNAUTHORIZED;
        }

        ErrorResponse response = ErrorResponse.buildError(
                code,
                message != null ? message : "Internal server error",
                null
        );
        return new ResponseEntity<>(response, status);
    }
}
