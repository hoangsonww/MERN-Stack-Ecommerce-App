import * as React from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Rating from '@mui/material/Rating';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import AddShoppingCartRoundedIcon from '@mui/icons-material/AddShoppingCartRounded';
import { useNavigate } from 'react-router-dom';

const ACCENT_GRADIENT = 'linear-gradient(120deg, #38bdf8 0%, #2874f0 45%, #f50057 100%)';

export default function ProductCard({ product, addToCart }) {
  const navigate = useNavigate();

  const canonicalId = product?._id || product?.id;
  const formattedCategory = product?.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1) : null;
  const ratingValue = typeof product?.rating === 'number' ? product.rating : null;
  const reviewCount = typeof product?.numReviews === 'number' ? product.numReviews : null;

  const handleViewDetails = () => {
    if (!canonicalId) {
      return;
    }
    navigate(`/product/${canonicalId}`);
  };

  const handleCardClick = event => {
    if (!canonicalId) return;
    const button = event.target.closest('button');
    if (button) return;
    handleViewDetails();
  };

  return (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(15,23,42,0.06)',
        transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease, border-color 0.35s ease',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 28px 50px rgba(40, 116, 240, 0.18)',
          borderColor: 'rgba(40,116,240,0.35)',
        },
        '&:hover .product-media': {
          transform: 'scale(1.07)',
        },
      }}
      onClick={handleCardClick}
    >
      <Box
        sx={{
          position: 'relative',
          pt: '75%',
          overflow: 'hidden',
          borderRadius: '18px 18px 0 0',
          background: '#ffffff',
        }}
      >
        <CardMedia
          component="img"
          className="product-media"
          alt={product.name}
          src={product.image}
          loading="eager"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            p: 2,
            transition: 'transform 0.45s cubic-bezier(0.22,1,0.36,1)',
          }}
        />
        {formattedCategory && (
          <Chip
            size="small"
            label={formattedCategory}
            color="primary"
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              bgcolor: 'rgba(40,116,240,0.92)',
              color: '#fff',
              fontWeight: 600,
            }}
          />
        )}
      </Box>

      <Divider />

      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {product.description}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
            ${product.price.toFixed(2)}
          </Typography>
          {ratingValue !== null && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Rating name={`rating-${canonicalId}`} value={ratingValue} precision={0.5} readOnly size="small" />
              {reviewCount !== null && (
                <Typography variant="caption" color="text.secondary">
                  ({reviewCount})
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
        {typeof product?.stock === 'number' && (
          <Typography variant="caption" color={product.stock > 5 ? 'success.main' : 'warning.main'} sx={{ mt: 1, display: 'block' }}>
            {product.stock > 5 ? `${product.stock} in stock` : 'Limited stock available'}
          </Typography>
        )}
      </CardContent>

      <CardActions disableSpacing sx={{ justifyContent: 'space-between', px: 2, pb: 2, mt: 'auto' }}>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddShoppingCartRoundedIcon />}
          onClick={event => {
            event.stopPropagation();
            addToCart(product);
          }}
          sx={{ background: ACCENT_GRADIENT, boxShadow: '0 10px 22px rgba(40,116,240,0.3)', '&:hover': { boxShadow: '0 14px 28px rgba(245,0,87,0.32)' } }}
        >
          Add to Cart
        </Button>
        <Tooltip title="See full specs" arrow>
          <Button
            size="small"
            color="inherit"
            onClick={event => {
              event.stopPropagation();
              handleViewDetails();
            }}
          >
            View Details
          </Button>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
