# MongoDB Atlas Setup Guide

This guide will walk you through setting up MongoDB Atlas for your Personal Trainer Content Platform.

## Step 1: Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click **"Try Free"** or **"Sign Up"**
3. Create an account using:
   - Email and password, OR
   - Google account, OR
   - GitHub account

## Step 2: Create a New Cluster

1. After logging in, click **"Build a Database"**
2. Choose **"M0 FREE"** tier (perfect for development)
3. Select your preferred cloud provider:
   - **AWS** (recommended)
   - Google Cloud
   - Azure
4. Choose a region closest to your users or Vercel deployment region
5. Give your cluster a name (e.g., "trainer-app-cluster")
6. Click **"Create"**

Wait 1-3 minutes for your cluster to be provisioned.

## Step 3: Create a Database User

1. You'll see a security quickstart screen
2. Choose **"Username and Password"** authentication
3. Create a database user:
   - **Username**: `trainer-app-user` (or your choice)
   - **Password**: Click "Autogenerate Secure Password" and save it!
4. Click **"Create User"**

**IMPORTANT**: Save your password in a secure location. You'll need it for the connection string.

## Step 4: Configure Network Access

1. Still in the security quickstart, configure IP whitelist
2. For development, click **"Add My Current IP Address"**
3. For Vercel deployment, click **"Allow Access from Anywhere"**
   - This adds `0.0.0.0/0` (all IPs)
   - Safe because authentication is still required
4. Click **"Finish and Close"**

## Step 5: Get Your Connection String

1. Click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Select:
   - **Driver**: Node.js
   - **Version**: 4.1 or later
4. Copy the connection string - it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Update Your Connection String

Replace the placeholders in your connection string:

1. Replace `<username>` with your database username
2. Replace `<password>` with your database password
3. Add your database name before the `?`:

**Original:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**Updated:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trainer-app?retryWrites=true&w=majority
```

## Step 7: Add to Environment Variables

### For Local Development:

Create a `.env` file in your `backend/` directory:

```env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/trainer-app?retryWrites=true&w=majority
```

### For Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `MONGODB_URI`
   - **Value**: Your full connection string
   - **Environment**: Production, Preview, and Development

## Step 8: Test Your Connection

Run your application locally to test the connection:

```bash
cd backend
npm run dev
```

You should see:
```
✅ New database connection established
```

## Troubleshooting

### Connection Timeout Error

**Problem**: `MongoServerSelectionError: connection timed out`

**Solutions**:
- Check that your IP address is whitelisted in Network Access
- Try whitelisting `0.0.0.0/0` (all IPs)
- Verify your connection string is correct
- Check your firewall or VPN isn't blocking MongoDB Atlas

### Authentication Failed

**Problem**: `MongoServerError: bad auth : authentication failed`

**Solutions**:
- Double-check your username and password
- Make sure special characters in password are URL-encoded
  - Example: `p@ssw0rd!` should be `p%40ssw0rd%21`
- Verify the user exists in Database Access tab

### Database Name Not Created

**Problem**: Database doesn't appear in Atlas

**Solution**:
- The database is created automatically when you insert the first document
- Run your app and create a user to initialize the database
- Refresh the Atlas dashboard after a minute

## MongoDB Atlas Features

### Viewing Your Data

1. In Atlas dashboard, click **"Browse Collections"**
2. Select your database (`trainer-app`)
3. View collections: `users`, `posts`
4. You can manually edit, add, or delete documents here

### Monitoring

1. Click **"Metrics"** to see database performance
2. Monitor connections, operations, and storage usage

### Backups

Free tier includes:
- Cloud backups
- Point-in-time restores
- Download backup snapshots

### Upgrading

When you're ready for production:
1. Upgrade from M0 (free) to M10+ for:
   - Automatic backups
   - Higher performance
   - More storage
   - Priority support

## Security Best Practices

1. ✅ **Never commit your connection string to Git**
   - Always use `.env` files
   - Add `.env` to `.gitignore`

2. ✅ **Use strong passwords**
   - Use Atlas's auto-generated passwords
   - Store securely in password manager

3. ✅ **Limit IP access in production**
   - Whitelist only necessary IPs if possible
   - For Vercel, `0.0.0.0/0` is required (safe with auth)

4. ✅ **Rotate credentials periodically**
   - Update passwords every few months
   - Update in both Atlas and Vercel

5. ✅ **Use separate databases for dev/prod**
   - Development: `trainer-app-dev`
   - Production: `trainer-app`

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Connection String Format](https://docs.mongodb.com/manual/reference/connection-string/)
- [MongoDB Node.js Driver](https://mongodb.github.io/node-mongodb-native/)
- [Atlas Free Tier Limits](https://www.mongodb.com/pricing)

## Next Steps

After setting up MongoDB Atlas:
1. ✅ Update your `.env` file with the connection string
2. ✅ Test local connection
3. ✅ Add environment variable to Vercel
4. ✅ Proceed with Vercel deployment

Happy coding! 🚀
