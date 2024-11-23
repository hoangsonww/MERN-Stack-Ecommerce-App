import * as React from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product, addToCart }) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/product/${product._id}`);
  };

  const handleCardClick = event => {
    // Prevent navigation if the "Add to Cart" button is clicked
    if (event.target.tagName !== 'BUTTON') {
      handleViewDetails();
    }
  };

  return (
    <Card sx={{ maxWidth: 345, height: '100%', cursor: 'pointer' }} onClick={handleCardClick}>
      <div style={{ position: 'relative', paddingBottom: '100%' }}>
        <CardMedia
          component="img"
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
          }}
        />
      </div>

      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {product.description}
        </Typography>
        <Typography variant="h6" color="text.primary" sx={{ mt: 1 }}>
          ${product.price.toFixed(2)}
        </Typography>
      </CardContent>

      <CardActions disableSpacing sx={{ justifyContent: 'space-between' }}>
        <Button
          size="small"
          onClick={event => {
            event.stopPropagation();
            addToCart(product);
          }}
        >
          Add to Cart
        </Button>
        <Button
          size="small"
          onClick={event => {
            event.stopPropagation();
            handleViewDetails();
          }}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
}
