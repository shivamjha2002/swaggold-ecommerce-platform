# Implementation Plan

- [x] 1. Set up Flask backend project structure





  - Create backend directory with Flask application factory pattern
  - Set up virtual environment and install dependencies (Flask, PyMongo, mongoengine, scikit-learn, pandas)
  - Create configuration classes for development, testing, and production environments
  - Implement CORS and JWT extension initialization
  - _Requirements: 1.1, 1.2, 1.3, 12.1, 12.2_

- [x] 2. Configure MongoDB connection and create data models




  - [x] 2.1 Set up MongoDB connection with mongoengine


    - Implement database connection in app factory with connection pooling
    - Create environment variable configuration for MongoDB URI
    - Add database connection error handling
    - _Requirements: 2.1, 2.4_

  - [x] 2.2 Create Product model with validation


    - Implement Product document class with all fields (name, category, price, weight, etc.)
    - Add calculate_current_price method
    - Create indexes for category, price, and weight fields
    - _Requirements: 2.2, 2.3, 3.1_

  - [x] 2.3 Create Customer and Khata models


    - Implement Customer document class with balance tracking
    - Implement KhataTransaction document class with reference to Customer
    - Add indexes for customer queries and transaction history
    - _Requirements: 2.2, 2.3, 4.1, 4.2_

  - [x] 2.4 Create Sale and PriceHistory models


    - Implement Sale document class with product references
    - Implement PriceHistory document class for gold/silver prices
    - Implement DiamondPriceHistory document class
    - Create User model for admin authentication
    - _Requirements: 2.2, 2.3, 6.1, 6.2_

  - [x] 2.5 Create database migration and seeding scripts


    - Write script to initialize collections with indexes
    - Create seed data for sample products and price history
    - _Requirements: 2.5_

- [x] 3. Implement Product Management API




  - [x] 3.1 Create products blueprint with CRUD endpoints


    - Implement POST /api/products endpoint with validation
    - Implement GET /api/products with pagination and filtering
    - Implement GET /api/products/:id endpoint
    - Implement PUT /api/products/:id endpoint
    - Implement DELETE /api/products/:id (soft delete)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Implement product service layer


    - Create ProductService class with business logic
    - Implement current price calculation based on gold rates
    - Add filtering and pagination logic
    - _Requirements: 3.2, 3.3_

  - [x] 3.3 Write API tests for product endpoints


    - Create unit tests for product CRUD operations
    - Test pagination and filtering
    - Test validation errors
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [-] 4. Implement Customer and Khata Management API



  - [x] 4.1 Create customers and khata blueprints


    - Implement POST /api/customers endpoint
    - Implement GET /api/customers/:id/khata endpoint with transaction history
    - Implement POST /api/khata/transactions endpoint
    - Implement GET /api/khata/summary endpoint
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [x] 4.2 Implement khata service with atomic balance updates


    - Create KhataService class with transaction logic
    - Implement atomic balance update using MongoDB transactions
    - Add running balance calculation
    - _Requirements: 4.3, 4.4_

  - [x] 4.3 Write tests for khata functionality


    - Test transaction creation and balance updates
    - Test atomic operations
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Implement ML models for price prediction




  - [x] 5.1 Create gold price predictor model


    - Implement GoldPricePredictor class with feature engineering
    - Add time-based features (day, month, moving averages)
    - Implement train method with Linear Regression
    - Implement predict method with confidence intervals
    - _Requirements: 5.1, 5.3_

  - [x] 5.2 Create diamond price predictor model


    - Implement DiamondPricePredictor class with Random Forest
    - Add label encoders for cut, color, clarity
    - Implement train method with feature encoding
    - Implement predict method with confidence intervals
    - _Requirements: 5.2, 5.4_

  - [x] 5.3 Create ML service layer


    - Implement MLService class for loading trained models
    - Add model loading from disk (joblib)
    - Implement prediction wrapper methods
    - Add error handling for untrained models
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 5.4 Implement model training pipeline


    - Create training script that fetches data from MongoDB
    - Implement train_gold_model function
    - Implement train_diamond_model function
    - Add model saving with versioning
    - Create TrainingLog model and logging
    - _Requirements: 5.5, 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 5.5 Write tests for ML models


    - Test feature engineering functions
    - Test model training with sample data
    - Test prediction accuracy
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 6. Implement Predictions API




  - [x] 6.1 Create predictions blueprint


    - Implement POST /api/predictions/gold endpoint
    - Implement POST /api/predictions/diamond endpoint
    - Implement GET /api/predictions/trends endpoint
    - Implement POST /api/predictions/retrain endpoint (admin only)
    - _Requirements: 5.3, 5.4, 6.4_

  - [x] 6.2 Implement price history management endpoints


    - Implement POST /api/prices/gold endpoint
    - Implement POST /api/prices/diamond endpoint
    - Implement GET /api/prices/gold/history with date filtering
    - Add automatic model retraining trigger
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [x] 6.3 Write tests for prediction endpoints


    - Test gold price prediction
    - Test diamond price prediction
    - Test error handling for untrained models
    - _Requirements: 5.3, 5.4, 6.1, 6.2_

- [x] 7. Implement authentication and authorization




  - [x] 7.1 Create auth blueprint with JWT


    - Implement POST /api/auth/login endpoint
    - Implement POST /api/auth/register endpoint (admin only)
    - Implement JWT token generation with 24-hour expiration
    - Add password hashing with werkzeug.security
    - _Requirements: 1.5_

  - [x] 7.2 Create authentication decorators


    - Implement @jwt_required decorator
    - Implement @admin_required decorator
    - Add role-based access control
    - _Requirements: 1.5_

  - [x] 7.3 Write tests for authentication


    - Test login flow
    - Test token validation
    - Test protected endpoints
    - _Requirements: 1.5_

- [x] 8. Implement error handling and validation






  - [x] 8.1 Create global error handlers

    - Implement global exception handler
    - Add ValidationError handler for mongoengine
    - Create custom exception classes (APIException, ResourceNotFoundError, etc.)
    - _Requirements: 1.3, 2.4_


  - [x] 8.2 Implement request validation

    - Create marshmallow schemas for request validation
    - Add input sanitization
    - Implement validation for all endpoints
    - _Requirements: 1.4_

- [x] 9. Create health check and deployment configuration




  - [x] 9.1 Implement health check endpoint


    - Create GET /api/health endpoint
    - Add database connectivity check
    - Return server status and version
    - _Requirements: 12.3_

  - [x] 9.2 Create deployment files


    - Write Dockerfile for Flask backend
    - Create docker-compose.yml with MongoDB and backend services
    - Configure Gunicorn for production
    - Set up environment variable templates
    - _Requirements: 12.4, 12.5_

- [x] 10. Update frontend API client and services




  - [x] 10.1 Create API client with axios


    - Implement axios instance with base URL configuration
    - Add request interceptor for JWT token
    - Add response interceptor for error handling
    - _Requirements: 10.1, 10.3_

  - [x] 10.2 Create service modules for API calls


    - Implement productService with CRUD methods
    - Implement customerService with khata methods
    - Implement predictionService with ML endpoints
    - Implement authService with login/logout
    - _Requirements: 10.1, 10.2_

  - [x] 10.3 Implement authentication context


    - Create AuthContext with React Context API
    - Add login, logout, and token management
    - Implement protected route wrapper
    - _Requirements: 9.1, 10.2_

  - [x] 10.4 Write tests for API services


    - Test API client configuration
    - Test service methods with mock responses
    - _Requirements: 10.1, 10.2_

- [x] 11. Create prediction dashboard components





  - [x] 11.1 Create GoldPredictor component


    - Implement date picker for prediction date
    - Add weight input field
    - Create prediction form with validation
    - Display prediction results with confidence intervals
    - _Requirements: 8.2, 8.3_



  - [x] 11.2 Create DiamondPredictor component

    - Implement form inputs for carat, cut, color, clarity
    - Add dropdown selectors with proper options
    - Create prediction form with validation
    - Display prediction results

    - _Requirements: 8.5_

  - [x] 11.3 Create PriceChart component

    - Implement line chart with Recharts for historical prices
    - Add area chart for confidence intervals
    - Create interactive tooltips
    - Add time range selector (30-day, 90-day, 1-year)
    - _Requirements: 8.3, 8.4_

  - [x] 11.4 Create Predictions page


    - Implement /predictions route
    - Add tabs for gold and diamond predictions
    - Integrate GoldPredictor and DiamondPredictor components
    - Add PriceChart for trends visualization
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 12. Enhance existing frontend components




  - [x] 12.1 Update product components with new API


    - Update Products page to use new API endpoints
    - Add real-time price calculation display
    - Implement filtering by category, price range, weight
    - Add loading states and error handling
    - _Requirements: 7.1, 7.5_

  - [x] 12.2 Update Homepage with live gold prices


    - Add gold price ticker component
    - Display percentage change indicators
    - Update product cards with current prices
    - _Requirements: 7.2_

  - [x] 12.3 Implement product detail modal


    - Create modal component for product details
    - Add high-resolution image display
    - Show specifications and current price calculation
    - Add "Add to Cart" functionality
    - _Requirements: 7.3_

- [x] 13. Implement admin dashboard enhancements









  - [x] 13.1 Create login page



    - Implement login form with validation
    - Add error handling for failed login
    - Redirect to admin dashboard on success
    - _Requirements: 9.1_

  - [x] 13.2 Update AdminDashboard with analytics





    - Display sales analytics (total revenue, transactions)
    - Show top-selling products
    - Add customer khata summary
    - Display outstanding balances
    - _Requirements: 9.2, 9.4_

  - [x] 13.3 Implement product management interface


    - Create product list with edit/delete actions
    - Add product creation form
    - Implement product editing modal
    - Add confirmation dialogs for delete
    - _Requirements: 9.3_

  - [x] 13.4 Add data export functionality





    - Implement CSV export for sales reports
    - Add customer data export
    - Create download buttons with date range filters
    - _Requirements: 9.5_

- [x] 14. Implement error handling and loading states






  - [x] 14.1 Create ErrorBoundary component


    - Implement React error boundary
    - Add fallback UI for errors
    - Add error logging
    - _Requirements: 7.5, 10.3_

  - [x] 14.2 Add toast notifications


    - Install and configure react-toastify
    - Implement toast notifications for API errors
    - Add success notifications for actions
    - _Requirements: 10.3_

  - [x] 14.3 Implement loading states


    - Add loading spinners for API calls
    - Create skeleton loaders for product lists
    - Add loading states to prediction forms
    - _Requirements: 7.5_

- [x] 15. Optimize frontend performance





  - [x] 15.1 Implement code splitting


    - Add lazy loading for routes
    - Use React.lazy for heavy components
    - Add Suspense boundaries
    - _Requirements: 10.5_


  - [x] 15.2 Add caching and optimization

    - Implement product list caching with 5-minute expiration
    - Add debouncing for search inputs
    - Optimize images with proper formats
    - _Requirements: 10.5_

- [x] 16. Final integration and testing







  - [x] 16.1 Integration testing


    - Test complete user workflows (browse products, view predictions)
    - Test admin workflows (manage products, view analytics)
    - Test khata management flow
    - _Requirements: All_

  - [x] 16.2 Fix TypeScript errors and warnings


    - Fix existing TypeScript errors in Homepage.tsx
    - Add proper type definitions for all components
    - Ensure no implicit any types
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 16.3 Performance and security audit


    - Test API performance under load
    - Verify security measures (JWT, CORS, input validation)
    - Check for common vulnerabilities
    - _Requirements: 1.3, 1.4, 1.5, 12.5_
