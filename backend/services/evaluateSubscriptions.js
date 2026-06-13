const AlertSubscription = require('../models/alertSubscription');
const User = require('../models/user');
const { sendRestockEmail, sendPriceDropEmail } = require('./emailService');

/**
 * Evaluate all ACTIVE subscriptions for a given product and fire alerts when
 * thresholds are met. Uses findOneAndUpdate with $set for idempotent triggering —
 * only one process can win the race to set status=TRIGGERED per subscription.
 *
 * Called from:
 *  - product update hooks (price / stock changes)
 *  - daily cron sweep
 */
async function evaluateSubscriptions(product) {
  if (process.env.FEATURE_ALERTS !== 'true') return;
  if (!product || !product._id) return;

  const productId = product._id;
  const subs = await AlertSubscription.find({ productId, status: 'ACTIVE' });
  if (!subs.length) return;

  const promises = subs.map(sub => _evaluate(sub, product));
  await Promise.allSettled(promises);
}

async function _evaluate(sub, product) {
  try {
    let shouldFire = false;

    if (sub.type === 'restock') {
      shouldFire = Number(product.stock) > 0;
    } else if (sub.type === 'price_drop') {
      const currentPrice = Number(product.price);
      if (sub.targetPrice !== null && sub.targetPrice !== undefined) {
        shouldFire = currentPrice <= sub.targetPrice;
      } else if (sub.dropPercent !== null && sub.dropPercent !== undefined && sub.priceAtSubscription) {
        const threshold = sub.priceAtSubscription * (1 - sub.dropPercent / 100);
        shouldFire = currentPrice <= threshold;
      }
    }

    if (!shouldFire) return;

    // Idempotent: atomically claim the trigger slot
    const claimed = await AlertSubscription.findOneAndUpdate(
      { _id: sub._id, status: 'ACTIVE' },
      { $set: { status: 'TRIGGERED', lastTriggeredAt: new Date() } },
      { new: false }
    );

    // Another process already triggered it
    if (!claimed) return;

    const user = await User.findById(sub.userId).lean();
    if (!user) return;

    if (sub.type === 'restock') {
      await sendRestockEmail({
        to: user.email,
        productName: product.name,
        productId: product._id.toString(),
      });
    } else if (sub.type === 'price_drop') {
      await sendPriceDropEmail({
        to: user.email,
        productName: product.name,
        productId: product._id.toString(),
        price: product.price,
      });
    }
  } catch (err) {
    console.error(`[evaluateSubscriptions] Error processing sub ${sub._id}:`, err.message);
  }
}

module.exports = { evaluateSubscriptions };
