import * as React from 'react';
import { Alert, Snackbar, Slide } from '@mui/material';

const NotificationContext = React.createContext({ notify: () => {} });

const defaultOptions = {
  severity: 'info',
  autoHideDuration: 4000,
  anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
};

const slideUp = props => <Slide {...props} direction="up" />;

export function NotificationProvider({ children }) {
  const queueRef = React.useRef([]);
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState(null);

  const processQueue = React.useCallback(() => {
    if (queueRef.current.length && !current) {
      const next = queueRef.current.shift();
      setCurrent(next);
      setOpen(true);
    }
  }, [current]);

  const notify = React.useCallback(
    options => {
      const payload = {
        key: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ...defaultOptions,
        ...options,
      };
      queueRef.current.push(payload);
      if (!open) {
        processQueue();
      }
    },
    [open, processQueue]
  );

  React.useEffect(() => {
    if (!open) {
      processQueue();
    }
  }, [open, processQueue]);

  const handleClose = (_event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  const handleExited = () => {
    setCurrent(null);
  };

  const value = React.useMemo(() => ({ notify }), [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        key={current ? current.key : undefined}
        open={open}
        onClose={handleClose}
        TransitionComponent={slideUp}
        autoHideDuration={current?.autoHideDuration}
        anchorOrigin={current?.anchorOrigin || defaultOptions.anchorOrigin}
        onExited={handleExited}
        sx={{
          // Ensure snackbars remain visible above Safari/iOS safe areas.
          bottom: {
            xs: `calc(20px + env(safe-area-inset-bottom, 0px))`,
            sm: '24px',
          },
        }}
      >
        <Alert
          elevation={6}
          variant="filled"
          severity={current?.severity || defaultOptions.severity}
          onClose={handleClose}
          sx={{
            width: '100%',
            fontFamily: 'Poppins, sans-serif',
            '& .MuiAlert-message': {
              fontFamily: 'Poppins, sans-serif',
            },
          }}
        >
          {current?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export const useNotifier = () => React.useContext(NotificationContext);
