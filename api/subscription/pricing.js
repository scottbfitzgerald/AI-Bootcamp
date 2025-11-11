module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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
        priceId: process.env.STRIPE_PRICE_ID || 'price_xxxxx',
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
};
