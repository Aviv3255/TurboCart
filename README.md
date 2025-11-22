# 🚀 TurboCart - AI Cart Upsells for Shopify

AI-Powered Smart Upsells That Convert

## 🎯 Overview

TurboCart is a Shopify app that uses AI to automatically optimize cart upsells, increasing Average Order Value (AOV) without overwhelming customers.

### Key Features

- **AI-Powered Recommendations**: Smart product suggestions based on cart contents
- **Automatic A/B Testing**: Continuously tests and optimizes upsell combinations
- **Deep Analytics**: Comprehensive insights into upsell performance
- **5 Display Styles**: Clean, minimal designs that fit any theme
- **Cart Drawer & Page Support**: Works everywhere
- **Performance Optimized**: <50KB bundle, <200ms API responses

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Admin UI**: Shopify Polaris, App Bridge 4.0
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **Deployment**: Vercel/Railway (recommended)

## 📦 Installation

### Prerequisites

- Node.js 18+
- PostgreSQL
- Shopify Partner Account

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd TurboCart
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your Shopify credentials
```

4. Set up the database:
```bash
npm run db:setup
```

5. Run the development server:
```bash
npm run dev
```

6. Connect to Shopify:
```bash
shopify app dev
```

## 🏗️ Project Structure

```
TurboCart/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Admin dashboard routes
│   ├── api/               # API routes
│   └── layout.tsx
├── extensions/            # Theme App Extensions
│   └── turbocart-upsells/
├── lib/                   # Utilities & helpers
│   ├── shopify/          # Shopify SDK
│   ├── db/               # Database
│   └── ai/               # AI engine
├── components/            # React components
├── public/               # Static assets
└── shopify.app.toml      # Shopify app config
```

## 🚀 Development

### Running Locally

```bash
npm run dev
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## 📊 Features

### AI Recommendation Engine

- Context-aware matching (collection, product type, price range)
- Machine learning from purchase data
- Automatic optimization

### A/B Testing

- 20% test traffic, 80% control
- Automatic winner selection
- Continuous optimization

### Analytics Dashboard

- Revenue tracking
- Conversion funnels
- Product performance
- ROI calculations

## 🔒 Security & Compliance

- OAuth 2.0 authentication
- Session token-based auth (App Bridge 4.0)
- GDPR-compliant webhooks
- Content Security Policy headers
- Rate limiting on all endpoints

## 📝 License

Proprietary - All rights reserved

## 🤝 Support

For support, email: support@turbocart.app

---

Built with ❤️ for Shopify merchants
