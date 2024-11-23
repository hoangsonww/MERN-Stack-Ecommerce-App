import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Typography, Container, Grid, Paper, Button, CircularProgress, Rating, Chip, Box } from '@mui/material';

function ProductDetails({ addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRating, setUserRating] = useState(0);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await axios.get(`https://mern-stack-ecommerce-app-h5wb.onrender.com/api/products/${id}`);
        if (response.data) {
          setProduct(response.data);
          setUserRating(response.data.rating);
        }
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id, navigate]);

  const capitalizeFirstLetter = string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
    }
  };

  const handleRatingChange = async (event, newRating) => {
    setUserRating(newRating);
    try {
      await axios.put(`https://mern-stack-ecommerce-app-h5wb.onrender.com/api/products/${id}/rating`, { rating: newRating });
      setProduct(prevProduct => ({
        ...prevProduct,
        rating: newRating,
        numReviews: prevProduct.numReviews + 1,
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

  if (error) {
    return (
      <Typography variant="h4" align="center">
        Error loading product details.
      </Typography>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <img src={product.image} alt={product.name} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
          </Grid>

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
    </Container>
  );
}

export default ProductDetails;
