import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useWishlist } from '../context/WishlistContext';

function EmptyWishlist() {
  const navigate = useNavigate();
  return (
    <Paper elevation={0} sx={{ p: { xs: 4, md: 8 }, textAlign: 'center', borderRadius: 4 }}>
      <FavoriteIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        Your wishlist is empty
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Browse the shop and save items you love.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/shop')}>
        Browse products
      </Button>
    </Paper>
  );
}

function WishlistItem({ product, onRemove, onView }) {
  const isOOS = !product.stock || product.stock === 0;

  return (
    <Card elevation={3} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, height: '100%' }}>
      <CardMedia
        component="img"
        image={product.image}
        alt={product.name}
        sx={{
          width: { xs: '100%', sm: 160 },
          height: { xs: 180, sm: 'auto' },
          objectFit: 'contain',
          p: 2,
          flexShrink: 0,
          cursor: 'pointer',
        }}
        onClick={() => onView(product._id || product.id)}
      />
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
            onClick={() => onView(product._id || product.id)}
          >
            {product.name}
          </Typography>
          <Tooltip title="Remove from wishlist">
            <IconButton size="small" onClick={() => onRemove(product._id || product.id)} color="error">
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {product.brand && (
          <Typography variant="body2" color="text.secondary">
            {product.brand}
          </Typography>
        )}

        <Typography variant="h6" color="primary" fontWeight={700}>
          ${product.price}
        </Typography>

        <Chip
          size="small"
          label={isOOS ? 'Out of Stock' : `${product.stock} in stock`}
          color={isOOS ? 'error' : 'success'}
          sx={{ alignSelf: 'flex-start' }}
        />

        <Box sx={{ mt: 'auto', pt: 1 }}>
          <Button
            size="small"
            variant="outlined"
            endIcon={<OpenInNewIcon />}
            onClick={() => onView(product._id || product.id)}
          >
            View product
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

function Wishlist() {
  const { wishlist, loading, removeFromWishlist } = useWishlist();
  const navigate = useNavigate();

  const isLoggedIn = Boolean(localStorage.getItem('MERNEcommerceToken'));

  if (!isLoggedIn) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, textAlign: 'center', borderRadius: 4 }}>
          <Typography variant="h5" gutterBottom>
            Sign in to view your wishlist
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Save products you love and get notified about restocks or price drops.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" onClick={() => navigate('/login')}>
              Sign in
            </Button>
            <Button variant="outlined" onClick={() => navigate('/register')}>
              Create account
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, pb: 8 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4 }}>
        <FavoriteIcon color="error" />
        <Typography variant="h4" fontWeight={700}>
          My Wishlist
        </Typography>
        {!loading && wishlist.length > 0 && (
          <Chip label={`${wishlist.length} item${wishlist.length !== 1 ? 's' : ''}`} size="small" />
        )}
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : wishlist.length === 0 ? (
        <EmptyWishlist />
      ) : (
        <Grid container spacing={3}>
          {wishlist.map(product => (
            <Grid item xs={12} sm={6} md={4} key={product._id || product.id}>
              <WishlistItem
                product={product}
                onRemove={removeFromWishlist}
                onView={id => navigate(`/product/${id}`)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default Wishlist;
