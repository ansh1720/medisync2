# MediSync Healthcare Platform - Flow Diagram

## Main Application Flow

```mermaid
flowchart TD
    Start([Start: User Opens MediSync])
    
    Start --> Auth{Login or<br/>Register?}
    
    Auth -->|Register| Register[Create Account]
    Auth -->|Login| Login[Login Page]
    
    Register --> Login
    Login --> ValidAuth{Valid<br/>Credentials?}
    
    ValidAuth -->|No| Login
    ValidAuth -->|Yes| RoleCheck{User Role?}
    
    RoleCheck -->|Patient| PatientDash[Patient Dashboard]
    RoleCheck -->|Doctor| DoctorDash[Doctor Dashboard]
    RoleCheck -->|Admin| AdminDash[Admin Dashboard]
    
    %% Patient Flow
    PatientDash --> PatientFeatures[Access Patient Features]
    PatientFeatures --> SearchDisease[Search Diseases]
    PatientFeatures --> FindHospital[Find Hospitals]
    PatientFeatures --> BookConsult[Book Consultation]
    PatientFeatures --> ViewNews[View Health News]
    
    SearchDisease --> EndPatient[Continue Using App]
    FindHospital --> EndPatient
    BookConsult --> EndPatient
    ViewNews --> EndPatient
    
    %% Doctor Flow
    DoctorDash --> DoctorFeatures[Access Doctor Features]
    DoctorFeatures --> ViewPatients[View Patients]
    DoctorFeatures --> ManageConsult[Manage Consultations]
    DoctorFeatures --> ViewEquipment[Equipment Readings]
    
    ViewPatients --> EndDoctor[Continue Using App]
    ManageConsult --> EndDoctor
    ViewEquipment --> EndDoctor
    
    %% Admin Flow
    AdminDash --> AdminFeatures[Access Admin Features]
    AdminFeatures --> ManageUsers[Manage Users]
    AdminFeatures --> ViewAnalytics[View Analytics]
    AdminFeatures --> ManageContent[Manage Content]
    
    ManageUsers --> EndAdmin[Continue Using App]
    ViewAnalytics --> EndAdmin
    ManageContent --> EndAdmin
    
    %% Logout
    EndPatient --> Logout{Logout?}
    EndDoctor --> Logout
    EndAdmin --> Logout
    
    Logout -->|Yes| End([End: Session Closed])
    Logout -->|No| PatientDash
    Logout -->|No| DoctorDash
    Logout -->|No| AdminDash
    
    style Start fill:#f9e4c8
    style End fill:#f9e4c8
    style Auth fill:#f9e4c8
    style ValidAuth fill:#f9e4c8
    style RoleCheck fill:#f9e4c8
    style Logout fill:#f9e4c8
    style PatientDash fill:#e8f4f8
    style DoctorDash fill:#e8f8e8
    style AdminDash fill:#ffe8e8
```

---

## Detailed Patient Journey

```mermaid
flowchart TD
    PStart([Patient Logs In])
    
    PStart --> PDash[Patient Dashboard]
    
    PDash --> Choice{What to do?}
    
    Choice -->|Search Health Info| Disease[Search Disease/Symptoms]
    Choice -->|Find Healthcare| Hospital[Find Nearby Hospitals]
    Choice -->|Get Consultation| Consult[Book Doctor Consultation]
    Choice -->|Read News| News[Browse Health News]
    Choice -->|Check Records| Records[View Health Records]
    Choice -->|Risk Assessment| Risk[Health Risk Assessment]
    
    Disease --> DiseaseDetails[View Disease Details]
    DiseaseDetails --> PDash
    
    Hospital --> HospitalList[View Hospital List]
    HospitalList --> SelectHospital[Select Hospital]
    SelectHospital --> PDash
    
    Consult --> SelectDoctor[Choose Doctor]
    SelectDoctor --> BookSlot[Book Time Slot]
    BookSlot --> Payment[Payment]
    Payment --> Confirmed[Booking Confirmed]
    Confirmed --> PDash
    
    News --> ReadNews[Read Articles]
    ReadNews --> Bookmark[Bookmark Articles]
    Bookmark --> PDash
    
    Records --> ViewRecords[View Medical History]
    ViewRecords --> ViewPrescription[View Prescriptions]
    ViewPrescription --> PDash
    
    Risk --> FillForm[Fill Health Data]
    FillForm --> Calculate[Calculate Risk Score]
    Calculate --> ShowResults[Show Risk Assessment]
    ShowResults --> PDash
    
    PDash --> PEnd([Logout])
    
    style PStart fill:#f9e4c8
    style PEnd fill:#f9e4c8
    style Choice fill:#f9e4c8
    style PDash fill:#e8f4f8
```

---

## Detailed Doctor Journey

```mermaid
flowchart TD
    DStart([Doctor Logs In])
    
    DStart --> DDash[Doctor Dashboard]
    
    DDash --> DChoice{What to do?}
    
    DChoice -->|Manage Patients| Patients[View Patient List]
    DChoice -->|Consultations| Consult[View Consultations]
    DChoice -->|Equipment Data| Equipment[View Equipment Readings]
    DChoice -->|Update Profile| Profile[Update Professional Profile]
    
    Patients --> SelectPatient[Select Patient]
    SelectPatient --> PatientHistory[View Patient History]
    PatientHistory --> UpdateRecords[Update Medical Records]
    UpdateRecords --> DDash
    
    Consult --> ViewAppt[View Appointments]
    ViewAppt --> ConsultPatient[Conduct Consultation]
    ConsultPatient --> Prescribe[Write Prescription]
    Prescribe --> DDash
    
    Equipment --> ViewReadings[View Equipment Data]
    ViewReadings --> AnalyzeData[Analyze Patient Data]
    AnalyzeData --> DDash
    
    Profile --> UpdateInfo[Update Information]
    UpdateInfo --> DDash
    
    DDash --> DEnd([Logout])
    
    style DStart fill:#f9e4c8
    style DEnd fill:#f9e4c8
    style DChoice fill:#f9e4c8
    style DDash fill:#e8f8e8
```

---

## Detailed Admin Journey

```mermaid
flowchart TD
    AStart([Admin Logs In])
    
    AStart --> ADash[Admin Dashboard]
    
    ADash --> AChoice{What to do?}
    
    AChoice -->|Manage Users| Users[User Management]
    AChoice -->|View Analytics| Analytics[System Analytics]
    AChoice -->|Manage Content| Content[Content Management]
    AChoice -->|System Settings| Settings[System Configuration]
    
    Users --> ViewUsers[View All Users]
    ViewUsers --> EditUser[Add/Edit/Delete Users]
    EditUser --> ManageRoles[Manage User Roles]
    ManageRoles --> ADash
    
    Analytics --> ViewStats[View Platform Statistics]
    ViewStats --> Reports[Generate Reports]
    Reports --> Monitor[Monitor Activity]
    Monitor --> ADash
    
    Content --> ManageHospitals[Manage Hospitals]
    Content --> ManageDoctors[Manage Doctors]
    Content --> ManageNews[Manage News Content]
    ManageHospitals --> ADash
    ManageDoctors --> ADash
    ManageNews --> ADash
    
    Settings --> APIKeys[API Configuration]
    Settings --> Security[Security Settings]
    APIKeys --> ADash
    Security --> ADash
    
    ADash --> AEnd([Logout])
    
    style AStart fill:#f9e4c8
    style AEnd fill:#f9e4c8
    style AChoice fill:#f9e4c8
    style ADash fill:#ffe8e8
```

---

## How to View This Diagram

### Option 1: VS Code Preview
1. Open this file in VS Code
2. Install "Markdown Preview Mermaid Support" extension (if not installed)
3. Right-click and select "Open Preview" or press `Ctrl+Shift+V`

### Option 2: Online Viewer
1. Copy any diagram code (including the \`\`\`mermaid ... \`\`\` block)
2. Go to https://mermaid.live
3. Paste the code to see the rendered diagram
4. Export as PNG or SVG for your report

### Option 3: GitHub/GitLab
1. Push this file to your repository
2. Open it on GitHub - Mermaid diagrams render automatically

---

## Legend

- **Rounded Rectangles (Beige)**: Start/End points, Decision points
- **Blue Boxes**: Patient-related features
- **Green Boxes**: Doctor-related features  
- **Red Boxes**: Admin-related features
- **Diamond Shapes**: Decision/Choice points
- **Arrows**: Flow direction

---

## Color Coding Guide

```mermaid
flowchart LR
    Start([Start/End])
    Decision{Decision}
    Patient[Patient Feature]
    Doctor[Doctor Feature]
    Admin[Admin Feature]
    
    style Start fill:#f9e4c8
    style Decision fill:#f9e4c8
    style Patient fill:#e8f4f8
    style Doctor fill:#e8f8e8
    style Admin fill:#ffe8e8
```
