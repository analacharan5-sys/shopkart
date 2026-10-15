import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Customer } from '../models/customer.model.js';
import { Order } from '../models/order.model.js';

const DATA_DIR = path.resolve('./data');
const CUSTOMERS_FILE = path.join(DATA_DIR, 'saved_customers.json');
const ORDERS_FILE = path.join(DATA_DIR, 'saved_orders.json');

// Ensure data folder exists
const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

// Read JSON file safely
const readJson = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content || '[]');
    }
  } catch (err) {
    console.warn(`Error reading ${filePath}:`, err.message);
  }
  return [];
};

// Write JSON file safely
const writeJson = (filePath, data) => {
  try {
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error saving to ${filePath}:`, err.message);
  }
};

// Sync customer document to persistent disk file
export const syncCustomerToDisk = async (customer) => {
  try {
    if (!customer) return;
    const doc = customer.toObject ? customer.toObject() : customer;
    const customers = readJson(CUSTOMERS_FILE);
    const index = customers.findIndex(
      (c) => c._id?.toString() === doc._id?.toString() || c.email === doc.email
    );

    if (index >= 0) {
      customers[index] = doc;
    } else {
      customers.push(doc);
    }

    writeJson(CUSTOMERS_FILE, customers);
  } catch (err) {
    console.error('Failed to sync customer to disk:', err.message);
  }
};

// Sync order document to persistent disk file
export const syncOrderToDisk = async (order) => {
  try {
    if (!order) return;
    const doc = order.toObject ? order.toObject() : order;
    const orders = readJson(ORDERS_FILE);
    const index = orders.findIndex((o) => o._id?.toString() === doc._id?.toString());

    if (index >= 0) {
      orders[index] = doc;
    } else {
      orders.push(doc);
    }

    writeJson(ORDERS_FILE, orders);
  } catch (err) {
    console.error('Failed to sync order to disk:', err.message);
  }
};

// Restore all saved customers and orders on server startup
export const restorePersistentData = async () => {
  try {
    ensureDataDir();

    // 1. Restore Customers
    const savedCustomers = readJson(CUSTOMERS_FILE);
    let restoredCustomerCount = 0;

    for (const c of savedCustomers) {
      const existing = await Customer.findOne({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(c._id) ? c._id : new mongoose.Types.ObjectId() },
          { email: c.email }
        ]
      });

      if (!existing && c.email && c.password) {
        const customerToInsert = {
          ...c,
          _id: mongoose.Types.ObjectId.isValid(c._id)
            ? new mongoose.Types.ObjectId(c._id)
            : new mongoose.Types.ObjectId(),
          cart: (c.cart || []).map((item) => ({
            ...item,
            product: mongoose.Types.ObjectId.isValid(item.product)
              ? new mongoose.Types.ObjectId(item.product)
              : item.product
          })),
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date()
        };

        // Use Customer.collection.insertOne to preserve the existing bcrypt hash without re-hashing
        await Customer.collection.insertOne(customerToInsert);
        restoredCustomerCount++;
      }
    }

    if (restoredCustomerCount > 0) {
      console.log(`💾 Restored ${restoredCustomerCount} persistent customer account(s) from disk.`);
    }

    // 2. Restore Orders
    const savedOrders = readJson(ORDERS_FILE);
    let restoredOrderCount = 0;

    for (const o of savedOrders) {
      const existing = await Order.findById(o._id);
      if (!existing && o.user && o.items) {
        const orderToInsert = {
          ...o,
          _id: mongoose.Types.ObjectId.isValid(o._id)
            ? new mongoose.Types.ObjectId(o._id)
            : new mongoose.Types.ObjectId(),
          user: mongoose.Types.ObjectId.isValid(o.user)
            ? new mongoose.Types.ObjectId(o.user)
            : o.user,
          items: (o.items || []).map((item) => ({
            ...item,
            product: mongoose.Types.ObjectId.isValid(item.product)
              ? new mongoose.Types.ObjectId(item.product)
              : item.product
          })),
          createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
          updatedAt: o.updatedAt ? new Date(o.updatedAt) : new Date()
        };

        await Order.collection.insertOne(orderToInsert);
        restoredOrderCount++;
      }
    }

    if (restoredOrderCount > 0) {
      console.log(`💾 Restored ${restoredOrderCount} persistent order(s) from disk.`);
    }
  } catch (err) {
    console.error('Error restoring persistent data from disk:', err.message);
  }
};
