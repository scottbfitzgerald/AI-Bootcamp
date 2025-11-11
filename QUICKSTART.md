# Quick Start Guide

Get your Personal Trainer Content Platform up and running in 5 minutes!

## Prerequisites

Make sure you have installed:
- Node.js (v14+)
- MongoDB (running locally or MongoDB Atlas account)
- Stripe account (for payment processing)

## Step 1: Install Dependencies

```bash
cd trainer-app
npm install
npm run install-all
```

## Step 2: Configure Backend

1. Copy the example environment file:
```bash
cd backend
cp .env.example .env
```

2. Edit `backend/.env` and update:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/trainer-app
JWT_SECRET=your_secret_key_change_this
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
STRIPE_PRICE_ID=price_your_price_id
CLIENT_URL=http://localhost:3000
```

### Getting Stripe Keys:
1. Go to [stripe.com](https://stripe.com) and sign up
2. Switch to Test Mode (toggle in top right)
3. Go to Developers → API Keys
4. Copy Secret Key and Publishable Key
5. Create a Product → Add Price ($29.99/month)
6. Copy the Price ID (starts with `price_`)

## Step 3: Configure Frontend

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Step 4: Start MongoDB

### Option A: Local MongoDB
```bash
mongod
```

### Option B: MongoDB Atlas
Update `MONGODB_URI` in `backend/.env` with your Atlas connection string.

## Step 5: Run the Application

From the root `trainer-app` directory:

```bash
npm run dev
```

This will start both:
- Backend server on `http://localhost:5000`
- Frontend on `http://localhost:3000`

## Step 6: Create Your First Account

1. Open `http://localhost:3000` in your browser
2. Click "Register" and create an account
3. Login with your credentials

## Step 7: Make Yourself a Trainer

To create posts, you need trainer role. In MongoDB:

### Using MongoDB Compass:
1. Connect to your database
2. Find the `users` collection
3. Find your user by email
4. Edit and change `role` from `"user"` to `"trainer"`
5. Save

### Using MongoDB Shell:
```javascript
use trainer-app
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "trainer" } }
)
```

## Step 8: Start Creating Content!

1. Refresh the page - you should now see "Create Post" in the navbar
2. Click "Create Post"
3. Create your first piece of content
4. Set the access level (public, free, or paid)
5. Upload images, videos, or PDFs if desired
6. Publish!

## Testing Subscriptions

### Free Subscription:
1. Go to "Subscribe" page
2. Click "Subscribe Free"
3. Now you can access free subscriber content

### Paid Subscription:
1. Go to "Subscribe" page
2. Click "Upgrade to Premium"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Any future expiry date and any 3-digit CVC
5. Complete checkout

## Common Issues

### MongoDB Connection Error
- Make sure MongoDB is running
- Check your `MONGODB_URI` is correct

### CORS Error
- Ensure `CLIENT_URL` in backend `.env` is `http://localhost:3000`
- Restart the backend server

### Stripe Checkout Not Working
- Verify your Stripe keys are correct
- Make sure you're using test mode keys
- Check that `STRIPE_PRICE_ID` is set

### File Uploads Not Working
- The `backend/uploads/` directory is automatically created
- Check file size (max 100MB)
- Ensure file type is supported (images, videos, PDFs)

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the API endpoints
- Customize the styling in `frontend/src/App.css`
- Set up Stripe webhooks for production
- Deploy to production (Heroku, Vercel, DigitalOcean, etc.)

## Development Tips

### Running Servers Separately

Backend only:
```bash
cd backend
npm run dev
```

Frontend only:
```bash
cd frontend
npm start
```

### View API Documentation

Visit `http://localhost:5000` to see available endpoints.

### Check Database

Use MongoDB Compass or shell to inspect your data:
```bash
mongo
use trainer-app
db.users.find()
db.posts.find()
```

## Need Help?

- Check the full [README.md](README.md)
- Review the API endpoints
- Check browser console for errors
- Check terminal for backend errors

Happy coding!
