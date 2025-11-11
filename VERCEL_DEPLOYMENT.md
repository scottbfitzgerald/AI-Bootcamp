# Vercel Deployment Guide

Complete guide to deploying your Personal Trainer Content Platform to Vercel.

## Prerequisites

Before you begin, make sure you have:

- ✅ GitHub account
- ✅ Vercel account (sign up at [vercel.com](https://vercel.com))
- ✅ MongoDB Atlas cluster setup (see [MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md))
- ✅ Cloudinary account (see Cloudinary Setup section below)
- ✅ Stripe account with test mode enabled

## Part 1: Cloudinary Setup

Cloudinary handles file uploads (images, videos, PDFs) since Vercel's serverless functions are stateless.

### Step 1: Create Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Click **"Sign Up for Free"**
3. Create account with email or social login
4. Verify your email

### Step 2: Get Your Cloudinary Credentials

1. After logging in, go to your Dashboard
2. You'll see your credentials:
   - **Cloud Name**: (e.g., `dxyz123abc`)
   - **API Key**: (e.g., `123456789012345`)
   - **API Secret**: (click "eye" icon to reveal)

3. **Copy these values** - you'll need them for environment variables

### Step 3: Configure Upload Settings (Optional)

1. Go to **Settings** → **Upload**
2. Recommended settings:
   - **Upload Preset**: Create an unsigned preset for easier uploads
   - **File Size Limit**: Set to 100MB
   - **Allowed Formats**: jpg, png, gif, mp4, mov, avi, pdf

## Part 2: Stripe Configuration

### Step 1: Get Stripe Keys

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Toggle to **Test Mode** (switch in top right)
3. Go to **Developers** → **API Keys**
4. Copy:
   - **Publishable Key** (starts with `pk_test_`)
   - **Secret Key** (starts with `sk_test_`)

### Step 2: Create a Product and Price

1. Go to **Products** → **Add Product**
2. Product details:
   - **Name**: Premium Membership
   - **Description**: Full access to all trainer content
3. Pricing:
   - **Price**: $29.99
   - **Billing Period**: Monthly
   - **Recurring**: Yes
4. Click **"Save product"**
5. **Copy the Price ID** (starts with `price_`) - you'll need this!

### Step 3: Set Up Webhook (After Deployment)

You'll configure this after deploying to Vercel - bookmark this section to return to it.

## Part 3: GitHub Setup

### Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and log in
2. Click **"New repository"** (+ icon in top right)
3. Repository settings:
   - **Name**: `trainer-content-platform` (or your choice)
   - **Visibility**: Public or Private
   - **DO NOT** initialize with README (we already have files)
4. Click **"Create repository"**

### Step 2: Push Your Code to GitHub

Open terminal in your `trainer-app` directory and run:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Personal Trainer Content Platform"

# Add remote (replace with your GitHub username and repo name)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Verify your code is on GitHub by visiting your repository URL.

## Part 4: Vercel Deployment

### Step 1: Import Your Project

1. Go to [vercel.com](https://vercel.com) and log in
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Authorize Vercel to access your GitHub account (if first time)
5. Find and select your `trainer-content-platform` repository
6. Click **"Import"**

### Step 2: Configure Project Settings

On the import screen:

1. **Framework Preset**: Detect as "Other" or "Create React App" (auto-detected)
2. **Root Directory**: `./` (leave as is - monorepo setup)
3. **Build Settings**: Leave default (Vercel will use `vercel.json`)

### Step 3: Add Environment Variables

Click **"Environment Variables"** and add ALL of these:

#### Database
```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/trainer-app?retryWrites=true&w=majority
```

#### JWT
```
JWT_SECRET = your_random_secure_string_min_32_characters_long
```
Generate a secure secret: `openssl rand -base64 32`

#### Stripe
```
STRIPE_SECRET_KEY = sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY = pk_test_your_stripe_publishable_key
STRIPE_PRICE_ID = price_your_price_id_from_earlier
```

#### Cloudinary
```
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
```

#### Client URL (Leave blank for now - will update after deployment)
```
CLIENT_URL =
```

**Important**:
- Check **"Production"**, **"Preview"**, and **"Development"** for all variables
- Double-check NO SPACES around the `=` sign
- Click **"Add"** after each variable

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-5 minutes for build to complete
3. You'll see confetti 🎉 when deployment succeeds!

### Step 5: Get Your Deployment URL

1. Vercel will show your deployment URL (e.g., `https://trainer-content-platform.vercel.app`)
2. **Copy this URL** - you'll need it

### Step 6: Update CLIENT_URL Environment Variable

1. Go to your project dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Find `CLIENT_URL` and click **"Edit"**
4. Update value to your deployment URL:
   ```
   CLIENT_URL = https://your-app-name.vercel.app
   ```
5. Click **"Save"**
6. **Redeploy**: Go to **"Deployments"** → click ⋯ on latest → **"Redeploy"**

## Part 5: Configure Stripe Webhooks

Now that your app is deployed, set up Stripe webhooks for production.

### Step 1: Get Webhook URL

Your webhook URL is:
```
https://your-app-name.vercel.app/api/subscription/webhook
```

### Step 2: Add Webhook in Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click **"Add endpoint"**
4. Endpoint details:
   - **Endpoint URL**: `https://your-app.vercel.app/api/subscription/webhook`
   - **Description**: "Trainer App Subscription Events"
5. Click **"Select events"**
6. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
7. Click **"Add events"**
8. Click **"Add endpoint"**

### Step 3: Get Webhook Secret

1. Click on your newly created webhook
2. Under **"Signing secret"**, click **"Reveal"**
3. Copy the secret (starts with `whsec_`)

### Step 4: Add Webhook Secret to Vercel

1. Go back to Vercel project → **Settings** → **Environment Variables**
2. Add new variable:
   ```
   STRIPE_WEBHOOK_SECRET = whsec_your_webhook_secret
   ```
3. Click **"Save"**
4. **Redeploy** again for changes to take effect

## Part 6: Create Your First Trainer Account

### Step 1: Register a User

1. Visit your deployed app: `https://your-app.vercel.app`
2. Click **"Register"**
3. Create an account with your email

### Step 2: Make Yourself a Trainer

Since you're using MongoDB Atlas:

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Click **"Browse Collections"** on your cluster
3. Navigate to `trainer-app` database → `users` collection
4. Find your user (search by email)
5. Click **"Edit Document"** (pencil icon)
6. Change `"role": "user"` to `"role": "trainer"`
7. Click **"Update"**

### Step 3: Test Your App

1. Refresh your deployed app
2. You should now see **"Create Post"** in the navigation
3. Try creating a post!
4. Test file uploads (images, videos, PDFs)
5. Test free subscription
6. Test paid subscription with Stripe test card: `4242 4242 4242 4242`

## Part 7: Custom Domain (Optional)

### Add Your Own Domain

1. In Vercel project, go to **Settings** → **Domains**
2. Enter your domain (e.g., `trainercontent.com`)
3. Follow Vercel's instructions to update DNS records
4. After domain is verified:
   - Update `CLIENT_URL` environment variable to your custom domain
   - Update Stripe webhook URL to new domain
   - Redeploy

## Troubleshooting

### Build Fails

**Check the build logs** in Vercel deployment details:

Common issues:
- Missing environment variables
- Syntax errors in code
- Missing dependencies in `package.json`

### API Routes Not Working

**Symptoms**: 404 errors or "Function not found"

**Solutions**:
- Verify `vercel.json` is in root directory
- Check API route files are in `/api` directory
- Redeploy after making changes

### Database Connection Fails

**Symptoms**: "MongoDB connection error" in function logs

**Solutions**:
- Verify `MONGODB_URI` is correct and accessible
- Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Test connection string locally first

### Stripe Webhooks Not Working

**Symptoms**: Payments process but user subscription doesn't activate

**Solutions**:
- Verify webhook URL is correct in Stripe Dashboard
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe value
- View webhook logs in Stripe Dashboard for errors
- Check Vercel function logs for webhook errors

### File Uploads Fail

**Symptoms**: "Upload failed" error

**Solutions**:
- Verify all Cloudinary credentials are correct
- Check Cloudinary dashboard for upload quota
- Try with smaller files first (< 5MB)
- Check function logs for specific errors

### CORS Errors

**Symptoms**: "CORS policy" errors in browser console

**Solutions**:
- Verify `CLIENT_URL` environment variable matches your deployment URL
- Check CORS headers in API route files
- Redeploy after updating `CLIENT_URL`

## Monitoring & Logs

### View Function Logs

1. Go to Vercel project dashboard
2. Click **"Functions"** or **"Logs"**
3. See real-time logs from your serverless functions
4. Filter by function name or time range

### Monitor Performance

1. Go to **"Analytics"** in Vercel
2. View:
   - Page views
   - User sessions
   - Function execution time
   - Error rates

### Database Monitoring

1. In MongoDB Atlas, go to **"Metrics"**
2. Monitor:
   - Connection count
   - Operations per second
   - Storage usage

## Production Checklist

Before going live with real users:

- [ ] Switch Stripe from test mode to live mode
- [ ] Update all Stripe keys in Vercel environment variables
- [ ] Update webhook to use live mode webhook secret
- [ ] Set up custom domain
- [ ] Update `CLIENT_URL` to custom domain
- [ ] Test full user journey (register → subscribe → access content)
- [ ] Set up MongoDB backups
- [ ] Configure email notifications (optional - requires email service)
- [ ] Add privacy policy and terms of service
- [ ] Set up analytics (Google Analytics, Plausible, etc.)
- [ ] Test on mobile devices
- [ ] Set up error tracking (Sentry, LogRocket, etc.)

## Continuous Deployment

With GitHub + Vercel integration:

- **Every push to `main`** branch automatically deploys to production
- **Pull requests** get preview deployments
- **Branches** can have preview URLs

To deploy:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

Vercel will automatically rebuild and deploy!

## Costs

### Vercel
- **Hobby Plan**: Free (perfect for personal projects)
  - Serverless functions
  - Unlimited deployments
  - Custom domains
- **Pro Plan**: $20/month (for commercial use)

### MongoDB Atlas
- **M0 Free Tier**: $0 (512MB storage)
- **M10 Shared**: $9/month (2GB storage)

### Cloudinary
- **Free Tier**: $0
  - 25 GB storage
  - 25 GB bandwidth/month
- **Plus**: $89/month (more storage/bandwidth)

### Stripe
- No monthly fee
- 2.9% + $0.30 per successful charge

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [MongoDB Atlas Support](https://support.mongodb.com/)
- [Cloudinary Support](https://support.cloudinary.com/)
- [Stripe Support](https://support.stripe.com/)

## Congratulations! 🎉

Your Personal Trainer Content Platform is now live on Vercel!

Share your app URL and start creating content for your subscribers!
