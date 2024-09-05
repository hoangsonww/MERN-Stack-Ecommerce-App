const Product = require('../models/product');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

// Sample product data -- to be replaced with actual products
const productSeeds = [
  {
    name: 'iPhone 15 Pro Max',
    description: "Apple's latest flagship smartphone.",
    price: 1099,
    category: 'electronics',
    image: 'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-blue-thumbnew-600x600.jpg',
    brand: 'Apple',
    stock: 100,
  },
  {
    name: 'MacBook Air M2',
    description: 'Powerful and lightweight laptop from Apple.',
    price: 1199,
    category: 'computers',
    image: 'https://cdn8.web4s.vn/media/products/mac-air-m2/macbookairm2-midnight%201.jpg',
    brand: 'Apple',
    stock: 50,
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise-canceling headphones.',
    price: 399,
    category: 'electronics',
    image: 'https://bizweb.dktcdn.net/100/340/129/products/wh1000xm5-midnightblue-2-cuongphanvn.jpg?v=1714306049613',
    brand: 'Sony',
    stock: 200,
  },
  {
    name: 'Samsung 65" QLED TV',
    description: 'Immersive 4K TV experience with QLED technology.',
    price: 1499,
    category: 'electronics',
    image: 'https://cdn.mediamart.vn/images/product/qled-tivi-4k-samsung-65-inch-65q80c-smart-tv_5304e716.png', // Replace with actual image URL
    brand: 'Samsung',
    stock: 10,
  },
  {
    name: 'Canon EOS R5',
    description: 'High-performance mirrorless camera from Canon.',
    price: 3799,
    category: 'electronics',
    image: 'https://i1.adis.ws/i/canon/eos-r5_front_rf24-105mmf4lisusm_square_32c26ad194234d42b3cd9e582a21c99b',
    brand: 'Canon',
    stock: 5,
  },
  {
    name: 'Apple Watch Series 7',
    description: 'Stay connected and healthy with the latest Apple Watch.',
    price: 399,
    category: 'electronics',
    image: 'https://akbroshop.com/wp-content/uploads/2022/08/hinh-aw-s7-xanh.jpg',
    brand: 'Apple',
    stock: 100,
  },
  {
    name: 'Dell XPS 15',
    description: 'Powerful laptop with stunning 4K display.',
    price: 1799,
    category: 'computers',
    image: 'https://minhvu.vn/thumb/dellxps/dellxps159530/dellxps159530cbfbjco_480_360.jpg',
    brand: 'Dell',
    stock: 20,
  },
  {
    name: 'Samsung Galaxy Tab S7+',
    description: 'Premium Android tablet with stunning AMOLED display.',
    price: 849,
    category: 'electronics',
    image: 'https://hanoicomputercdn.com/media/product/60370_may_tinh_bang_samsung_galaxy_tab_s7_plus_128gb_den.png',
    brand: 'Samsung',
    stock: 30,
  },
  {
    name: 'Sony A7 IV',
    description: 'Full-frame mirrorless camera with 33MP sensor.',
    price: 2499,
    category: 'electronics',
    image: 'https://zshop.vn/images/detailed/92/1634812545_1667800.jpg',
    brand: 'Sony',
    stock: 10,
  },
  {
    name: 'LG C1 OLED TV',
    description: 'Stunning OLED TV with great picture quality.',
    price: 1999,
    category: 'electronics',
    image: 'https://product.hstatic.net/200000574527/product/dz-6_ac9672a6534245fcbb1a4938a1337907_1024x1024.jpg',
    brand: 'LG',
    stock: 15,
  },
  {
    name: 'Microsoft Surface Laptop 4',
    description: 'Sleek and powerful laptop from Microsoft.',
    price: 1299,
    category: 'computers',
    image:
      'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE4LiXm?ver=45be&q=90&m=6&h=705&w=1253&b=%23FFFFFFFF&f=jpg&o=f&p=140&aim=true',
    brand: 'Microsoft',
    stock: 25,
  },
  {
    name: 'GoPro Hero 10 Black',
    description: 'High-performance action camera for capturing your adventures.',
    price: 499,
    category: 'electronics',
    image: 'https://cdn.vjshop.vn/camera-hanh-dong/gopro/gopro-hero-10/gopro-hero-10-1000x1000.png',
    brand: 'GoPro',
    stock: 50,
  },
  {
    name: 'Bose QuietComfort 45 Headphones',
    description: 'Premium noise-canceling headphones for immersive audio experience.',
    price: 329,
    category: 'electronics',
    image: 'https://cdn.nguyenkimmall.com/images/detailed/848/10054167-tai-nghe-khong-day-bose-quietcomfort-45-den-866724-0100-1.jpg',
    brand: 'Bose',
    stock: 100,
  },
  {
    name: 'iPad Pro 12.9" (2022)',
    description: 'Powerful tablet with M1 chip and stunning Liquid Retina XDR display.',
    price: 1099,
    category: 'electronics',
    image: 'https://cdn2.cellphones.com.vn/x/media/catalog/product/i/p/ipad-pro-13-select-202210_3_3_1_1.png',
    brand: 'Apple',
    stock: 50,
  },
  {
    name: 'Samsung Galaxy S22 Ultra',
    description: "Samsung's latest flagship smartphone with S Pen support.",
    price: 1199,
    category: 'electronics',
    image:
      'https://i5.walmartimages.com/seo/Samsung-Galaxy-S22-Ultra-5G-SM-S908U1-256GB-Green-US-Model-Factory-Unlocked-Cell-Phone-Very-Good-Condition_0b4b7166-2688-4e0c-954d-539d5ea29ad9.5946110fe2a2c21cda0b256e2969a555.jpeg',
    brand: 'Samsung',
    stock: 30,
  },
  {
    name: 'Sony A7C',
    description: 'Compact full-frame mirrorless camera with 24MP sensor.',
    price: 1799,
    category: 'electronics',
    image: 'https://cdn.vjshop.vn/may-anh/mirrorless/sony/sony-alpha-a7c/sony-a7c-black-1.jpg',
    brand: 'Sony',
    stock: 10,
  },
  {
    name: 'LG Gram 17" Laptop',
    description: 'Ultra-lightweight laptop with long battery life.',
    price: 1499,
    category: 'computers',
    image: 'https://lapvip.vn/upload/products/original/lg-gram-17-20232-1700187329.jpg',
    brand: 'LG',
    stock: 20,
  },
  {
    name: 'Canon EOS R6',
    description: 'High-performance mirrorless camera with 20MP sensor.',
    price: 2499,
    category: 'electronics',
    image: 'https://cdn.vjshop.vn/may-anh/mirrorless/canon/canon-eos-r6/canon-eos-r6-1-1500x1500.jpg',
    brand: 'Canon',
    stock: 5,
  },
  {
    name: 'Apple AirPods Max',
    description: 'Premium over-ear headphones with high-fidelity audio.',
    price: 549,
    category: 'electronics',
    image:
      'https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/airpods-max-hero-select-202011_FMT_WHH?wid=607&hei=556&fmt=jpeg&qlt=90&.v=1633623988000',
    brand: 'Apple',
    stock: 50,
  },
  {
    name: 'Dell XPS 13',
    description: 'Ultra-portable laptop with stunning InfinityEdge display.',
    price: 999,
    category: 'computers',
    image: 'https://product.hstatic.net/1000331874/product/dell_xps_13_dc9a366cc90c495b9a3da844f2a08cb9_1024x1024.jpg',
    brand: 'Dell',
    stock: 30,
  },
  {
    name: 'Samsung Galaxy Watch 4',
    description: 'Stylish smartwatch with advanced health tracking features.',
    price: 249,
    category: 'electronics',
    image: 'https://cdn-v2.didongviet.vn/files/media/catalog/product/s/a/samsung-galaxy-watch-4-40mm-likenew-mau-den-didongviet.jpeg',
    brand: 'Samsung',
    stock: 100,
  },
  {
    name: 'Sony WH-1000XM4 Headphones',
    description: 'Premium noise-canceling headphones with long battery life.',
    price: 349,
    category: 'electronics',
    image: 'https://www.sony.com.vn/image/5d02da5df552836db894cead8a68f5f3?fmt=pjpeg&wid=330&bgcolor=FFFFFF&bgc=FFFFFF',
    brand: 'Sony',
    stock: 100,
  },
];

const seedDB = async () => {
  await Product.deleteMany({});
  await Product.insertMany(productSeeds);
  console.log('Products data seeded successfully!');
};

// Only runs when the "node productSeeds.js dev" command is executed manually
if (process.argv[2] == 'dev') {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  mongoose.connect(process.env.MONGO_URI, {}).then(async () => {
    await seedDB();
    process.exit();
  });
}

module.exports = seedDB;
