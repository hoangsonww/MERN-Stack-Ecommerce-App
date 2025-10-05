import * as React from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Container, Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import ReplayIcon from '@mui/icons-material/Replay';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VerifiedIcon from '@mui/icons-material/Verified';
import ChecklistIcon from '@mui/icons-material/Checklist';
import AirportShuttleIcon from '@mui/icons-material/AirportShuttle';
import HomeIcon from '@mui/icons-material/Home';

const shippingSteps = [
  {
    title: 'Order confirmed',
    icon: <VerifiedIcon color="primary" fontSize="small" />,
    summary: 'Inventory is allocated instantly and you receive your confirmation email with the FE order number.',
    details: [
      'Payment is verified in real time to lock in limited-release items.',
      'Any personalised engraving or bundle notes are routed to the production queue.',
    ],
  },
  {
    title: 'Packed at our HQ',
    icon: <ChecklistIcon color="primary" fontSize="small" />,
    summary: 'Products move through our smart line for protective packaging and quality checks.',
    details: [
      'Technicians run diagnostics on smart devices and capture serial numbers for your warranty locker.',
      'Impact-tested packaging and climate inserts are added based on the gear in your cart.',
    ],
  },
  {
    title: 'In transit',
    icon: <AirportShuttleIcon color="primary" fontSize="small" />,
    summary: 'The carrier begins the journey and hands off milestone scans to your tracking dashboard.',
    details: [
      'You receive SMS/email updates for each hub the parcel visits.',
      'Need a delivery hold? Reply to any notification and our concierge will coordinate it for you.',
    ],
  },
  {
    title: 'Out for delivery',
    icon: <HomeIcon color="primary" fontSize="small" />,
    summary: 'The final courier run happens and proof of delivery is captured where available.',
    details: [
      'Choose doorstep, mailroom, or signature-required drop-offs in the tracking portal.',
      'We keep a delivery photo on file for 14 days in case you need additional verification.',
    ],
  },
];

function ShippingReturns() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
      <Stack spacing={3} alignItems="center" textAlign="center" sx={{ mb: 4 }}>
        <Chip label="Shipping & Returns" color="primary" variant="outlined" />
        <Typography variant="h3" fontWeight={700}>
          From our warehouse to your setup, on your terms
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680 }}>
          Precision logistics, proactive updates, and a no-drama return policy make gearing up with Fusion Electronics effortless.
        </Typography>
      </Stack>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, height: '100%' }}>
            <Stack spacing={3}>
              <Stack direction="row" spacing={2} alignItems="center">
                <LocalShippingIcon color="primary" fontSize="large" />
                <Typography variant="h5" fontWeight={700}>
                  Fast, insured delivery
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Orders ship within 24 hours on business days. We partner with UPS Premier, FedEx Priority, and DHL Express to guarantee rapid, insured delivery
                in over 190 markets.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tracking links are sent automatically via email and SMS. Preferred delivery windows are available in select metro areas—look for the ”white
                glove” badge at checkout.
              </Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, height: '100%' }}>
            <Stack spacing={3}>
              <Stack direction="row" spacing={2} alignItems="center">
                <FlightTakeoffIcon color="primary" fontSize="large" />
                <Typography variant="h5" fontWeight={700}>
                  International ready
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Duties and taxes are calculated and paid up front for most destinations, eliminating surprise fees at delivery. For remote regions we ship via
                consolidated weekly flights to ensure consistent timelines.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Need expedited delivery for a launch or event? Contact Support and our logistics desk will orchestrate the best route.
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ mt: 5, p: { xs: 3, md: 5 }, borderRadius: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Inventory2Icon color="primary" fontSize="large" />
            <Typography variant="h5" fontWeight={700}>
              Packaging that protects
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Every shipment leaves our facility with impact-tested packaging and tamper seals. If your gear arrives damaged, document it within 48 hours and we
            will handle the claim end-to-end.
          </Typography>
          <Divider />
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={700}>
              Our return promise
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Returns are simple. Initiate a return within 30 days for a prepaid label. Refunds are issued 2-3 business days after inspection. Exchanges ship
              immediately subject to inventory availability.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              For bundles or limited releases, we offer instant store credit so you can pick an alternative without waiting for payment processing.
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <ReplayIcon color="primary" fontSize="small" />
              <Typography variant="caption" color="text.secondary">
                Pro tip: keep original packaging for the smoothest return experience.
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ mt: 5, p: { xs: 3, md: 5 }, borderRadius: 4 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Standard delivery journey
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Tap any milestone to see what happens behind the scenes and how we keep you updated.
        </Typography>
        <Stack spacing={1.5}>
          {shippingSteps.map((step, index) => (
            <Accordion key={step.title} disableGutters sx={{ borderRadius: 3, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Chip label={index + 1} color="primary" variant="outlined" size="small" />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {step.icon}
                    <Typography variant="subtitle1" fontWeight={700}>
                      {step.title}
                    </Typography>
                  </Box>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {step.summary}
                </Typography>
                <Stack component="ul" spacing={1} sx={{ pl: 2, m: 0 }}>
                  {step.details.map(detail => (
                    <Typography component="li" variant="body2" color="text.secondary" key={detail}>
                      {detail}
                    </Typography>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Paper>
    </Container>
  );
}

export default ShippingReturns;
