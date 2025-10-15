# MediSync Project - Sequence Diagrams

## Overview
This document contains comprehensive sequence diagrams for the MediSync healthcare application, illustrating the interactions between users, frontend, backend, and external services for various use cases.

---

## 1. User Registration Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant AuthContext
    participant AuthAPI
    participant BackendAuth
    participant Database
    participant UserModel

    User->>Browser: Fill registration form
    User->>Browser: Click "Create Account"
    Browser->>AuthContext: register(userData)
    
    AuthContext->>AuthContext: setLoading(true)
    AuthContext->>AuthAPI: authAPI.register(userData)
    AuthAPI->>BackendAuth: POST /api/auth/register
    
    BackendAuth->>BackendAuth: Validate input data
    BackendAuth->>UserModel: findByEmail(email)
    UserModel->>Database: Query user by email
    Database-->>UserModel: Return query result
    UserModel-->>BackendAuth: User exists/not exists
    
    alt User already exists
        BackendAuth-->>AuthAPI: 400 - User already exists
        AuthAPI-->>AuthContext: Error response
        AuthContext->>Browser: toast.error("User already exists")
        Browser->>User: Show error message
    else User doesn't exist
        BackendAuth->>UserModel: Create new user
        UserModel->>UserModel: Hash password
        UserModel->>Database: Save user
        Database-->>UserModel: User created
        
        BackendAuth->>BackendAuth: Generate JWT token
        BackendAuth->>UserModel: Update lastLogin
        UserModel->>Database: Update user
        
        BackendAuth-->>AuthAPI: 201 - Registration successful
        AuthAPI-->>AuthContext: Success response with token
        AuthContext->>Browser: localStorage.setItem('token')
        AuthContext->>Browser: toast.success("Welcome to MediSync")
        Browser->>User: Redirect to dashboard
    end
```

---

## 2. User Login Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant AuthContext
    participant AuthAPI
    participant BackendAuth
    participant Database
    participant UserModel

    User->>Browser: Enter email/password
    User->>Browser: Click "Sign In"
    Browser->>AuthContext: login(credentials)
    
    AuthContext->>AuthContext: setLoading(true)
    AuthContext->>AuthAPI: authAPI.login(credentials)
    AuthAPI->>BackendAuth: POST /api/auth/login
    
    BackendAuth->>BackendAuth: Validate input
    BackendAuth->>UserModel: findByEmail(email)
    UserModel->>Database: Query user
    Database-->>UserModel: Return user data
    UserModel-->>BackendAuth: User data or null
    
    alt User not found
        BackendAuth-->>AuthAPI: 401 - Invalid credentials
        AuthAPI-->>AuthContext: Error response
        AuthContext->>Browser: toast.error("Invalid email or password")
        Browser->>User: Show error message
    else User found
        BackendAuth->>UserModel: comparePassword(password)
        UserModel->>UserModel: Verify password hash
        
        alt Password invalid
            UserModel-->>BackendAuth: false
            BackendAuth-->>AuthAPI: 401 - Invalid credentials
            AuthAPI-->>AuthContext: Error response
            AuthContext->>Browser: toast.error("Invalid email or password")
            Browser->>User: Show error message
        else Password valid
            UserModel-->>BackendAuth: true
            BackendAuth->>BackendAuth: Generate JWT token
            BackendAuth->>UserModel: Update lastLogin
            UserModel->>Database: Update user
            
            BackendAuth-->>AuthAPI: 200 - Login successful
            AuthAPI-->>AuthContext: Success response with token
            AuthContext->>Browser: localStorage.setItem('token')
            AuthContext->>Browser: toast.success("Welcome back!")
            Browser->>User: Redirect to dashboard
        end
    end
```

---

## 3. Risk Assessment Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant RiskAssessment
    participant RiskAPI
    participant RiskController
    participant Database
    participant DiseaseModel
    participant HospitalModel
    participant RiskHistory

    User->>Browser: Fill risk assessment form
    User->>Browser: Select symptoms and conditions
    User->>Browser: Click "Calculate Risk"
    
    Browser->>RiskAssessment: handleSubmit()
    RiskAssessment->>RiskAssessment: validateForm()
    RiskAssessment->>RiskAPI: calculateRisk(formData)
    RiskAPI->>RiskController: POST /api/risk
    
    RiskController->>RiskController: Validate input data
    RiskController->>RiskController: calculateRiskScore(symptoms, age, conditions)
    RiskController->>RiskController: getRiskLevel(finalScore)
    
    par Disease Matching
        RiskController->>DiseaseModel: Find matching diseases
        DiseaseModel->>Database: Query diseases by symptoms
        Database-->>DiseaseModel: Return matching diseases
        DiseaseModel-->>RiskController: Disease list
    and Hospital Search
        RiskController->>HospitalModel: findNearby(location)
        HospitalModel->>Database: Geospatial query
        Database-->>HospitalModel: Return nearby hospitals
        HospitalModel-->>RiskController: Hospital list
    end
    
    RiskController->>RiskController: generateRecommendations()
    RiskController->>RiskController: calculateNextAssessmentDate()
    
    alt User authenticated
        RiskController->>RiskHistory: Save assessment
        RiskHistory->>Database: Store risk history
        Database-->>RiskHistory: Saved successfully
    end
    
    RiskController-->>RiskAPI: Risk assessment result
    RiskAPI-->>RiskAssessment: Assessment data
    RiskAssessment->>Browser: setRiskResult(data)
    Browser->>User: Display risk level and recommendations
```

---

## 4. Equipment Reading Submission Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant EquipmentPage
    participant EquipmentAPI
    participant EquipmentController
    participant EquipmentModel
    parameter Database

    User->>Browser: Select equipment type
    User->>Browser: Enter readings (BP, temperature, etc.)
    User->>Browser: Click "Submit Reading"
    
    Browser->>EquipmentPage: handleSubmit()
    EquipmentPage->>EquipmentPage: validateReadings()
    EquipmentPage->>EquipmentAPI: submitReading(readingData)
    EquipmentAPI->>EquipmentController: POST /api/equipment/readings
    
    EquipmentController->>EquipmentController: Validate reading data
    EquipmentController->>EquipmentModel: Create new reading
    
    EquipmentModel->>EquipmentModel: Pre-save middleware
    EquipmentModel->>EquipmentModel: interpretReading(type, readings)
    
    alt Blood Pressure Reading
        EquipmentModel->>EquipmentModel: Check systolic/diastolic values
        EquipmentModel->>EquipmentModel: Determine risk level
    else Temperature Reading
        EquipmentModel->>EquipmentModel: Check fever ranges
        EquipmentModel->>EquipmentModel: Generate alerts if abnormal
    else Other Equipment Types
        EquipmentModel->>EquipmentModel: Apply specific interpretation logic
    end
    
    EquipmentModel->>EquipmentModel: generateAlert() if abnormal
    EquipmentModel->>Database: Save reading with interpretation
    Database-->>EquipmentModel: Reading saved successfully
    
    EquipmentModel-->>EquipmentController: Reading with interpretation
    EquipmentController-->>EquipmentAPI: Success response
    EquipmentAPI-->>EquipmentPage: Reading submitted
    EquipmentPage->>Browser: toast.success("Reading saved")
    Browser->>User: Show success message and interpretation
```

---

## 5. Hospital Locator Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Browser
    parameter HospitalLocator
    participant GeolocationAPI
    participant GoogleMapsAPI
    participant HospitalAPI
    participant OpenStreetMap
    participant Database

    User->>Browser: Open Hospital Locator
    User->>Browser: Click "Get Current Location"
    
    Browser->>HospitalLocator: getCurrentLocation()
    HospitalLocator->>GeolocationAPI: navigator.geolocation.getCurrentPosition()
    GeolocationAPI-->>HospitalLocator: Position coordinates
    
    HospitalLocator->>HospitalLocator: setUserLocation(coordinates)
    HospitalLocator->>HospitalLocator: searchHospitals(location)
    
    par Real Hospital Data
        HospitalLocator->>OpenStreetMap: fetchHospitalsFromMaps()
        OpenStreetMap-->>HospitalLocator: Hospital data
    and Fallback Data
        HospitalLocator->>HospitalAPI: searchHospitals()
        HospitalAPI->>Database: Geospatial query
        Database-->>HospitalAPI: Nearby hospitals
        HospitalAPI-->>HospitalLocator: Hospital list
    end
    
    HospitalLocator->>HospitalLocator: calculateDistance() for each hospital
    HospitalLocator->>HospitalLocator: sortByDistance()
    HospitalLocator->>Browser: Display hospitals on map and list
    
    User->>Browser: Search specific hospital/place
    Browser->>HospitalLocator: handleHospitalSearchChange()
    HospitalLocator->>HospitalLocator: debouncedHybridSearch()
    HospitalLocator->>Browser: Show autocomplete suggestions
    
    User->>Browser: Click "Get Directions"
    Browser->>HospitalLocator: getDirections(hospital)
    HospitalLocator->>GoogleMapsAPI: Open directions URL
    GoogleMapsAPI-->>User: Navigate to Google Maps with directions
```

---

## 6. Health News Loading Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant HealthNews
    participant NewsService
    participant NewsAPI
    participant GNewsAPI
    participant CurrentsAPI
    participant MockDataGenerator

    User->>Browser: Open Health News page
    Browser->>HealthNews: Component loads
    HealthNews->>HealthNews: useEffect() - loadArticles()
    HealthNews->>NewsService: fetchHealthNews(options)
    
    NewsService->>NewsService: Strategy rotation based on page
    
    par Primary Strategy - Priority Health Sources
        NewsService->>NewsAPI: Fetch from WHO, CDC, NIH domains
        NewsAPI-->>NewsService: Official health articles
    and Fallback Strategy 1 - International Sources
        NewsService->>NewsAPI: Fetch from BBC, Reuters, CNN
        NewsAPI-->>NewsService: International health news
    and Fallback Strategy 2 - Alternative APIs
        NewsService->>GNewsAPI: Fetch health news
        GNewsAPI-->>NewsService: Health articles
    and Fallback Strategy 3 - Currents API
        NewsService->>CurrentsAPI: Fetch health news
        CurrentsAPI-->>NewsService: Health articles
    end
    
    alt APIs successful
        NewsService->>NewsService: deduplicateArticles()
        NewsService->>NewsService: Apply similarity detection
        NewsService-->>HealthNews: Unique articles array
    else All APIs fail
        NewsService->>MockDataGenerator: fetchDiverseMockData()
        MockDataGenerator->>MockDataGenerator: generateOfficialHealthArticles()
        MockDataGenerator->>MockDataGenerator: generateResearchArticles()
        MockDataGenerator->>MockDataGenerator: generateInternationalNewsArticles()
        MockDataGenerator-->>NewsService: Diverse mock articles
        NewsService-->>HealthNews: Mock articles
    end
    
    HealthNews->>Browser: setArticles(articles)
    Browser->>User: Display news articles with infinite scroll
    
    User->>Browser: Scroll to bottom
    Browser->>HealthNews: Intersection Observer triggered
    HealthNews->>HealthNews: loadMoreArticles()
    HealthNews->>NewsService: fetchHealthNews() with next page
    NewsService-->>HealthNews: More articles
    HealthNews->>Browser: Append new articles
    Browser->>User: Show more articles seamlessly
```

---

## 7. Doctor Consultation Booking Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant ConsultationPage
    participant ConsultationAPI
    participant ConsultationController
    participant DoctorModel
    participant Database
    participant NotificationService

    User->>Browser: Search for doctors
    Browser->>ConsultationPage: handleSearch()
    ConsultationPage->>ConsultationAPI: searchDoctors(criteria)
    ConsultationAPI->>ConsultationController: GET /api/consultations/doctors
    
    ConsultationController->>DoctorModel: find(searchCriteria)
    DoctorModel->>Database: Query doctors
    Database-->>DoctorModel: Doctor list
    DoctorModel-->>ConsultationController: Filtered doctors
    ConsultationController-->>ConsultationAPI: Doctor results
    ConsultationAPI-->>ConsultationPage: Doctor list
    ConsultationPage->>Browser: Display available doctors
    
    User->>Browser: Select doctor and time slot
    User->>Browser: Fill consultation form
    User->>Browser: Click "Book Appointment"
    
    Browser->>ConsultationPage: handleBooking()
    ConsultationPage->>ConsultationAPI: bookConsultation(bookingData)
    ConsultationAPI->>ConsultationController: POST /api/consultations
    
    ConsultationController->>ConsultationController: Validate booking data
    ConsultationController->>DoctorModel: Check availability
    DoctorModel->>Database: Check doctor schedule
    Database-->>DoctorModel: Availability status
    
    alt Doctor available
        ConsultationController->>Database: Create consultation
        Database-->>ConsultationController: Consultation created
        ConsultationController->>NotificationService: Send confirmation
        NotificationService->>User: Email/SMS confirmation
        ConsultationController-->>ConsultationAPI: Booking successful
        ConsultationAPI-->>ConsultationPage: Success response
        ConsultationPage->>Browser: toast.success("Appointment booked")
        Browser->>User: Show confirmation details
    else Doctor not available
        ConsultationController-->>ConsultationAPI: 409 - Time slot unavailable
        ConsultationAPI-->>ConsultationPage: Error response
        ConsultationPage->>Browser: toast.error("Time slot unavailable")
        Browser->>User: Show error and suggest alternatives
    end
```

---

## 8. Community Forum Post Creation Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant ForumPage
    participant ForumAPI
    participant ForumController
    participant PostModel
    participant Database
    participant ModerationService

    User->>Browser: Click "Create New Post"
    Browser->>ForumPage: showCreatePost()
    User->>Browser: Fill post title and content
    User->>Browser: Select category and tags
    User->>Browser: Click "Publish Post"
    
    Browser->>ForumPage: handleSubmit()
    ForumPage->>ForumAPI: createPost(postData)
    ForumAPI->>ForumController: POST /api/forum/posts
    
    ForumController->>ForumController: Validate post data
    ForumController->>ModerationService: checkContent(content)
    ModerationService->>ModerationService: Scan for inappropriate content
    
    alt Content appropriate
        ModerationService-->>ForumController: Content approved
        ForumController->>PostModel: Create new post
        PostModel->>Database: Save post
        Database-->>PostModel: Post saved
        PostModel-->>ForumController: Post created
        ForumController-->>ForumAPI: Success response
        ForumAPI-->>ForumPage: Post published
        ForumPage->>Browser: toast.success("Post published")
        Browser->>User: Redirect to post view
    else Content flagged
        ModerationService-->>ForumController: Content flagged
        ForumController-->>ForumAPI: 400 - Content violates guidelines
        ForumAPI-->>ForumPage: Error response
        ForumPage->>Browser: toast.error("Content violates community guidelines")
        Browser->>User: Show error and editing options
    end
```

---

## 9. User Profile Update Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant ProfilePage
    participant AuthAPI
    participant AuthController
    participant UserModel
    participant Database

    User->>Browser: Open profile page
    Browser->>ProfilePage: Load user profile
    ProfilePage->>AuthAPI: getProfile()
    AuthAPI->>AuthController: GET /api/auth/profile
    
    AuthController->>UserModel: findById(userId)
    UserModel->>Database: Query user data
    Database-->>UserModel: User profile data
    UserModel-->>AuthController: User profile
    AuthController-->>AuthAPI: Profile data
    AuthAPI-->>ProfilePage: User profile
    ProfilePage->>Browser: Display current profile
    
    User->>Browser: Edit profile fields
    User->>Browser: Click "Update Profile"
    
    Browser->>ProfilePage: handleUpdateProfile()
    ProfilePage->>AuthAPI: updateProfile(updatedData)
    AuthAPI->>AuthController: PUT /api/auth/profile
    
    AuthController->>AuthController: Validate update data
    AuthController->>UserModel: findByIdAndUpdate()
    UserModel->>Database: Update user record
    Database-->>UserModel: Updated user
    UserModel-->>AuthController: Updated profile
    
    AuthController-->>AuthAPI: Update successful
    AuthAPI-->>ProfilePage: Success response
    ProfilePage->>Browser: localStorage.setItem('user', updatedUser)
    ProfilePage->>Browser: toast.success("Profile updated successfully")
    Browser->>User: Show updated profile
```

---

## 10. Dashboard Data Loading Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Dashboard
    participant SearchEngine
    participant EquipmentAPI
    participant RiskAPI
    participant ConsultationAPI
    participant NewsAPI
    participant BackendServices

    User->>Browser: Navigate to dashboard
    Browser->>Dashboard: Component loads
    Dashboard->>Dashboard: useEffect() - Load dashboard data
    
    par Load Dashboard Data
        Dashboard->>EquipmentAPI: getLatestReadings()
        EquipmentAPI->>BackendServices: GET /api/equipment/summary
        BackendServices-->>EquipmentAPI: Latest readings
        EquipmentAPI-->>Dashboard: Equipment data
    and Load Risk Assessment
        Dashboard->>RiskAPI: getLatestRiskAssessment()
        RiskAPI->>BackendServices: GET /api/risk/latest
        BackendServices-->>RiskAPI: Risk data
        RiskAPI-->>Dashboard: Risk assessment
    and Load Appointments
        Dashboard->>ConsultationAPI: getUpcomingAppointments()
        ConsultationAPI->>BackendServices: GET /api/consultations/upcoming
        BackendServices-->>ConsultationAPI: Appointment data
        ConsultationAPI-->>Dashboard: Appointments
    and Load Health News
        Dashboard->>NewsAPI: getLatestHealthNews(limit: 5)
        NewsAPI->>BackendServices: Health news headlines
        BackendServices-->>NewsAPI: News articles
        NewsAPI-->>Dashboard: News data
    end
    
    Dashboard->>Dashboard: Calculate health metrics
    Dashboard->>Dashboard: Generate insights and recommendations
    Dashboard->>Browser: Render dashboard with smart search bar
    Browser->>User: Display personalized health dashboard
    
    User->>Browser: Type in search bar
    Browser->>Dashboard: handleSearchChange()
    Dashboard->>SearchEngine: Filter suggestions (symptoms/diseases)
    SearchEngine-->>Dashboard: Filtered suggestions
    Dashboard->>Browser: Show search suggestions with categories
    
    alt User selects symptom
        User->>Browser: Click symptom suggestion
        Browser->>Dashboard: handleSuggestionClick(symptom)
        Dashboard->>Browser: navigate('/risk-assessment', {state: symptom})
    else User selects disease
        User->>Browser: Click disease suggestion
        Browser->>Dashboard: handleSuggestionClick(disease)
        Dashboard->>Browser: navigate('/disease/disease-name', {state: disease})
    else User presses Enter
        User->>Browser: Press Enter or click search
        Browser->>Dashboard: handleSearchSubmit()
        Dashboard->>Dashboard: Determine if symptom or disease
        alt Search matches disease
            Dashboard->>Browser: navigate('/disease/disease-name')
        else Search treated as symptom
            Dashboard->>Browser: navigate('/risk-assessment')
        end
    end
```

---

## 11. Disease Search and Details Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Dashboard
    participant DiseaseDetails
    participant DiseaseAPI
    participant Database
    participant ChartLibrary

    User->>Browser: Type disease name in search bar
    Browser->>Dashboard: handleSearchChange()
    Dashboard->>Dashboard: Filter disease suggestions
    Dashboard->>Browser: Show disease suggestions
    
    User->>Browser: Click disease suggestion
    Browser->>Dashboard: handleSuggestionClick(disease)
    Dashboard->>Browser: navigate('/disease/disease-name')
    
    Browser->>DiseaseDetails: Component loads
    DiseaseDetails->>DiseaseDetails: useEffect() - Load disease data
    DiseaseDetails->>DiseaseAPI: fetchDiseaseDetails(diseaseId)
    DiseaseAPI->>Database: Query disease information
    Database-->>DiseaseAPI: Disease data with symptoms, causes, prevention
    DiseaseAPI-->>DiseaseDetails: Complete disease information
    
    par Load Basic Info
        DiseaseDetails->>Browser: Display disease overview
        DiseaseDetails->>Browser: Show symptoms and causes
        DiseaseDetails->>Browser: Display prevention and treatment
    and Generate Visualizations
        DiseaseDetails->>ChartLibrary: Create prevalence chart
        ChartLibrary-->>DiseaseDetails: Regional prevalence bars
        DiseaseDetails->>ChartLibrary: Create symptom frequency chart
        ChartLibrary-->>DiseaseDetails: Symptom frequency bars
        DiseaseDetails->>ChartLibrary: Create severity distribution
        ChartLibrary-->>DiseaseDetails: Severity doughnut chart
    and Load Related Data
        DiseaseDetails->>DiseaseAPI: getRelatedDiseases()
        DiseaseAPI->>Database: Query diseases by category
        Database-->>DiseaseAPI: Related diseases list
        DiseaseAPI-->>DiseaseDetails: Related diseases
    end
    
    DiseaseDetails->>Browser: Render complete disease page
    Browser->>User: Display comprehensive disease information with charts
    
    alt User wants risk assessment
        User->>Browser: Click "Check Risk Assessment"
        Browser->>DiseaseDetails: Navigate to risk assessment
        DiseaseDetails->>Browser: navigate('/risk-assessment', {state: diseaseQuery})
    else User wants to find specialists
        User->>Browser: Click "Find Specialists"
        Browser->>DiseaseDetails: Navigate to hospital locator
        DiseaseDetails->>Browser: navigate('/hospitals')
    else User wants consultation
        User->>Browser: Click "Book Consultation"
        Browser->>DiseaseDetails: Navigate to consultations
        DiseaseDetails->>Browser: navigate('/consultations')
    end
```

---

## Key Components and Their Roles

### Frontend Components
- **AuthContext**: Manages authentication state and user sessions
- **Protected Routes**: Ensures authenticated access to protected pages
- **Page Components**: Handle user interactions and API calls
- **API Utilities**: Centralized API communication layer
- **Search Engine**: Smart search with symptom/disease categorization
- **DiseaseDetails**: Comprehensive disease information with data visualizations
- **Chart Components**: Interactive data visualization using Chart.js

### Backend Services
- **Controllers**: Handle HTTP requests and business logic
- **Models**: Database schemas and data validation
- **Middleware**: Authentication, validation, and error handling
- **Routes**: API endpoint definitions and validation rules

### External Services
- **Geolocation API**: User location services
- **Google Maps API**: Directions and place search
- **News APIs**: Real-time health news aggregation
- **OpenStreetMap**: Hospital location data

### Database Operations
- **User Management**: Registration, authentication, profile updates
- **Health Data**: Risk assessments, equipment readings, consultations
- **Content Management**: Forum posts, news articles, hospital data

---

These sequence diagrams provide a comprehensive view of how different actors interact within the MediSync system, showing the flow of data and control through various layers of the application architecture.