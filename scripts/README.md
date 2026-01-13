# Scripts

Utility scripts for MedWard development and deployment.

## 📜 Available Scripts

### setup-clasp.sh

**Purpose**: Automated setup for Google Apps Script deployment via clasp

**Usage**:
```bash
./scripts/setup-clasp.sh
```

**What it does**:
1. Checks if Node.js is installed
2. Installs clasp if not already installed
3. Logs you into Google Apps Script
4. Validates or creates `.clasp.json` configuration
5. Optionally creates a new Apps Script project
6. Tests deployment by pushing files

**Requirements**:
- Node.js 18+
- Bash shell (works on Mac/Linux, use Git Bash on Windows)
- Google Account

**See also**: [DEPLOY-FROM-GITHUB.md](../google-apps-script/DEPLOY-FROM-GITHUB.md)

---

### init-db.js

**Purpose**: Initialize SQLite database for Next.js version

**Usage**:
```bash
npm run db:init
# or
node scripts/init-db.js
```

**What it does**:
- Creates database schema
- Sets up tables for users, patients, reports, knowledge base
- Initializes indexes for performance

---

## 🔧 Adding New Scripts

When adding new scripts:

1. Place them in the `scripts/` directory
2. Make shell scripts executable: `chmod +x scripts/your-script.sh`
3. Add documentation to this README
4. Use clear, descriptive names
5. Add error handling and user-friendly messages

---

## 📝 Naming Conventions

- `.sh` - Bash shell scripts
- `.js` - Node.js scripts
- `.py` - Python scripts (if any)

All scripts should have:
- Clear purpose description at the top
- Usage examples
- Error handling
- Help/usage messages
