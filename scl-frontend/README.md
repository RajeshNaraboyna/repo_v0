# School Management System - Frontend

React-based frontend for the School Management System.

## Features

- User Login with Guest Access
- Student Admission Request Form
- Responsive Design with Tailwind CSS

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Project Structure

```
scl-frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API service layer
│   ├── store/          # State management
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── public/             # Static assets
└── index.html          # HTML entry point
```

## Environment Variables

Create a `.env` file:

```
VITE_API_URL=http://localhost:8000/api/v1
```
