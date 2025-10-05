const mongoose = require('mongoose');

const ORDER_STATUSES = [
  {
    code: 'ORDER_PLACED',
    label: 'Order placed',
    description: 'We received your order and secured the inventory in our warehouse.',
  },
  {
    code: 'PAYMENT_VERIFIED',
    label: 'Payment verified',
    description: 'Your payment cleared successfully and funds have been captured securely.',
  },
  {
    code: 'PICKING_ITEMS',
    label: 'Picking items',
    description: 'Our fulfillment team is picking each item and preparing the packaging.',
  },
  {
    code: 'QUALITY_CHECK',
    label: 'Quality assurance',
    description: 'Every component passes a quick diagnostics check before sealing the box.',
  },
  {
    code: 'PACKED_FOR_SHIPMENT',
    label: 'Packed for shipment',
    description: 'Packaging is sealed with tamper protection and awaiting carrier handoff.',
  },
  {
    code: 'HANDOFF_TO_CARRIER',
    label: 'Handed to carrier',
    description: 'Your parcel has been scanned by the carrier and is leaving our facility.',
  },
  {
    code: 'IN_TRANSIT',
    label: 'In transit',
    description: 'The shipment is moving through carrier hubs on the way to your region.',
  },
  {
    code: 'AT_LOCAL_DEPOT',
    label: 'Arrived locally',
    description: 'Your order reached the local distribution center and is being sorted.',
  },
  {
    code: 'OUT_FOR_DELIVERY',
    label: 'Out for delivery',
    description: 'A courier has your parcel on the truck and will attempt delivery today.',
  },
  {
    code: 'DELIVERED',
    label: 'Delivered',
    description: 'Delivery confirmed. Check your doorstep or reception area for the package.',
  },
  {
    code: 'DELIVERY_CONFIRMED',
    label: 'Delivery verified',
    description: 'Proof of delivery captured and your order is now closed. Enjoy your gear!',
  },
];

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
  },
  { _id: false }
);

const StatusEntrySchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String, required: true },
    enteredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, index: true },
    name: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    items: { type: [OrderItemSchema], default: [] },
    total: { type: Number, required: true, min: 0 },
    statusIndex: { type: Number, default: 0 },
    statusHistory: { type: [StatusEntrySchema], default: [] },
    estimatedDelivery: { type: Date },
  },
  { timestamps: true }
);

OrderSchema.methods.advanceStatus = function advanceStatus() {
  if (this.statusIndex >= ORDER_STATUSES.length - 1) {
    return false;
  }

  const remaining = ORDER_STATUSES.length - 1 - this.statusIndex;
  const maxJump = Math.min(2, remaining);
  const jump = Math.max(1, Math.floor(Math.random() * (maxJump + 1)));
  const targetIndex = Math.min(this.statusIndex + jump, ORDER_STATUSES.length - 1);

  const updates = [];
  for (let i = this.statusIndex + 1; i <= targetIndex; i += 1) {
    const meta = ORDER_STATUSES[i];
    updates.push({
      code: meta.code,
      label: meta.label,
      description: meta.description,
      enteredAt: new Date(),
    });
  }

  if (updates.length) {
    this.statusHistory.push(...updates);
    this.statusIndex = targetIndex;
    return true;
  }

  return false;
};

OrderSchema.methods.ensureInitialStatus = function ensureInitialStatus() {
  if (!this.statusHistory.length) {
    const initial = ORDER_STATUSES[0];
    this.statusHistory.push({
      code: initial.code,
      label: initial.label,
      description: initial.description,
      enteredAt: new Date(),
    });
    this.statusIndex = 0;
  }
};

OrderSchema.statics.STATUS_FLOW = ORDER_STATUSES;

module.exports = mongoose.model('Order', OrderSchema);
module.exports.STATUS_FLOW = ORDER_STATUSES;
