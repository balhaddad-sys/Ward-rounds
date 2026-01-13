# Google Apps Script Integration

This document describes the integration between the MedWard Next.js application and the Google Apps Script (GAS) deployment.

## Overview

MedWard has two deployment options:

1. **Next.js Application** (Primary) - Full-featured application with Node.js backend, SQLite database
2. **Google Apps Script** (Alternative) - Browser-based deployment using Google Sheets as database

The GAS integration allows:
- **Data Synchronization**: Sync patients and reports between Next.js and GAS
- **Backup**: Use GAS as a backup/cloud storage option
- **Cross-Platform Access**: Access data from both deployments
- **Alternative Deployment**: Deploy to Google Apps Script when Node.js is not available

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│   Next.js App       │         │  Google Apps Script  │
│                     │         │                      │
│  ┌──────────────┐   │         │  ┌───────────────┐  │
│  │  SQLite DB   │   │         │  │ Google Sheets │  │
│  └──────────────┘   │         │  └───────────────┘  │
│                     │         │                      │
│  ┌──────────────┐   │  Sync   │  ┌───────────────┐  │
│  │  GAS Client  │───┼────────▶│  │  doPost()     │  │
│  └──────────────┘   │         │  └───────────────┘  │
│                     │         │                      │
│  API: /api/gas      │         │  Functions:          │
│  - sync_patient     │         │  - loginUser()       │
│  - sync_report      │         │  - getPatients()     │
│  - health_check     │         │  - processDocument() │
└─────────────────────┘         └──────────────────────┘
```

## Setup

### 1. Environment Configuration

Add to your `.env.local` file:

```bash
# Google Apps Script Integration
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
ENABLE_GAS_INTEGRATION=true
```

**Getting the URL:**
1. Open Google Apps Script project
2. Click **Deploy** → **New deployment**
3. Select **Web app** as type
4. Set **Execute as**: Me
5. Set **Who has access**: Anyone (or as needed)
6. Click **Deploy**
7. Copy the **Web app URL**

### 2. GAS Deployment

The Google Apps Script is already deployed at:
```
https://script.google.com/macros/s/AKfycbz5I5uGmK3f-_k7pi9HMsW1YMANS8NGnC8-kIDxcEB1vesYXpmwNHRnQRGX_GqV19iWJw/exec
```

To redeploy or update:
1. Open the Google Apps Script project
2. Make changes to `Code.gs`, `API.gs`, or HTML files
3. Click **Deploy** → **Manage deployments**
4. Click **Edit** on the active deployment
5. Update version to **New version**
6. Click **Deploy**

### 3. Permissions

The GAS deployment requires:
- Google Cloud Vision API access (for OCR)
- OpenAI API access (for interpretation)
- Google Sheets access (for database)

Set Script Properties in GAS:
1. Open **Project Settings** → **Script Properties**
2. Add:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `GOOGLE_CLOUD_CREDENTIALS`: Service account JSON (as string)

## Usage

### Health Check

Check if GAS endpoint is accessible:

```bash
curl http://localhost:3000/api/gas
```

Response:
```json
{
  "success": true,
  "gas": {
    "healthy": true,
    "status": 200,
    "message": "GAS endpoint is accessible",
    "enabled": true,
    "url": "https://script.google.com/..."
  }
}
```

### Sync Patient to GAS

```javascript
// From your Next.js app
const response = await fetch('/api/gas', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'sync_patient',
    data: {
      patient: {
        id: 'patient-123',
        mrn: '123456',
        name: 'John Doe',
        age: 65,
        gender: 'M',
        chiefComplaint: 'Chest pain',
        admissionDate: '2024-01-10',
        status: 'stable'
      }
    }
  })
});

const result = await response.json();
```

### Sync Report to GAS

```javascript
const response = await fetch('/api/gas', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'sync_report',
    data: {
      report: {
        id: 'report-456',
        type: 'lab',
        imageData: 'base64-encoded-image-or-text',
        ocrText: 'Extracted text...'
      }
    }
  })
});
```

## Using the Demo HTML

The `demo.html` file can connect to the real GAS endpoint:

1. Open `demo.html` in a text editor
2. Find the `CONFIG` section at the top of the `<script>` tag
3. Update the configuration:

```javascript
const CONFIG = {
  // Set to true to use real Google Apps Script endpoint
  USE_REAL_API: true,

  // Your deployed GAS URL
  GAS_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',

  // Set to false when using real API
  DEMO_MODE: false
};
```

4. Open `demo.html` in a browser
5. The badge will show "🔗 CONNECTED TO GAS" instead of "📱 DEMO MODE"

## API Reference

### Library Functions

Located in `/lib/integrations/google-apps-script.js`:

#### `isGASEnabled()`
Check if GAS integration is enabled.

```javascript
import { isGASEnabled } from '@/lib/integrations/google-apps-script';

if (isGASEnabled()) {
  // GAS integration is active
}
```

#### `checkGASHealth()`
Health check for GAS endpoint.

```javascript
import { checkGASHealth } from '@/lib/integrations/google-apps-script';

const health = await checkGASHealth();
console.log(health.healthy); // true/false
```

#### `syncPatientToGAS(token, patient)`
Sync patient to Google Sheets.

```javascript
import { syncPatientToGAS } from '@/lib/integrations/google-apps-script';

const result = await syncPatientToGAS(token, patient);
if (result.success) {
  console.log('Patient synced:', result.action); // 'created' or 'none'
}
```

#### `syncReportToGAS(token, report)`
Process and sync report to GAS.

```javascript
import { syncReportToGAS } from '@/lib/integrations/google-apps-script';

const result = await syncReportToGAS(token, report);
if (result.success) {
  console.log('Report processed and synced');
}
```

### API Endpoints

#### `GET /api/gas`
Health check endpoint.

**Response:**
```json
{
  "success": true,
  "gas": {
    "healthy": true,
    "status": 200,
    "message": "GAS endpoint is accessible",
    "enabled": true,
    "url": "https://script.google.com/..."
  }
}
```

#### `POST /api/gas`
Sync data or perform actions.

**Request:**
```json
{
  "action": "sync_patient|sync_report|health_check",
  "data": {
    "patient": { /* patient object */ },
    "report": { /* report object */ }
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "sync_patient",
  "result": {
    "success": true,
    "message": "Patient synced",
    "action": "created"
  }
}
```

## GAS Functions

The Google Apps Script provides these server-side functions:

### `loginUser(username)`
Login or create user.

```javascript
// Called from HTML frontend via google.script.run
google.script.run
  .withSuccessHandler(onSuccess)
  .loginUser(username);
```

### `getPatients(token)`
Get all patients for authenticated user.

### `createPatient(token, patientData)`
Create new patient.

### `processDocument(token, imageData, reportType)`
Process medical document:
1. OCR with Google Cloud Vision
2. AI interpretation with OpenAI
3. Generate clinical pearls
4. Generate teaching questions
5. Save to Google Sheets

## Data Storage

### Google Sheets Structure

The GAS version uses three sheets:

#### 1. `users` Sheet
| id | username | createdAt |
|----|----------|-----------|
| uuid | string | timestamp |

#### 2. `patients` Sheet
| id | userId | mrn | name | age | gender | chiefComplaint | admissionDate | status | createdAt |
|----|--------|-----|------|-----|--------|----------------|---------------|--------|-----------|

#### 3. `reports` Sheet
| id | userId | type | ocrText | interpretation | pearls | questions | createdAt |
|----|--------|------|---------|----------------|--------|-----------|-----------|

## Troubleshooting

### GAS endpoint returns 403

**Issue:** The GAS web app has access restrictions.

**Solution:**
1. Open GAS project → **Deploy** → **Manage deployments**
2. Click **Edit** on active deployment
3. Set **Who has access** to "Anyone" or appropriate setting
4. Click **Deploy**

### GAS integration not working

**Check:**
1. `ENABLE_GAS_INTEGRATION=true` in `.env.local`
2. `GOOGLE_APPS_SCRIPT_URL` is correct
3. GAS deployment is active (not archived)
4. Script Properties are set in GAS project

### Sync fails with authentication error

**Issue:** Token is invalid or missing.

**Solution:**
- Ensure you're passing the JWT token from Next.js app
- Token is passed in `Authorization` header
- Token has not expired (check JWT_SECRET)

## Security Considerations

1. **Access Control**: Set appropriate access levels in GAS deployment
2. **Token Validation**: GAS implements token verification
3. **Audit Logging**: All sync operations are logged in Next.js app
4. **Data Privacy**: Be cautious with PHI in Google Sheets
5. **API Keys**: Store API keys in Script Properties, not in code

## Performance

- **Sync is optional**: GAS integration doesn't affect Next.js app performance
- **Async operations**: Syncs happen asynchronously
- **No blocking**: Failed syncs don't block user operations
- **Retry logic**: Consider implementing retry for failed syncs

## Best Practices

1. **Enable for backup only**: Use Next.js as primary, GAS as backup
2. **Sync periodically**: Don't sync every operation (rate limits)
3. **Monitor health**: Check `/api/gas` endpoint regularly
4. **Log all syncs**: Use audit log for tracking
5. **Handle failures gracefully**: Don't show errors to users for sync failures

## Future Enhancements

- [ ] Bidirectional sync (pull data from GAS to Next.js)
- [ ] Conflict resolution for concurrent updates
- [ ] Batch sync operations
- [ ] Webhook notifications from GAS to Next.js
- [ ] Real-time sync with WebSockets
- [ ] Selective sync (only changed records)
- [ ] Sync queue with retry mechanism

## Support

For issues with:
- **Next.js integration**: Check `/lib/integrations/google-apps-script.js`
- **GAS deployment**: Check `google-apps-script/DEPLOY.md`
- **API routes**: Check `/app/api/gas/route.js`
- **Demo HTML**: Check `demo.html` CONFIG section
