# CardSky - Card Distribution Platform

A comprehensive card distribution and management platform similar to Google Flights/Skyscanner, designed for digital cards (game cards, recharge cards, coupons, membership codes, etc.).

## Features

- **Search & Filter**: Search and filter cards by keywords, price range, denomination, validity period
- **Price Comparison**: Real-time price comparison across multiple suppliers
- **Smart Recommendations**: AI-powered recommendations based on user behavior and trends
- **Inventory Management**: Multi-channel inventory integration with real-time updates
- **Secure Distribution**: Encrypted card storage with instant delivery
- **Order Management**: Complete order history and tracking
- **Payment Integration**: Multiple payment methods (Alipay, WeChat, PayPal, etc.)
- **Analytics Dashboard**: Comprehensive data analysis and reporting
- **Enterprise Solutions**: Bulk purchase and distribution capabilities

## Tech Stack

### Frontend
- React 18 with TypeScript
- Redux Toolkit for state management
- React Router for navigation
- Ant Design / Material-UI for components
- Axios for API calls
- Chart.js for data visualization

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL for main database
- Redis for caching and sessions
- JWT for authentication
- Bcrypt for password hashing
- Crypto for card encryption

### DevOps
- Docker & Docker Compose
- Nginx for reverse proxy
- PM2 for process management

## Project Structure

```
CardSky/
├── backend/              # Node.js/Express backend
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── controllers/ # Route controllers
│   │   ├── models/      # Database models
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Express middleware
│   │   ├── utils/       # Utility functions
│   │   └── types/       # TypeScript types
│   ├── tests/           # Backend tests
│   └── package.json
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── store/       # Redux store
│   │   ├── services/    # API services
│   │   ├── hooks/       # Custom hooks
│   │   ├── utils/       # Utility functions
│   │   └── types/       # TypeScript types
│   ├── public/
│   └── package.json
├── database/            # Database migrations & seeds
├── docker/              # Docker configurations
└── docs/                # Documentation
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd JustSell
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

4. Set up environment variables:
```bash
# Copy example env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

5. Set up database:
```bash
cd backend
npm run db:migrate
npm run db:seed
```

6. Start development servers:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### Using Docker

```bash
docker-compose up -d
```

## API Documentation

API documentation is available at `/api/docs` when running the backend server.

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## License

MIT

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.
