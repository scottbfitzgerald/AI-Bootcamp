const connectToDatabase = require('../../backend/config/database');
const User = require('../../backend/models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // For Vercel, the body is already parsed, we need raw body for webhook verification
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle different event types
  try {
    await connectToDatabase();

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleCheckoutComplete(session);
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        await handleSubscriptionUpdate(updatedSubscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        await handleSubscriptionCancel(deletedSubscription);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        await handlePaymentFailed(failedInvoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

// Handle successful checkout
async function handleCheckoutComplete(session) {
  const userId = session.metadata.userId;
  const user = await User.findById(userId);

  if (user) {
    user.subscriptionTier = 'paid';
    user.subscriptionStatus = 'active';
    user.stripeSubscriptionId = session.subscription;
    await user.save();
    console.log(`User ${userId} subscribed successfully`);
  }
}

// Handle subscription updates
async function handleSubscriptionUpdate(subscription) {
  const user = await User.findOne({ stripeSubscriptionId: subscription.id });

  if (user) {
    user.subscriptionStatus = subscription.status;
    if (subscription.current_period_end) {
      user.subscriptionEndDate = new Date(subscription.current_period_end * 1000);
    }
    await user.save();
    console.log(`Subscription ${subscription.id} updated`);
  }
}

// Handle subscription cancellation
async function handleSubscriptionCancel(subscription) {
  const user = await User.findOne({ stripeSubscriptionId: subscription.id });

  if (user) {
    user.subscriptionTier = 'free';
    user.subscriptionStatus = 'canceled';
    user.stripeSubscriptionId = null;
    await user.save();
    console.log(`Subscription ${subscription.id} canceled`);
  }
}

// Handle payment failures
async function handlePaymentFailed(invoice) {
  const user = await User.findOne({ stripeCustomerId: invoice.customer });

  if (user) {
    user.subscriptionStatus = 'past_due';
    await user.save();
    console.log(`Payment failed for user ${user._id}`);
  }
}
