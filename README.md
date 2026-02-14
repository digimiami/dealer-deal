# Carforsales.net - Auto Dealer Lead Generation System

A comprehensive, AI-powered lead generation and vehicle sales platform for auto dealers. Built with Next.js, PostgreSQL, and OpenClaw AI integration.

![Deployment](https://img.shields.io/badge/deployment-ready-success)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Features

### Core Functionality
- **AI-Powered Chatbot** - Intelligent vehicle matching and customer assistance
- **Lead Capture & Scoring** - Automatic lead qualification and routing
- **Vehicle Inventory** - Complete vehicle management with images/videos
- **Vehicle Finder** - Advanced search and filtering
- **Test Drive Booking** - Direct appointment scheduling
- **Dealer Matching** - Intelligent routing to appropriate dealers
- **Multi-channel Notifications** - Email, SMS, WhatsApp via OpenClaw

### User Experience
- **Beautiful Landing Page** - Modern, conversion-optimized design
- **Responsive Design** - Works perfectly on all devices
- **Real-time Chat** - AI assistant available 24/7
- **Image Galleries** - High-quality vehicle photos and videos
- **Smooth Navigation** - Intuitive user flow

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- OpenClaw (optional, for AI features)
- VPS or hosting service (for production)

## 🛠️ Installation

### 1. Clone Repository

```bash
git clone https://github.com/digimiami/dealer-deal.git
cd dealer-deal
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment

```bash
cp env.example .env
# Edit .env with your configuration
```

### 4. Set Up Database

```bash
# Create database
createdb dealer_leads

# Run migrations
npm run migrate

# Seed sample data (optional)
psql dealer_leads < database/seed.sql
psql dealer_leads < database/seed-vehicles.sql
```

### 5. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## 📁 Project Structure

```
dealer-deal/
├── components/          # React components
│   ├── Chatbot.js      # AI chatbot component
│   └── TestDriveModal.js
├── database/           # Database schemas and migrations
│   ├── schema.sql
│   ├── migrations/
│   └── seed.sql
├── lib/                # Utility libraries
│   ├── db.js          # Database connection
│   ├── leadRouter.js   # Lead routing logic
│   └── openclaw.js     # OpenClaw integration
├── pages/              # Next.js pages
│   ├── api/           # API routes
│   ├── vehicles/      # Vehicle pages
│   └── index.js       # Landing page
├── styles/            # CSS files
└── openclaw/          # OpenClaw configuration
```

## 🔧 Configuration

### Environment Variables

See `env.example` for all required variables:

- **Database**: Connection details for PostgreSQL
- **OpenClaw**: Gateway URL and authentication tokens
- **Email/SMTP**: For sending notifications
- **Application**: Node environment and port

### OpenClaw Setup

1. Install OpenClaw on your server
2. Configure `openclaw/config.json`
3. Set environment variables in `.env`
4. Place agent prompts in OpenClaw workspace

See `SETUP.md` for detailed instructions.

## 🚀 Deployment

### Quick Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

See `DEPLOYMENT.md` for complete deployment guide.

### Deploy to Your Own Server

See `DEPLOYMENT.md` for VPS deployment instructions.

## 📖 Documentation

- **SETUP.md** - Detailed setup instructions
- **DEPLOYMENT.md** - Deployment guide
- **FEATURES.md** - Complete feature documentation
- **TESTING.md** - Testing guide
- **BUILD_STATUS.md** - Build information

## 🎯 Usage

### For Customers

1. Visit the landing page
2. Fill out the lead form or chat with AI
3. Browse matched vehicles
4. View vehicle details with photos/videos
5. Schedule test drive
6. Get notifications and confirmations

### For Dealers

1. Vehicles are automatically matched to dealers
2. Receive notifications for new leads
3. Get test drive appointment requests
4. Track all interactions

## 🔐 Security

- Input validation on all forms
- SQL injection protection
- XSS protection
- CSRF protection (Next.js built-in)
- Environment variable security

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Check documentation in `/docs`
- Open an issue on GitHub
- Contact support

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database: [PostgreSQL](https://www.postgresql.org/)
- AI Integration: [OpenClaw](https://openclaw.ai/)
- Styling: [Tailwind CSS](https://tailwindcss.com/)

## 📊 System Architecture

```
┌─────────────┐
│   Landing   │ (Next.js Frontend)
│    Page     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  API Routes │ (Next.js API)
└──────┬──────┘
       │
       ├──► PostgreSQL Database
       │
       └──► OpenClaw Gateway
              │
              ├──► AI Chatbot
              ├──► Lead Processing
              └──► Notifications
```

## 🎨 Features Overview

- ✅ AI-powered vehicle matching
- ✅ Lead capture and scoring
- ✅ Vehicle inventory management
- ✅ Advanced search and filters
- ✅ Image/video galleries
- ✅ Test drive booking
- ✅ Dealer notifications
- ✅ Customer confirmations
- ✅ Real-time chatbot
- ✅ Responsive design
- ✅ SEO optimized

---

**Repository**: https://github.com/digimiami/dealer-deal.git

**Live Demo**: [Coming Soon]

**Documentation**: See `/docs` folder
