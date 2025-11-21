# Design Document

## Overview

The Swati Jewellers platform will be redesigned as a modern full-stack application with a Flask REST API backend, MongoDB database, React/TypeScript frontend, and integrated Machine Learning capabilities for price prediction. The architecture follows a three-tier pattern: presentation layer (React SPA), application layer (Flask API), and data layer (MongoDB + ML models).

### Technology Stack

**Backend:**
- Flask 3.0+ (Python web framework)
- Flask-CORS (Cross-origin resource sharing)
- Flask-JWT-Extended (Authentication)
- PyMongo 4.0+ (MongoDB driver)
- Mongoengine (ODM for MongoDB)
- Scikit-learn (ML models)
- Pandas & NumPy (Data processing)
- Flask-RESTful (REST API utilities)

**Frontend:**
- React 18+ with TypeScript
- React Router v7 (Routing)
- Axios (HTTP client)
- Recharts (Data visualization)
- Tailwind CSS (Styling)
- Lucide React (Icons)

**Database:**
- MongoDB 6.0+ (Primary database)

**ML/Data Science:**
- Scikit-learn (Regression models)
- Pandas (Data manipulation)
- NumPy (Numerical computing)
- Joblib (Model serialization)


## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         React/TypeScript Frontend (SPA)              │  │
│  │  - Product Catalog UI                                │  │
│  │  - Price Prediction Dashboard                        │  │
│  │  - Admin Dashboard                                   │  │
│  │  - Khata Management UI                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │ (JSON)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Flask Backend Server                      │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Products   │  │   Customers  │  │   Predictions   │  │
│  │   Blueprint  │  │   Blueprint  │  │   Blueprint     │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │    Sales     │  │     Khata    │  │      Auth       │  │
│  │   Blueprint  │  │   Blueprint  │  │   Blueprint     │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         ML Service Layer                            │  │
│  │  - Gold Price Predictor                             │  │
│  │  - Diamond Price Predictor                          │  │
│  │  - Model Training Pipeline                          │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ PyMongo/Mongoengine
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      MongoDB Database                       │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ products │ │customers │ │  sales   │ │khata_trans   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │price_hist│ │  users   │ │  models  │ │training_logs │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
project-root/
├── backend/                      # Flask backend
│   ├── app/
│   │   ├── __init__.py          # Flask app factory
│   │   ├── config.py            # Configuration classes
│   │   ├── models/              # Mongoengine models
│   │   │   ├── __init__.py
│   │   │   ├── product.py
│   │   │   ├── customer.py
│   │   │   ├── sale.py
│   │   │   ├── khata.py
│   │   │   └── price_history.py
│   │   ├── routes/              # Flask blueprints
│   │   │   ├── __init__.py
│   │   │   ├── products.py
│   │   │   ├── customers.py
│   │   │   ├── sales.py
│   │   │   ├── khata.py
│   │   │   ├── predictions.py
│   │   │   └── auth.py
│   │   ├── services/            # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── product_service.py
│   │   │   ├── khata_service.py
│   │   │   └── ml_service.py
│   │   ├── ml/                  # ML models and training
│   │   │   ├── __init__.py
│   │   │   ├── gold_predictor.py
│   │   │   ├── diamond_predictor.py
│   │   │   ├── train.py
│   │   │   └── utils.py
│   │   └── utils/               # Utilities
│   │       ├── __init__.py
│   │       ├── validators.py
│   │       └── decorators.py
│   ├── models/                  # Saved ML models
│   │   ├── gold_model.pkl
│   │   └── diamond_model.pkl
│   ├── data/                    # Training data
│   │   ├── gold_prices.csv
│   │   └── diamond_prices.csv
│   ├── requirements.txt
│   ├── run.py                   # Application entry point
│   └── .env                     # Environment variables
│
├── src/                         # React frontend (existing)
│   ├── components/
│   │   ├── predictions/         # New prediction components
│   │   │   ├── GoldPredictor.tsx
│   │   │   ├── DiamondPredictor.tsx
│   │   │   └── PriceChart.tsx
│   │   └── ...
│   ├── pages/
│   │   ├── Predictions.tsx      # New predictions page
│   │   └── ...
│   ├── services/                # API client
│   │   ├── api.ts
│   │   ├── productService.ts
│   │   ├── predictionService.ts
│   │   └── authService.ts
│   ├── context/                 # React context
│   │   └── AuthContext.tsx
│   └── ...
│
└── ...
```


## Components and Interfaces

### Backend Components

#### 1. Flask Application Factory (`app/__init__.py`)

```python
def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    CORS(app)
    JWTManager(app)
    connect(host=app.config['MONGODB_URI'])
    
    # Register blueprints
    from app.routes import products, customers, sales, khata, predictions, auth
    app.register_blueprint(products.bp, url_prefix='/api/products')
    app.register_blueprint(customers.bp, url_prefix='/api/customers')
    app.register_blueprint(sales.bp, url_prefix='/api/sales')
    app.register_blueprint(khata.bp, url_prefix='/api/khata')
    app.register_blueprint(predictions.bp, url_prefix='/api/predictions')
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    
    return app
```

#### 2. Product Blueprint (`routes/products.py`)

**Endpoints:**
- `GET /api/products` - List products with pagination and filters
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Soft delete product (admin only)

**Request/Response Examples:**

```json
// POST /api/products
{
  "name": "Traditional Gold Nath Set",
  "category": "Nath",
  "base_price": 120000,
  "weight": 4.110,
  "gold_purity": "916",
  "description": "Handcrafted traditional nath set",
  "image_url": "https://example.com/image.jpg",
  "stock_quantity": 5
}

// Response
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Traditional Gold Nath Set",
    "category": "Nath",
    "base_price": 120000,
    "current_price": 125400,  // Calculated with current gold rate
    "weight": 4.110,
    "gold_purity": "916",
    "description": "Handcrafted traditional nath set",
    "image_url": "https://example.com/image.jpg",
    "stock_quantity": 5,
    "is_active": true,
    "created_at": "2025-11-14T10:30:00Z"
  }
}
```

#### 3. Predictions Blueprint (`routes/predictions.py`)

**Endpoints:**
- `POST /api/predictions/gold` - Predict gold price
- `POST /api/predictions/diamond` - Predict diamond price
- `GET /api/predictions/trends` - Get price trends
- `POST /api/predictions/retrain` - Trigger model retraining (admin only)

**Request/Response Examples:**

```json
// POST /api/predictions/gold
{
  "date": "2025-12-01",
  "weight_grams": 10
}

// Response
{
  "success": true,
  "data": {
    "date": "2025-12-01",
    "predicted_price_per_gram": 6850,
    "total_price": 68500,
    "confidence_interval": {
      "lower": 6720,
      "upper": 6980
    },
    "model_accuracy": 0.94,
    "last_trained": "2025-11-10T08:00:00Z"
  }
}

// POST /api/predictions/diamond
{
  "carat": 1.5,
  "cut": "Ideal",
  "color": "E",
  "clarity": "VS1"
}

// Response
{
  "success": true,
  "data": {
    "predicted_price": 450000,
    "confidence_interval": {
      "lower": 425000,
      "upper": 475000
    },
    "features_used": {
      "carat": 1.5,
      "cut": "Ideal",
      "color": "E",
      "clarity": "VS1"
    },
    "model_accuracy": 0.91
  }
}
```

#### 4. Khata Blueprint (`routes/khata.py`)

**Endpoints:**
- `POST /api/khata/transactions` - Create transaction
- `GET /api/customers/:id/khata` - Get customer khata
- `GET /api/khata/summary` - Get overall summary

**Request/Response Examples:**

```json
// POST /api/khata/transactions
{
  "customer_id": "507f1f77bcf86cd799439011",
  "transaction_type": "credit",  // or "debit"
  "amount": 50000,
  "description": "Payment for gold necklace",
  "payment_method": "cash"
}

// Response
{
  "success": true,
  "data": {
    "transaction_id": "507f1f77bcf86cd799439012",
    "customer_id": "507f1f77bcf86cd799439011",
    "transaction_type": "credit",
    "amount": 50000,
    "balance_after": 70000,
    "description": "Payment for gold necklace",
    "created_at": "2025-11-14T10:30:00Z"
  }
}
```

### Frontend Components

#### 1. API Service Layer (`services/api.ts`)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

#### 2. Prediction Service (`services/predictionService.ts`)

```typescript
import api from './api';

export interface GoldPredictionRequest {
  date: string;
  weight_grams?: number;
}

export interface DiamondPredictionRequest {
  carat: number;
  cut: string;
  color: string;
  clarity: string;
}

export const predictionService = {
  predictGoldPrice: async (data: GoldPredictionRequest) => {
    const response = await api.post('/predictions/gold', data);
    return response.data;
  },

  predictDiamondPrice: async (data: DiamondPredictionRequest) => {
    const response = await api.post('/predictions/diamond', data);
    return response.data;
  },

  getPriceTrends: async (days: number = 30) => {
    const response = await api.get(`/predictions/trends?days=${days}`);
    return response.data;
  },
};
```

#### 3. Gold Predictor Component (`components/predictions/GoldPredictor.tsx`)

```typescript
interface GoldPredictorProps {
  onPredictionComplete?: (result: any) => void;
}

export const GoldPredictor: React.FC<GoldPredictorProps> = ({ 
  onPredictionComplete 
}) => {
  const [date, setDate] = useState('');
  const [weight, setWeight] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const prediction = await predictionService.predictGoldPrice({
        date,
        weight_grams: weight,
      });
      setResult(prediction.data);
      onPredictionComplete?.(prediction.data);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    // Component JSX
  );
};
```

#### 4. Price Chart Component (`components/predictions/PriceChart.tsx`)

Uses Recharts library to display:
- Historical price data (line chart)
- Predicted prices with confidence intervals (area chart)
- Moving averages (multiple lines)
- Interactive tooltips and zoom


## Data Models

### MongoDB Collections

#### 1. Products Collection

```python
from mongoengine import Document, StringField, FloatField, IntField, BooleanField, DateTimeField

class Product(Document):
    name = StringField(required=True, max_length=200)
    category = StringField(required=True, choices=[
        'Nath', 'Pendant Set', 'Tika', 'Necklace', 'Earrings', 
        'Bangles', 'Ring', 'Bracelet', 'Bridal Set'
    ])
    base_price = FloatField(required=True, min_value=0)
    weight = FloatField(required=True, min_value=0)  # in grams
    gold_purity = StringField(choices=['916', '750', '585'], default='916')
    description = StringField()
    image_url = StringField()
    stock_quantity = IntField(default=0, min_value=0)
    is_active = BooleanField(default=True)
    created_at = DateTimeField()
    updated_at = DateTimeField()
    
    meta = {
        'collection': 'products',
        'indexes': [
            'category',
            'is_active',
            {'fields': ['base_price']},
            {'fields': ['weight']}
        ]
    }
    
    def calculate_current_price(self):
        """Calculate price based on current gold rate"""
        current_gold_rate = self.get_current_gold_rate()
        gold_value = self.weight * current_gold_rate
        making_charges = gold_value * 0.15  # 15% making charges
        return gold_value + making_charges
```

#### 2. Customers Collection

```python
class Customer(Document):
    name = StringField(required=True, max_length=200)
    phone = StringField(required=True, unique=True, max_length=15)
    email = StringField(max_length=200)
    address = StringField()
    current_balance = FloatField(default=0.0)  # Positive = customer owes, Negative = store owes
    created_at = DateTimeField()
    updated_at = DateTimeField()
    
    meta = {
        'collection': 'customers',
        'indexes': [
            'phone',
            'email',
            {'fields': ['current_balance']}
        ]
    }
```

#### 3. Khata Transactions Collection

```python
class KhataTransaction(Document):
    customer = ReferenceField(Customer, required=True)
    transaction_type = StringField(required=True, choices=['credit', 'debit'])
    amount = FloatField(required=True, min_value=0)
    balance_after = FloatField(required=True)
    description = StringField()
    payment_method = StringField(choices=['cash', 'upi', 'card', 'cheque'])
    reference_number = StringField()
    created_at = DateTimeField()
    created_by = StringField()  # Admin user who created the transaction
    
    meta = {
        'collection': 'khata_transactions',
        'indexes': [
            'customer',
            'created_at',
            'transaction_type'
        ]
    }
```

#### 4. Sales Collection

```python
class Sale(Document):
    customer = ReferenceField(Customer, required=True)
    products = ListField(DictField())  # [{product_id, quantity, price_at_sale}]
    total_amount = FloatField(required=True, min_value=0)
    discount = FloatField(default=0.0, min_value=0)
    final_amount = FloatField(required=True, min_value=0)
    payment_status = StringField(choices=['paid', 'partial', 'pending'], default='pending')
    payment_method = StringField(choices=['cash', 'upi', 'card', 'cheque', 'khata'])
    notes = StringField()
    created_at = DateTimeField()
    created_by = StringField()
    
    meta = {
        'collection': 'sales',
        'indexes': [
            'customer',
            'created_at',
            'payment_status'
        ]
    }
```

#### 5. Price History Collection

```python
class PriceHistory(Document):
    metal_type = StringField(required=True, choices=['gold', 'silver', 'platinum'])
    purity = StringField()  # e.g., '916', '999'
    price_per_gram = FloatField(required=True, min_value=0)
    date = DateTimeField(required=True)
    source = StringField()  # e.g., 'manual', 'api', 'market_data'
    currency = StringField(default='INR')
    
    meta = {
        'collection': 'price_history',
        'indexes': [
            {'fields': ['metal_type', 'date']},
            'date'
        ]
    }
```

#### 6. Diamond Price History Collection

```python
class DiamondPriceHistory(Document):
    carat = FloatField(required=True, min_value=0)
    cut = StringField(required=True, choices=['Ideal', 'Excellent', 'Very Good', 'Good', 'Fair'])
    color = StringField(required=True, choices=['D', 'E', 'F', 'G', 'H', 'I', 'J'])
    clarity = StringField(required=True, choices=['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'])
    price = FloatField(required=True, min_value=0)
    date = DateTimeField(required=True)
    source = StringField()
    
    meta = {
        'collection': 'diamond_price_history',
        'indexes': [
            'date',
            {'fields': ['carat', 'cut', 'color', 'clarity']}
        ]
    }
```

#### 7. Users Collection (Admin Authentication)

```python
from werkzeug.security import generate_password_hash, check_password_hash

class User(Document):
    username = StringField(required=True, unique=True, max_length=80)
    email = StringField(required=True, unique=True, max_length=200)
    password_hash = StringField(required=True)
    role = StringField(choices=['admin', 'staff'], default='staff')
    is_active = BooleanField(default=True)
    created_at = DateTimeField()
    last_login = DateTimeField()
    
    meta = {
        'collection': 'users',
        'indexes': ['username', 'email']
    }
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
```

### TypeScript Interfaces (Frontend)

```typescript
// Product interface
export interface Product {
  id: string;
  name: string;
  category: string;
  base_price: number;
  current_price: number;
  weight: number;
  gold_purity: string;
  description: string;
  image_url: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
}

// Customer interface
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  current_balance: number;
  created_at: string;
}

// Khata Transaction interface
export interface KhataTransaction {
  id: string;
  customer_id: string;
  transaction_type: 'credit' | 'debit';
  amount: number;
  balance_after: number;
  description?: string;
  payment_method?: string;
  created_at: string;
}

// Prediction Result interfaces
export interface GoldPrediction {
  date: string;
  predicted_price_per_gram: number;
  total_price: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  model_accuracy: number;
}

export interface DiamondPrediction {
  predicted_price: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  features_used: {
    carat: number;
    cut: string;
    color: string;
    clarity: string;
  };
  model_accuracy: number;
}
```


## Machine Learning Models

### 1. Gold Price Prediction Model

**Algorithm:** Time Series Forecasting using Linear Regression with feature engineering

**Features:**
- Historical price data (30-90 days)
- Day of week
- Month
- Moving averages (7-day, 30-day)
- Price momentum indicators
- Seasonal decomposition components

**Implementation:**

```python
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import pandas as pd
import numpy as np

class GoldPricePredictor:
    def __init__(self):
        self.model = LinearRegression()
        self.scaler = StandardScaler()
        self.is_trained = False
    
    def prepare_features(self, df):
        """Prepare features from historical price data"""
        df = df.copy()
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Time-based features
        df['day_of_week'] = df['date'].dt.dayofweek
        df['month'] = df['date'].dt.month
        df['day_of_month'] = df['date'].dt.day
        
        # Moving averages
        df['ma_7'] = df['price_per_gram'].rolling(window=7).mean()
        df['ma_30'] = df['price_per_gram'].rolling(window=30).mean()
        
        # Price momentum
        df['price_change'] = df['price_per_gram'].diff()
        df['price_change_pct'] = df['price_per_gram'].pct_change()
        
        # Lag features
        df['price_lag_1'] = df['price_per_gram'].shift(1)
        df['price_lag_7'] = df['price_per_gram'].shift(7)
        
        df = df.dropna()
        return df
    
    def train(self, historical_data):
        """Train the model on historical data"""
        df = self.prepare_features(historical_data)
        
        feature_cols = [
            'day_of_week', 'month', 'day_of_month',
            'ma_7', 'ma_30', 'price_change', 'price_change_pct',
            'price_lag_1', 'price_lag_7'
        ]
        
        X = df[feature_cols].values
        y = df['price_per_gram'].values
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model.fit(X_scaled, y)
        self.is_trained = True
        
        # Calculate metrics
        train_score = self.model.score(X_scaled, y)
        return {'r2_score': train_score}
    
    def predict(self, target_date, recent_data):
        """Predict gold price for a future date"""
        if not self.is_trained:
            raise ValueError("Model not trained")
        
        # Prepare features for prediction
        features = self._prepare_prediction_features(target_date, recent_data)
        features_scaled = self.scaler.transform(features)
        
        # Make prediction
        prediction = self.model.predict(features_scaled)[0]
        
        # Calculate confidence interval (simplified)
        std_error = np.std(recent_data['price_per_gram']) * 0.05
        confidence_interval = {
            'lower': prediction - 1.96 * std_error,
            'upper': prediction + 1.96 * std_error
        }
        
        return {
            'predicted_price': prediction,
            'confidence_interval': confidence_interval
        }
```

### 2. Diamond Price Prediction Model

**Algorithm:** Random Forest Regression

**Features:**
- Carat (weight)
- Cut quality (encoded)
- Color grade (encoded)
- Clarity grade (encoded)

**Implementation:**

```python
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder

class DiamondPricePredictor:
    def __init__(self):
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.encoders = {
            'cut': LabelEncoder(),
            'color': LabelEncoder(),
            'clarity': LabelEncoder()
        }
        self.is_trained = False
    
    def prepare_features(self, df):
        """Encode categorical features"""
        df = df.copy()
        
        # Encode categorical variables
        df['cut_encoded'] = self.encoders['cut'].fit_transform(df['cut'])
        df['color_encoded'] = self.encoders['color'].fit_transform(df['color'])
        df['clarity_encoded'] = self.encoders['clarity'].fit_transform(df['clarity'])
        
        return df
    
    def train(self, historical_data):
        """Train the model on historical diamond data"""
        df = self.prepare_features(historical_data)
        
        feature_cols = ['carat', 'cut_encoded', 'color_encoded', 'clarity_encoded']
        X = df[feature_cols].values
        y = df['price'].values
        
        # Train model
        self.model.fit(X, y)
        self.is_trained = True
        
        # Calculate metrics
        train_score = self.model.score(X, y)
        return {'r2_score': train_score}
    
    def predict(self, carat, cut, color, clarity):
        """Predict diamond price based on 4Cs"""
        if not self.is_trained:
            raise ValueError("Model not trained")
        
        # Encode features
        cut_encoded = self.encoders['cut'].transform([cut])[0]
        color_encoded = self.encoders['color'].transform([color])[0]
        clarity_encoded = self.encoders['clarity'].transform([clarity])[0]
        
        features = np.array([[carat, cut_encoded, color_encoded, clarity_encoded]])
        
        # Make prediction
        prediction = self.model.predict(features)[0]
        
        # Estimate confidence interval using tree predictions
        tree_predictions = [tree.predict(features)[0] for tree in self.model.estimators_]
        std_error = np.std(tree_predictions)
        
        confidence_interval = {
            'lower': prediction - 1.96 * std_error,
            'upper': prediction + 1.96 * std_error
        }
        
        return {
            'predicted_price': prediction,
            'confidence_interval': confidence_interval
        }
```

### 3. Model Training Pipeline

**Training Script (`ml/train.py`):**

```python
import joblib
from datetime import datetime
from app.models import PriceHistory, DiamondPriceHistory, TrainingLog
from app.ml.gold_predictor import GoldPricePredictor
from app.ml.diamond_predictor import DiamondPricePredictor

def train_gold_model():
    """Train gold price prediction model"""
    # Fetch historical data from MongoDB
    price_data = PriceHistory.objects(metal_type='gold').order_by('date')
    
    # Convert to DataFrame
    df = pd.DataFrame([{
        'date': p.date,
        'price_per_gram': p.price_per_gram
    } for p in price_data])
    
    # Train model
    predictor = GoldPricePredictor()
    metrics = predictor.train(df)
    
    # Save model
    joblib.dump(predictor, 'models/gold_model.pkl')
    
    # Log training
    TrainingLog(
        model_name='gold_predictor',
        metrics=metrics,
        trained_at=datetime.utcnow(),
        data_points=len(df)
    ).save()
    
    return metrics

def train_diamond_model():
    """Train diamond price prediction model"""
    # Fetch historical data
    diamond_data = DiamondPriceHistory.objects()
    
    # Convert to DataFrame
    df = pd.DataFrame([{
        'carat': d.carat,
        'cut': d.cut,
        'color': d.color,
        'clarity': d.clarity,
        'price': d.price
    } for d in diamond_data])
    
    # Train model
    predictor = DiamondPricePredictor()
    metrics = predictor.train(df)
    
    # Save model
    joblib.dump(predictor, 'models/diamond_model.pkl')
    
    # Log training
    TrainingLog(
        model_name='diamond_predictor',
        metrics=metrics,
        trained_at=datetime.utcnow(),
        data_points=len(df)
    ).save()
    
    return metrics
```

**Model Loading Service:**

```python
import joblib
import os

class MLService:
    def __init__(self):
        self.gold_model = None
        self.diamond_model = None
        self.load_models()
    
    def load_models(self):
        """Load trained models from disk"""
        gold_model_path = 'models/gold_model.pkl'
        diamond_model_path = 'models/diamond_model.pkl'
        
        if os.path.exists(gold_model_path):
            self.gold_model = joblib.load(gold_model_path)
        
        if os.path.exists(diamond_model_path):
            self.diamond_model = joblib.load(diamond_model_path)
    
    def predict_gold_price(self, target_date, recent_data):
        if not self.gold_model:
            raise ValueError("Gold model not loaded")
        return self.gold_model.predict(target_date, recent_data)
    
    def predict_diamond_price(self, carat, cut, color, clarity):
        if not self.diamond_model:
            raise ValueError("Diamond model not loaded")
        return self.diamond_model.predict(carat, cut, color, clarity)
```


## Error Handling

### Backend Error Handling

**Global Error Handler:**

```python
from flask import jsonify
from werkzeug.exceptions import HTTPException

@app.errorhandler(Exception)
def handle_error(error):
    """Global error handler"""
    if isinstance(error, HTTPException):
        response = {
            'success': False,
            'error': {
                'code': error.code,
                'message': error.description
            }
        }
        return jsonify(response), error.code
    
    # Log unexpected errors
    app.logger.error(f'Unexpected error: {str(error)}', exc_info=True)
    
    response = {
        'success': False,
        'error': {
            'code': 500,
            'message': 'An unexpected error occurred'
        }
    }
    return jsonify(response), 500

@app.errorhandler(ValidationError)
def handle_validation_error(error):
    """Handle mongoengine validation errors"""
    response = {
        'success': False,
        'error': {
            'code': 400,
            'message': 'Validation error',
            'details': error.to_dict()
        }
    }
    return jsonify(response), 400
```

**Custom Exceptions:**

```python
class APIException(Exception):
    """Base API exception"""
    status_code = 400
    
    def __init__(self, message, status_code=None, payload=None):
        super().__init__()
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload
    
    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv

class ResourceNotFoundError(APIException):
    status_code = 404

class UnauthorizedError(APIException):
    status_code = 401

class ModelNotTrainedError(APIException):
    status_code = 503
    
    def __init__(self):
        super().__init__('ML model not trained. Please train the model first.')
```

### Frontend Error Handling

**Error Boundary Component:**

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

**API Error Handler:**

```typescript
import { toast } from 'react-toastify';

export const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error
    const message = error.response.data?.error?.message || 'An error occurred';
    toast.error(message);
    return message;
  } else if (error.request) {
    // Request made but no response
    toast.error('Network error. Please check your connection.');
    return 'Network error';
  } else {
    // Something else happened
    toast.error('An unexpected error occurred');
    return 'Unexpected error';
  }
};
```

## Testing Strategy

### Backend Testing

**Unit Tests:**
- Test individual model methods (Product.calculate_current_price())
- Test ML predictor classes with mock data
- Test utility functions and validators

**Integration Tests:**
- Test API endpoints with test database
- Test authentication flow
- Test database operations

**ML Model Tests:**
- Test model training with sample data
- Test prediction accuracy
- Test feature engineering functions

**Example Test:**

```python
import unittest
from app import create_app
from app.models import Product

class ProductTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
    
    def tearDown(self):
        self.app_context.pop()
    
    def test_create_product(self):
        response = self.client.post('/api/products', json={
            'name': 'Test Necklace',
            'category': 'Necklace',
            'base_price': 50000,
            'weight': 10.5,
            'gold_purity': '916'
        })
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertIn('id', data['data'])
```

### Frontend Testing

**Component Tests:**
- Test component rendering
- Test user interactions
- Test form validation

**Integration Tests:**
- Test API service calls
- Test routing
- Test authentication flow

**E2E Tests (Optional):**
- Test complete user workflows
- Test prediction feature end-to-end

**Example Test:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { GoldPredictor } from './GoldPredictor';

describe('GoldPredictor', () => {
  it('renders prediction form', () => {
    render(<GoldPredictor />);
    expect(screen.getByText(/predict gold price/i)).toBeInTheDocument();
  });

  it('validates date input', () => {
    render(<GoldPredictor />);
    const dateInput = screen.getByLabelText(/date/i);
    fireEvent.change(dateInput, { target: { value: '2020-01-01' } });
    fireEvent.click(screen.getByText(/predict/i));
    expect(screen.getByText(/date must be in the future/i)).toBeInTheDocument();
  });
});
```

## Security Considerations

### Authentication & Authorization

1. **JWT Token Authentication:**
   - Tokens expire after 24 hours
   - Refresh token mechanism for extended sessions
   - Secure token storage in httpOnly cookies (alternative to localStorage)

2. **Password Security:**
   - Passwords hashed using werkzeug.security (PBKDF2)
   - Minimum password requirements enforced
   - Rate limiting on login attempts

3. **Role-Based Access Control:**
   - Admin role for full access
   - Staff role for limited access
   - Customer role for viewing only

### API Security

1. **CORS Configuration:**
   - Whitelist specific origins in production
   - Restrict allowed methods and headers

2. **Input Validation:**
   - Validate all inputs using marshmallow schemas
   - Sanitize user inputs to prevent injection attacks
   - Limit request payload size

3. **Rate Limiting:**
   - Implement rate limiting on prediction endpoints
   - Prevent brute force attacks on authentication

4. **HTTPS:**
   - Enforce HTTPS in production
   - Use secure cookies

### Data Security

1. **Database Security:**
   - Use MongoDB authentication
   - Encrypt sensitive data at rest
   - Regular backups

2. **Environment Variables:**
   - Store secrets in .env file
   - Never commit secrets to version control
   - Use different secrets for dev/prod

## Performance Optimization

### Backend Optimization

1. **Database Indexing:**
   - Index frequently queried fields
   - Compound indexes for complex queries

2. **Caching:**
   - Cache current gold prices (5-minute TTL)
   - Cache product lists (1-minute TTL)
   - Use Redis for distributed caching (optional)

3. **Query Optimization:**
   - Use pagination for large result sets
   - Limit fields returned in queries
   - Use aggregation pipelines for complex queries

### Frontend Optimization

1. **Code Splitting:**
   - Lazy load routes
   - Dynamic imports for heavy components

2. **Asset Optimization:**
   - Optimize images (WebP format)
   - Compress assets
   - Use CDN for static assets

3. **State Management:**
   - Minimize re-renders
   - Use React.memo for expensive components
   - Implement virtual scrolling for long lists

4. **API Optimization:**
   - Debounce search inputs
   - Cache API responses
   - Implement request cancellation

## Deployment Architecture

### Development Environment

```
Frontend: Vite dev server (port 5173)
Backend: Flask dev server (port 5000)
Database: Local MongoDB (port 27017)
```

### Production Environment

```
Frontend: Nginx serving static build
Backend: Gunicorn + Flask (multiple workers)
Database: MongoDB Atlas or self-hosted
Reverse Proxy: Nginx
SSL: Let's Encrypt certificates
```

**Docker Compose Configuration:**

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/
      JWT_SECRET: ${JWT_SECRET}
      FLASK_ENV: production
    depends_on:
      - mongodb
    volumes:
      - ./backend/models:/app/models

  frontend:
    build: ./
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

## Migration Strategy

### Phase 1: Backend Setup
1. Set up Flask project structure
2. Configure MongoDB connection
3. Create data models
4. Implement basic CRUD APIs

### Phase 2: Data Migration
1. Export existing data from current backend
2. Transform data to new schema
3. Import into MongoDB
4. Verify data integrity

### Phase 3: ML Implementation
1. Collect/generate training data
2. Implement ML models
3. Train initial models
4. Create prediction APIs

### Phase 4: Frontend Integration
1. Update API client
2. Create new prediction components
3. Update existing components
4. Test integration

### Phase 5: Testing & Deployment
1. Comprehensive testing
2. Performance optimization
3. Security audit
4. Production deployment
