const mongoose = require('mongoose');

const ALERT_TYPES = ['restock', 'price_drop'];
const ALERT_STATUSES = ['ACTIVE', 'TRIGGERED', 'CANCELLED'];

const AlertSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ALERT_TYPES,
      required: true,
    },
    // For price_drop: absolute target price (takes precedence over dropPercent)
    targetPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    // For price_drop: percentage drop from current price at subscription time
    dropPercent: {
      type: Number,
      min: 1,
      max: 99,
      default: null,
    },
    // Snapshot of price at subscription time; used to compute % drop threshold
    priceAtSubscription: {
      type: Number,
      min: 0,
      default: null,
    },
    status: {
      type: String,
      enum: ALERT_STATUSES,
      default: 'ACTIVE',
      index: true,
    },
    lastTriggeredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Enforce one active subscription per user+product+type combo
AlertSubscriptionSchema.index({ userId: 1, productId: 1, type: 1 }, { unique: true });

AlertSubscriptionSchema.statics.ALERT_TYPES = ALERT_TYPES;
AlertSubscriptionSchema.statics.ALERT_STATUSES = ALERT_STATUSES;

module.exports = mongoose.model('AlertSubscription', AlertSubscriptionSchema);
