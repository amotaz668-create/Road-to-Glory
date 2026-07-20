# 🚀 Road to Glory

A secure and scalable **Event Management REST API** built with **Node.js**, **Express.js**, and **MongoDB**.

Road to Glory is a backend platform developed to manage official football events during Egypt's historic FIFA World Cup campaign. The platform provides secure APIs for attendees, organizers, and administrators to manage events, bookings, attendance, feedback, and reporting.

---

# 📖 Project Overview

Road to Glory is a centralized backend solution for managing official football events. It allows attendees to register, reserve tickets, attend events, and submit feedback, while organizers create and manage events, and administrators oversee the entire platform through secure RESTful APIs.

---

# ✨ Features

- 🔐 JWT Authentication
- 👤 User Roles Management
- 🎉 Event Management
- 🎟 Ticket Reservation
- 📅 Attendance Management
- 💬 Feedback & Reviews
- 📊 Reports & Analytics
- 🛡 Role-Based Authorization
- 🔑 Password Hashing (bcrypt)
- ✅ Input Validation
- ⚡ RESTful API
- 🏗 MVC Architecture

---

# 👥 User Roles

### 👤 Attendee

- Register & Login
- Browse Available Events
- Reserve Tickets
- View Reservation History
- Access Digital Tickets
- Submit Feedback

### 🏢 Organizer

- Create Events
- Update Events
- Delete Events
- View Assigned Events
- Validate Tickets
- Manage Attendees
- View Event Performance

### 👑 Administrator

- Manage Users
- Approve Organizers
- Override Events
- Monitor Platform Activity
- View Reports & Analytics

---

# 🛠 Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Validator
- Dotenv
- Cors
- Nodemon

---

# 📂 Project Structure

```text
Road-to-Glory
│
├── config/
├── controllers/
├── middlewares/
├── models/
├── routes/
├── utils/
├── package.json
├── .env.example
└── index.js
```

---

# ⚙ Installation

Clone the repository

```bash
git clone https://github.com/OmarCoder9/Road-to-Glory.git
```

Move to the project directory

```bash
cd Road-to-Glory
```

Install dependencies

```bash
npm install
```

Create your environment file

```bash
cp .env.example .env
```

Configure the required environment variables.

Start the development server

```bash
npm run dev
```

---

# 🔑 Environment Variables

```env
PORT=3000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET_KEY=your_secret_key
```

---

# 🌐 Base URL

```text
http://localhost:3000/api
```

---

# 📡 API Endpoints

## 🔐 Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and receive JWT token |

---

## 👤 Attendee APIs

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/attendee/events` | Public | Browse available events |
| POST | `/api/attendee/events/:eventId/reserve` | Attendee | Reserve a ticket |
| GET | `/api/attendee/reservations` | Attendee | View reservation history |
| GET | `/api/attendee/tickets` | Attendee | View issued tickets |
| DELETE | `/api/attendee/reservations/:reservationId` | Attendee | Cancel reservation |
| POST | `/api/attendee/feedback` | Attendee | Submit event feedback |

---

## 🏢 Organizer APIs

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/organizer/events` | Organizer / Admin | Create a new event |
| GET | `/api/organizer/events` | Organizer / Admin | Get assigned events |
| GET | `/api/organizer/events/:eventId` | Organizer / Admin | Get event details |
| PATCH | `/api/organizer/events/:eventId` | Organizer / Admin | Update event |
| DELETE | `/api/organizer/events/:eventId` | Organizer / Admin | Delete event |
| GET | `/api/organizer/performance` | Organizer / Admin | View event performance |
| POST | `/api/organizer/tickets/validate` | Organizer / Admin | Validate attendee ticket |
| GET | `/api/organizer/:eventId` | Organizer / Admin | Get registrations for an event |
| PATCH | `/api/organizer/:eventId` | Organizer / Admin | Update registration status |
| GET | `/api/organizer/` | Organizer / Admin | Get all attendees |
| PATCH | `/api/organizer/` | Organizer / Admin | Update attendee reservation |

---

## 👑 Administrator APIs

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/admin/users` | Admin | Get all users |
| PATCH | `/api/admin/users` | Admin | Change user status |
| GET | `/api/admin/organizers/pending` | Admin | Get pending organizers |
| PATCH | `/api/admin/organizers/approve/:organizerId` | Admin | Approve organizer |
| PATCH | `/api/admin/events/override/:eventId` | Admin | Override any event |
| GET | `/api/admin/analytics` | Admin | View platform analytics |

---

# 🔒 Authorization

| Role | Permissions |
|------|-------------|
| Public | Register, Login, Browse Events |
| Attendee | Reserve tickets, View reservations, View tickets, Cancel reservations, Submit feedback |
| Organizer | Create, Update, Delete events, Manage attendees, Validate tickets, View performance |
| Admin | Full system access including users, organizers, events, analytics, and reports |

---

# 📌 Main Modules

- Authentication & User Management
- Event Management
- Ticket Reservation
- Attendance Management
- Feedback System
- Organizer Management
- Reports & Analytics

---

# 🔒 Security

- JWT Authentication
- Password Hashing using bcrypt
- Protected Routes
- Role-Based Authorization
- Request Validation
- Secure REST API Design

---

# 🏗 Architecture

The project follows the **MVC (Model–View–Controller)** architecture.

```text
Client
   │
Routes
   │
Controllers
   │
Models
   │
MongoDB
```

---

# 🚀 Future Improvements

- Email Verification
- Forgot Password
- Refresh Tokens
- Image Upload
- Payment Integration
- Swagger API Documentation
- Unit Testing
- Docker Support

---

