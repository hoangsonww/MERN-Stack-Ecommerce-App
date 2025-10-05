import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Grid,
  Link,
  Paper,
  Rating,
  Stack,
  Typography,
} from '@mui/material';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { apiClient, withRetry } from '../services/apiClient';
import { useNotifier } from '../context/NotificationProvider';

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
  const [similarError, setSimilarError] = useState(false);
  const { notify } = useNotifier();

  const normalizeProduct = useCallback(prod => {
    if (!prod || typeof prod !== 'object') return null;
    const candidate = prod._id ?? prod.id ?? prod.mongoId ?? prod?.metadata?.mongoId;
    const normalizedId = candidate !== undefined && candidate !== null ? `${candidate}` : undefined;

    return normalizedId
      ? {
          ...prod,
          id: normalizedId,
          _id: normalizedId,
        }
      : { ...prod };
  }, []);

  const recordVisit = useCallback(
    prod => {
      try {
        const normalized = normalizeProduct(prod);
        if (!normalized?.id) return;

        const key = 'visitedProducts';
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        const stored = Array.isArray(parsed) ? parsed : [];
        const filtered = stored.filter(item => item.id !== normalized.id);
        const next = [
          ...filtered,
          {
            id: normalized.id,
            name: normalized.name,
            image: normalized.image,
            price: normalized.price,
            visitedAt: Date.now(),
          },
        ].slice(-12);
        localStorage.setItem(key, JSON.stringify(next));
      } catch (storageError) {
        console.warn('Unable to track visited product', storageError);
      }
    },
    [normalizeProduct]
  );

  const fetchRecommended = useCallback(async () => {
    setRecLoading(true);
    setSimilarError(false);
    try {
      const { data: recs } = await withRetry(() => apiClient.get(`products/${id}/similar`));
      if (!Array.isArray(recs)) {
        setRecommended([]);
        return;
      }
      const normalized = recs
        .map(item => normalizeProduct(item))
        .filter(Boolean)
        .filter((item, index, self) => item.id && self.findIndex(other => other.id === item.id) === index)
        .filter(item => item.id !== `${id}`);
      setRecommended(normalized);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setSimilarError(true);
      setRecommended([]);
    } finally {
      setRecLoading(false);
    }
  }, [id, normalizeProduct]);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await withRetry(() => apiClient.get(`products/${id}`));
      const normalized = normalizeProduct(data);
      if (!normalized?.id) {
        throw new Error('Product not found');
      }
      setProduct(normalized);
      setUserRating(normalized.rating || 0);
      recordVisit(normalized);
      fetchRecommended();
    } catch (err) {
      console.error('Error fetching product details:', err);
      setProduct(null);
      setError(err);
      if (err?.response?.status === 404) {
        try {
          const key = 'visitedProducts';
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter(item => item?.id !== id);
              localStorage.setItem(key, JSON.stringify(filtered));
            }
          }
        } catch (storageError) {
          console.warn('Unable to prune visitedProducts cache', storageError);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [fetchRecommended, id, normalizeProduct, recordVisit]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const formatCategory = value => {
    if (typeof value !== 'string' || !value.length) {
      return 'Uncategorized';
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const handleAddToCart = useCallback(() => {
    if (product) {
      addToCart(product);
    }
  }, [addToCart, product]);

  const handleRatingChange = async (_e, newRating) => {
    setUserRating(newRating);
    try {
      await apiClient.put(`products/${id}/rating`, { rating: newRating });
      setProduct(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          rating: newRating,
          numReviews: (prev.numReviews || 0) + 1,
        };
      });
      notify({ severity: 'success', message: 'Thanks for the feedback!' });
    } catch (err) {
      console.error('Error updating rating:', err);
      notify({ severity: 'error', message: 'Could not update your rating right now.' });
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
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, textAlign: 'center', borderRadius: 4 }}>
          <Typography variant="h4" gutterBottom>
            We could not load this product.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The product may have been removed or is temporarily unavailable. Please refresh or browse the latest releases.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button variant="contained" onClick={fetchProduct} startIcon={<RefreshIcon />}>
              Try again
            </Button>
            <Button variant="outlined" onClick={() => navigate('/shop')}>
              Back to shop
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, pb: 6 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <img src={product.image} alt={product.name} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              {product.name}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Brand: {product.brand || 'Fusion Electronics'}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Category: {formatCategory(product.category)}
            </Typography>
            <Typography variant="h6" color="primary" gutterBottom>
              ${product.price}
            </Typography>
            <Typography variant="body1" gutterBottom>
              {product.description}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
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
              <Typography variant="body2" color="text.secondary">
                ({product.numReviews || 0} Reviews)
              </Typography>
            </Box>

            <Button variant="contained" color="primary" onClick={handleAddToCart} sx={{ mt: 2 }}>
              Add to Cart
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mt: 5 }}>
        <Typography variant="h5" gutterBottom>
          Recommended for you
        </Typography>

        {recLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <CircularProgress size={32} />
          </Box>
        ) : recommended.length === 0 ? (
          similarError ? (
            <SimilarProductsError onRetry={fetchRecommended} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              We are curating recommendations for this product. Check back soon for more gear.
            </Typography>
          )
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
