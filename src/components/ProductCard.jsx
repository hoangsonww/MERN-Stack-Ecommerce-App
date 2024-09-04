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

  return (
    <Card sx={{ maxWidth: 345, height: '100%' }}>
      <div style={{ position: 'relative', paddingBottom: '100%' }}>
        <CardMedia
          component="img"
          alt={product.name}
          src={product.image}
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
        <Button size="small" onClick={() => addToCart(product)}>
          Add to Cart
        </Button>
        <Button size="small" onClick={handleViewDetails} sx={{ mr: 1 }}>
          View Details
        </Button>
      </CardActions>
    </Card>
  );
}
