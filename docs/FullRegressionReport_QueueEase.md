# Full Regression Test Report - QueueEase
**Prepared by:** Group 4 (Alia)  
**Date:** May 8, 2026  
**Project:** QueueEase Smart Queue Management System  
**Repository branch:** feature/vertical-slice-refactoring  
**Primary design reference:** docs/TestPlan.md  

## 1. Project Information
QueueEase is a multi-platform smart queue management system for service centers. The implemented system includes:
- Spring Boot backend with Firestore persistence integration.
- React web frontend for customers, staff, and admins.
- Android mobile app for user queue workflows.
- JWT authentication, Google OAuth, role-based access control, and real-time Firebase queue updates.

## 2. Refactoring Summary
The project was refactored from a primarily technical-layer structure into a Vertical Slice Architecture. Feature behavior is now grouped by business capability while shared infrastructure remains outside feature slices.

**Backend changes:**
- `features/auth`: authentication controller, auth facade, authentication strategies, user models, factories, and auth DTOs.
- `core/security`: JWT filters, external token verifiers, Google adapters, Security and Firebase configurations.
- `core/config`: General web configuration.

**Web changes:**
- `features/auth`: login, register, registerStaff pages, auth API, auth components.
- `features/queue`: queue monitor, queue status, customer home, queue API.
- `features/serviceCenter`: admin dashboard, service centers overview, serviceCenter API.
- `components`: sidebar, toast and shared UI components.

**Mobile changes:**
- `features/auth`: login and register activities.
- `core/network`: ApiClient, ApiService, and data models (AuthResponse, LoginRequest, RegisterRequest).
- Android manifest: activity locations were updated to the new package names.

## 3. Updated Project Structure
```text
backend/src/main/java/com/QueueEase/backend/
  core/
    config/
    security/
  features/
    auth/

web/src/
  components/
  features/
    auth/
    queue/
    serviceCenter/

mobile/app/src/main/java/edu/alia/queueease/
  core/
    network/
  features/
    auth/
  MainActivity.kt
```

## 4. Test Plan Documentation
The complete test plan is maintained in:
- `docs/TestPlan.md`

It covers all implemented functional requirements, manual regression cases, automated test commands, entry/exit criteria, and defect handling.

## 5. Automated Test Evidence
Supporting evidence is maintained in the generated log files:
- `backend/backend_test_logs.txt`
- `mobile/mobile_test_logs.txt`
- `web/web_build_logs.txt`

**Automated checks executed:**

| ID | Check | Purpose |
|----|-------|---------|
| AT-01 | Backend stale package scan | Confirms old controller/facade/dto package imports were removed. |
| AT-02 | Web stale import scan | Confirms old page/api aliases were repaired. |
| AT-03 | Android stale package scan | Confirms old UI/network/models packages were replaced. |
| AT-04 | Backend Maven tests | Confirms Spring backend context and tests pass. |
| AT-05 | Web lint/build | Confirms React/TypeScript correctness and production build. |
| AT-06 | Android unit tests | Confirms Android package refactor and activity wiring. |

## 6. Regression Test Results

| Area | Status | Evidence / Notes |
|------|--------|------------------|
| Branch creation | Passed | Branch created from updated main: `feature/vertical-slice-refactoring`. |
| Backend vertical slice package scan | Passed | Verified programmatically via refactoring scripts. |
| Web import repair scan | Passed | Verified programmatically via refactoring scripts. |
| Android package reference scan | Passed | Verified programmatically via refactoring scripts. |
| Backend full tests | Passed | `backend\mvnw.cmd test`: 1 test, 0 failures, 0 errors. Log: `backend/backend_test_logs.txt`. |
| Web production build | Passed | `web\npm run build` passed. Log: `web/web_build_logs.txt`. |
| Android unit tests | Passed | `mobile\gradlew.bat testDebugUnitTest` passed. Log: `mobile/mobile_test_logs.txt`. |
| Hardcoded Port Repair | Passed | Corrected hardcoded ports (8080 -> 8081) in frontend Axios requests to match backend. |
| Android APK build | Passed | `mobile\gradlew.bat assembleDebug` completed successfully. |

## 7. Issues Found

| Issue | Severity | Resolution |
|-------|----------|------------|
| Backend features missed imports after moving classes. | High | Fixed package declarations and removed redundant imports using Node script. |
| Web imports still referenced old page/API locations. | High | Updated imports to direct feature paths programmatically. |
| Android package replacement affected shared network declarations. | High | Corrected package declarations for ApiClient, ApiService, and data models. |
| Android manifest referenced old activity package names. | High | Updated `.LoginActivity` and `.RegisterActivity` names in `AndroidManifest.xml`. |
| Android moved activities could not resolve R. | High | Added explicit `import edu.alia.queueease.R` after moving activities into `features.auth`. |
| API Port Mismatch between frontends and backend. | High | Updated base URLs in React (`auth.ts`) and Kotlin (`ApiClient.kt`) to point to `8081` instead of `8080`. |
| Hardcoded API ports in React components. | High | Changed `8080` to `8081` directly inside `Login.tsx` and `RegisterStaff.tsx`. |

## 8. Fixes Applied
- Backend code was moved into business feature packages (`features/auth`) and infrastructure packages (`core/security`, `core/config`).
- Web code was moved into feature folders (`features/*`) with corresponding API logic.
- Android files were moved into `features/auth` and `core/network`.
- Manifest and layout references were aligned with the new Android packages.
- Android MainActivity and Feature Activity imports were corrected after package relocation, and the `R` class was explicitly imported.
- Missing cross-slice backend imports were restored and package declarations enforced.
- Fixed API port configurations on the frontends to correctly route to the Spring Boot instance.
- Regression documentation, and automated test logs were compiled.

## 9. Submission Checklist

| Requirement | Status |
|-------------|--------|
| GitHub repository link | Use the existing QueueEase repository URL after pushing this branch. |
| Refactor branch pushed | Pending push after final commit. |
| Commit history reflecting refactor/testing | Pending final commits. |
| Full regression report PDF | Editable Markdown is available as `docs/FullRegressionReport_QueueEase.md`; convert manually to PDF. |
| Automated test evidence | Logs are captured in `backend_test_logs.txt`, `mobile_test_logs.txt`, and `web_build_logs.txt`. |
