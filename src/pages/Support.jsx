import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Typography, Accordion, AccordionSummary, AccordionDetails, TextField, Button, Grid, Paper, Stack, Chip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PhoneForwardedIcon from '@mui/icons-material/PhoneForwarded';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ShieldIcon from '@mui/icons-material/Shield';
import { useNotifier } from '../context/NotificationProvider';

const faqs = [
  {
    question: 'How quickly do you ship orders?',
    answer: 'Orders placed before 2 PM local warehouse time ship the same day. US orders arrive in 2 business days, international orders within 4-7 days.',
  },
  {
    question: 'What is your return policy?',
    answer:
      'You have 30 days from delivery to initiate a return. We provide prepaid labels and instant store credit or refunds back to your original payment method.',
  },
  {
    question: 'Do products come with warranties?',
    answer: 'Most of our gear includes a 1-year manufacturer warranty. For Fusion-branded collections we extend that to 24 months automatically.',
  },
  {
    question: 'Can I speak with a product specialist before ordering?',
    answer: 'Absolutely. Book a complimentary 15-minute virtual consult with our team to get tailored recommendations.',
  },
  {
    question: 'Do you offer setup or installation support?',
    answer:
      'Yes. Our concierge partners cover in-home setup in 180+ metro areas. Let us know your ZIP code in the contact form and we will coordinate scheduling.',
  },
  {
    question: 'Can I finance my purchase?',
    answer:
      'We partner with Affirm and Klarna to provide flexible financing at checkout. Most approvals happen instantly with 0% APR promotional plans available.',
  },
  {
    question: 'Will you price match other retailers?',
    answer: 'If you find an identical product in stock at an authorized retailer within 14 days of purchase, reach out with the link and we will match it.',
  },
  {
    question: 'How can I see the status of my support ticket?',
    answer: 'Every request receives a confirmation email with a tracking number. Reply to that thread or log into your dashboard to see updates in real time.',
  },
];

function Support() {
  const [form, setForm] = React.useState({ name: '', email: '', topic: '', message: '' });
  const { notify } = useNotifier();
  const location = useLocation();

  const handleChange = event => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = event => {
    event.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const topic = form.topic.trim();
    const message = form.message.trim();

    if (!name || !email || !topic || !message) {
      notify({ severity: 'warning', message: 'Please complete all required fields.' });
      return;
    }

    const emailPattern = /[^@\s]+@[^@\s]+\.[^@\s]+/;
    if (!emailPattern.test(email)) {
      notify({ severity: 'warning', message: 'Enter a valid email address so we can respond.' });
      return;
    }

    notify({ severity: 'info', message: 'Submitting your request…', autoHideDuration: 2200 });
    setTimeout(() => {
      notify({ severity: 'success', message: 'Contact request submitted! A specialist will reach out within 24 hours.' });
    }, 350);
    setForm({ name: '', email: '', topic: '', message: '' });
  };

  React.useEffect(() => {
    const { hash } = location;
    if (!hash || hash === '#faq') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const targetId = hash.replace('#', '');
    const scrollToSection = () => {
      const node = document.getElementById(targetId);
      if (node) {
        const offset = 96;
        const nodeTop = node.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: nodeTop, behavior: 'smooth' });
      }
    };

    const timeout = window.setTimeout(scrollToSection, 120);
    return () => window.clearTimeout(timeout);
  }, [location]);

  return (
    <Container maxWidth="lg" sx={{ pb: 10 }}>
      <Stack spacing={1} sx={{ textAlign: 'center', mt: 6, mb: 6 }} alignItems="center">
        <Chip label="Need a hand?" color="primary" variant="outlined" sx={{ alignSelf: 'center' }} />
        <Typography variant="h3" fontWeight={700}>
          Support that feels human.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mx: 'auto', textAlign: 'center' }}>
          Whether you have a delivery question or want help planning your dream setup, our specialists are on standby.
        </Typography>
      </Stack>

      <Grid container spacing={4} id="orders">
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, height: '100%' }}>
            <Stack spacing={2}>
              <PhoneForwardedIcon color="primary" fontSize="large" />
              <Typography variant="h6" fontWeight={700}>
                Concierge hotline
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Call +1 (833) 555-0195 from 7 AM – 11 PM PST, 7 days a week. We’ll resolve most issues on the spot.
              </Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4} id="shipping">
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, height: '100%' }}>
            <Stack spacing={2}>
              <LocalShippingIcon color="primary" fontSize="large" />
              <Typography variant="h6" fontWeight={700}>
                Delivery & tracking
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track your order in real time from the Orders dashboard. Text updates available in the US, EU, and APAC regions.
              </Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4} id="privacy">
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, height: '100%' }}>
            <Stack spacing={2}>
              <ShieldIcon color="primary" fontSize="large" />
              <Typography variant="h6" fontWeight={700}>
                Privacy first
              </Typography>
              <Typography variant="body2" color="text.secondary">
                We never sell personal data. Review our full privacy brief and security protocols anytime.
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Stack spacing={2} sx={{ mt: 8, mb: 2 }} id="faq">
        <Typography variant="h4" fontWeight={700}>
          Frequently asked questions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Quick answers to common questions about orders, shipping, and returns.
        </Typography>
      </Stack>

      {faqs.map(item => (
        <Accordion key={item.question} sx={{ borderRadius: 2, mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>{item.question}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary">
              {item.answer}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}

      <Paper elevation={0} sx={{ mt: 8, p: { xs: 3, md: 5 }, borderRadius: 4 }} id="contact">
        <Grid container spacing={4}>
          <Grid item xs={12} md={5}>
            <Stack spacing={2}>
              <SupportAgentIcon color="primary" fontSize="large" />
              <Typography variant="h4" fontWeight={700}>
                Send us a message
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Drop your details and we’ll reach out within a business day. Include links or screenshots if you’re troubleshooting gear.
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={7}>
            <form onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} fullWidth required />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Topic"
                    name="topic"
                    value={form.topic}
                    onChange={handleChange}
                    placeholder="Orders, returns, product advice"
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="How can we help?" name="message" value={form.message} onChange={handleChange} multiline rows={4} fullWidth required />
                </Grid>
              </Grid>
              <Button type="submit" variant="contained" size="large" sx={{ mt: 3 }}>
                Submit request
              </Button>
            </form>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default Support;
