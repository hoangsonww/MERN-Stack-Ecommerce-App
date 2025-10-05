import * as React from 'react';
import { Container, Typography, Grid, Paper, Stack, Chip, Avatar, Divider, Box } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';

const milestones = [
  {
    year: '2018',
    title: 'Launch',
    description: 'Started Fusion Electronics with a mission to curate gear that empowers creators and everyday innovators.',
  },
  {
    year: '2020',
    title: 'Global Warehouses',
    description: 'Opened regional fulfillment hubs in Austin, Berlin, and Singapore to ship faster than ever.',
  },
  {
    year: '2022',
    title: 'Creator Collective',
    description: 'Introduced our invite-only creator program to co-design exclusive bundles and gear edits.',
  },
  {
    year: '2024',
    title: '50k+ Members',
    description: 'Celebrated 50,000 VIP members and expanded our line to include modular smart home ecosystems.',
  },
];

const pillars = [
  {
    icon: <EmojiObjectsIcon fontSize="large" />,
    title: 'Curated Tech Intelligence',
    description: 'Every product we list goes through hands-on testing by our lab team. If it doesn’t elevate your setup, it doesn’t make the cut.',
  },
  {
    icon: <PrecisionManufacturingIcon fontSize="large" />,
    title: 'Responsible Innovation',
    description: 'We partner with makers focused on energy efficiency, recycled materials, and ethical manufacturing.',
  },
  {
    icon: <FavoriteBorderIcon fontSize="large" />,
    title: 'Delightful Experiences',
    description: 'From packaging to post-purchase support, we obsess over surprise-and-delight moments that keep customers inspired.',
  },
  {
    icon: <RocketLaunchIcon fontSize="large" />,
    title: 'Future-Ready Roadmap',
    description: 'We collaborate with venture labs and indie builders to pilot limited-run drops before they hit mainstream shelves.',
  },
];

function About() {
  return (
    <Container maxWidth="lg" sx={{ pb: 10 }}>
      <Stack spacing={3} sx={{ textAlign: 'center', mt: 6, mb: 6 }} alignItems="center">
        <Chip label="About Fusion" color="primary" variant="outlined" sx={{ alignSelf: 'center' }} />
        <Typography variant="h3" fontWeight={800}>
          We exist to help you curate the future.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680, mx: 'auto', lineHeight: 1.9, textAlign: 'center' }}>
          Fusion Electronics is a collective of engineers, industrial designers, and experience strategists. We scout the highest performing gadgets,
          stress-test them in our lab, and package them into delightful experiences so you can focus on creating.
        </Typography>
      </Stack>

      <Grid container spacing={4}>
        {pillars.map(pillar => (
          <Grid item xs={12} md={6} key={pillar.title}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, height: '100%' }}>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}>{pillar.icon}</Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {pillar.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pillar.description}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Stack spacing={2} sx={{ mt: 8 }}>
        <Typography variant="h4" fontWeight={700}>
          Our Journey
        </Typography>
        <Typography variant="body1" color="text.secondary">
          From humble beginnings to a global community of builders, here’s how we’ve evolved.
        </Typography>
      </Stack>

      <Paper elevation={0} sx={{ mt: 3, p: { xs: 3, md: 5 }, borderRadius: 4 }}>
        <Grid container spacing={4} justifyContent="center">
          {milestones.map(step => (
            <Grid item xs={12} sm={6} key={step.year}>
              <Stack spacing={1.5}>
                <Chip label={step.year} color="primary" sx={{ alignSelf: 'flex-start' }} />
                <Typography variant="h6" fontWeight={700}>
                  {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ mt: 8, p: { xs: 3, md: 5 }, borderRadius: 4 }}>
        <Grid container spacing={4} alignItems="center" justifyContent="center">
          <Grid item xs={12} md={6} sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              The collective behind the brand
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 720, mx: 'auto' }}>
              Our team spans hardware engineers, firmware wizards, service designers, and stylists obsessed with making tech effortless. We source directly from
              makers and run micro-batch pilots before scaling popular favourites.
            </Typography>
            <Stack direction="row" spacing={3} justifyContent="center">
              <Box textAlign="center">
                <Typography variant="h5" fontWeight={700}>
                  38
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Specialists across 5 disciplines
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h5" fontWeight={700}>
                  72%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Products scored 4.5★ or higher
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h5" fontWeight={700}>
                  12
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Partner labs worldwide
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper' }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                What we believe
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                • Technology should feel warm, human, and designed for real life.
                <br />
                • Transparency matters. We publish sourcing notes and lifecycle scores.
                <br />• Community wins. Co-designing with our members leads to breakthrough ideas.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default About;
