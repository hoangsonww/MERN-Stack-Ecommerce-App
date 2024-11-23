import * as React from 'react';
import { Typography, Grid, Box, Container, Button, CircularProgress, Alert, Paper, styled } from '@mui/material';
import Carousel from 'react-material-ui-carousel';
import ProductCard from '../components/ProductCard';
import summerSaleImage from '../assets/images/summer-sale.jpg';
import techGadgetsImage from '../assets/images/tech-gadgets.jpg';
import trendingFashionImage from '../assets/images/trending-fashion.jpg';
import '../App.css';

const StyledCarousel = styled(Carousel)({
  '& .Carousel-indicators-container': {
    bottom: '20px',
    '& button': {
      backgroundColor: 'white',
      opacity: 0.6,
      '&:hover': {
        opacity: 1,
      },
      '&.selected': {
        opacity: 1,
      },
    },
  },
});

function Home({ products, addToCart, error, loading }) {
  const featuredProducts = products.slice(0, 3); // Display the first 3 products as featured
  const [animatedCards, setAnimatedCards] = React.useState([]); // Track animated card indices

  React.useEffect(() => {
    // Add animation classes incrementally for visible product cards
    const timer = setTimeout(() => {
      setAnimatedCards(featuredProducts.map((_, index) => index));
    }, 100);

    return () => clearTimeout(timer);
  }, [featuredProducts]);

  const bannerImages = [
    {
      url: summerSaleImage,
      title: 'Summer Sale - Up to 50% Off',
      description: 'Shop now for the best deals on summer essentials!',
    },
    {
      url: techGadgetsImage,
      title: 'New Tech Gadgets',
      description: 'Explore the latest in tech and gadgets.',
    },
    {
      url: trendingFashionImage,
      title: 'Trending Fashion',
      description: 'Discover the newest fashion trends for this season.',
    },
  ];

  return (
    <Box sx={{ my: 4 }}>
      {/* Hero Section */}
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', marginBottom: '2rem' }}>
        <StyledCarousel
          animation="slide"
          autoPlay={true}
          interval={2500}
          navButtonsAlwaysVisible={true}
          navButtonsProps={{
            style: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: '#fff',
              borderRadius: 0,
            },
          }}
          indicatorIconButtonProps={{
            style: {
              padding: '10px',
            },
          }}
          activeIndicatorIconButtonProps={{
            style: {
              backgroundColor: '#fff',
            },
          }}
        >
          {bannerImages.map((item, i) => (
            <Box key={i} sx={{ position: 'relative' }}>
              <img src={item.url} alt={item.title} style={{ width: '100%', height: '400px', objectFit: 'cover' }} />

              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: '#fff',
                  padding: '30px',
                  '& h4': {
                    fontWeight: 700,
                    marginBottom: '10px',
                  },
                }}
              >
                <Typography variant="h4" component="h2" gutterBottom sx={{ color: '#fff' }}>
                  {item.title}
                </Typography>

                <Typography variant="body1" sx={{ color: '#fff' }}>
                  {item.description}
                </Typography>
              </Box>
            </Box>
          ))}
        </StyledCarousel>
      </Paper>

      {/* Featured Products Section */}
      <Container maxWidth="lg">
        <Typography variant="h4" align="center" sx={{ my: 4, color: 'black', fontWeight: 700 }}>
          Featured Products
        </Typography>
        {error ? (
          <Alert severity="error">{error.message}</Alert>
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={4}>
            {featuredProducts.map((product, index) => (
              <Grid item key={product._id} xs={12} sm={6} md={4} className={animatedCards.includes(index) ? 'product-card-animated' : ''}>
                <ProductCard product={product} addToCart={addToCart} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Call to Action */}
      <Box sx={{ textAlign: 'center', mt: 5 }}>
        <Button variant="contained" size="large" href="/shop">
          Shop Now
        </Button>
      </Box>
    </Box>
  );
}

export default Home;
