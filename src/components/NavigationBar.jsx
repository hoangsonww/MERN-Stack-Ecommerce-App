import * as React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  InputBase,
  useMediaQuery,
  Box,
  CircularProgress,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  ListItemIcon,
  Divider,
  InputAdornment,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import StorefrontIcon from '@mui/icons-material/Storefront';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import CloseIcon from '@mui/icons-material/Close';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import SearchResults from './SearchResults';
import { apiClient } from '../services/apiClient';
import { useNotifier } from '../context/NotificationProvider';

const navLinks = [
  { label: 'Home', to: '/', icon: <HomeRoundedIcon fontSize="small" /> },
  { label: 'Shop', to: '/shop', icon: <StorefrontIcon fontSize="small" /> },
  { label: 'About', to: '/about', icon: <InfoOutlinedIcon fontSize="small" /> },
  { label: 'Support', to: '/support', icon: <SupportAgentIcon fontSize="small" /> },
];

function NavigationBar({ cartItemCount }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const searchBarRef = React.useRef(null);
  const searchResultsRef = React.useRef(null);
  const mobileSearchFieldRef = React.useRef(null);
  const open = Boolean(anchorEl);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:1200px)');
  const { notify } = useNotifier();
  const [searchModalOpen, setSearchModalOpen] = React.useState(false);

  React.useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('MERNEcommerceToken');
      setIsLoggedIn(Boolean(token));
    };
    checkToken();
    const interval = setInterval(checkToken, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSearchChange = event => {
    const value = event.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleLogout = () => {
    localStorage.removeItem('MERNEcommerceToken');
    setIsLoggedIn(false);
    notify({ severity: 'success', message: 'Signed out successfully.' });
    navigate('/');
  };

  const debouncedSearch = React.useMemo(
    () =>
      debounce(async query => {
        if (query.trim() === '') {
          setSearchResults([]);
          setLoading(false);
          return;
        }
        setLoading(true);
        try {
          const response = await apiClient.get('search', { params: { q: query } });
          setSearchResults(response.data);
          if (Array.isArray(response.data) && response.data.length === 0) {
            notify({ severity: 'info', message: 'No products matched your search yet.' });
          }
        } catch (error) {
          console.error('Error fetching search results:', error);
          setSearchResults([]);
          notify({ severity: 'error', message: 'Search is unavailable right now.' });
        } finally {
          setLoading(false);
        }
      }, 320),
    [notify]
  );

  React.useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const handleSearchModalClose = React.useCallback(() => {
    setSearchModalOpen(false);
    debouncedSearch.cancel();
    setSearchResults([]);
    setSearchQuery('');
    setLoading(false);
  }, [debouncedSearch]);

  const handleSearchModalOpen = () => {
    setSearchModalOpen(true);
    setTimeout(() => mobileSearchFieldRef.current?.focus(), 120);
  };

  const handleSearchResultClick = () => {
    if (searchModalOpen) {
      handleSearchModalClose();
    } else {
      setSearchResults([]);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = event => {
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target) &&
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target)
      ) {
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    setSearchResults([]);
  }, [location.pathname]);

  const anchorRect = searchBarRef.current?.getBoundingClientRect();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'linear-gradient(90deg, #111827 0%, #1f3a93 40%, #3154d0 100%)',
        mb: 4,
        borderRadius: 0,
        '& .logo-link': {
          textDecoration: 'none',
          color: 'white',
          fontWeight: 700,
          fontSize: '1.6rem',
          letterSpacing: '0.08em',
          whiteSpace: 'nowrap',
        },
        '& .search-bar': {
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderRadius: 999,
          padding: '0.35rem 0.8rem',
          display: 'flex',
          alignItems: 'center',
          minWidth: { xs: '70%', md: 320 },
          maxWidth: 420,
          marginInline: { xs: 'auto', md: 0 },
          position: 'relative',
          transition: 'background-color 0.3s ease',
          '&:focus-within': {
            backgroundColor: 'rgba(255,255,255,0.18)',
          },
        },
        '& .search-bar input': {
          marginLeft: '0.5rem',
          border: 'none',
          outline: 'none',
          color: 'white',
          backgroundColor: 'transparent',
          width: '100%',
        },
      }}
    >
      <Toolbar sx={{ py: { xs: 1, md: 1.5 }, gap: { xs: 1.5, md: 2 } }}>
        {isMobile ? (
          <>
            <IconButton size="large" edge="start" color="inherit" aria-label="open navigation" onClick={handleClick}>
              <MenuIcon />
            </IconButton>
            <Menu id="mobile-menu" anchorEl={anchorEl} open={open} onClose={handleClose}>
              <MenuItem
                onClick={() => {
                  handleClose();
                  handleSearchModalOpen();
                }}
                sx={{ gap: 0.5 }}
              >
                Search
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
              {navLinks.map(link => (
                <MenuItem
                  key={link.to}
                  onClick={() => {
                    handleClose();
                    navigate(link.to);
                  }}
                >
                  {link.label}
                </MenuItem>
              ))}
              <MenuItem
                onClick={() => {
                  handleClose();
                  navigate('/cart');
                }}
              >
                <Badge
                  badgeContent={cartItemCount}
                  color="secondary"
                  showZero
                  sx={{
                    '& .MuiBadge-badge': {
                      top: 4,
                      right: -16,
                      minWidth: 20,
                      height: 20,
                    },
                  }}
                >
                  <Typography component="span">Cart</Typography>
                </Badge>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleClose();
                  isLoggedIn ? handleLogout() : navigate('/login');
                }}
              >
                {isLoggedIn ? 'Logout' : 'Login'}
              </MenuItem>
              {!isLoggedIn && (
                <MenuItem
                  onClick={() => {
                    handleClose();
                    navigate('/register');
                  }}
                >
                  Register
                </MenuItem>
              )}
            </Menu>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, minWidth: 0 }}>
              <Link to="/" className="logo-link">
                FUSION ELECTRONICS
              </Link>
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Link to="/" className="logo-link">
                FUSION ELECTRONICS
              </Link>
              <Typography component="span" variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap' }}>
                Elevate Your Everyday Tech
              </Typography>
            </Typography>
            <form className="search-bar" ref={searchBarRef} onSubmit={e => e.preventDefault()}>
              <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
              <InputBase
                placeholder="Search gadgets, accessories..."
                inputProps={{ 'aria-label': 'search' }}
                value={searchQuery}
                onChange={handleSearchChange}
                sx={{ flex: 1, minWidth: 0 }}
              />
              {loading && (
                <CircularProgress
                  size={18}
                  sx={{
                    color: 'white',
                    ml: 1,
                  }}
                />
              )}
            </form>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 'auto' }}>
              <Stack direction="row" spacing={0.9} alignItems="center">
                {navLinks.map(link => {
                  const isActive = location.pathname === link.to;
                  return (
                    <Tooltip key={link.to} title={link.label} arrow placement="bottom">
                      <IconButton
                        component={Link}
                        to={link.to}
                        color="inherit"
                        size="small"
                        sx={{
                          bgcolor: isActive ? 'rgba(255,255,255,0.25)' : 'transparent',
                          transition: 'background-color 0.25s ease',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.32)',
                          },
                        }}
                      >
                        {link.icon}
                      </IconButton>
                    </Tooltip>
                  );
                })}
              </Stack>

              {isLoggedIn ? (
                <Tooltip title="Sign out" arrow>
                  <IconButton color="inherit" size="small" onClick={handleLogout} style={{ color: 'red' }}>
                    <LogoutIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : (
                <>
                  <Tooltip title="Sign in" arrow>
                    <IconButton component={Link} to="/login" color="inherit" size="small">
                      <LoginIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Create account" arrow>
                    <IconButton component={Link} to="/register" color="inherit" size="small">
                      <PersonAddAltIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}

              <Tooltip title="View cart" arrow>
                <IconButton color="inherit" component={Link} to="/cart" size="small">
                  <Badge badgeContent={cartItemCount} color="secondary" overlap="circular" showZero>
                    <ShoppingCartIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>
            </Box>
          </>
        )}
      </Toolbar>

      {!isMobile && searchResults.length > 0 && anchorRect && (
        <Box
          ref={searchResultsRef}
          sx={{
            position: 'absolute',
            top: anchorRect.bottom + 12,
            left: anchorRect.left,
            width: 'min(420px, 85vw)',
            zIndex: theme => theme.zIndex.modal - 1,
            backgroundColor: 'white',
            borderRadius: 3,
            boxShadow: '0 22px 48px rgba(15, 23, 42, 0.18)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <SearchResults results={searchResults} onResultClick={handleSearchResultClick} setSearchResults={setSearchResults} />
        </Box>
      )}

      <Dialog open={searchModalOpen} onClose={handleSearchModalClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Search Products
          <IconButton onClick={handleSearchModalClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              inputRef={mobileSearchFieldRef}
              autoFocus
              variant="outlined"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search gadgets, accessories..."
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={20} />
              </Box>
            ) : searchResults.length > 0 ? (
              <SearchResults results={searchResults} onResultClick={handleSearchResultClick} setSearchResults={setSearchResults} variant="modal" />
            ) : searchQuery.trim() ? (
              <Typography variant="body2" color="text.secondary">
                No products matched your search yet.
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Start typing to explore our catalog.
              </Typography>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </AppBar>
  );
}

export default NavigationBar;
