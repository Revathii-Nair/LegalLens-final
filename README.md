# LegalLens

LegalLens is a comprehensive, full-stack investigative case management system designed for law enforcement, forensic teams, and intelligence agencies. It provides a secure, centralized platform to manage investigative cases, handle digital evidence, track timeline events, and maintain strict accountability through role-based access control and system-wide audit logging.

---

## OVERVIEW

Managing investigative cases involves handling sensitive data, coordinating between different specialized officers, and maintaining a strict chain of custody for evidence. LegalLens solves this by offering a digital workspace where:

- **Supervisors** can oversee all cases, manage personnel, and track system-wide activity.
- **Lead Investigators** can direct cases, assign tasks, and verify critical evidence.
- **Forensic & Police Officers** can securely upload evidence, update case timelines, and collaborate seamlessly.

Every action taken in the system is recorded in an immutable Audit Log, ensuring complete transparency and security.

---

## TECHNOLOGIES USED (MERN Stack)

### Frontend

- **React.js**: Component-driven UI
- **React Router DOM**: Client-side routing for seamless navigation
- **Axios**: Handling API requests with JWT interceptors
- **Lucide React**: Clean, modern SVG icons for the interface

### Backend

- **Node.js & Express.js**: Robust RESTful API server
- **MongoDB & Mongoose**: NoSQL database with strict schema validation
- **JSON Web Tokens (JWT)**: Secure, stateless user authentication and role authorization
- **Multer**: Handling multipart/form-data for uploading case evidence and user avatars locally

---

## KEY FEATURES

### Role-Based Access Control (RBAC)

The system enforces strict permission levels depending on the user's role:

- **Supervising_Officer** → Admin level access, manages system members and global cases
- **Lead_Investigator** → Case leaders, evidence verification
- **Forensic_Officer** → Evidence handling
- **Police_Officer** → General case work and timeline tracking

### Advanced Case Management

- Create cases with varying priority levels (Low, Medium, High)
- Track case statuses (Open, Closed, Archived)
- Assign specific members to cases
- Detailed case dashboards featuring Tabs for Timelines, Members, and Evidence

### Evidence & Chain of Custody

- Secure file uploads scoped directly to specific case folders
- Formal **Verification system** where senior officers can verify evidence and attach official notes
- Prevention of deleting verified evidence to maintain investigative integrity

### System-Wide Audit Logging & Notifications

- Every critical action (case creation, status changes, member assignment, evidence upload/verification) is automatically logged
- Real-time, in-app notification system alerts users when they are assigned to a case, when a password is reset, or when evidence is added to their cases
- Audit logs can be exported and saved as CSV files for reporting and archival use.

---

## INSTALLATION & LOCAL SETUP

### Prerequisites

- Node.js: v16.0 or higher
- MongoDB: Running locally or via MongoDB Atlas
- Frontend Core: React 19, Axios, Lucide React
- Backend Core: Node.js (ES Modules), Express, Mongoose, JWT, Multer

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/legallens.git
   cd legallens
   ```

2. **Environment Variables**
   Create a `.env` file in the Backend directory and add the following:

   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/legallens
   JWT_SECRET=your_super_secret_jwt_signature_key
   ```

3. **Backend Setup**
   Open a terminal and navigate to the backend directory:

   ```bash
   cd Backend
   npm install
   npm run dev
   ```

4. **Frontend Setup**
   Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd Frontend
   npm install
   npm start
   ```

---

## PROJECT STRUCTURE

```
LegalLens/
├── Backend/
│   ├── models/
│   │   ├── AuditLog.js
│   │   ├── Case.js
│   │   ├── CaseMember.js
│   │   ├── Event.js
│   │   ├── Evidence.js
│   │   ├── Notification.js
│   │   ├── Role.js
│   │   └── User.js
│   ├── uploads/
│   ├── .env
│   └── server.js
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── cases/
│   │   │   └── common/
│   │   ├── pages/
│   │   │   ├── audit/
│   │   │   ├── cases/
│   │   │   ├── dashboard/
│   │   │   ├── evidence/
│   │   │   ├── notifications/
│   │   │   ├── profile/
│   │   │   └── settings/
│   │   ├── api.js
│   │   ├── App.js
│   │   └── index.js
└── README.md
```

---

## CORE API ENDPOINTS

### Authentication

- POST /login - Authenticate user and receive JWT

### Cases

- GET /cases - Fetch cases based on user role
- POST /create-case - Create a new investigative case (Admin only)
- PATCH /case/:id/status - Update case status
- GET /case-stats - Retrieve dashboard statistics

### Evidence & Timeline

- POST /case/:id/evidence - Upload evidence to a specific case
- PATCH /evidence/:id/verify - Verify uploaded evidence
- POST /case/:id/events - Add a custom timeline event

### Users & Members

- GET /users/search - Search system members by name, role, or region
- POST /users/create - Provision a new user account
- POST /users/:userId/reset-password - Force password reset for a user
