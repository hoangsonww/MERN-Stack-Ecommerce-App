import * as React from 'react';
import { Grid } from '@mui/material';
import ProductCard from './ProductCard';

export default function ProductListing({ products, addToCart }) {
  return (
    <Grid container spacing={3}>
      {products.map(product => (
        <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
          <ProductCard product={product} addToCart={addToCart} />
        </Grid>
      ))}
    </Grid>
  );
}
