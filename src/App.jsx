import * as React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Container, CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import NavigationBar from './components/NavigationBar';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import ProductDetails from './pages/ProductDetails';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2874f0',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
  },
});

function App() {
  const [products, setProducts] = React.useState([]);
  const [cart, setCart] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Be sure to replace the endpoint if your API (backend server) is running on a different port
        // This is the default port for the Express server - port 5000
        const response = await fetch('http://localhost:5000/api/products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const addToCart = product => {
    setCart([...cart, product]);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <NavigationBar cartItemCount={cart.length} />
        <Container>
          <Routes>
            <Route path="/" element={<Home products={products} loading={loading} addToCart={addToCart} />} />

            <Route path="/shop" element={<Shop products={products} addToCart={addToCart} />} />

            <Route path="/cart" element={<Cart cart={cart} setCart={setCart} />} />

            <Route path="/checkout" element={<Checkout />} />

            <Route path="/order-success" element={<OrderSuccess />} />

            <Route path="/product/:id" element={<ProductDetails addToCart={addToCart} />} />
          </Routes>
        </Container>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
