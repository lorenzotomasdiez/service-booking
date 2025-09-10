# BarberPro - Premium Service Booking Platform

🇦🇷 **Built for Argentina's service booking market**

BarberPro is a premium service booking platform designed specifically for Argentina, starting with barber services and architected for rapid expansion to other service verticals (psychologists, doctors, etc.).

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd service-booking
npm run install:all

# Start development environment
npm run docker:up

# Verify setup
curl http://localhost:3000/api/health
```

## 🏗️ Architecture

**Template-Based Platform** - Designed for 80%+ code reuse across service verticals

### Tech Stack
- **Frontend:** SvelteKit + TypeScript + TailwindCSS
- **Backend:** Fastify + TypeScript + Prisma
- **Database:** PostgreSQL + Redis
- **Infrastructure:** Docker + Docker Compose

### Core Components
```
├── Shared Platform (80%)          ├── Niche Templates (20%)
│   ├── Authentication             │   ├── Barber Services
│   ├── Payment Processing          │   ├── Psychology Services
│   ├── Booking Engine             │   ├── Medical Services
│   ├── User Management            │   └── Custom Verticals
│   └── Notification Hub           │
```

## 🌟 Features

### MVP Features (14-day sprint)
- ✅ User registration and authentication
- ✅ Service discovery and booking
- ✅ Provider dashboard
- ✅ Payment processing (MercadoPago)
- ✅ WhatsApp notifications
- ✅ Mobile-first responsive design

### Argentina-Specific
- 🇦🇷 Spanish localization
- 💰 Argentine Peso (ARS) currency
- 📱 MercadoPago payment integration
- 🕐 America/Argentina/Buenos_Aires timezone
- 📋 AFIP tax compliance (planned)

## 📁 Project Structure

```
service-booking/
├── backend/              # Fastify API + Prisma + PostgreSQL
├── frontend/             # SvelteKit + TypeScript
├── docs/                 # Documentation
├── docker-compose.yml    # Development environment
└── .env.example         # Environment configuration
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### Environment Setup
```bash
# Install dependencies
npm run install:all

# Copy environment configuration
cp .env.example .env

# Start services
npm run docker:up

# Generate database schema
npm run db:generate
npm run db:migrate
```

### Available Scripts
```bash
npm run dev              # Start frontend + backend
npm run backend          # Backend only
npm run frontend         # Frontend only
npm run docker:up        # Start all containers
npm run db:studio        # Database browser
npm run db:migrate       # Run migrations
```

### Verification
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend:** [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **API Docs:** [http://localhost:3000/docs](http://localhost:3000/docs)
- **Database:** `npm run db:studio`

## 🔧 Configuration

Key environment variables:

```bash
# Database
DATABASE_URL="postgresql://barberpro:barberpro_dev_password@localhost:5432/barberpro_dev"

# API
PORT=3000
JWT_SECRET=your-secret-key

# Frontend
VITE_API_URL=http://localhost:3000/api

# Payments
MERCADOPAGO_ACCESS_TOKEN=your-token
```

## 📊 Team Structure

- **Tech Lead:** Architecture & technical strategy
- **Frontend Developer:** SvelteKit + component library
- **Backend Developer:** Fastify + APIs + database
- **UI/UX Designer:** Design system + Argentina UX
- **DevOps Engineer:** Infrastructure + CI/CD
- **Product Owner:** Features + user stories
- **QA Engineer:** Testing + quality assurance
- **Payment Specialist:** MercadoPago integration

## 🎯 Roadmap

### Phase 1: MVP Foundation (Day 1-14)
- [x] Architecture setup
- [x] Core infrastructure
- [ ] Authentication system
- [ ] Basic booking flow
- [ ] Payment integration
- [ ] Mobile UI

### Phase 2: Market Launch (Day 15-30)
- [ ] Provider onboarding
- [ ] Client acquisition
- [ ] WhatsApp integration
- [ ] Performance optimization
- [ ] Argentina market testing

### Phase 3: Scale & Expand (Month 2+)
- [ ] Multi-city expansion
- [ ] Template replication (psychology)
- [ ] Advanced features
- [ ] AFIP integration

## 🚦 Status

**Current Status:** ✅ **Foundation Complete - Ready for Development**

### Completed ✅
- [x] SvelteKit project setup with TypeScript
- [x] Fastify backend with health endpoints
- [x] PostgreSQL + Prisma schema
- [x] Redis caching service
- [x] Docker development environment
- [x] Environment configuration
- [x] Project documentation

### Next Steps 🎯
1. **Frontend Team:** Component library implementation
2. **Backend Team:** Authentication and user APIs
3. **Design Team:** Argentina brand system
4. **DevOps Team:** Production infrastructure

## 📚 Documentation

- [Development Setup Guide](./docs/DEVELOPMENT_SETUP.md)
- [Day 1 Tasks](./docs/project-management/day_one_tasks.md)
- [MVP Specifications](./ServiceBooking_PRD.md)

## 🤝 Contributing

1. Follow conventional commit messages
2. Write TypeScript with strict mode
3. Add tests for new features
4. Update documentation
5. Never commit secrets

## 📞 Support

- **Technical Issues:** Check development setup guide
- **Architecture Questions:** Contact tech lead
- **Business Requirements:** Contact product owner

---

**Built with ❤️ for Argentina's service booking market**

*Last Updated: Day 1 - Foundation Architecture Complete*