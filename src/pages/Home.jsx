import * as React from 'react';
import {
  Typography,
  Grid,
  Box,
  Container,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  Paper,
  styled,
  Pagination,
  Stack,
  Link,
  Collapse,
  Chip,
  Divider,
  Avatar,
  TextField,
  InputAdornment,
  useMediaQuery,
} from '@mui/material';
import Carousel from 'react-material-ui-carousel';
import ProductCard from '../components/ProductCard';
import summerSaleImage from '../assets/images/summer-sale.jpg';
import techGadgetsImage from '../assets/images/tech-gadgets.jpg';
import trendingFashionImage from '../assets/images/trending-fashion.png';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import LockIcon from '@mui/icons-material/Lock';
import SyncIcon from '@mui/icons-material/Sync';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StarIcon from '@mui/icons-material/Star';
import FormatQuoteRoundedIcon from '@mui/icons-material/FormatQuoteRounded';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import '../App.css';
import { apiClient, withRetry } from '../services/apiClient';
import { useNotifier } from '../context/NotificationProvider';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

const StyledCarousel = styled(Carousel)({
  height: '100%',
  '& .CarouselItem': {
    overflow: 'hidden',
    borderRadius: 0,
  },
  '& .MuiPaper-root': {
    overflow: 'hidden',
    borderRadius: 0,
  },
  '& .Carousel-indicators-container': {
    bottom: '20px',
    '& button': {
      backgroundColor: 'white',
      opacity: 0.6,
      '&:hover': { opacity: 1 },
      '&.selected': { opacity: 1 },
    },
  },
});

const normalizeProduct = p => {
  const canonical = p._id || p.id;
  return { ...p, id: canonical, _id: canonical };
};

const valueProps = [
  {
    title: 'Free 2-Day Delivery',
    description: 'Complimentary express shipping on all orders over $75 in the continental US.',
    icon: <LocalShippingIcon fontSize="large" />,
  },
  {
    title: 'Concierge Support',
    description: 'Dedicated product specialists available 24/7 to help you level up your setup.',
    icon: <HeadsetMicIcon fontSize="large" />,
  },
  {
    title: 'Secure Checkout',
    description: 'End-to-end encryption and trusted payment partners keep your data protected.',
    icon: <LockIcon fontSize="large" />,
  },
  {
    title: '30-Day Returns',
    description: 'Love it or send it back. Hassle-free returns on every single purchase.',
    icon: <SyncIcon fontSize="large" />,
  },
];

const testimonials = [
  {
    name: 'Riley Chen',
    role: 'Content Creator',
    quote: 'Fusion Electronics curates gear I didn’t even know I needed. The quality and delivery speed are unmatched.',
  },
  {
    name: 'Morgan Patel',
    role: 'Startup Founder',
    quote: 'From smart home tech to productivity gadgets, everything arrives perfectly packaged and ready to go.',
  },
  {
    name: 'Devon Brooks',
    role: 'Product Designer',
    quote: 'Their support team is next level. They helped me switch out a device overnight before a big launch.',
  },
];

const brandInitials = ['SONY', 'BOSE', 'LG', 'SAMSUNG', 'ANKER', 'APPLE'];

/* ---------- Pretty states for Recommended ---------- */
function RecommendedError({ error, onRetry }) {
  const [showDetails, setShowDetails] = React.useState(false);
  const detail = error?.response?.data?.message || error?.message || 'Unknown error. Please try again.';

  return (
    <Alert
      severity="warning"
      variant="outlined"
      icon={<CloudOffIcon />}
      sx={{
        borderRadius: 3,
        borderWidth: 2,
        maxWidth: 900,
        mx: 'auto',
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
      <AlertTitle>Recommendations unavailable</AlertTitle>
      We couldn’t load personalized picks right now. This often happens when the vector service is unreachable. Please try again shortly.
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

function RecommendedEmpty({ onExplore }) {
  return (
    <Alert
      severity="info"
      icon={<InfoOutlinedIcon />}
      sx={{
        borderRadius: 3,
        maxWidth: 900,
        mx: 'auto',
        background: theme => `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
      }}
    >
      <AlertTitle>No recommendations yet</AlertTitle>
      Browse a few products so we can learn your taste and surface better picks.
      <Box sx={{ mt: 1 }}>
        <Button onClick={onExplore} variant="outlined" size="small" endIcon={<ArrowForwardIcon fontSize="small" />}>
          Explore products
        </Button>
      </Box>
    </Alert>
  );
}

/* --------------------------------------------------- */

function Home({ products, addToCart, error, loading }) {
  const featuredProducts = React.useMemo(() => products.slice(0, 3).map(normalizeProduct), [products]);
  const newArrivals = React.useMemo(() => {
    if (!Array.isArray(products)) return [];
    return [...products]
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 6)
      .map(normalizeProduct);
  }, [products]);
  const topRated = React.useMemo(() => {
    if (!Array.isArray(products)) return [];
    const rated = products.filter(p => typeof p?.rating === 'number' && p.rating >= 4.2);
    const base = rated.length ? rated : products;
    return base.slice(0, 6).map(normalizeProduct);
  }, [products]);
  const categories = React.useMemo(() => {
    const unique = new Map();
    products.forEach(product => {
      if (!product?.category) return;
      const key = product.category.toLowerCase();
      if (!unique.has(key)) {
        unique.set(key, {
          key,
          label: product.category.charAt(0).toUpperCase() + product.category.slice(1),
          thumbnail: product.image,
        });
      }
    });
    return Array.from(unique.values()).slice(0, 6);
  }, [products]);

  const [animatedCards, setAnimatedCards] = React.useState([]);
  const [recs, setRecs] = React.useState([]);
  const [recLoading, setRecLoading] = React.useState(true);
  const [recError, setRecError] = React.useState(null);
  const [recPage, setRecPage] = React.useState(1);
  const [newsletterEmail, setNewsletterEmail] = React.useState('');
  const recPerPage = 6;
  const { notify } = useNotifier();
  const isSmall = useMediaQuery('(max-width:900px)');
  const navigate = useNavigate();
  const heroHeight = isSmall ? 420 : 560;

  /* Featured card animation */
  React.useEffect(() => {
    const t = setTimeout(() => {
      setAnimatedCards(featuredProducts.map((_, i) => i));
    }, 120);
    return () => clearTimeout(t);
  }, [featuredProducts]);

  /* Fetch recommendations (hoisted for Retry) */
  const fetchRecs = React.useCallback(async () => {
    setRecLoading(true);
    setRecError(null);
    try {
      const visitedRaw = JSON.parse(localStorage.getItem('visitedProducts')) || [];
      const visited = visitedRaw.filter(entry => entry && entry.id);
      if (!visited.length) {
        localStorage.removeItem('visitedProducts');
        setRecs([]);
        return;
      }

      const seen = new Set();
      const lastTen = [];
      for (let i = visited.length - 1; i >= 0 && lastTen.length < 10; i -= 1) {
        const vid = visited[i].id;
        if (!vid || seen.has(vid)) continue;
        seen.add(vid);
        lastTen.push(vid);
      }
      if (!lastTen.length) {
        setRecs([]);
        return;
      }

      const { data } = await withRetry(() => apiClient.post('products/recommendations', { ids: lastTen }));
      if (!Array.isArray(data)) {
        throw new Error('Unexpected recommendations response.');
      }
      setRecs(data);
    } catch (e) {
      if (e?.response?.status === 400) {
        console.warn('Clearing visitedProducts due to stale recommendation ids');
        localStorage.removeItem('visitedProducts');
        setRecs([]);
      } else {
        setRecs([]);
        setRecError(e);
      }
    } finally {
      setRecLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRecs();
  }, [fetchRecs]);

  /* Pagination helpers for recommendations */
  const recPageCount = Math.ceil(recs.length / recPerPage) || 1;
  const recStart = (recPage - 1) * recPerPage;
  const recToShow = recs.slice(recStart, recStart + recPerPage).map(normalizeProduct);
  const handleRecPageChange = (_e, value) => setRecPage(value);

  const bannerImages = [
    { url: summerSaleImage, title: 'Summer Sale - Up to 50% Off', description: 'Shop now for the best deals on summer essentials!' },
    { url: techGadgetsImage, title: 'New Tech Gadgets', description: 'Explore the latest in tech and gadgets.' },
    { url: trendingFashionImage, title: 'Trending Electronics', description: 'Discover the newest trends in electronics this season.' },
  ];

  const handleNewsletterSubmit = event => {
    event.preventDefault();
    const email = newsletterEmail.trim();
    if (!email) {
      notify({ severity: 'warning', message: 'Please enter your email address.' });
      return;
    }
    const pattern = /[^@\s]+@[^@\s]+\.[^@\s]+/;
    if (!pattern.test(email)) {
      notify({ severity: 'warning', message: 'Enter a valid email address.' });
      return;
    }
    notify({ severity: 'info', message: 'Unlocking those curated drops for you…', autoHideDuration: 2200 });
    notify({ severity: 'success', message: 'Welcome aboard! Expect curated drops every Friday.' });
    setNewsletterEmail('');
  };

  const handleExplore = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box sx={{ my: { xs: 2, md: 4 } }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 5,
          overflow: 'hidden',
          mb: 5,
          position: 'relative',
          background: 'linear-gradient(120deg, rgba(40,116,240,0.92) 0%, rgba(63,81,181,0.82) 100%)',
          minHeight: heroHeight,
        }}
      >
        <Grid container sx={{ height: '100%' }} alignItems="stretch">
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              p: { xs: 4, md: 8 },
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 3,
              minHeight: heroHeight,
            }}
          >
            <Chip label="Summer Tech Edit" sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} />
            <Box>
              <Typography variant={isSmall ? 'h4' : 'h3'} fontWeight={800} gutterBottom color="common.white">
                Gear that upgrades every moment of your day.
              </Typography>
              <Typography variant="body1" sx={{ maxWidth: 440, lineHeight: 1.8 }}>
                Discover handpicked gadgets, smart home essentials, and creator-ready accessories curated by our in-house specialists.
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />} component={RouterLink} to="/shop">
                Shop best sellers
              </Button>
              <Button variant="outlined" size="large" color="inherit" component={RouterLink} to="/about">
                Learn our story
              </Button>
            </Stack>
            <Stack direction="row" spacing={3}>
              <Stack spacing={0.5}>
                <Typography variant="h5" fontWeight={700}>
                  4.8/5
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Rated by 12k+ customers
                </Typography>
              </Stack>
              <Stack spacing={0.5}>
                <Typography variant="h5" fontWeight={700}>
                  48h
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Average delivery time
                </Typography>
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
            <Box sx={{ flex: 1, position: 'relative', minHeight: heroHeight }}>
              <StyledCarousel
                height={heroHeight}
                animation="slide"
                autoPlay
                interval={3500}
                navButtonsAlwaysVisible
                indicatorIconButtonProps={{ style: { padding: 10 } }}
                navButtonsProps={{ style: { backgroundColor: 'rgba(17, 24, 39, 0.45)' } }}
              >
                {bannerImages.map(item => (
                  <Box key={item.title} sx={{ height: '100%', position: 'relative' }}>
                    <Box
                      component="img"
                      src={item.url}
                      alt={item.title}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        background: 'linear-gradient(180deg, rgba(10,13,28,0.05) 0%, rgba(10,13,28,0.75) 100%)',
                        color: '#fff',
                        p: { xs: 2, md: 3 },
                        borderRadius: '8px',
                      }}
                    >
                      <Typography variant="h5" fontWeight={700} gutterBottom>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" sx={{ maxWidth: 520 }}>
                        {item.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </StyledCarousel>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Container maxWidth="xl">
        <Grid container spacing={2} sx={{ mb: 6 }}>
          {valueProps.map(card => (
            <Grid item xs={12} sm={6} md={3} key={card.title}>
              <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: 4, backdropFilter: 'blur(6px)' }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}>{card.icon}</Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.description}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: 'center', mb: 1 }}>
          <Typography variant="h4" fontWeight={700}>
            Featured Products
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Check out our top picks for this month!
          </Typography>
        </Box>

        {error ? (
          <Alert severity="error" sx={{ maxWidth: 560, mx: 'auto' }}>
            {error.message}
          </Alert>
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={4}>
            {featuredProducts.map((p, idx) => (
              <Grid item key={p._id} xs={12} sm={6} md={4} className={animatedCards.includes(idx) ? 'product-card-animated' : ''}>
                <ProductCard product={p} addToCart={addToCart} />
              </Grid>
            ))}
          </Grid>
        )}

        <Box sx={{ mt: 8 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
            <Box>
              <Typography variant="h4" fontWeight={700}>
                New Arrivals
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Fresh drops from brands we love. Updated every week.
              </Typography>
            </Box>
            <Button variant="text" endIcon={<ArrowForwardIcon />} href="/shop">
              View all products
            </Button>
          </Stack>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            {newArrivals.map(product => (
              <Grid item key={product.id} xs={12} sm={6} md={4}>
                <ProductCard product={product} addToCart={addToCart} />
              </Grid>
            ))}
          </Grid>
        </Box>

        {!!categories.length && (
          <Box sx={{ mt: 10 }}>
            <Typography variant="h4" fontWeight={700} textAlign="center">
              Shop by Category
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
              Discover essentials across sound, home, fitness, and creative workflows.
            </Typography>
            <Grid container spacing={3}>
              {categories.map(category => (
                <Grid item xs={12} sm={4} md={2} key={category.key}>
                  <Paper
                    elevation={0}
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      borderRadius: 4,
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 18px 30px rgba(15, 23, 42, 0.08)',
                      },
                    }}
                    onClick={() => {
                      notify({ severity: 'info', message: `Browsing ${category.label}` });
                      navigate(`/shop?category=${category.key}`);
                    }}
                  >
                    <Avatar
                      variant="rounded"
                      src={category.thumbnail}
                      alt={category.label}
                      sx={{ width: 72, height: 72, mx: 'auto', mb: 2, bgcolor: 'primary.light' }}
                    >
                      {category.label.charAt(0)}
                    </Avatar>
                    <Typography fontWeight={600}>{category.label}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Box sx={{ mt: 10 }}>
          <Typography variant="h4" fontWeight={700} textAlign="center">
            Personalized For You
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
            Based on your recent views, we think you might like these products!
          </Typography>

          {recError ? (
            <RecommendedError error={recError} onRetry={fetchRecs} />
          ) : recLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : recs.length === 0 ? (
            <RecommendedEmpty onExplore={handleExplore} />
          ) : (
            <>
              <Grid container spacing={4}>
                {recToShow.map(rec => (
                  <Grid item key={rec.id} xs={12} sm={6} md={4}>
                    <ProductCard product={rec} addToCart={addToCart} />
                  </Grid>
                ))}
              </Grid>

              {recPageCount > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination count={recPageCount} page={recPage} onChange={handleRecPageChange} color="primary" />
                </Box>
              )}
            </>
          )}
        </Box>

        <Box sx={{ mt: 10 }}>
          <Typography variant="h4" fontWeight={700} textAlign="center">
            Loved by creators & innovators
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
            Real stories from customers building their dream setups with Fusion Electronics.
          </Typography>
          <Grid container spacing={3}>
            {testimonials.map(testimonial => (
              <Grid item xs={12} md={4} key={testimonial.name}>
                <Paper elevation={0} sx={{ p: 4, height: '100%', borderRadius: 4 }}>
                  <FormatQuoteRoundedIcon color="primary" />
                  <Typography variant="body1" sx={{ my: 2 }}>
                    “{testimonial.quote}”
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {testimonial.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {testimonial.role}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Paper
          elevation={0}
          sx={{
            mt: 10,
            p: { xs: 4, md: 6 },
            borderRadius: 5,
            background: 'linear-gradient(120deg, rgba(15,23,42,0.95) 0%, rgba(30,64,175,0.85) 100%)',
            color: 'white',
          }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={2}>
                <Chip
                  icon={<StarIcon fontSize="small" />}
                  label="Join 50k+ tech enthusiasts"
                  sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(255,255,255,0.18)', color: 'white' }}
                />
                <Typography variant="h4" fontWeight={700}>
                  Unlock curated buying guides and exclusive launch alerts.
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Subscribe to the Weekly Signal newsletter to get bite-sized product breakdowns, setup inspiration, and member-only perks.
                </Typography>
                <Stack direction="row" spacing={3} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  <Stack>
                    <Typography variant="h6" fontWeight={700}>
                      2x
                    </Typography>
                    <Typography variant="caption">More reward points</Typography>
                  </Stack>
                  <Stack>
                    <Typography variant="h6" fontWeight={700}>
                      48hr
                    </Typography>
                    <Typography variant="caption">VIP launch previews</Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box component="form" onSubmit={handleNewsletterSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  variant="outlined"
                  value={newsletterEmail}
                  onChange={event => setNewsletterEmail(event.target.value)}
                  placeholder="Enter your email"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    sx: { bgcolor: 'white', borderRadius: 2 },
                  }}
                />
                <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />} type="submit">
                  Get the newsletter
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Divider sx={{ my: 10 }} />

        <Stack direction="row" spacing={3} justifyContent="center" alignItems="center" flexWrap="wrap">
          {brandInitials.map(brand => (
            <Chip key={brand} icon={<StarIcon />} label={brand} sx={{ bgcolor: 'rgba(37, 99, 235, 0.08)' }} />
          ))}
        </Stack>

        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Ready to build your next-level setup?
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" spacing={2}>
            <Button variant="contained" size="large" component={RouterLink} to="/shop" endIcon={<ArrowForwardIcon />}>
              View More Products
            </Button>
            <Button variant="outlined" size="large" component={RouterLink} to="/support">
              Talk with a specialist
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

export default Home;
