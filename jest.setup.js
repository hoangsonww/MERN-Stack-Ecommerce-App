// Polyfill TextEncoder/TextDecoder for supertest under Node 18+
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
