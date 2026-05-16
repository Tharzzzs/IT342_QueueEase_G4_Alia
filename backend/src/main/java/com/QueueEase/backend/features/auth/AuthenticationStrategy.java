package com.QueueEase.backend.features.auth;

import com.QueueEase.backend.features.auth.User;
import java.util.Map;

public interface AuthenticationStrategy {
    User authenticate(Map<String, String> credentials) throws Exception;
}
