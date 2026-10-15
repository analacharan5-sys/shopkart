# ShopKart 🛒

A full-stack modern e-commerce web application built using the MERN stack (MongoDB, Express, React, Node.js) with Vite and Razorpay payment integration.

---

## 🚀 Features

- **Authentication & Authorization**: Secure customer signup, login, and JWT-based session management with cookie parsing.
- **Product Catalog & Details**: Browse products with categories, search, filtering, ratings, and stock status.
- **Cart & Wishlist**: Manage items, quantity adjustments, and persistent cart/wishlist state.
- **Checkout & Payments**: Seamless Razorpay payment gateway integration for secure order placement.
- **Order Tracking**: Detailed order history, item breakdowns, and delivery tracking.
- **Modern UI**: Fast, responsive React frontend powered by Vite and Lucide React icons.

---

## 📁 Project Architecture

```
shopkart/
├── backend/                # Express & Node.js REST API
│   ├── config/             # Database connection & configurations
│   ├── controllers/        # Route controllers
│   ├── data/               # Seed data & product lists
│   ├── middlewares/        # Auth and error handling middlewares
│   ├── models/             # Mongoose schemas (User, Product, Order, Cart, etc.)
│   ├── routes/             # API routes
│   ├── utils/              # Helper utilities
│   ├── index.js            # Backend server entry point
│   ├── package.json
│   └── .env.example        # Environment variable template
├── frontend/               # React + Vite client
│   ├── src/                # Components, pages, hooks, contexts, and styles
│   ├── public/             # Static assets
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)

---

### 1. Backend Setup

1. Open a terminal and navigate to `backend`:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```
   Variables required:
   ```env
   PORT=5001
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```

4. Seed the database (optional):
   ```bash
   node seedProducts.js
   ```

5. Run the backend server:
   ```bash
   npm run dev
   ```
   The backend server runs on `http://localhost:5001`.

---

### 2. Frontend Setup

1. In a new terminal, navigate to `frontend`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   Open the browser at the local URL provided by Vite (typically `http://localhost:5173`).

---

## 📜 License

This project is licensed under the MIT License.
