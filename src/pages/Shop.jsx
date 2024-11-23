import * as React from 'react';
import { Grid, Typography, Container, Box, FormControl, InputLabel, Select, MenuItem, Pagination, CircularProgress } from '@mui/material';
import ProductCard from '../components/ProductCard';
import '../App.css';

function Shop({ products, addToCart, loading }) {
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [animatedCards, setAnimatedCards] = React.useState([]); // Track animated card indices
  const itemsPerPage = 6;

  // Capitalize the first letter of each category
  const capitalizeCategory = category => category.charAt(0).toUpperCase() + category.slice(1);

  const uniqueCategories = Array.from(new Set(products.map(product => capitalizeCategory(product.category))));

  const filteredProducts = categoryFilter === 'all' ? products : products.filter(product => capitalizeCategory(product.category) === categoryFilter);

  const pageCount = Math.ceil(filteredProducts.length / itemsPerPage);

  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const productsToShow = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (event, value) => {
    setPage(value);
    setAnimatedCards([]); // Reset animations when page changes
  };

  const handleCategoryChange = event => {
    setCategoryFilter(event.target.value);
    setPage(1);
    setAnimatedCards([]); // Reset animations when category changes
  };

  React.useEffect(() => {
    // Add animation classes incrementally for visible product cards
    const timer = setTimeout(() => {
      setAnimatedCards(productsToShow.map((_, index) => index));
    }, 100);

    return () => clearTimeout(timer);
  }, [productsToShow]);

  if (loading) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ my: 2 }}>
        Shop
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="category-filter-label">Filter by Category</InputLabel>
        <Select labelId="category-filter-label" id="category-filter" value={categoryFilter} label="Filter by Category" onChange={handleCategoryChange}>
          <MenuItem value="all">All Categories</MenuItem>
          {uniqueCategories.map(category => (
            <MenuItem key={category} value={category}>
              {category}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Grid container spacing={3}>
        {productsToShow.map((product, index) => (
          <Grid item key={product.id} xs={12} sm={6} md={4} className={animatedCards.includes(index) ? 'product-card-animated' : ''}>
            <ProductCard product={product} addToCart={addToCart} />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 3 }}>
        <Pagination count={pageCount} page={page} onChange={handlePageChange} color="primary" />
      </Box>
    </Container>
  );
}

export default Shop;
