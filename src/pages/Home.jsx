import * as React from 'react';
import { Typography, Grid, Box, Container, Button, CircularProgress, Alert, Paper, styled, Pagination } from '@mui/material';
import Carousel from 'react-material-ui-carousel';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import summerSaleImage from '../assets/images/summer-sale.jpg';
import techGadgetsImage from '../assets/images/tech-gadgets.jpg';
import trendingFashionImage from '../assets/images/trending-fashion.png';
import '../App.css';

const StyledCarousel = styled(Carousel)({
  '& .Carousel-indicators-container': {
    bottom: '20px',
    '& button': {
      backgroundColor: 'white',
      opacity: 0.6,
      '&:hover': { opacity: 1 },
      '&.selected': { opacity: 1 },
    },
  },
});

const normalizeProduct = p => {
  const canonical = p._id || p.id;
  return { ...p, id: canonical, _id: canonical };
};

function Home({ products, addToCart, error, loading }) {
  const featuredProducts = products.slice(0, 3);
  const [animatedCards, setAnimatedCards] = React.useState([]);
  const [recs, setRecs] = React.useState([]);
  const [recLoading, setRecLoading] = React.useState(true);
  const [recError, setRecError] = React.useState(null);
  const [recPage, setRecPage] = React.useState(1);
  const recPerPage = 6;

  /* Featured card animation */
  React.useEffect(() => {
    const t = setTimeout(() => {
      setAnimatedCards(featuredProducts.map((_, i) => i));
    }, 100);
    return () => clearTimeout(t);
  }, [featuredProducts]);

  /* Fetch recommendations from last-10 visited unique IDs */
  React.useEffect(() => {
    async function fetchRecs() {
      try {
        const visited = JSON.parse(localStorage.getItem('visitedProducts')) || [];
        if (!visited.length) {
          setRecLoading(false);
          return;
        }

        const seen = new Set();
        const lastTen = [];
        for (let i = visited.length - 1; i >= 0 && lastTen.length < 10; i--) {
          const vid = visited[i].id;
          if (!seen.has(vid)) {
            seen.add(vid);
            lastTen.push(vid);
          }
        }
        if (!lastTen.length) {
          setRecLoading(false);
          return;
        }

        const { data } = await axios.post('https://fusion-electronics-api.vercel.app/api/products/recommendations', { ids: lastTen });
        setRecs(data || []);
      } catch (e) {
        setRecError(e);
      } finally {
        setRecLoading(false);
      }
    }
    fetchRecs();
  }, []);

  /* Pagination helpers for recommendations */
  const recPageCount = Math.ceil(recs.length / recPerPage);
  const recStart = (recPage - 1) * recPerPage;
  const recToShow = recs.slice(recStart, recStart + recPerPage);
  const handleRecPageChange = (_e, value) => setRecPage(value);

  /* Banner images */
  const bannerImages = [
    { url: summerSaleImage, title: 'Summer Sale - Up to 50% Off', description: 'Shop now for the best deals on summer essentials!' },
    { url: techGadgetsImage, title: 'New Tech Gadgets', description: 'Explore the latest in tech and gadgets.' },
    { url: trendingFashionImage, title: 'Trending Electronics', description: 'Discover the newest trends in electronics this season.' },
  ];

  return (
    <Box sx={{ my: 4 }}>
      {/* ───────── Hero Section ───────── */}
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
        <StyledCarousel
          animation="slide"
          autoPlay
          interval={2500}
          navButtonsAlwaysVisible
          navButtonsProps={{
            style: { backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: 0 },
          }}
          indicatorIconButtonProps={{ style: { padding: 10 } }}
          activeIndicatorIconButtonProps={{ style: { backgroundColor: '#fff' } }}
        >
          {bannerImages.map((item, i) => (
            <Box key={i} sx={{ position: 'relative' }}>
              <img src={item.url} alt={item.title} style={{ width: '100%', height: 400, objectFit: 'cover' }} />
              <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: '100%', bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', p: 3 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="body1">{item.description}</Typography>
              </Box>
            </Box>
          ))}
        </StyledCarousel>
      </Paper>

      {/* ───────── Featured Products ───────── */}
      <Container maxWidth="lg">
        <Typography variant="h4" align="center" sx={{ fontWeight: 700 }}>
          Featured Products
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
          Check out our top picks for this month!
        </Typography>

        {error ? (
          <Alert severity="error">{error.message}</Alert>
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={4}>
            {featuredProducts.map((p, idx) => (
              <Grid item key={p._id} xs={12} sm={6} md={4} className={animatedCards.includes(idx) ? 'product-card-animated' : ''}>
                <ProductCard product={normalizeProduct(p)} addToCart={addToCart} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* ───────── Recommended Section ───────── */}
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <Typography variant="h4" align="center" sx={{ fontWeight: 700 }}>
          Recommended For You
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
          Based on your recent views, we think you might like these products!
        </Typography>

        {recError ? (
          <Alert severity="error">{recError.message}</Alert>
        ) : recLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : recs.length === 0 ? (
          <Typography align="center" color="textSecondary">
            Browse a few products so we can analyze your preferences and recommend relevant items!
          </Typography>
        ) : (
          <>
            <Grid container spacing={4}>
              {recToShow.map(rec => (
                <Grid item key={rec.id} xs={12} sm={6} md={4}>
                  <ProductCard product={normalizeProduct(rec)} addToCart={addToCart} />
                </Grid>
              ))}
            </Grid>

            {recPageCount > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination count={recPageCount} page={recPage} onChange={handleRecPageChange} color="primary" />
              </Box>
            )}
          </>
        )}
      </Container>

      {/* ───────── Call to Action ───────── */}
      <Box sx={{ textAlign: 'center', mt: 5 }}>
        <Button variant="contained" size="large" href="/shop">
          View More Products
        </Button>
      </Box>
    </Box>
  );
}

export default Home;
