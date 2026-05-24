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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Radio,
  RadioGroup,
  Rating,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import { apiClient, withRetry } from '../services/apiClient';
import { useNotifier } from '../context/NotificationProvider';
import { useWishlist } from '../context/WishlistContext';

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

const ALERTS_ENABLED = process.env.REACT_APP_FEATURE_ALERTS === 'true';

function PriceDropDialog({ open, onClose, onSubmit, currentPrice }) {
  const [alertType, setAlertType] = useState('targetPrice');
  const [targetPrice, setTargetPrice] = useState('');
  const [dropPercent, setDropPercent] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (alertType === 'targetPrice') {
      const val = parseFloat(targetPrice);
      if (!targetPrice || isNaN(val) || val <= 0) errs.targetPrice = 'Enter a valid price greater than 0';
      else if (val >= currentPrice) errs.targetPrice = `Must be less than current price ($${currentPrice})`;
    } else {
      const val = parseFloat(dropPercent);
      if (!dropPercent || isNaN(val) || val < 1 || val > 99) errs.dropPercent = 'Enter a percentage between 1 and 99';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      type: 'price_drop',
      targetPrice: alertType === 'targetPrice' ? parseFloat(targetPrice) : undefined,
      dropPercent: alertType === 'dropPercent' ? parseFloat(dropPercent) : undefined,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Set price-drop alert</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Current price: <strong>${currentPrice}</strong>
        </Typography>
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <RadioGroup value={alertType} onChange={e => setAlertType(e.target.value)}>
            <FormControlLabel value="targetPrice" control={<Radio />} label="Notify when price drops to" />
            <FormControlLabel value="dropPercent" control={<Radio />} label="Notify when price drops by %" />
          </RadioGroup>
        </FormControl>
        {alertType === 'targetPrice' ? (
          <TextField
            label="Target price"
            type="number"
            value={targetPrice}
            onChange={e => setTargetPrice(e.target.value)}
            fullWidth
            error={Boolean(errors.targetPrice)}
            helperText={errors.targetPrice}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            inputProps={{ min: 0.01, step: 0.01 }}
          />
        ) : (
          <TextField
            label="Drop percentage"
            type="number"
            value={dropPercent}
            onChange={e => setDropPercent(e.target.value)}
            fullWidth
            error={Boolean(errors.dropPercent)}
            helperText={errors.dropPercent}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            inputProps={{ min: 1, max: 99, step: 1 }}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Set alert
        </Button>
      </DialogActions>
    </Dialog>
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
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const [restockSubbed, setRestockSubbed] = useState(false);
  const [priceDropDialogOpen, setPriceDropDialogOpen] = useState(false);
  const [alertLoading, setAlertLoading] = useState(false);

  const isLoggedIn = Boolean(localStorage.getItem('MERNEcommerceToken'));
  const authHeader = () => {
    const token = localStorage.getItem('MERNEcommerceToken');
    return token ? { 'x-auth-token': token } : {};
  };

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

  // Sync restock subscription state when product loads
  useEffect(() => {
    if (!product || !isLoggedIn || !ALERTS_ENABLED) return;
    apiClient
      .get('alerts/mine', { headers: authHeader() })
      .then(({ data }) => {
        const active = data.find(
          s => s.productId === (product._id || product.id) && s.type === 'restock' && s.status === 'ACTIVE'
        );
        setRestockSubbed(Boolean(active));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, isLoggedIn]);

  const handleToggleRestock = async () => {
    if (!isLoggedIn) {
      notify({ severity: 'warning', message: 'Please sign in to set alerts.' });
      return;
    }
    setAlertLoading(true);
    try {
      if (restockSubbed) {
        await apiClient.post('alerts/cancel', { productId: product._id || product.id, type: 'restock' }, { headers: authHeader() });
        setRestockSubbed(false);
        notify({ severity: 'info', message: 'Restock alert cancelled.' });
      } else {
        await apiClient.post('alerts/subscribe', { productId: product._id || product.id, type: 'restock' }, { headers: authHeader() });
        setRestockSubbed(true);
        notify({ severity: 'success', message: "We'll notify you when this item is back in stock!" });
      }
    } catch (err) {
      const msg = err?.response?.data?.msg || err?.response?.data?.errors?.[0]?.msg || 'Could not update alert.';
      notify({ severity: 'error', message: msg });
    } finally {
      setAlertLoading(false);
    }
  };

  const handlePriceDropSubmit = async ({ type, targetPrice, dropPercent }) => {
    if (!isLoggedIn) {
      notify({ severity: 'warning', message: 'Please sign in to set alerts.' });
      return;
    }
    setPriceDropDialogOpen(false);
    setAlertLoading(true);
    try {
      await apiClient.post(
        'alerts/subscribe',
        { productId: product._id || product.id, type, targetPrice, dropPercent },
        { headers: authHeader() }
      );
      notify({ severity: 'success', message: "Price-drop alert set! We'll email you when the price falls." });
    } catch (err) {
      const msg = err?.response?.data?.msg || err?.response?.data?.errors?.[0]?.msg || 'Could not set price-drop alert.';
      notify({ severity: 'error', message: msg });
    } finally {
      setAlertLoading(false);
    }
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

            <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" gap={1}>
              <Button variant="contained" color="primary" onClick={handleAddToCart}>
                Add to Cart
              </Button>

              <Tooltip title={isInWishlist(product._id || product.id) ? 'Remove from wishlist' : 'Add to wishlist'}>
                <IconButton
                  color="error"
                  onClick={() => {
                    const pid = product._id || product.id;
                    isInWishlist(pid) ? removeFromWishlist(pid) : addToWishlist(pid);
                  }}
                >
                  {isInWishlist(product._id || product.id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
              </Tooltip>

              {ALERTS_ENABLED && product.stock === 0 && (
                <Button
                  variant={restockSubbed ? 'outlined' : 'outlined'}
                  color={restockSubbed ? 'warning' : 'secondary'}
                  startIcon={restockSubbed ? <NotificationsOffIcon /> : <NotificationsActiveIcon />}
                  onClick={handleToggleRestock}
                  disabled={alertLoading}
                >
                  {restockSubbed ? 'Cancel restock alert' : 'Notify me when back in stock'}
                </Button>
              )}

              {ALERTS_ENABLED && product.stock > 0 && (
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<NotificationsActiveIcon />}
                  onClick={() => setPriceDropDialogOpen(true)}
                  disabled={alertLoading}
                >
                  Price-drop alert
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {ALERTS_ENABLED && (
        <PriceDropDialog
          open={priceDropDialogOpen}
          onClose={() => setPriceDropDialogOpen(false)}
          onSubmit={handlePriceDropSubmit}
          currentPrice={product.price}
        />
      )}

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
