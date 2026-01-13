# 🏥 MedWard - Medical Report Interpreter

AI-powered medical report interpretation system for ward presentations. Transform medical documents into presentation-ready content with clinical pearls and educational questions.

![MedWard](https://img.shields.io/badge/Medical-AI-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🎯 Core Functionality
- **📷 Document Scanning**: Camera or upload medical documents (labs, imaging, notes, ECGs)
- **🧠 AI Interpretation**: GPT-4 powered analysis of medical reports
- **💎 Clinical Pearls**: Automatically generated teaching points
- **❓ Educational Questions**: Attending-ready questions with detailed answers
- **📋 Ward Presentations**: Structured SOAP format for presentations

### 🚀 Advanced Features
- **🧠 Self-Learning System**: Reduces API costs by caching common interpretations
- **🔒 HIPAA-Compliant**: End-to-end encryption and audit logging
- **☁️ Google Drive Sync**: Automatic backup and cross-device sync
- **📱 Progressive Web App**: Install on mobile devices, works offline
- **👆 Passwordless Auth**: Device fingerprint or username login
- **⚡ Real-time OCR**: Google Cloud Vision for accurate text extraction

### 📊 Smart Features
- **Knowledge Base**: Learns from previous interpretations to save API costs
- **Confidence Scoring**: Shows when cached knowledge is used vs. new AI calls
- **Usage Analytics**: Track API savings and learning progress
- **Multi-patient Management**: Organize reports by patient

## 🎓 Use Cases

- **Medical Students**: Learn clinical reasoning and presentation skills
- **Residents**: Quick pre-rounds preparation
- **Attendings**: Generate discussion questions for teaching rounds
- **Researchers**: Organize and analyze clinical data

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: SQLite with better-sqlite3
- **AI**: OpenAI GPT-4, Google Cloud Vision
- **Storage**: Google Drive API (optional)
- **Auth**: JWT, device fingerprinting
- **Deployment**: Docker, Vercel

## 🚀 Quick Start

### 🌐 Try the Google Apps Script Version (No Setup Required!)

**Live Demo**: [https://script.google.com/macros/s/AKfycbz5I5uGmK3f-_k7pi9HMsW1YMANS8NGnC8-kIDxcEB1vesYXpmwNHRnQRGX_GqV19iWJw/exec](https://script.google.com/macros/s/AKfycbz5I5uGmK3f-_k7pi9HMsW1YMANS8NGnC8-kIDxcEB1vesYXpmwNHRnQRGX_GqV19iWJw/exec)

Want to deploy your own? See the [Google Apps Script Deployment Guide](google-apps-script/DEPLOY.md) for a serverless option that requires no infrastructure!

### 💻 Self-Hosted Installation

#### Prerequisites
- Node.js 18+
- OpenAI API key
- Google Cloud account (Vision API enabled)

#### Installation

```bash
# 1. Clone repository
git clone https://github.com/balhaddad-sys/Ward-rounds.git
cd Ward-rounds

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Initialize database
npm run db:init

# 5. Start development server
npm run dev
```

Visit `http://localhost:3000` 🎉

### Docker Quick Start

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f medward
```

## 📖 Documentation

### Deployment Guides
- [Self-Hosted Deployment Guide](DEPLOYMENT.md) - Complete deployment instructions for Next.js version
- [Google Apps Script Guide](google-apps-script/README.md) - Serverless deployment option
- [Google Apps Script Manual Deployment](google-apps-script/DEPLOY.md) - Step-by-step manual setup
- [Google Apps Script GitHub Deployment](google-apps-script/DEPLOY-FROM-GITHUB.md) - Automated deployment with clasp

### Other Documentation
- See inline documentation in code files for API details

## 🔧 Configuration

### Required Environment Variables

```env
# OpenAI
OPENAI_API_KEY=sk-your-key-here

# Google Cloud Vision
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account",...}

# Security
JWT_SECRET=your-secure-random-string
ENCRYPTION_KEY=your-32-byte-hex-key
```

### Optional Configuration

```env
# Google Drive Sync
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Rate Limiting
RATE_LIMIT_API=60
RATE_LIMIT_AI=20

# Feature Flags
ENABLE_GOOGLE_DRIVE_SYNC=true
ENABLE_SELF_LEARNING=true
```

See [.env.example](.env.example) for complete configuration options.

## 📱 Usage

### 1. Login
- Use device fingerprint (automatic)
- Or create a username for cross-device access

### 2. Scan Document
- Take a photo or upload image/PDF
- Select document type (Lab, Imaging, Note, etc.)
- AI processes and extracts text

### 3. Get Interpretation
- View AI-powered interpretation
- Read clinical pearls
- Study potential questions
- Generate ward presentation

### 4. Present
- Use structured SOAP format
- Reference clinical pearls
- Be ready for attending questions

## 🧠 Self-Learning System

MedWard learns from previous interpretations to reduce API costs:

```
First Request:     Uses OpenAI API ($$$)
Similar Request:   Uses cached knowledge (FREE!)
```

**Features:**
- Semantic similarity matching
- Confidence scoring
- Automatic learning from feedback
- Usage analytics

**Cost Savings:**
- Typical savings: 60-80% of API calls
- ROI improves over time as knowledge base grows

## 🔒 Security & Privacy

### Data Protection
- ✅ AES-256-GCM encryption at rest
- ✅ TLS 1.3 encryption in transit
- ✅ Unique user authentication
- ✅ Comprehensive audit logging
- ✅ Session timeout and management

### HIPAA Compliance
- Encryption of PHI
- Access controls and audit trails
- Data retention policies
- Secure data deletion
- Business Associate Agreements with providers

**⚠️ Important**: This is a development tool. For production use with real patient data, ensure full HIPAA compliance and proper security review.

## 📊 Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  Next.js 14 + React + Tailwind + PWA            │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│              API Routes (Next.js)                │
│  Auth │ Patients │ Reports │ Knowledge           │
└──────┬───────────┬──────────┬──────────┬────────┘
       │           │          │          │
   ┌───▼───┐   ┌──▼───┐  ┌───▼────┐ ┌──▼─────┐
   │ Auth  │   │ OCR  │  │   AI   │ │ Storage│
   │Module │   │Vision│  │ GPT-4  │ │ SQLite │
   └───────┘   └──────┘  └────────┘ └────────┘
                                         │
                                    ┌────▼─────┐
                                    │Knowledge │
                                    │   Base   │
                                    └──────────┘
```

## 📝 License

This project is licensed under the MIT License.

## ⚠️ Disclaimer

**Medical Disclaimer**: This tool is for educational purposes only. It is not a substitute for professional medical judgment. Always verify AI-generated interpretations with clinical expertise.

**Data Privacy**: Never use real patient identifiable information in development/testing environments. Follow all applicable privacy laws and regulations.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Google Cloud for Vision API
- Next.js team for the amazing framework
- Medical educators and residents who provided feedback

## 📧 Contact

- **Author**: Bader Alhaddad
- **GitHub**: [@balhaddad-sys](https://github.com/balhaddad-sys)
- **Project**: [Ward-rounds](https://github.com/balhaddad-sys/Ward-rounds)

## 🗺️ Roadmap

- [ ] Voice input for hands-free operation
- [ ] Multi-language support
- [ ] Custom AI models for specific specialties
- [ ] Integration with EHR systems
- [ ] Mobile native apps (iOS/Android)
- [ ] Collaborative features for team rounds
- [ ] Advanced analytics dashboard

---

**Built with ❤️ for medical professionals by medical professionals**

*Star ⭐ this repo if you find it helpful!*