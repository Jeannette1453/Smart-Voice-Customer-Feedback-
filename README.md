# SmartVoice — Customer Feedback and Service Tracker

> Final Year Project | Adventist University of Central Africa (AUCA)  
> Student: Uwimbabazi Jeannette  
> Partner Organization: LOLC Unguka Finance, Kigali, Rwanda

---

## What is SmartVoice?

SmartVoice is a web-based customer feedback management system built for LOLC Unguka Finance. It allows customers to submit complaints, compliments, and suggestions online. The system uses AI to automatically classify, prioritize, and route feedback to the right department and staff member. Managers can track performance in real time through dashboards and downloadable reports.

---

## Features

- Customer feedback submission (complaint, compliment, suggestion, survey)
- AI-powered automatic classification and routing
- Auto-assignment to the right department and least-busy staff member
- Real-time status tracking and notifications (email + in-app)
- Manager dashboard with analytics, charts, overdue cases, and staff workload
- PDF and Excel report generation with filters
- Customer outreach — managers contact customers directly
- Role-based access: Customer, Staff, Manager, Admin
- Secure login: JWT + OTP email verification + Google OAuth
- Survey creation and response analysis
- FAQ management

---

## Project Structure

```
├── smartvoice/              → Spring Boot Backend (Java)
│   └── src/main/java/rw/smartvoice/
│       ├── controller/      → API endpoints
│       ├── service/         → Business logic
│       ├── model/           → Database entities
│       ├── repository/      → Database queries
│       └── dto/             → Data transfer objects
│
├── smartvoice-frontend/     → React Frontend
│   └── src/
│       ├── pages/           → All page components
│       ├── components/      → Reusable components
│       └── index.css        → Global styles and color variables
│
└── smartvoice-ai/           → Python AI Service (FastAPI)
    └── smartvoice-ai/
        └── main.py          → Feedback classification logic
```

---

## Technologies Used

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Recharts, Lucide Icons, Poppins font |
| Backend | Java Spring Boot, Spring Security, JWT |
| AI Service | Python FastAPI |
| Database | PostgreSQL |
| Authentication | JWT + OTP Email + Google OAuth |
| Reports | OpenPDF, Apache POI (Excel) |

---

## Roles

| Role | Permissions |
|------|------------|
| Customer | Submit feedback, track status, message staff, rate service, take surveys |
| Staff | Handle assigned feedback, update status, message customers |
| Manager | View all feedback, assign cases, view reports, contact customers, create surveys |
| Admin | Full user management, system settings, all manager permissions |

---

## Setup Instructions

### 1. Database
- Create a PostgreSQL database named `smartvoice_db`

### 2. Backend
```bash
cd smartvoice
cp src/main/resources/application.properties.example src/main/resources/application.properties
# Fill in your database credentials, email, JWT secret, Google client ID
./mvnw spring-boot:run
```

### 3. AI Service
```bash
cd smartvoice-ai/smartvoice-ai
pip install fastapi uvicorn
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### 4. Frontend
```bash
cd smartvoice-frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Color Reference (for customization)

All main colors are in `smartvoice-frontend/src/index.css` under `:root`:

```css
--primary: #1d61a8;    /* LOLC Blue — buttons, sidebar active */
--accent: #ed1f24;     /* LOLC Red — danger, accent elements */
--bg: #f3f6f9;         /* Page background */
--card: #ffffff;       /* Cards and panels */
--font-family: 'Poppins', sans-serif;  /* Change font here */
```

Landing page specific colors are in `smartvoice-frontend/src/pages/Landing.jsx`.

---

## License

This project was developed as a Final Year Project at AUCA.  
© 2026 Uwimbabazi Jeannette. All rights reserved.
