package com.QueueEase.backend.event;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class UserRegistrationListener {
    private static final Logger logger = LoggerFactory.getLogger(UserRegistrationListener.class);

    @EventListener
    public void handleUserRegistration(UserRegisteredEvent event) {
        logger.info("Observer Pattern: Received UserRegisteredEvent for user: " + event.getUser().getEmail());
        // Additional business logic like sending an email can be placed here
    }
}
