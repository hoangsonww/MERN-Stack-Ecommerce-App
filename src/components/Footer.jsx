import * as React from 'react';
import { Box, Container, Grid, Typography, Link as MuiLink, Stack, TextField, IconButton, Divider, Chip, Tooltip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SendIcon from '@mui/icons-material/Send';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import PrivacyTipOutlinedIcon from '@mui/icons-material/PrivacyTipOutlined';
import GavelIcon from '@mui/icons-material/Gavel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { useNotifier } from '../context/NotificationProvider';

const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'About', to: '/about' },
  { label: 'Support', to: '/support' },
  { label: 'Cart', to: '/cart' },
];

const helpLinks = [
  { label: 'Order Tracking', to: '/order-tracking' },
  { label: 'Shipping & Returns', to: '/shipping-returns' },
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'FAQ', to: '/support#faq' },
  { label: 'Contact Us', to: '/support#contact' },
];

const socialLinks = [
  { icon: <GitHubIcon />, label: 'GitHub', href: 'https://github.com/hoangsonww' },
  { icon: <LinkedInIcon />, label: 'LinkedIn', href: 'https://www.linkedin.com/in/hoangsonw/' },
  { icon: <LanguageIcon />, label: 'Portfolio', href: 'https://sonnguyenhoang.com/' },
  { icon: <EmailIcon />, label: 'Email', href: 'mailto:hoangson091104@gmail.com' },
];

const policyLinks = [
  { label: 'Privacy', to: '/privacy', icon: <PrivacyTipOutlinedIcon fontSize="small" /> },
  { label: 'Terms', to: '/terms', icon: <GavelIcon fontSize="small" /> },
  { label: 'Shipping & Returns', to: '/shipping-returns', icon: <LocalShippingIcon fontSize="small" /> },
  { label: 'Track Order', to: '/order-tracking', icon: <LocationSearchingIcon fontSize="small" /> },
  { label: 'Contact', to: '/support#contact', icon: <SupportAgentIcon fontSize="small" /> },
];

function Footer() {
  const [email, setEmail] = React.useState('');
  const { notify } = useNotifier();

  const handleSubmit = event => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      notify({ severity: 'warning', message: 'Please enter your email to subscribe.' });
      return;
    }
    const emailPattern = /[^@\s]+@[^@\s]+\.[^@\s]+/;
    if (!emailPattern.test(trimmed)) {
      notify({ severity: 'warning', message: 'Enter a valid email address.' });
      return;
    }

    notify({ severity: 'info', message: 'Adding you to the insider list…', autoHideDuration: 2200 });
    notify({ severity: 'success', message: 'You are on the VIP list! Look out for our next drop.' });
    setEmail('');
  };

  return (
    <Box component="footer" sx={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: 'white', mt: 8 }}>
      <Container maxWidth="xl" sx={{ py: { xs: 6, md: 8 } }}>
        <Grid container spacing={5}>
          <Grid item xs={12} md={4}>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '0.12em' }} gutterBottom>
              FUSION ELECTRONICS
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.78)' }}>
              Curating cutting-edge gadgets, smart home essentials, and premium accessories to help you live smarter every day.
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
              {socialLinks.map(link => (
                <IconButton
                  key={link.label}
                  component="a"
                  href={link.href}
                  target="_blank"
                  rel="noopener"
                  color="inherit"
                  size="small"
                  aria-label={link.label}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.08)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                  }}
                >
                  {link.icon}
                </IconButton>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} md={2.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Explore
            </Typography>
            <Stack spacing={1.2}>
              {quickLinks.map(link => (
                <MuiLink
                  key={link.to}
                  component={RouterLink}
                  to={link.to}
                  color="inherit"
                  underline="none"
                  sx={{ color: 'rgba(226,232,240,0.78)', '&:hover': { color: '#fff' } }}
                >
                  {link.label}
                </MuiLink>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} md={2.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Customer Care
            </Typography>
            <Stack spacing={1.2}>
              {helpLinks.map(link => (
                <MuiLink
                  key={link.to}
                  component={RouterLink}
                  to={link.to}
                  color="inherit"
                  underline="none"
                  sx={{ color: 'rgba(226,232,240,0.78)', '&:hover': { color: '#fff' } }}
                >
                  {link.label}
                </MuiLink>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Join the Insider List
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.78)', mb: 2 }}>
              Unlock early access to product drops, curated buying guides, and exclusive VIP offers.
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <TextField
                type="email"
                required
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="your@email.com"
                size="small"
                variant="outlined"
                sx={{ flexGrow: 1, minWidth: '220px', bgcolor: 'white', borderRadius: 1 }}
              />
              <IconButton type="submit" color="primary" sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#e2e8f0' } }}>
                <SendIcon />
              </IconButton>
            </Box>
            <Chip label="We respect your inbox" size="small" sx={{ mt: 2, bgcolor: 'rgba(148, 163, 184, 0.12)', color: 'rgba(248, 250, 252, 0.8)' }} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 5, borderColor: 'rgba(148,163,184,0.25)' }} />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)' }}>
            © {new Date().getFullYear()} Fusion Electronics. Crafted in California & powered worldwide.
          </Typography>
          <Stack direction="row" spacing={2} sx={{ color: 'rgba(226,232,240,0.7)', display: { xs: 'none', sm: 'flex' } }}>
            {policyLinks.map(link => (
              <MuiLink key={link.to} component={RouterLink} to={link.to} color="inherit" underline="none">
                {link.label}
              </MuiLink>
            ))}
          </Stack>
          <Stack direction="row" spacing={1} sx={{ display: { xs: 'flex', sm: 'none' } }}>
            {policyLinks.map(link => (
              <Tooltip key={link.to} title={link.label} enterTouchDelay={0} leaveTouchDelay={2500}>
                <IconButton
                  component={RouterLink}
                  to={link.to}
                  size="small"
                  color="inherit"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.12)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                  }}
                  aria-label={link.label}
                >
                  {link.icon}
                </IconButton>
              </Tooltip>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

export default Footer;
