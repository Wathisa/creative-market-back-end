# 🎨 Creative Market — Human-Made Art Marketplace (Backend)

**Creative Market Backend** is a RESTful API service powering a digital marketplace dedicated 100% to human-made art. Built with Node.js + Express.js and connected to MongoDB, it handles all business logic for products, users, cart management, image uploads, and authentication — ensuring every transaction on the platform is backed by a fast, secure, and scalable API.

[![API Status](https://img.shields.io/badge/API%20Status-Live-brightgreen?style=for-the-badge&logo=render)](https://creative-market-back-end.onrender.com/)
[![Documentation](https://img.shields.io/badge/Project%20Docs-Google%20Docs-4285F4?style=for-the-badge&logo=googledocs&logoColor=white)](https://docs.google.com/document/d/1CdNxqwrQUCS4ei0iBF1PQaGILajpYmAmKfzmL8m9FXM/edit?tab=t.0)
[![Architecture](https://img.shields.io/badge/Architecture-Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white)](https://www.figma.com/board/knELaqlKa8ARUQofT0FwEE/Commit-no-Jutsu?node-id=480-986&t=c1UFc62fAUL5XE5Y-0)
[![Frontend Repo](https://img.shields.io/badge/Frontend%20Repo-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/AshaJenvasu/creative-market)

---

## 🧩 What This API Powers

The backend serves as the engine for a trust-first art marketplace where every listed item is guaranteed to be human-made. It exposes structured endpoints consumed by the React frontend to support:

- Full product lifecycle (create, browse, detail, upload)
- User authentication and session management
- Cart and order processing
- Artist content management
- Admin monitoring and oversight

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | JWT-based register, login, forgot/reset password flows |
| 🖼️ **Image Upload** | Multer + Cloudinary integration for artist artwork uploads |
| 🛒 **Cart & Orders** | RESTful endpoints for cart management and order processing |
| 🛡️ **Rate Limiting** | Middleware throttling to protect against API abuse |
| 🗂️ **MVC Architecture** | Clean separation of routes, controllers, and models |
| ⚙️ **Environment Config** | `.env`-based credential management for secure deployments |

---

## 🛠️ Tech Stack

| Technology | Role |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| MongoDB + Mongoose | NoSQL database with schema modeling |
| Multer | Multipart file upload handling |
| Cloudinary | Cloud-based image storage and delivery |
| JSON Web Token (JWT) | Stateless user authentication |
| Rate Limiting Middleware | API abuse protection |
| Nodemon | Auto-restart during development |
| REST Client (`.rest` files) | HTTP endpoint testing |
| Render | Backend deployment and hosting |

---

## 📁 Project Structure

```
backend/
├── controllers/        # Business logic per resource
├── models/             # Mongoose schemas (User, Product, Order, Cart)
├── routes/             # API endpoint definitions
├── middleware/         # Auth guard, rate limiter
├── utils/              # Helper functions (e.g. Cloudinary config)
├── .env                # Environment variables (not committed)
└── server.js           # Entry point
```

---

## 📄 Documentation

| Resource | Link |
|---|---|
| 📝 Project Documentation (Vision, Goals, Features) | [Google Docs](https://docs.google.com/document/d/1CdNxqwrQUCS4ei0iBF1PQaGILajpYmAmKfzmL8m9FXM/edit?tab=t.0) |
| 🗂️ Software Architecture & System Blueprint | [Figma Board](https://www.figma.com/board/knELaqlKa8ARUQofT0FwEE/Commit-no-Jutsu?node-id=480-986&t=c1UFc62fAUL5XE5Y-0) |
| 🌐 Live API | [creative-market-back-end.onrender.com](https://creative-market-back-end.onrender.com/) |
| 🖥️ Frontend Application | [creative-market-front-end-sprint-2-mu.vercel.app](https://creative-market-front-end-sprint-2-mu.vercel.app/) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Cloudinary account

### Installation

```bash
# Clone the repository
git clone https://github.com/AshaJenvasu/creative-market.git
cd creative-market/backend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in `/backend`:

```env
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_jwt_secret
PORT=7777
```

---

## 👥 The Team

This project was built in a Scrum environment across two sprints by a cross-functional team of six developers:

| GitHub | Role |
|---|---|
| [@lattawanksp](https://github.com/lattawanksp) | Team Member |
| [@Wathisa](https://github.com/Wathisa) | Team Member |
| [@AshaJenvasu](https://github.com/AshaJenvasu) | **Scrum Master** |
| [@devmontri-github](https://github.com/devmontri-github) | Team Member |
| [@jolynestarchaser](https://github.com/jolynestarchaser) | Team Member |
| [@billie89-33](https://github.com/billie89-33) | Team Member |

---

> *"Art is not what you see, but what you make others see."*
> — Every endpoint here exists to protect the human spirit behind every pixel. 🎨✨
