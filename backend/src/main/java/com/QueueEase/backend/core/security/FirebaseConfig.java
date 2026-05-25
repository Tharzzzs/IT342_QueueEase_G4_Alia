package com.QueueEase.backend.core.security;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @Bean
    public Firestore firestore() throws IOException {
        // Check if Firebase is already initialized to avoid "app already exists" errors
        if (FirebaseApp.getApps().isEmpty()) {
            // Ensure your json file is inside src/main/resources/
            java.io.InputStream serviceAccount = 
                    getClass().getResourceAsStream("/serviceAccountKey.json");

            if (serviceAccount == null) {
                throw new IOException("serviceAccountKey.json not found in classpath");
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            FirebaseApp.initializeApp(options);
        }
        return FirestoreClient.getFirestore();
    }
}