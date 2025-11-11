const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get subscription pricing info
router.get('/pricing', (req, res) => {
  res.json({
    tiers: [
      {
        id: 'free',
        name: 'Free Subscriber',
        price: 0,
        features: [
          'Access to public content',
          'Access to free subscriber content',
          'Weekly newsletter'
        ]
      },
      {
        id: 'paid',
        name: 'Premium Member',
        price: 29.99,
        priceId: process.env.STRIPE_PRICE_ID || 'price_xxxxx', // Set in .env
        features: [
          'Access to all content',
          'Exclusive workout plans',
          'Meal prep guides',
          'Video tutorials',
          'Direct trainer support',
          'Downloadable PDFs'
        ]
      }
    ]
  });
});

// Create Stripe checkout session for paid subscription
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    const user = req.user;

    if (user.subscriptionTier === 'paid' && user.subscriptionStatus === 'active') {
      return res.status(400).json({ message: 'You already have an active paid subscription' });
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user._id.toString()
        }
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID || 'price_xxxxx', // Replace with your Stripe Price ID
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`,
      metadata: {
        userId: user._id.toString()
      }
    });

    res.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ message: 'Error creating checkout session', error: error.message });
  }
});

// Stripe webhook to handle subscription events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle different event types
  try {
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
});

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

// Cancel subscription
router.post('/cancel', auth, async (req, res) => {
  try {
    const user = req.user;

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ message: 'No active subscription found' });
    }

    // Cancel at period end to allow access until billing cycle ends
    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    res.json({
      message: 'Subscription will be canceled at the end of the billing period',
      endsAt: new Date(subscription.current_period_end * 1000)
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Error canceling subscription' });
  }
});

// Get subscription status
router.get('/status', auth, async (req, res) => {
  try {
    const user = req.user;

    let subscriptionDetails = null;

    if (user.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      subscriptionDetails = {
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      };
    }

    res.json({
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      details: subscriptionDetails
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ message: 'Error fetching subscription status' });
  }
});

module.exports = router;
