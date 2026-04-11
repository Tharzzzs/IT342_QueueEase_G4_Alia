package com.QueueEase.backend.strategy;

import com.QueueEase.backend.model.User;
import java.util.Map;

public interface AuthenticationStrategy {
    User authenticate(Map<String, String> credentials) throws Exception;
}
