import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, AlertTitle, Collapse, Link, Stack } from '@mui/material';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import axios from 'axios';
import { Typography, Container, Grid, Paper, Button, CircularProgress, Rating, Chip, Box, Card, CardActionArea, CardMedia, CardContent } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function SimilarProductsError({ onRetry }) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <Alert
      severity="warning"
      variant="outlined"
      icon={<CloudOffIcon fontSize="inherit" />}
      sx={{
        borderRadius: 2,
        borderWidth: 2,
        alignItems: 'center',
        background: theme => `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
        '& .MuiAlert-message': { width: '100%' },
      }}
      action={
        <Stack direction="row" spacing={1}>
          <Button size="small" startIcon={<RefreshIcon />} onClick={onRetry}>
            Retry
          </Button>
          <Button size="small" component={Link} href="https://weaviate.io" target="_blank" rel="noopener" endIcon={<OpenInNewIcon />}>
            Docs
          </Button>
        </Stack>
      }
    >
      <AlertTitle>Similar products unavailable</AlertTitle>
      We couldn’t load recommendations right now. This often happens when the vector database is unreachable. Please try again shortly.
      <Box sx={{ mt: 1 }}>
        <Button
          size="small"
          endIcon={
            <ExpandMoreIcon
              sx={{
                transform: showDetails ? 'rotate(180deg)' : 'none',
                transition: '0.2s',
              }}
            />
          }
          onClick={() => setShowDetails(v => !v)}
        >
          {showDetails ? 'Hide details' : 'Show details'}
        </Button>
        <Collapse in={showDetails}>
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              mt: 1,
              bgcolor: theme => theme.palette.action.hover,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 12,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            Weaviate cluster has been suspended. Please create your own free cluster at https://weaviate.io/developers/weaviate/installation/cloud and update
            the API URL in <code>.env</code> to restore recommendations.
          </Paper>
        </Collapse>
      </Box>
    </Alert>
  );
}

function ProductDetails({ addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [recommended, setRecommended] = useState([]);
  const [recLoading, setRecLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const { data } = await axios.get(`https://fusion-electronics-api.vercel.app/api/products/${id}`);
        if (data) {
          setProduct(data);
          setUserRating(data.rating);
          trackVisit(data);
          fetchRecommended();
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchRecommended() {
      setRecLoading(true);
      try {
        const { data: recs } = await axios.get(`https://fusion-electronics-api.vercel.app/api/products/${id}/similar`);
        setRecommended(recs || []);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      } finally {
        setRecLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  const trackVisit = prod => {
    try {
      const key = 'visitedProducts';
      const stored = JSON.parse(localStorage.getItem(key)) || [];

      const exists = stored.find(p => p.id === (prod._id || prod.id));
      if (!exists) {
        stored.push({
          id: prod._id || prod.id,
          name: prod.name,
          image: prod.image,
          price: prod.price,
        });
        localStorage.setItem(key, JSON.stringify(stored));
      }
    } catch (e) {
      // silently ignore localStorage errors (e.g., quota exceeded)
      console.warn('localStorage tracking failed:', e);
    }
  };

  const capitalizeFirstLetter = str => str.charAt(0).toUpperCase() + str.slice(1);

  const handleAddToCart = () => product && addToCart(product);

  const handleRatingChange = async (_e, newRating) => {
    setUserRating(newRating);
    try {
      await axios.put(`https://fusion-electronics-api.vercel.app/api/products/${id}/rating`, { rating: newRating });
      setProduct(prev => ({
        ...prev,
        rating: newRating,
        numReviews: prev.numReviews + 1,
      }));
    } catch (err) {
      console.error('Error updating rating:', err);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Typography variant="h4" align="center">
        Error loading product details.
      </Typography>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, pb: 6 }}>
      {/* ========== PRODUCT DETAILS ========== */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* image */}
          <Grid item xs={12} md={6}>
            <img src={product.image} alt={product.name} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
          </Grid>

          {/* info */}
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              {product.name}
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Brand: {product.brand}
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Category: {capitalizeFirstLetter(product.category)}
            </Typography>
            <Typography variant="h6" color="primary" gutterBottom>
              ${product.price}
            </Typography>
            <Typography variant="body1" gutterBottom>
              {product.description}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
                In Stock:
              </Typography>
              <Chip
                label={product.stock > 0 ? `${product.stock} Available` : 'Out of Stock'}
                color={product.stock > 0 ? 'success' : 'error'}
                sx={{ maxWidth: '200px' }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
              <Rating value={userRating} precision={0.5} onChange={handleRatingChange} sx={{ mr: 1 }} />
              <Typography variant="body2" color="textSecondary">
                ({product.numReviews} Reviews)
              </Typography>
            </Box>

            <Button variant="contained" color="primary" onClick={handleAddToCart} sx={{ mt: 2 }}>
              Add to Cart
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ========== RECOMMENDED SECTION ========== */}
      <Box sx={{ mt: 5 }}>
        <Typography variant="h5" gutterBottom>
          Recommended for you
        </Typography>

        {recLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <CircularProgress size={32} />
          </Box>
        ) : recommended.length === 0 ? (
          <SimilarProductsError onRetry={() => navigate(0)} />
        ) : (
          <Grid container spacing={3}>
            {recommended.map(rec => (
              <Grid item xs={12} sm={6} md={4} key={rec.id}>
                <Card elevation={4} sx={{ height: '100%' }}>
                  <CardActionArea onClick={() => navigate(`/product/${rec.id}`)}>
                    <CardMedia component="img" height="160" image={rec.image} alt={rec.name} sx={{ objectFit: 'contain', p: 2 }} />
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom noWrap>
                        {rec.name}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        ${rec.price}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}

export default ProductDetails;
