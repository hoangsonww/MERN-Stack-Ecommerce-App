import * as React from 'react';
import { Box, Chip, Container, Divider, Grid, List, ListItem, ListItemIcon, ListItemText, Paper, Stack, Typography } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PaymentsIcon from '@mui/icons-material/Payments';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

const termsSections = [
  {
    title: 'Using our platform',
    copy: 'Fusion Electronics delivers a curated digital storefront for premium consumer technology. By visiting our site you agree to engage respectfully, refrain from malicious activity, and only submit accurate personal details. Accounts may be suspended when suspicious behaviour is detected to keep the community safe.',
    icon: <VerifiedUserIcon color="primary" fontSize="large" />,
  },
  {
    title: 'Orders, billing, and pricing',
    copy: 'Checkout totals are confirmed at the point of payment, inclusive of taxes and shipping where applicable. We reserve the right to cancel or refund orders in the rare case of pricing errors or inventory constraints. Any promotional pricing or bundles will state clear eligibility criteria.',
    icon: <PaymentsIcon color="primary" fontSize="large" />,
  },
  {
    title: 'Shipping commitments',
    copy: 'Most in-stock products ship within one business day from our fulfillment hubs. Delivery timeframes shared at checkout are estimates subject to carrier performance. Please verify your shipping address carefully—undeliverable packages may incur reshipment fees.',
    icon: <LocalShippingIcon color="primary" fontSize="large" />,
  },
  {
    title: 'Returns and exchanges',
    copy: 'We proudly stand behind the hardware we curate. Eligible products can be returned within 30 days of delivery so long as they remain in like-new condition with original packaging. Certain hygiene or final-sale items will be clearly marked as non-returnable before purchase.',
    icon: <AutorenewIcon color="primary" fontSize="large" />,
  },
  {
    title: 'Support and escalation',
    copy: 'Our concierge team loves solving tough problems. If an issue arises, contact us through the Support Centre so we can document the details and provide a resolution timeline. Emergencies impacting device safety will always receive priority routing.',
    icon: <SupportAgentIcon color="primary" fontSize="large" />,
  },
];

function Terms() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
      <Stack spacing={3} alignItems="center" textAlign="center" sx={{ mb: 4 }}>
        <Chip label="Terms of Service" color="primary" variant="outlined" />
        <Typography variant="h3" fontWeight={700}>
          The agreement that powers our partnership
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680 }}>
          These terms ensure every Fusion Electronics order is handled with integrity, transparency, and the level of care you expect from a premium retailer.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Last updated: April 7, 2025
        </Typography>
      </Stack>

      <Paper elevation={0} sx={{ pr: 4, pt: 1, borderRadius: 4 }}>
        <Stack spacing={4}>
          {termsSections.map(section => (
            <Grid container spacing={3} key={section.title} alignItems="flex-start">
              <Grid item xs={12} sm={2} display="flex" justifyContent="center">
                {section.icon}
              </Grid>
              <Grid item xs={12} sm={10}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {section.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {section.copy}
                </Typography>
              </Grid>
            </Grid>
          ))}

          <Divider />

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ pl: 4 }}>
              Your responsibilities
            </Typography>
            <List dense sx={{ pl: 4, pb: 4 }}>
              <ListItem disableGutters>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <GavelIcon color="primary" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Provide accurate account and billing details so orders arrive without delay." />
              </ListItem>
              <ListItem disableGutters>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <GavelIcon color="primary" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Respect intellectual property and only use site content for personal shopping." />
              </ListItem>
              <ListItem disableGutters>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <GavelIcon color="primary" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Notify us quickly if you believe your account has been accessed without permission." />
              </ListItem>
            </List>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}

export default Terms;
