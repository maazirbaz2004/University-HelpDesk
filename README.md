# SmartResolve - University Helpdesk System

SmartResolve is a comprehensive, role-based helpdesk application designed for universities to streamline the management and resolution of student complaints. The platform provides dedicated portals for Administrators, Staff, and Students, ensuring efficient communication, incident tracking, and resolution workflows.

## Features

### Role-Based Access Control
- **Student Portal**: Submit new complaints, track the status of existing complaints, request reopens, and provide feedback on resolved issues.
- **Staff Portal**: View and manage assigned complaints, update complaint statuses, and review student feedback.
- **Admin Portal**: Complete oversight of the system. Manage complaints, users (staff and students), and departments. View analytics and handle escalation requests.

### Core Functionalities
- **Complaint Management**: Complete lifecycle tracking from submission to resolution.
- **Major Incident Clustering**: Admins can mark specific issues as "Major Incidents" and cluster related complaints under them. Resolving the parent incident automatically resolves all linked child complaints.
- **Automated Notifications**: Database-driven notification system alerts users of status changes, assignments, and new feedback.
- **History Tracking**: Detailed audit trail for every complaint, recording status changes, assignments, and remarks.
- **Department Reporting**: Analytics and reporting on department performance, resolution rates, and staff analytics.
- **Feedback System**: Students can rate and review the resolution of their complaints.

## Tech Stack

### Frontend
- **React.js**: User interface and component architecture.
- **Tailwind CSS**: Modern, responsive, and glassmorphic UI styling.
- **React Router**: Client-side routing.
- **Axios**: HTTP client for API requests.

### Backend
- **Node.js & Express.js**: RESTful API server.
- **JSON Web Tokens (JWT)**: Secure authentication and session management.
- **SQL Server**: Relational database backend.
- **Tedious & msnodesqlv8**: SQL Server driver for Node.js.

## Project Structure

```text
├── backend/               # Node.js Express server
│   ├── db.js              # Database connection, queries, and procedures mapping
│   ├── server.js          # Express app and RESTful API routes
│   └── package.json       # Backend dependencies
├── frontend/              # React frontend application
│   ├── src/               # React components, pages, and assets
│   ├── public/            # Static files
│   ├── tailwind.config.js # Tailwind CSS configuration
│   └── package.json       # Frontend dependencies
├── Database.sql           # Complete SQL Server database schema, procedures, and triggers
└── README.md              # Project documentation
```

## Setup & Installation

### Prerequisites
- Node.js (v14 or higher recommended)
- SQL Server (Local or Remote)

### Database Setup
1. Open SQL Server Management Studio (SSMS) or Azure Data Studio.
2. Execute the `Database.sql` script to create the `UniversityHelpdeskDB` database, tables, stored procedures, and triggers.

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory and configure necessary environment variables:
   ```env
   JWT_SECRET=your_secret_key_here
   ```
4. Start the backend server (runs on `http://localhost:5000`):
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server (runs on `http://localhost:3000`):
   ```bash
   npm start
   ```

## Usage
- The React frontend will be available at `http://localhost:3000`.
- The backend API runs on `http://localhost:5000` (requests from the frontend are proxied to this port).
- Ensure both the backend and frontend servers are running concurrently for full functionality.
