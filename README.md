About SwagGold – Jewellery E-Commerce Platform

SwagGold is a full-stack jewellery e-commerce platform built using React + TypeScript, Flask (Python), and MongoDB.
The system includes:

🛍️ Customer Storefront with product browsing, filters, search, and collections

🔐 User Authentication (Register, Login, Forgot Password)

🛒 Advanced Cart & Checkout

💳 Payments Integration (UPI & Card/Wallet)

🛠️ Admin Management Panel (Products, Categories, Orders)

📈 Live Gold Price Tracking

🤖 AI/ML Model to predict gold rates year-by-year

⚡ Fully responsive UI designed for a premium jewellery experience

🚀 How to Run the Project (Development Setup)

Follow the steps below to run both backend and frontend:

🟣 1️⃣ Start the Backend (Flask + MongoDB)
cd backend
python run.py


This will:

Start the Flask backend

Connect to MongoDB

Enable API routes for products, users, orders, payments, and admin

Serve AI model prediction endpoints

🟡 2️⃣ Start the Frontend (React + TypeScript)
cd frontend
npm install
npm run dev


This will:

Launch the React client

Connect the UI with backend APIs

Run the platform at:
➤ http://localhost:5173/
 (or whichever port Vite assigns)

📦 Project Structure
swaggold-ecommerce-platform/
│── backend/        # Flask backend + ML model + APIs
│── frontend/       # React + TypeScript UI
│── .vscode/        # Editor configuration
│── .python-version # Python version info

📌 Tech Stack
Frontend

React + TypeScript

Vite

Context API / Redux (if applicable)

TailwindCSS / Custom CSS

Backend

Flask (Python)

MongoDB

ML Model (Predictive Analytics)

Payments

Razorpay UPI

Braintree Wallet/Card

🎯 Project Highlights

Complete jewellery e-commerce workflow

Admin dashboard for real-time management

Clean code architecture (frontend + backend separated)

AI-powered gold prediction

Optimized UI for jewellery brands
