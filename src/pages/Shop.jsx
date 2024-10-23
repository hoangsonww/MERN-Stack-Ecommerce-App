import * as React from 'react';
import { Grid, Typography, Container, Box, FormControl, InputLabel, Select, MenuItem, Pagination, CircularProgress } from '@mui/material';
import ProductCard from '../components/ProductCard';

function Shop({ products, addToCart }) {
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true); // Set loading to true initially to show CircularProgress
  const itemsPerPage = 6;

  // Capitalize the first letter of each category
  const capitalizeCategory = (category) => category.charAt(0).toUpperCase() + category.slice(1);

  const uniqueCategories = Array.from(new Set(products.map(product => capitalizeCategory(product.category))));

  const filteredProducts = categoryFilter === 'all'
    ? products
    : products.filter(product => capitalizeCategory(product.category) === categoryFilter);

  const pageCount = Math.ceil(filteredProducts.length / itemsPerPage);

  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const productsToShow = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleCategoryChange = event => {
    setCategoryFilter(event.target.value);
    setPage(1);
  };

  React.useEffect(() => {
    // Simulating an API call to fetch products
    setLoading(true);
    const fetchProducts = async () => {
      // Simulate an API fetch with a timeout (replace with actual API call)
      setTimeout(() => {
        setLoading(false); // Set loading to false after data is loaded
      }, 1000); // Adjust this timeout or replace with an actual fetch call
    };

    fetchProducts();
  }, []);

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
        <Select
          labelId="category-filter-label"
          id="category-filter"
          value={categoryFilter}
          label="Filter by Category"
          onChange={handleCategoryChange}
        >
          <MenuItem value="all">All Categories</MenuItem>
          {uniqueCategories.map(category => (
            <MenuItem key={category} value={category}>
              {category}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Grid container spacing={3}>
        {productsToShow.map(product => (
          <Grid item key={product.id} xs={12} sm={6} md={4}>
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
