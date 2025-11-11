# Claude Code Assistant Guide

This file provides guidance for AI assistants working with the Personal Trainer Content Subscription Platform codebase.

## Project Overview

**Type**: Full-stack web application (MERN stack)
**Purpose**: Personal trainer content subscription platform with tiered access
**Deployment**: Vercel (serverless) + MongoDB Atlas + Cloudinary
**Payment**: Stripe subscriptions

### Key Features
- Three-tier subscription system (public, free subscriber, premium)
- JWT-based authentication
- Content management with access controls
- File uploads (images, videos, PDFs) via Cloudinary
- Stripe payment integration
- Serverless architecture for Vercel deployment

## Architecture

### Dual Setup: Local Development + Serverless Production

This project has TWO ways to run:

1. **Local Development**: Traditional Express server (`backend/server.js`)
2. **Production (Vercel)**: Serverless functions (`/api` directory)

The `/api` directory contains Vercel serverless functions that mirror the Express routes but are optimized for serverless execution.

### Directory Structure

```
trainer-app/
├── api/                      # Vercel serverless functions (PRODUCTION)
│   ├── auth/                 # Authentication endpoints
│   ├── posts/                # Content CRUD operations
│   └── subscription/         # Stripe subscription handling
├── backend/                  # Express server (LOCAL DEVELOPMENT)
│   ├── models/               # Mongoose schemas
│   ├── config/               # Database & Cloudinary config
│   ├── middleware/           # Auth middleware
│   ├── routes/               # Express routes (for local dev)
│   └── server.js             # Express server
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── context/          # Auth context
│   │   ├── pages/            # Page components
│   │   └── App.js
│   └── public/
├── vercel.json               # Vercel deployment config
└── [Documentation files]
```

## Important Files

### Configuration Files

**`vercel.json`**
- Configures Vercel deployment
- Defines build settings and routes
- Maps `/api` routes to serverless functions
- DO NOT modify unless changing deployment architecture

**`backend/.env` (local only, not in git)**
- Environment variables for local development
- Use `backend/.env.example` as template

**Environment Variables Required**:
```
MONGODB_URI          - MongoDB Atlas connection string
JWT_SECRET           - Random secure string (32+ chars)
STRIPE_SECRET_KEY    - Stripe secret key (sk_test_ or sk_live_)
STRIPE_PUBLISHABLE_KEY - Stripe publishable key
STRIPE_WEBHOOK_SECRET  - Stripe webhook signing secret
STRIPE_PRICE_ID      - Stripe Price ID for subscription
CLIENT_URL           - Frontend URL (Vercel deployment URL)
CLOUDINARY_CLOUD_NAME - Cloudinary cloud name
CLOUDINARY_API_KEY   - Cloudinary API key
CLOUDINARY_API_SECRET - Cloudinary API secret
```

### Core Models

**`backend/models/User.js`**
- User schema with subscription information
- Fields: email, password (hashed), name, role, subscriptionTier, stripeCustomerId, etc.
- Roles: 'user', 'trainer', 'admin'
- Subscription tiers: 'none', 'free', 'paid'
- Pre-save hook for password hashing
- Method: `comparePassword()` for authentication

**`backend/models/Post.js`**
- Post/content schema
- Fields: title, content, excerpt, accessLevel, contentType, media, author, tags
- Access levels: 'public', 'free', 'paid'
- Content types: 'text', 'image', 'video', 'pdf', 'mixed'
- Media array stores Cloudinary URLs

### Authentication Flow

**JWT-based authentication**:
1. User registers/logs in → receives JWT token
2. Token stored in localStorage (frontend)
3. Token sent in `Authorization: Bearer <token>` header
4. Serverless functions verify token using `backend/middleware/auth.js` logic
5. User object attached to request for authorization checks

**Middleware**: `backend/middleware/auth.js`
- `auth()`: Verifies JWT token, attaches user to request
- `isTrainer()`: Checks if user has trainer/admin role
- `checkAccess(level)`: Checks subscription tier access

### File Upload System

**Important**: Uses Cloudinary, NOT local storage

**Flow**:
1. Frontend: Convert file to base64 (`CreatePost.js`)
2. Send to `/api/posts/upload` with base64 data
3. Backend: Upload to Cloudinary using `backend/config/cloudinary.js`
4. Store Cloudinary URL in Post.media array
5. Frontend displays from Cloudinary CDN

**File types supported**: Images (jpg, png, gif), Videos (mp4, mov, avi), PDFs

**Max file size**: 100MB (Cloudinary free tier limit)

### Stripe Integration

**Subscription Flow**:
1. User clicks "Upgrade to Premium"
2. Frontend calls `/api/subscription/create-checkout`
3. Backend creates Stripe Checkout Session
4. User redirected to Stripe-hosted checkout
5. After payment, Stripe redirects back with session ID
6. Stripe webhook (`/api/subscription/webhook`) updates user subscription

**Webhooks handle**:
- `checkout.session.completed`: Activate subscription
- `customer.subscription.updated`: Update subscription status
- `customer.subscription.deleted`: Cancel subscription
- `invoice.payment_failed`: Mark as past_due

**Test card**: `4242 4242 4242 4242` (any future date, any CVC)

## Common Tasks

### Adding a New API Endpoint

**For Vercel deployment, you must create BOTH**:

1. **Serverless function** in `/api/` (for production)
2. **Express route** in `backend/routes/` (for local dev)

Example: Adding `/api/posts/like`

**Step 1**: Create serverless function
```javascript
// api/posts/like.js
const connectToDatabase = require('../../backend/config/database');
const Post = require('../../backend/models/Post');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    // Auth verification
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No authentication token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Your logic here
    const { postId } = req.body;
    const post = await Post.findById(postId);

    res.json({ success: true, post });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
```

**Step 2**: Add to Express routes (for local dev)
```javascript
// backend/routes/posts.js
router.post('/like', auth, async (req, res) => {
  // Same logic as serverless function
});
```

### Modifying User Schema

**IMPORTANT**: Changes to schemas affect both local AND production

1. Update schema in `backend/models/User.js` or `backend/models/Post.js`
2. Test locally first
3. Deploy to Vercel
4. Existing database documents will have old structure until updated
5. Consider migration strategy for existing data

### Adding Environment Variables

1. Add to `backend/.env.example` (for documentation)
2. Add to your local `backend/.env`
3. Add to Vercel environment variables:
   - Go to Vercel project → Settings → Environment Variables
   - Add for Production, Preview, AND Development
4. Redeploy for changes to take effect

### Testing Locally

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm start
```

Frontend: `http://localhost:3000`
Backend: `http://localhost:5000`

**Note**: Local dev uses Express server, not serverless functions

### Testing Serverless Functions Locally

```bash
# Install Vercel CLI
npm install -g vercel

# Run in dev mode
vercel dev
```

This simulates Vercel environment locally.

## Database Queries

### User Queries

```javascript
// Find user by email
const user = await User.findOne({ email: 'user@example.com' });

// Find users with paid subscription
const paidUsers = await User.find({ subscriptionTier: 'paid' });

// Update user role (make trainer)
await User.findByIdAndUpdate(userId, { role: 'trainer' });
```

### Post Queries

```javascript
// Get all public posts
const posts = await Post.find({
  published: true,
  accessLevel: 'public'
}).populate('author', 'name email');

// Get posts accessible to free subscriber
const posts = await Post.find({
  published: true,
  accessLevel: { $in: ['public', 'free'] }
});

// Get all posts (paid user)
const posts = await Post.find({ published: true });
```

## Access Control Logic

**Three-tier system**:
- `none` (0): Can view 'public' posts only
- `free` (1): Can view 'public' + 'free' posts
- `paid` (2): Can view all posts

**Implementation**:
```javascript
const accessLevels = { 'public': 0, 'free': 1, 'paid': 2 };
const tierLevels = { 'none': 0, 'free': 1, 'paid': 2 };

if (tierLevels[userTier] >= accessLevels[postAccessLevel]) {
  // User can access
} else {
  // Subscription required
}
```

## Frontend Architecture

### Context API

**AuthContext** (`frontend/src/context/AuthContext.js`):
- Manages authentication state
- Provides: `user`, `loading`, `login()`, `register()`, `logout()`, `subscribeFree()`
- Automatically fetches user on mount if token exists
- Stores JWT in localStorage

**Usage**:
```javascript
import { useAuth } from '../context/AuthContext';

const { user, isAuthenticated, isTrainer, login } = useAuth();
```

### Protected Routes

**ProtectedRoute component** protects pages requiring auth:
```javascript
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

// Trainer-only route
<Route path="/create-post" element={
  <ProtectedRoute trainerOnly>
    <CreatePost />
  </ProtectedRoute>
} />
```

### API Calls

**Pattern**: Use axios with auth headers (automatically set by AuthContext)

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Auth header automatically added by AuthContext
const response = await axios.get(`${API_URL}/posts`);
const response = await axios.post(`${API_URL}/posts/create`, postData);
```

## Common Errors & Solutions

### "MongoDB connection error"
**Cause**: Can't connect to MongoDB Atlas
**Solution**:
- Check MongoDB Atlas IP whitelist (should include `0.0.0.0/0`)
- Verify connection string in environment variables
- Ensure MongoDB Atlas cluster is running

### "Cloudinary upload failed"
**Cause**: Invalid Cloudinary credentials or quota exceeded
**Solution**:
- Verify Cloudinary credentials in Vercel environment variables
- Check Cloudinary dashboard for usage/quota
- Ensure file size is under limit

### "Stripe webhook signature verification failed"
**Cause**: Webhook secret mismatch
**Solution**:
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Check webhook endpoint URL is correct
- View webhook logs in Stripe Dashboard

### "CORS error" in production
**Cause**: `CLIENT_URL` not set correctly
**Solution**:
- Update `CLIENT_URL` environment variable to Vercel deployment URL
- Redeploy after updating

### "Function not found" on Vercel
**Cause**: Serverless function not found or misconfigured
**Solution**:
- Check file is in `/api` directory
- Verify `vercel.json` routing is correct
- Redeploy

## Deployment

### Local → Vercel

**Process**:
1. Make changes locally
2. Test with `npm run dev`
3. Commit: `git add . && git commit -m "Description"`
4. Push: `git push origin main`
5. Vercel automatically deploys (takes 2-3 minutes)

### Deployment Checklist

Before deploying new features:
- [ ] Test locally (backend + frontend)
- [ ] Check no `.env` files are committed
- [ ] Update documentation if needed
- [ ] Verify environment variables are in Vercel
- [ ] Test with Vercel CLI locally (`vercel dev`)
- [ ] Push to GitHub
- [ ] Monitor Vercel deployment logs
- [ ] Test on production URL

## Security Considerations

### Never Commit
- `.env` files (added to `.gitignore`)
- API keys or secrets
- Database credentials
- Stripe keys

### Password Handling
- Passwords hashed with bcrypt (salt rounds: 10)
- Never return password in API responses
- Use `.select('-password')` when querying users

### JWT Tokens
- Set expiration: 7 days
- Store only in localStorage (not cookies for this implementation)
- Validate on every protected route

### File Uploads
- Validate file types before upload
- Limit file size (100MB max)
- Sanitize filenames
- Use Cloudinary's secure upload

### Stripe
- Never expose secret key in frontend
- Always verify webhook signatures
- Use test mode for development
- Validate amounts server-side

## Testing

### Manual Testing Workflow

**User Flow**:
1. Register new account → verify JWT received
2. Login → verify user data loads
3. Subscribe free → verify tier updates
4. View free content → verify access granted
5. Attempt paid content → verify blocked
6. Upgrade to premium → verify Stripe checkout
7. Complete payment → verify subscription activates
8. View premium content → verify access granted

**Trainer Flow**:
1. Manually update user role to 'trainer' in MongoDB
2. Login → verify "Create Post" appears
3. Create post with text → verify saves
4. Upload image → verify Cloudinary upload
5. Upload video → verify Cloudinary upload
6. Set access levels → verify filtering works

### Test Cards (Stripe)

**Success**: `4242 4242 4242 4242`
**Decline**: `4000 0000 0000 0002`
**Requires 3D Secure**: `4000 0027 6000 3184`

Any future expiry, any 3-digit CVC

## Code Conventions

### File Naming
- React components: PascalCase (`CreatePost.js`)
- Utilities: camelCase (`database.js`)
- Routes/API: kebab-case for URLs, camelCase for files

### Imports Order
1. External libraries (react, axios, etc.)
2. Internal components/utilities
3. Styles/assets

### Error Handling
- Try-catch in all async functions
- Return meaningful error messages
- Log errors with `console.error()`
- Return 500 for server errors, 400 for client errors

### Comments
- Use comments for complex logic
- Explain "why" not "what"
- Document API endpoints with expected params

## Helpful Commands

```bash
# Install all dependencies (root, backend, frontend)
npm run install-all

# Run both servers concurrently
npm run dev

# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm start

# Deploy with Vercel CLI
vercel --prod

# View Vercel logs
vercel logs

# MongoDB connection test
cd backend && node -e "require('./config/database')().then(() => console.log('Connected!'))"
```

## Resources

### Documentation Files
- `README.md` - Project overview and setup
- `VERCEL_DEPLOYMENT.md` - Deployment guide
- `MONGODB_ATLAS_SETUP.md` - Database setup
- `DEPLOYMENT_CHANGES_SUMMARY.md` - Architecture changes
- `QUICKSTART.md` - Quick setup for local dev

### External Documentation
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Mongoose Docs](https://mongoosejs.com/docs/)
- [Stripe API Docs](https://stripe.com/docs/api)
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [React Router Docs](https://reactrouter.com/)

## Version Information

**Node.js**: 14+ required
**React**: 18.2.0
**Express**: 4.18.2
**Mongoose**: 7.6.3
**Stripe**: 13.10.0

## Key Principles When Assisting

1. **Understand dual architecture**: Changes often need to be made in BOTH `/api` (serverless) and `backend/routes` (local dev)

2. **Environment variables**: Always check if new features need env vars in BOTH local `.env` AND Vercel

3. **Database connection**: Use `connectToDatabase()` in serverless functions for connection pooling

4. **CORS**: All serverless functions need CORS headers

5. **Security first**: Never expose secrets, always validate user input

6. **Test locally first**: Changes should work with Express server before deploying

7. **Documentation**: Update relevant docs when making significant changes

## When Helping Users

### Common User Requests

**"Add a new feature"**
→ Ask about: authentication requirements, database changes, frontend/backend needs
→ Remember to create both serverless function AND Express route

**"Fix deployment error"**
→ Check: Vercel logs, environment variables, `vercel.json` config
→ Common causes: missing env vars, wrong API paths, database connection

**"How do I test payments?"**
→ Point to test card numbers
→ Explain webhook testing (use Stripe CLI or ngrok for local)

**"Upload isn't working"**
→ Check: Cloudinary credentials, file size, file type validation
→ Verify base64 conversion in frontend

### Best Practices for Assistance

1. Always read the full conversation context
2. Check existing files before suggesting new ones
3. Maintain consistency with existing code style
4. Test suggestions when possible
5. Explain the "why" behind solutions
6. Reference documentation files when relevant
7. Consider both local development and production deployment
8. Think about database implications (migrations, existing data)

---

**Remember**: This codebase is production-ready and deployed on Vercel. Changes affect real users if deployed to main branch!
