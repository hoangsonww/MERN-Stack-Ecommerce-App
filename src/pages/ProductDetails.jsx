import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Typography, Container, Grid, Paper, Button, CircularProgress
} from '@mui/material';

function ProductDetails({ addToCart }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchProduct() {
            try {
                const response = await axios.get(`http://localhost:5000/api/products/${id}`);
                if (response.data) {
                    setProduct(response.data);
                }
            }
            catch (error) {
                setError(error);
            }
            finally {
                setLoading(false);
            }
        }
        fetchProduct();
    }, [id, navigate]);

    const handleAddToCart = () => {
        if (product) {
            addToCart(product);
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
        return <Typography variant="h4" align="center">Error loading product details.</Typography>;
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <img src={product.image} alt={product.name} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography variant="h4" gutterBottom>{product.name}</Typography>
                        <Typography variant="h6">${product.price}</Typography>
                        <Typography variant="body1" gutterBottom>{product.description}</Typography>
                        <Button variant="contained" color="primary" onClick={handleAddToCart}>
                            Add to Cart
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    );
}

export default ProductDetails;
