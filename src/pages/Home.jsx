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
import ProductCard from '../components/ProductCard';
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
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import FormatQuoteRoundedIcon from '@mui/icons-material/FormatQuoteRounded';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import '../App.css';
import { apiClient, withRetry } from '../services/apiClient';
import { useNotifier } from '../context/NotificationProvider';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

// The 3D hero backdrop ships in its own lazy chunk and is only mounted on
// capable GPUs (see detectGpuTier). Weak / reduced-motion devices keep the
// pure-CSS gradient hero.
const HeroScene = React.lazy(() => import('../components/HeroScene'));

// Keeps the hero alive if WebGL throws or the 3D chunk fails to load.
class HeroSceneBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {}
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function detectGpuTier() {
  if (typeof window === 'undefined') return 'none';
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let gl = null;
  try {
    const c = document.createElement('canvas');
    gl = c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl');
  } catch (e) {
    gl = null;
  }
  if (!gl) return 'none';
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  if (reduce || mem <= 2 || cores <= 2) return 'none';
  if (cores <= 4 || window.innerWidth < 700) return 'mid';
  return 'high';
}

const ACCENT_GRADIENT = 'linear-gradient(120deg, #38bdf8 0%, #2874f0 45%, #f50057 100%)';

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

/* ---------- Reusable section heading ---------- */
function SectionHeading({ eyebrow, title, subtitle, align = 'center' }) {
  return (
    <Box sx={{ textAlign: align, mb: 4, maxWidth: align === 'center' ? 720 : 'none', mx: align === 'center' ? 'auto' : 0 }}>
      {eyebrow && (
        <Typography
          component="span"
          sx={{
            display: 'inline-block',
            mb: 1.5,
            px: 1.5,
            py: 0.5,
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'primary.main',
            bgcolor: 'rgba(40,116,240,0.10)',
            border: '1px solid rgba(40,116,240,0.18)',
          }}
        >
          {eyebrow}
        </Typography>
      )}
      <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
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
  const heroHeight = isSmall ? 520 : 620;

  const gpuTier = React.useMemo(detectGpuTier, []);
  const [sceneLost, setSceneLost] = React.useState(false);
  const show3D = (gpuTier === 'mid' || gpuTier === 'high') && !sceneLost;

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
    <Box sx={{ my: { xs: 2, md: 4 }, position: 'relative' }}>
      <Box className="home-aurora" aria-hidden="true" />
      {/* ============================ HERO ============================ */}
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          isolation: 'isolate',
          borderRadius: 6,
          overflow: 'hidden',
          mb: 5,
          minHeight: heroHeight,
          color: 'white',
          background: 'radial-gradient(120% 120% at 80% 0%, #16234a 0%, #0b1124 55%, #070a17 100%)',
        }}
      >
        {/* Procedural 3D backdrop (capable GPUs only) */}
        {show3D && (
          <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }} aria-hidden="true">
            <HeroSceneBoundary>
              <React.Suspense fallback={null}>
                <HeroScene quality={gpuTier} onLost={() => setSceneLost(true)} />
              </React.Suspense>
            </HeroSceneBoundary>
          </Box>
        )}

        {/* Legibility scrim — keeps copy crisp over the moving 3D */}
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background: {
              xs: 'linear-gradient(180deg, rgba(7,10,23,0.35) 0%, rgba(7,10,23,0.85) 100%)',
              md: 'linear-gradient(90deg, rgba(7,10,23,0.92) 0%, rgba(7,10,23,0.55) 42%, rgba(7,10,23,0) 70%)',
            },
          }}
        />

        <Grid container sx={{ position: 'relative', zIndex: 2, minHeight: heroHeight }} alignItems="center">
          <Grid item xs={12} md={7} lg={6} sx={{ p: { xs: 4, md: 8 } }}>
            <Stack spacing={3} alignItems="flex-start">
              <Chip
                icon={<AutoAwesomeRoundedIcon sx={{ color: 'white !important' }} />}
                label="Summer Tech Edit"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.12)',
                  color: 'white',
                  fontWeight: 600,
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255,255,255,0.18)',
                }}
              />
              <Typography
                variant={isSmall ? 'h3' : 'h2'}
                fontWeight={800}
                sx={{ color: '#fff', lineHeight: 1.05, letterSpacing: '-0.03em', fontSize: { xs: '2.6rem', md: '3.8rem' } }}
              >
                Gear that upgrades every{' '}
                <Box
                  component="span"
                  sx={{
                    background: ACCENT_GRADIENT,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent',
                  }}
                >
                  moment
                </Box>{' '}
                of your day.
              </Typography>
              <Typography variant="body1" sx={{ maxWidth: 480, lineHeight: 1.8, color: 'rgba(255,255,255,0.78)' }}>
                Discover handpicked gadgets, smart-home essentials, and creator-ready accessories curated by our in-house specialists.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  component={RouterLink}
                  to="/shop"
                  sx={{
                    px: 3.5,
                    py: 1.4,
                    background: ACCENT_GRADIENT,
                    boxShadow: '0 16px 38px rgba(40,116,240,0.45)',
                    '&:hover': { boxShadow: '0 20px 46px rgba(245,0,87,0.4)' },
                  }}
                >
                  Shop best sellers
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  color="inherit"
                  component={RouterLink}
                  to="/about"
                  sx={{ px: 3.5, py: 1.4, borderColor: 'rgba(255,255,255,0.4)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.06)' } }}
                >
                  Learn our story
                </Button>
              </Stack>
              <Stack
                direction="row"
                spacing={4}
                sx={{ pt: 1 }}
                divider={<Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.18)' }} />}
              >
                <Stack spacing={0.3}>
                  <Typography variant="h5" fontWeight={800}>
                    4.8/5
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                    12k+ reviews
                  </Typography>
                </Stack>
                <Stack spacing={0.3}>
                  <Typography variant="h5" fontWeight={800}>
                    48h
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                    Avg. delivery
                  </Typography>
                </Stack>
                <Stack spacing={0.3}>
                  <Typography variant="h5" fontWeight={800}>
                    50k+
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                    Happy members
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Grid>

          {/* Floating glass trust card (desktop) — balances the composition */}
          <Grid item xs={12} md={5} lg={6} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end', p: { md: 8 } }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                width: 280,
                borderRadius: 4,
                bgcolor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.16)',
                backdropFilter: 'blur(14px)',
                color: 'white',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                {[0, 1, 2, 3, 4].map(i => (
                  <StarRoundedIcon key={i} sx={{ color: '#fbbf24', fontSize: 20 }} />
                ))}
              </Stack>
              <Typography variant="subtitle1" fontWeight={700}>
                Trusted by 50,000+ builders
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5, mb: 2 }}>
                Premium gear, expert curation, and delivery you can count on.
              </Typography>
              <Stack spacing={1.2}>
                {[
                  { icon: <BoltRoundedIcon fontSize="small" />, label: 'Same-week express shipping' },
                  { icon: <VerifiedRoundedIcon fontSize="small" />, label: 'Authentic, warrantied products' },
                  { icon: <LockIcon fontSize="small" />, label: 'Encrypted, secure checkout' },
                ].map(item => (
                  <Stack key={item.label} direction="row" spacing={1.2} alignItems="center">
                    <Box sx={{ display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 2, background: ACCENT_GRADIENT }}>{item.icon}</Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                      {item.label}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Container maxWidth="xl">
        {/* ====================== VALUE PROPS ====================== */}
        <Grid container spacing={2.5} sx={{ mb: 8 }} data-reveal="true">
          {valueProps.map(card => (
            <Grid item xs={12} sm={6} md={3} key={card.title}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 4,
                  border: '1px solid rgba(15,23,42,0.06)',
                  transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease',
                  '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 24px 50px rgba(40,116,240,0.16)' },
                }}
              >
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 52,
                      height: 52,
                      borderRadius: 3,
                      color: 'white',
                      background: ACCENT_GRADIENT,
                      boxShadow: '0 12px 24px rgba(40,116,240,0.3)',
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.description}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* ====================== FEATURED ====================== */}
        <SectionHeading eyebrow="Editor's picks" title="Featured Products" subtitle="Our specialists' top picks for this month — tried, tested, and loved." />

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

        {/* ====================== SPOTLIGHT PROMO ====================== */}
        <Paper
          elevation={0}
          data-reveal="true"
          sx={{
            mt: 12,
            p: { xs: 4, md: 7 },
            borderRadius: 6,
            position: 'relative',
            overflow: 'hidden',
            color: 'white',
            background: 'linear-gradient(115deg, #2563eb 0%, #1e3a8a 44%, #131c3f 74%, #0b1124 100%)',
            boxShadow: '0 30px 70px rgba(15,23,42,0.25)',
          }}
        >
          {/* Crisp, contained accents — a soft top-right sheen + a fading dot grid (no blurry splotches). */}
          <Box
            aria-hidden="true"
            sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(55% 120% at 100% 0%, rgba(56,189,248,0.30), transparent 55%)' }}
          />
          <Box
            aria-hidden="true"
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: 0.45,
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
              WebkitMaskImage: 'linear-gradient(90deg, #000 0%, transparent 65%)',
              maskImage: 'linear-gradient(90deg, #000 0%, transparent 65%)',
            }}
          />
          <Grid container spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid item xs={12} md={8}>
              <Typography
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  mb: 1.5,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                <LocalOfferRoundedIcon sx={{ fontSize: 16 }} /> Member exclusive
              </Typography>
              <Typography variant="h3" fontWeight={800} sx={{ color: '#fff', letterSpacing: '-0.02em', mb: 1.5, fontSize: { xs: '2rem', md: '2.6rem' } }}>
                Up to 40% off premium audio & smart home.
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.82)', maxWidth: 560, lineHeight: 1.7 }}>
                Hand-picked bundles refreshed every week — with free express shipping, easy 30-day returns, and concierge setup help on every order.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
              <Button
                variant="contained"
                size="large"
                component={RouterLink}
                to="/shop"
                endIcon={<ArrowForwardIcon />}
                sx={{ px: 4, py: 1.4, bgcolor: '#fff', color: '#0b1124', fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,0.88)' } }}
              >
                Shop the collection
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* ====================== NEW ARRIVALS ====================== */}
        <Box sx={{ mt: 10 }} data-reveal="true">
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', md: 'flex-end' }}
            justifyContent="space-between"
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography
                component="span"
                sx={{
                  display: 'inline-block',
                  mb: 1,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'primary.main',
                }}
              >
                Just landed
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                New Arrivals
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                Fresh drops from brands we love. Updated every week.
              </Typography>
            </Box>
            <Button variant="text" endIcon={<ArrowForwardIcon />} component={RouterLink} to="/shop">
              View all products
            </Button>
          </Stack>
          <Grid container spacing={4}>
            {newArrivals.map(product => (
              <Grid item key={product.id} xs={12} sm={6} md={4}>
                <ProductCard product={product} addToCart={addToCart} />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ====================== CATEGORIES ====================== */}
        {!!categories.length && (
          <Box sx={{ mt: 12 }} data-reveal="true">
            <SectionHeading eyebrow="Browse" title="Shop by Category" subtitle="Discover essentials across sound, home, fitness, and creative workflows." />
            <Grid container spacing={3} justifyContent="center">
              {categories.map(category => (
                <Grid item xs={6} sm={4} md={categories.length <= 3 ? 3 : 2} key={category.key}>
                  <Paper
                    elevation={0}
                    sx={{
                      textAlign: 'center',
                      p: { xs: 3, md: 4 },
                      borderRadius: 4,
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      border: '1px solid rgba(15,23,42,0.06)',
                      transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease, border-color 0.3s ease',
                      '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 22px 40px rgba(40,116,240,0.16)', borderColor: 'rgba(40,116,240,0.35)' },
                      '&:hover .cat-cta': { opacity: 1, transform: 'translateY(0)' },
                    }}
                    onClick={() => {
                      notify({ severity: 'info', message: `Browsing ${category.label}` });
                      navigate(`/shop?category=${category.key}`);
                    }}
                  >
                    <Box sx={{ p: '3px', borderRadius: '50%', width: 'fit-content', mx: 'auto', mb: 2, background: ACCENT_GRADIENT }}>
                      <Avatar
                        variant="circular"
                        src={category.thumbnail}
                        alt={category.label}
                        sx={{ width: 84, height: 84, border: '3px solid #fff', bgcolor: 'primary.light' }}
                      >
                        {category.label.charAt(0)}
                      </Avatar>
                    </Box>
                    <Typography fontWeight={700}>{category.label}</Typography>
                    <Typography
                      className="cat-cta"
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        color: 'primary.main',
                        fontWeight: 600,
                        opacity: 0,
                        transform: 'translateY(4px)',
                        transition: 'opacity 0.3s ease, transform 0.3s ease',
                      }}
                    >
                      Shop now →
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* ====================== RECOMMENDATIONS ====================== */}
        <Box sx={{ mt: 12 }}>
          <SectionHeading eyebrow="For you" title="Personalized For You" subtitle="Based on your recent views, we think you might like these products." />

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

        {/* ====================== TESTIMONIALS ====================== */}
        <Box sx={{ mt: 12 }} data-reveal="true">
          <SectionHeading
            eyebrow="Social proof"
            title="Loved by creators & innovators"
            subtitle="Real stories from customers building their dream setups with Fusion Electronics."
          />
          <Grid container spacing={3}>
            {testimonials.map(testimonial => (
              <Grid item xs={12} md={4} key={testimonial.name}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    borderRadius: 4,
                    border: '1px solid rgba(15,23,42,0.06)',
                    position: 'relative',
                    transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease',
                    '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 24px 50px rgba(40,116,240,0.14)' },
                  }}
                >
                  <FormatQuoteRoundedIcon sx={{ fontSize: 40, color: 'rgba(40,116,240,0.25)' }} />
                  <Typography variant="body1" sx={{ my: 1.5, lineHeight: 1.7 }}>
                    “{testimonial.quote}”
                  </Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
                    <Avatar sx={{ background: ACCENT_GRADIENT, color: 'white', fontWeight: 700 }}>{testimonial.name.charAt(0)}</Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                        {testimonial.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {testimonial.role}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ====================== NEWSLETTER ====================== */}
        <Paper
          elevation={0}
          data-reveal="true"
          sx={{
            mt: 12,
            p: { xs: 4, md: 6 },
            borderRadius: 6,
            position: 'relative',
            overflow: 'hidden',
            background: 'radial-gradient(120% 140% at 100% 0%, #1e40af 0%, #0f172a 60%)',
            color: 'white',
          }}
        >
          <Grid container spacing={4} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid item xs={12} md={7}>
              <Stack spacing={2}>
                <Chip
                  icon={<StarIcon fontSize="small" />}
                  label="Join 50k+ tech enthusiasts"
                  sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(255,255,255,0.16)', color: 'white' }}
                />
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                  Unlock curated buying guides and exclusive launch alerts.
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Subscribe to the Weekly Signal newsletter for bite-sized product breakdowns, setup inspiration, and member-only perks.
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
                <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />} type="submit" sx={{ background: ACCENT_GRADIENT }}>
                  Get the newsletter
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Divider sx={{ mt: 8, mb: 3 }}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.2em' }}>
            Trusted brands
          </Typography>
        </Divider>

        <Box className="ecom-marquee" data-reveal="true">
          {/* 8 copies → the animated -50% shift lands exactly on a repeat
              boundary (each half is 4× the brand list, always wider than the
              viewport), so the loop is seamless and never shows an end. */}
          <Box className="ecom-marquee__track">
            {Array.from({ length: 8 }).flatMap((_, rep) =>
              brandInitials.map((brand, j) => (
                <Chip
                  key={`${rep}-${j}`}
                  icon={<StarIcon />}
                  label={brand}
                  sx={{ bgcolor: 'rgba(37, 99, 235, 0.08)', fontWeight: 600, px: 0.5, flex: '0 0 auto' }}
                />
              ))
            )}
          </Box>
        </Box>

        {/* ====================== FINAL CTA ====================== */}
        <Box sx={{ textAlign: 'center', mt: 10, mb: 4 }} data-reveal="true">
          <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.02em' }}>
            Ready to build your next-level setup?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, mx: 'auto', mb: 3 }}>
            Explore thousands of curated products, backed by concierge support and hassle-free returns.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" spacing={2}>
            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/shop"
              endIcon={<ArrowForwardIcon />}
              sx={{ px: 4, py: 1.3, background: ACCENT_GRADIENT, boxShadow: '0 16px 38px rgba(40,116,240,0.35)' }}
            >
              View More Products
            </Button>
            <Button variant="outlined" size="large" component={RouterLink} to="/support" sx={{ px: 4, py: 1.3 }}>
              Talk with a specialist
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

export default Home;
