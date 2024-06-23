const Product = require('../models/product');

// Sample product data -- to be replaced with actual products
const productSeeds = [
    {
        name: 'iPhone 15 Pro Max',
        description: 'Apple\'s latest flagship smartphone.',
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
    }
];

const seedDB = async () => {
    await Product.deleteMany({});
    await Product.insertMany(productSeeds);
    console.log('Products seeded successfully!');
};

module.exports = seedDB;
