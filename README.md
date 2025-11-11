# Personal Trainer Content Subscription Platform

A full-stack web application for personal trainers to share content with tiered subscription access. Users can view public content, subscribe for free to access more content, or purchase a premium subscription for full access including videos, PDFs, and exclusive material.

## 🚀 Quick Start

**Want to deploy to Vercel?** Follow these guides in order:

1. 📖 **[What Changed for Vercel?](DEPLOYMENT_CHANGES_SUMMARY.md)** - Summary of all deployment changes
2. 🗄️ **[MongoDB Atlas Setup](MONGODB_ATLAS_SETUP.md)** - Set up your cloud database (15 min)
3. ☁️ **[Vercel Deployment](VERCEL_DEPLOYMENT.md)** - Deploy to production (30 min)

**For local development**, see the [Installation & Setup](#installation--setup) section below.

## Features

### For Users
- **Three-tier access system:**
  - **Public**: Free access to public content
  - **Free Subscriber**: Access to public and free subscriber content
  - **Premium Member**: Full access to all content including videos, PDFs, and exclusive material

- **User Authentication**: Secure JWT-based authentication
- **Content Browsing**: Browse and view posts based on subscription level
- **Subscription Management**: Upgrade, downgrade, or cancel subscriptions
- **Stripe Integration**: Secure payment processing for premium subscriptions

### For Trainers
- **Content Management**: Create, edit, and delete posts
- **Multi-media Support**: Upload images, videos, and PDFs
- **Access Control**: Set access levels for each post (public, free, paid)
- **Rich Content**: Create detailed posts with text, media, and tags

## Tech Stack

### Backend (Serverless on Vercel)
- **Node.js** with **Vercel Serverless Functions**
- **MongoDB Atlas** (Cloud Database)
- **JWT** for authentication
- **Stripe** for payment processing
- **Cloudinary** for file uploads (images, videos, PDFs)
- **bcryptjs** for password hashing

### Frontend
- **React** with React Router
- **Axios** for API calls
- **Stripe.js** for checkout integration
- **Context API** for state management

### Deployment
- **Vercel** for hosting (frontend + serverless backend)
- **MongoDB Atlas** for database
- **Cloudinary** for media storage
- **Stripe** for payments

## Deployment

**Ready to deploy to Vercel?** Follow these guides:

1. **[MongoDB Atlas Setup Guide](MONGODB_ATLAS_SETUP.md)** - Set up your cloud database
2. **[Vercel Deployment Guide](VERCEL_DEPLOYMENT.md)** - Deploy to production with Vercel

The app is configured for Vercel deployment with:
- Serverless API routes
- MongoDB Atlas integration
- Cloudinary for file storage
- Stripe payment processing

## Project Structure

```
trainer-app/
├── api/                      # Vercel Serverless Functions
│   ├── auth/
│   │   ├── register.js      # User registration
│   │   ├── login.js         # User login
│   │   ├── me.js            # Get current user
│   │   └── subscribe-free.js # Free subscription
│   ├── posts/
│   │   ├── index.js         # List posts
│   │   ├── [id].js          # Get/Update/Delete post
│   │   ├── create.js        # Create post
│   │   └── upload.js        # Upload files to Cloudinary
│   └── subscription/
│       ├── pricing.js       # Get pricing info
│       ├── create-checkout.js # Stripe checkout
│       ├── webhook.js       # Stripe webhooks
│       ├── status.js        # Subscription status
│       └── cancel.js        # Cancel subscription
├── backend/
│   ├── models/
│   │   ├── User.js          # User schema
│   │   └── Post.js          # Post schema
│   ├── config/
│   │   ├── database.js      # MongoDB connection (serverless)
│   │   └── cloudinary.js    # Cloudinary config
│   ├── middleware/
│   │   └── auth.js          # JWT verification
│   ├── routes/              # Original Express routes (for local dev)
│   └── server.js            # Express server (for local dev)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── App.js
│   └── package.json
├── vercel.json              # Vercel configuration
├── VERCEL_DEPLOYMENT.md     # Deployment guide
└── MONGODB_ATLAS_SETUP.md   # Database setup guide
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Stripe account (for payment processing)

### 1. Clone the repository
```bash
cd trainer-app
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/trainer-app
JWT_SECRET=your_secret_key_here_change_in_production
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID=price_your_price_id
CLIENT_URL=http://localhost:3000
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Create a product and price in Stripe Dashboard:
   - Go to Products → Add Product
   - Set the price (e.g., $29.99/month)
   - Copy the Price ID and add it to your backend `.env` file

4. Set up Stripe Webhooks:
   - Go to Developers → Webhooks
   - Add endpoint: `http://localhost:5000/api/subscription/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy the webhook secret to your `.env` file

### 5. Database Setup

Make sure MongoDB is running locally, or update the `MONGODB_URI` in your `.env` to point to MongoDB Atlas.

### 6. Create a Trainer Account

After starting the application, you'll need to manually update a user's role to 'trainer' in MongoDB:

```javascript
// In MongoDB shell or Compass
db.users.updateOne(
  { email: "trainer@example.com" },
  { $set: { role: "trainer" } }
)
```

## Running the Application

### Start Backend Server
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

### Start Frontend Development Server
```bash
cd frontend
npm start
# Application runs on http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/subscribe-free` - Subscribe to free tier

### Posts
- `GET /api/posts` - Get all posts (filtered by access level)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post (trainer only)
- `PUT /api/posts/:id` - Update post (trainer only)
- `DELETE /api/posts/:id` - Delete post (trainer only)
- `POST /api/posts/:id/upload` - Upload media to post (trainer only)

### Subscription
- `GET /api/subscription/pricing` - Get pricing information
- `POST /api/subscription/create-checkout-session` - Create Stripe checkout
- `POST /api/subscription/webhook` - Stripe webhook handler
- `POST /api/subscription/cancel` - Cancel subscription
- `GET /api/subscription/status` - Get subscription status

## User Roles

### User (Default)
- Can view content based on subscription tier
- Can subscribe for free
- Can purchase premium subscription

### Trainer
- All user permissions
- Can create, edit, and delete posts
- Can upload media files
- Can set access levels for content

### Admin
- All trainer permissions
- Full system access

## Subscription Tiers

| Tier | Price | Access |
|------|-------|--------|
| None | Free | Public content only |
| Free Subscriber | Free | Public + Free subscriber content |
| Premium Member | $29.99/month | All content including premium videos and PDFs |

## Content Access Levels

- **Public**: Available to everyone (no login required)
- **Free**: Requires free subscription
- **Paid**: Requires premium subscription

## File Upload Support

The platform supports uploading:
- **Images**: JPEG, JPG, PNG, GIF
- **Videos**: MP4, MOV, AVI
- **Documents**: PDF

Maximum file size: 100MB per file

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected API routes
- Role-based access control
- Secure file upload validation
- Stripe webhook signature verification

## Development Notes

### Testing Stripe Integration
Use Stripe test mode with test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

### Environment Variables
Never commit `.env` files to version control. Always use `.env.example` as a template.

### MongoDB Indexes
The Post model includes an index on `{ accessLevel: 1, published: 1, createdAt: -1 }` for efficient queries.

## Future Enhancements

- Email notifications for new content
- Comments and likes on posts
- User favorites/bookmarks
- Video streaming optimization
- Mobile app (React Native)
- Analytics dashboard for trainers
- Multiple trainer support
- Referral program
- Discount codes

## Troubleshooting

### CORS Issues
Make sure `CLIENT_URL` in backend `.env` matches your frontend URL.

### Stripe Webhooks Not Working
- Check that your webhook endpoint is publicly accessible (use ngrok for local testing)
- Verify the webhook secret matches your Stripe dashboard
- Check webhook event logs in Stripe Dashboard

### File Uploads Failing
- Ensure the `uploads/` directory exists in the backend folder
- Check file size limits
- Verify file types are allowed

## License

MIT

## Support

For issues and questions, please open an issue in the repository.
