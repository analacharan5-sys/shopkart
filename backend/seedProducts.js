import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import { Product } from './models/product.model.js';
import { Customer } from './models/customer.model.js';

// Fix Windows DNS SRV lookup for MongoDB Atlas
dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopkart';

export const sampleProducts = [
  // Electronics
  {
    name: 'Noise Cancelling Headphones',
    description: 'Wireless over-ear headphones with active noise cancellation, 30-hour battery life, and ultra-comfortable memory foam earcups.',
    price: 4999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    stock: 25
  },
  {
    name: 'RGB Mechanical Keyboard',
    description: 'Tactile mechanical gaming keyboard with customizable per-key RGB lighting, blue clicky switches, and detachable USB-C cable.',
    price: 2999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    stock: 10
  },
  {
    name: 'Ergonomic Wireless Mouse',
    description: 'Precision wireless mouse with multi-device connectivity, hyper-fast scrolling wheel, and ergonomic thumb rest.',
    price: 1499,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80',
    stock: 18
  },
  {
    name: 'Ultra HD 4K Smart Monitor 27"',
    description: 'Crisp 4K IPS display with HDR10 support, ultra-thin bezels, USB-C hub connectivity, and anti-glare coating.',
    price: 18999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
    stock: 8
  },
  {
    name: 'Smartwatch Fitness Tracker',
    description: 'Sleek smartwatch featuring AMOLED display, heart rate monitor, SpO2 sensor, sleep tracking, and 7-day battery life.',
    price: 6999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
    stock: 30
  },
  {
    name: 'Portable Bluetooth Speaker',
    description: 'IPX7 waterproof wireless speaker delivering deep bass, 360-degree sound, and 15 hours of continuous music playback.',
    price: 3299,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=80',
    stock: 20
  },

  // Fashion & Accessories
  {
    name: 'Classic Denim Jacket',
    description: 'Timeless vintage denim jacket crafted from 100% heavy cotton with durable button closures and twin chest pockets.',
    price: 2499,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
    stock: 15
  },
  {
    name: 'Minimalist Leather Sneakers',
    description: 'Premium handcrafted white leather sneakers featuring cushioned insoles, rubber outsoles, and clean modern aesthetic.',
    price: 3499,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
    stock: 12
  },
  {
    name: 'Urban Oversized Hoodie',
    description: 'Ultra-soft fleece pullover hoodie designed for maximum comfort, featuring a cozy kangaroo pocket and relaxed fit.',
    price: 1899,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
    stock: 22
  },
  {
    name: 'Polarized Aviator Sunglasses',
    description: 'Classic metal frame aviators with UV400 protection, anti-glare polarized lenses, and lightweight comfortable fit.',
    price: 1299,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80',
    stock: 35
  },
  {
    name: 'Vintage Leather Messenger Bag',
    description: 'Handcrafted full-grain leather laptop shoulder bag with padded compartments and adjustable brass buckle strap.',
    price: 4499,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
    stock: 14
  },

  // Books
  {
    name: 'Designing Data-Intensive Applications',
    description: 'The definitive guide to architecture, data processing systems, scalability, and reliability by Martin Kleppmann.',
    price: 1299,
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    stock: 40
  },
  {
    name: 'Clean Code: Handbook of Software Craftsmanship',
    description: 'Even bad code can function. But if code isn’t clean, it can bring a development organization to its knees by Robert C. Martin.',
    price: 999,
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&auto=format&fit=crop&q=80',
    stock: 30
  },
  {
    name: 'Atomic Habits by James Clear',
    description: 'An easy and proven way to build good habits and break bad ones with actionable insights on human behavior.',
    price: 699,
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80',
    stock: 50
  },
  {
    name: 'The Pragmatic Programmer',
    description: 'Your journey to mastery in software development. Illustrates best practices and major pitfalls for modern developers.',
    price: 1199,
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
    stock: 25
  },

  // Home & Kitchen
  {
    name: 'Modern Ceramic Coffee Mug',
    description: 'Matte ceramic coffee mug with bamboo coaster lid, double-wall insulation, and 400ml capacity.',
    price: 599,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    stock: 50
  },
  {
    name: 'Minimalist LED Desk Lamp',
    description: 'Dimmable LED desk lamp with touch controls, 3 color temperatures, wireless charging base, and flexible arm.',
    price: 1799,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
    stock: 22
  },
  {
    name: 'Ultrasonic Essential Oil Diffuser',
    description: 'Quiet aromatherapy humidifier with 7 LED ambient light colors, automatic shut-off safety feature, and 300ml tank.',
    price: 1499,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=800&auto=format&fit=crop&q=80',
    stock: 18
  },
  {
    name: 'Insulated Stainless Steel Water Bottle',
    description: 'Double-walled vacuum insulated water bottle keeping beverages cold for 24 hours or hot for 12 hours.',
    price: 899,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80',
    stock: 45
  },

  // Gaming & Fitness
  {
    name: 'Wireless Pro Gaming Controller',
    description: 'Ergonomic dual vibration wireless gamepad with remappable back triggers, low-latency Bluetooth, and rechargeable battery.',
    price: 3999,
    category: 'Gaming',
    image: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&auto=format&fit=crop&q=80',
    stock: 16
  },
  {
    name: 'Surround Sound Gaming Headset',
    description: 'Immersive 7.1 surround sound gaming headset with noise-isolating boom mic and comfortable cooling-gel ear cushions.',
    price: 4299,
    category: 'Gaming',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
    stock: 19
  },
  {
    name: 'Eco-Friendly Non-Slip Yoga Mat',
    description: 'High-density TPE yoga mat with alignment lines, extra thick 6mm cushioning, and carrying strap.',
    price: 1199,
    category: 'Fitness',
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop&q=80',
    stock: 28
  },
  {
    name: 'Adjustable Dumbbell Set 10kg',
    description: 'Durable solid cast iron dumbbell set with non-slip chrome handles and secure star-lock collars.',
    price: 2999,
    category: 'Fitness',
    image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80',
    stock: 11
  }
];

export const autoSeedProductsIfEmpty = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('No products detected in database. Auto-seeding sample catalog...');
      const created = await Product.insertMany(sampleProducts);
      console.log(`Auto-seeded ${created.length} sample products into database.`);
    } else {
      console.log(`Database ready with ${count} existing products.`);
    }

    // Auto-seed persistent demo customer
    const existingDemo = await Customer.findOne({ email: 'demo@shopkart.com' });
    if (!existingDemo) {
      await Customer.create({
        fullName: 'Demo Customer',
        email: 'demo@shopkart.com',
        password: 'Password123!',
        phone: '9876543210'
      });
      console.log('Auto-seeded demo customer account: demo@shopkart.com / Password123!');
    }
  } catch (err) {
    console.error('Auto-seed check error:', err.message);
  }
};
