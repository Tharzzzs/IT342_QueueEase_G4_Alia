# Software Test Plan: QueueEase Multi-Platform Project

## 1. Introduction
This Test Plan outlines the testing strategy, functional requirements coverage, test cases, and test steps for the QueueEase project after the Vertical Slice Architecture refactoring.

## 2. Functional Requirements Coverage
1. **User Authentication (Auth Feature)**
   - Registration (Backend, Web, Mobile)
   - Login (Backend, Web, Mobile)
2. **Queue Management (Queue Feature)**
   - View Queue Status (Web)
   - Queue Monitor Dashboard (Web)
3. **Service Center Management (Service Center Feature)**
   - View Service Centers (Web)
   - Admin Dashboard for Service Centers (Web)

## 3. Test Cases & Test Scripts

### Feature: User Authentication

#### TC01: User Registration
- **Preconditions**: User has no existing account.
- **Test Steps**:
  1. Open the Registration page (Web or Mobile).
  2. Enter valid First Name, Last Name, Email, and Password.
  3. Submit the registration form.
- **Expected Result**: System creates the user, returns a success response, and navigates to the Login page. (Backend creates user record and fires UserRegisteredEvent).

#### TC02: User Login
- **Preconditions**: User has registered.
- **Test Steps**:
  1. Open the Login page (Web or Mobile).
  2. Enter the registered Email and Password.
  3. Submit the form.
- **Expected Result**: System authenticates the user, returns a JWT token, and redirects to the Customer Home / Main Activity.

### Feature: Queue Management

#### TC03: View Queue Status
- **Preconditions**: User is logged in.
- **Test Steps**:
  1. Navigate to the Queue Status page.
- **Expected Result**: Real-time queue information is displayed, pulling data accurately from the database/Firebase.

### Feature: Service Center Management

#### TC04: View Service Centers
- **Preconditions**: User is logged in.
- **Test Steps**:
  1. Navigate to the Service Centers page.
- **Expected Result**: A list of available service centers is rendered accurately.

## 4. Automated Test Cases
- **Backend (Spring Boot)**:
  - Unit Tests for `AuthController.java` (mocking `AuthFacade`).
  - Integration tests for registration and login endpoints.
- **Web Frontend (React)**:
  - Component tests for `Login.tsx` and `Register.tsx` using React Testing Library.
  - Build validation (`npm run build`).
- **Mobile App (Android)**:
  - Unit tests for `ApiService.kt` serialization.
  - UI Tests using Espresso for `LoginActivity` and `RegisterActivity`.
  - Build validation (`./gradlew assembleDebug`).
