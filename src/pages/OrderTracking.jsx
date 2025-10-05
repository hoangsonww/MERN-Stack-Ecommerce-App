import * as React from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HomeIcon from '@mui/icons-material/Home';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import HandshakeIcon from '@mui/icons-material/Handshake';
import { useSearchParams } from 'react-router-dom';
import { useNotifier } from '../context/NotificationProvider';
import { apiClient, withRetry } from '../services/apiClient';

const fallbackFlow = [
  {
    code: 'ORDER_PLACED',
    label: 'Order placed',
    description: 'We received your order and secured the inventory.',
  },
  {
    code: 'PAYMENT_VERIFIED',
    label: 'Payment verified',
    description: 'Payment cleared securely and your order is locked in.',
  },
  {
    code: 'PICKING_ITEMS',
    label: 'Picking items',
    description: 'Fulfillment specialists are pulling your products from the shelves.',
  },
  {
    code: 'PACKED_FOR_SHIPMENT',
    label: 'Packed for shipment',
    description: 'Everything is sealed with tamper protection and ready for carrier pickup.',
  },
  {
    code: 'HANDOFF_TO_CARRIER',
    label: 'Handed to carrier',
    description: 'Carrier has scanned the parcel and left our facility.',
  },
  {
    code: 'IN_TRANSIT',
    label: 'In transit',
    description: 'The shipment is moving through regional hubs on the way to you.',
  },
  {
    code: 'AT_LOCAL_DEPOT',
    label: 'Arrived locally',
    description: 'Package is at your local distribution center awaiting final sort.',
  },
  {
    code: 'OUT_FOR_DELIVERY',
    label: 'Out for delivery',
    description: 'A courier is heading your way with the package on board.',
  },
  {
    code: 'DELIVERED',
    label: 'Delivered',
    description: 'The courier marked the parcel as delivered. Enjoy your new gear!',
  },
  {
    code: 'DELIVERY_CONFIRMED',
    label: 'Delivery verified',
    description: 'Delivery confirmation logged with proof for your records.',
  },
];

const iconBase = { fontSize: 24, color: 'primary.main' };
const successIconBase = { ...iconBase, color: 'success.main' };

const statusIcons = {
  ORDER_PLACED: <InventoryIcon sx={iconBase} />,
  PAYMENT_VERIFIED: <HandshakeIcon sx={iconBase} />,
  PICKING_ITEMS: <WarehouseIcon sx={iconBase} />,
  QUALITY_CHECK: <QueryBuilderIcon sx={iconBase} />,
  PACKED_FOR_SHIPMENT: <InventoryIcon sx={iconBase} />,
  HANDOFF_TO_CARRIER: <DeliveryDiningIcon sx={iconBase} />,
  IN_TRANSIT: <LocalShippingIcon sx={iconBase} />,
  AT_LOCAL_DEPOT: <WarehouseIcon sx={iconBase} />,
  OUT_FOR_DELIVERY: <HomeIcon sx={iconBase} />,
  DELIVERED: <CheckCircleOutlineIcon sx={successIconBase} />,
  DELIVERY_CONFIRMED: <CheckCircleOutlineIcon sx={successIconBase} />,
};

const defaultIcon = <QueryBuilderIcon sx={iconBase} />;

const getStatusIcon = (code, size = 24) => {
  const baseIcon = statusIcons[code] || defaultIcon;
  return React.cloneElement(baseIcon, {
    sx: { ...(baseIcon.props.sx || {}), fontSize: size },
  });
};

const emailPattern = /[^@\s]+@[^@\s]+\.[^@\s]+/;

function formatTimestamp(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    return '';
  }
}

function OrderTracking() {
  const { notify } = useNotifier();
  const [searchParams] = useSearchParams();

  const lastOrder = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('fusionLastOrder')) || {};
    } catch (error) {
      return {};
    }
  }, []);

  const initialForm = React.useMemo(() => {
    const paramOrderNumber = searchParams.get('orderNumber') || '';
    const paramEmail = searchParams.get('email') || '';
    return {
      orderNumber: paramOrderNumber || lastOrder.orderNumber || '',
      email: paramEmail || lastOrder.email || '',
    };
  }, [lastOrder.email, lastOrder.orderNumber, searchParams]);

  const [form, setForm] = React.useState(initialForm);
  const [loading, setLoading] = React.useState(false);
  const [trackingData, setTrackingData] = React.useState(null);
  const [errorMessage, setErrorMessage] = React.useState('');

  const fetchTracking = React.useCallback(
    async (payload, { silent = false } = {}) => {
      const sanitizedOrderNumber = payload.orderNumber?.trim().toUpperCase();
      const sanitizedEmail = payload.email?.trim().toLowerCase();

      if (!sanitizedOrderNumber || !sanitizedEmail) {
        notify({ severity: 'warning', message: 'Enter both your email and order number to continue.' });
        return;
      }

      if (!emailPattern.test(sanitizedEmail)) {
        notify({ severity: 'warning', message: 'Enter a valid email associated with the order.' });
        return;
      }

      setLoading(true);
      setErrorMessage('');

      if (!silent) {
        notify({ severity: 'info', message: 'Fetching your order status…', autoHideDuration: 2000 });
      }

      try {
        const { data } = await withRetry(() =>
          apiClient.post('orders/track', {
            orderNumber: sanitizedOrderNumber,
            email: sanitizedEmail,
          })
        );

        setTrackingData(data);

        try {
          localStorage.setItem('fusionLastOrder', JSON.stringify({ orderNumber: data.orderNumber, email: data.email }));
        } catch (storageError) {
          console.warn('Unable to persist last order reference', storageError);
        }

        if (!silent && data?.currentStatus?.label) {
          notify({ severity: 'success', message: `Status updated: ${data.currentStatus.label}` });
        }
      } catch (error) {
        console.error('Error fetching order status:', error);
        const message = error?.response?.data?.error || 'We could not locate that order. Double-check the details and try again.';
        setErrorMessage(message);
        notify({ severity: 'error', message });
      } finally {
        setLoading(false);
      }
    },
    [notify]
  );

  React.useEffect(() => {
    setForm(initialForm);
    if (initialForm.orderNumber && initialForm.email) {
      fetchTracking(initialForm, { silent: true });
    }
  }, [fetchTracking, initialForm]);

  const handleChange = event => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = event => {
    event.preventDefault();
    fetchTracking(form);
  };

  const hasTracking = Boolean(trackingData);

  const activeFlow = React.useMemo(() => {
    if (!hasTracking) return [];
    const provided = trackingData?.statusFlow;
    if (Array.isArray(provided) && provided.length) {
      return provided;
    }
    return fallbackFlow;
  }, [hasTracking, trackingData]);

  const history = hasTracking ? trackingData?.statusHistory || [] : [];
  const historyMap = React.useMemo(() => {
    const entries = new Map();
    history.forEach(status => {
      entries.set(status.code, status);
    });
    return entries;
  }, [history]);
  const currentStatus = hasTracking ? trackingData?.currentStatus : null;

  const historyCodes = history.map(status => status.code);
  const activeCode = currentStatus?.code;
  const activeIndex = hasTracking ? activeFlow.findIndex(step => step.code === activeCode) : -1;
  const resolvedActiveIndex = hasTracking ? (activeIndex >= 0 ? activeIndex : Math.max(historyCodes.length - 1, 0)) : -1;
  const stepperActiveIndex = resolvedActiveIndex >= 0 ? resolvedActiveIndex : 0;

  const renderStatusAvatar = React.useCallback((code, isActive) => {
    const iconElement = getStatusIcon(code, 22);
    return (
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: isActive ? 'rgba(40, 116, 240, 0.12)' : 'rgba(148, 163, 184, 0.18)',
          flexShrink: 0,
          alignSelf: 'center',
        }}
      >
        {iconElement}
      </Box>
    );
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
      <Stack spacing={3} alignItems="center" textAlign="center" sx={{ mb: 4 }}>
        <Chip label="Order tracking" color="primary" variant="outlined" />
        <Typography variant="h3" fontWeight={700}>
          Real-time visibility from checkout to doorstep
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680 }}>
          Enter your order number to see carrier updates, proof of delivery, and concierge assistance options when you need them.
        </Typography>
      </Stack>

      <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Order number"
                  name="orderNumber"
                  value={form.orderNumber}
                  onChange={handleChange}
                  placeholder="e.g. FE-482019"
                  required
                  fullWidth
                  InputProps={{ sx: { textTransform: 'uppercase' } }}
                />
                <TextField
                  label="Email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  type="email"
                  placeholder="you@example.com"
                  required
                  fullWidth
                />
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button type="submit" variant="contained" size="large" disabled={loading}>
                    {loading ? 'Updating…' : 'Track my order'}
                  </Button>
                  {trackingData && (
                    <Tooltip title="Refresh status" arrow>
                      <IconButton color="primary" onClick={() => fetchTracking(form)} disabled={loading}>
                        <ReplayIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Having trouble locating your ID? Search your inbox for the subject “Fusion Electronics Order Confirmation”.
                </Typography>
              </Stack>
            </form>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                Concierge assistance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                For delivery holds, reroutes, or signature requests, reach out to our logistics team and we will coordinate directly with the carrier.
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <SupportAgentIcon color="primary" fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  support@fusionelectronics.io • +1 (833) 555-0195
                </Typography>
              </Stack>
              {trackingData?.estimatedDelivery && (
                <Typography variant="caption" color="text.secondary">
                  Estimated delivery: {formatTimestamp(trackingData.estimatedDelivery)}
                </Typography>
              )}
              {errorMessage && (
                <Typography variant="caption" color="error">
                  {errorMessage}
                </Typography>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ mt: 5, p: { xs: 3, md: 5 }, borderRadius: 4 }}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700}>
            {hasTracking ? 'Live order journey' : 'What to expect along the way'}
          </Typography>
          {trackingData?.orderNumber && <Chip label={`Order #: ${trackingData.orderNumber}`} variant="outlined" color="primary" />}
        </Stack>
        {hasTracking ? (
          <Stepper orientation="vertical" activeStep={stepperActiveIndex} sx={{ mt: 2 }}>
            {activeFlow.map((step, index) => {
              const statusEntry = historyMap.get(step.code);
              const isActive = index === resolvedActiveIndex;
              const completed = index < resolvedActiveIndex;
              return (
                <Step key={step.code || step.label} completed={completed}>
                  <StepLabel SlotProps={{ iconContainer: { sx: { display: 'none' } } }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      {renderStatusAvatar(step.code, isActive || completed)}
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700} color={isActive ? 'primary.main' : 'text.primary'}>
                          {step.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {step.description}
                        </Typography>
                        {statusEntry?.enteredAt && (
                          <Typography variant="caption" color="text.secondary">
                            Updated {formatTimestamp(statusEntry.enteredAt)}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        ) : (
          <Box
            sx={{
              mt: 2,
              p: 3,
              borderRadius: 3,
              bgcolor: 'rgba(148, 163, 184, 0.1)',
              textAlign: 'left',
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Ready when you are
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your order number and the email used at checkout to unlock real-time tracking. Once we locate your order, the full journey timeline will
              appear here with live updates.
            </Typography>
          </Box>
        )}
      </Paper>

      {hasTracking && history.length > 0 && (
        <Paper elevation={0} sx={{ mt: 5, p: { xs: 3, md: 5 }, borderRadius: 4 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Recent status updates
          </Typography>
          <List dense>
            {[...history].reverse().map(status => (
              <ListItem key={`${status.code}-${status.enteredAt}`} disableGutters>
                <ListItemText primary={status.label} secondary={`${formatTimestamp(status.enteredAt)} • ${status.description}`} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
}

export default OrderTracking;
