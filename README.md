🟡 SwagGold – Jewellery E-Commerce Platform (Full-Stack MERN + Flask + MongoDB)

SwagGold is a full-stack premium jewellery e-commerce platform built with React + TypeScript (Frontend), Flask (Backend), and MongoDB (Database).
This platform is designed to provide a luxury online shopping experience inspired by real jewellery brands.

It includes a complete admin panel, secure checkout, live gold price tracking, and even an AI/ML model that predicts yearly gold rates.

✨ Key Features
🛍️ Customer Storefront

Modern UI with a gold-theme aesthetic

Browse by categories, filters & sorting

Product previews with multiple images

Wishlist & responsive quick add

🔐 Authentication

User registration & login

Forgot Password & OTP verification

Profile dashboard & address management

🛒 Cart + Checkout

Add / Remove items

Auto price calculation

Save address & update address

Order confirmation page

💳 Online Payments

UPI (Razorpay)

Card & Wallet (Braintree)

🛠️ Admin Panel

Create / Edit / Delete categories

Add new products with images

Manage orders

Add product details + pricing

🤖 AI/ML Model

Predicts gold rate per year

Uses historical data + ML regression

Fetchable via API

🟡 Live Gold Price Tracking

Real-time gold price updates

Integrated into backend

🧰 Tech Stack
Frontend

React + TypeScript

Vite

TailwindCSS / Custom UI

Axios (API calls)

Backend

Flask (Python)

MongoDB

ML Model (Gold Price Prediction)

REST APIs

Payments

Razorpay UPI Gateway

Braintree Card/Wallet Gateway

🚀 How to Run the Project

Follow these steps to run the backend and frontend.

1️⃣ Start the Backend (Flask API)
cd backend
python run.py


This will start:

Flask server

Database connection

API routes (Products, Auth, Cart, Orders, ML, Gold Rates)

Backend runs at → http://localhost:5000

2️⃣ Start the Frontend (React + TypeScript)
cd frontend
npm install
npm run dev


Frontend runs at → http://localhost:5173

📂 Project Structure
swaggold-ecommerce-platform/
│
├── backend/              # Flask backend + ML model + Gold rate module
├── frontend/             # React + TypeScript frontend
├── .vscode/              # Editor settings
├── .python-version       # Backend python version indicator
└── README.md

📌 Future Enhancements

Admin revenue analytics dashboard

SEO optimization

PWA mobile application

Automated ML model retraining

👨‍💻 Developer

Shivam Kumar Jha
Email: shivamjhamay2002@gmail.com
