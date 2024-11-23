import * as React from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Badge, InputBase, useMediaQuery, Box, CircularProgress } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SearchResults from './SearchResults';
import { debounce } from 'lodash';

function NavigationBar({ cartItemCount }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false); // Loading state for search
  const [isLoggedIn, setIsLoggedIn] = React.useState(false); // State to track login status
  const searchBarRef = React.useRef(null);
  const searchResultsRef = React.useRef(null); // To detect clicks outside search results
  const open = Boolean(anchorEl);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:900px)');

  // Check if user is logged in by looking for token in localStorage
  React.useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('MERNEcommerceToken');
      setIsLoggedIn(!!token); // Set loggedIn state based on token presence
    };
    checkToken(); // Initial check
    const interval = setInterval(checkToken, 2000); // Check every 2 seconds

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSearchChange = event => {
    setSearchQuery(event.target.value);
    debouncedSearch(event.target.value); // Trigger the debounced search
  };

  const handleSearchResultClick = () => {
    setSearchResults([]);
  };

  const handleLogout = () => {
    localStorage.removeItem('MERNEcommerceToken'); // Remove token from localStorage
    setIsLoggedIn(false);
    navigate('/'); // Redirect to homepage after logout
  };

  // Debounced function to prevent triggering the search too often
  const debouncedSearch = React.useCallback(
    debounce(async query => {
      if (query.trim() === '') {
        setSearchResults([]); // Clear search results if the query is empty
        setLoading(false);
        return;
      }
      setLoading(true); // Set loading to true when search is triggered
      try {
        const response = await axios.get(`https://mern-stack-ecommerce-app-h5wb.onrender.com/api/search?q=${query}`);
        setSearchResults(response.data);
      } catch (error) {
        console.error('Error fetching search results:', error);
        setSearchResults([]);
      } finally {
        setLoading(false); // Stop loading when the API call finishes
      }
    }, 300), // 300ms debounce delay
    []
  );

  // Event listener to hide search results if clicking outside search bar or results
  React.useEffect(() => {
    const handleClickOutside = event => {
      // Check if click is outside search bar and search results
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target) &&
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target)
      ) {
        setSearchResults([]); // Hide search results on outside click
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside); // Cleanup listener on unmount
    };
  }, []);

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: '#3f51b5',
        marginBottom: '2rem',
        '& .logo-link': {
          textDecoration: 'none',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.5rem',
        },
        '& .search-bar': {
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: '4px',
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          width: '50%',
          marginLeft: 'auto',
          marginRight: 'auto',
          position: 'relative',
        },
        '& .search-bar input': {
          marginLeft: '0.5rem',
          border: 'none',
          outline: 'none',
          color: 'white',
          backgroundColor: 'transparent',
          width: '100%',
        },
        '& .active': {
          textDecoration: 'underline',
          fontWeight: 'bold',
        },
      }}
    >
      <Toolbar>
        {isMobile ? (
          <>
            <IconButton size="large" edge="start" color="inherit" aria-label="menu" onClick={handleClick}>
              <MenuIcon />
            </IconButton>
            <Menu id="mobile-menu" anchorEl={anchorEl} open={open} onClose={handleClose}>
              <MenuItem onClick={handleClose} component={Link} to="/">
                Home
              </MenuItem>
              <MenuItem onClick={handleClose} component={Link} to="/shop">
                Shop
              </MenuItem>
              <MenuItem onClick={handleClose} component={Link} to="/cart">
                Cart
              </MenuItem>
            </Menu>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              <Link to="/" className="logo-link">
                FUSION ELECTRONICS
              </Link>
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              <Link to="/" className="logo-link">
                FUSION ELECTRONICS
              </Link>
            </Typography>
            <form className="search-bar" ref={searchBarRef} onSubmit={e => e.preventDefault()}>
              <SearchIcon sx={{ color: 'white' }} />
              <InputBase
                placeholder="Search for a product..."
                inputProps={{ 'aria-label': 'search' }}
                value={searchQuery}
                onChange={handleSearchChange}
                style={{ width: '100%' }}
              />
              {/* Display loading spinner if search is in progress */}
              {loading && (
                <CircularProgress
                  size={20}
                  sx={{
                    color: 'white',
                    marginLeft: '10px',
                  }}
                />
              )}
            </form>
            <Button
              color="inherit"
              component={Link}
              to="/"
              className={location.pathname === '/' ? 'active' : ''}
              sx={{ fontSize: '1rem', marginLeft: '1rem', marginRight: '0.5rem' }}
            >
              Home
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/shop"
              className={location.pathname === '/shop' ? 'active' : ''}
              sx={{ fontSize: '1rem', marginLeft: '0.5rem', marginRight: '0.5rem' }}
            >
              Shop
            </Button>

            {/* Login/Logout and Register */}
            {isLoggedIn ? (
              <Button onClick={handleLogout} sx={{ color: 'red', marginLeft: '0.5rem', marginRight: '0.5rem' }}>
                Logout
              </Button>
            ) : (
              <>
                <Button color="inherit" component={Link} to="/login" sx={{ fontSize: '1rem', marginLeft: '0.5rem', marginRight: '0.5rem' }}>
                  Login
                </Button>
              </>
            )}
            <Button color="inherit" component={Link} to="/register" sx={{ fontSize: '1rem', marginLeft: '0.5rem' }}>
              Register
            </Button>

            {/* Cart Icon */}
            <IconButton color="inherit" component={Link} to="/cart" sx={{ marginLeft: '0.5rem' }}>
              <Badge badgeContent={cartItemCount} color="secondary">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </>
        )}
      </Toolbar>

      {searchResults.length > 0 && searchBarRef.current && (
        <Box
          ref={searchResultsRef} // Reference for detecting clicks outside the search results
          sx={{
            position: 'absolute',
            top: searchBarRef.current.getBoundingClientRect().bottom + 'px',
            left: searchBarRef.current.getBoundingClientRect().left + 'px',
            zIndex: 10,
            backgroundColor: 'white',
            borderRadius: '4px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            width: '300px', // Specify a custom width, no need to match the search bar
          }}
        >
          <SearchResults results={searchResults} onResultClick={handleSearchResultClick} setSearchResults={setSearchResults} />
        </Box>
      )}
    </AppBar>
  );
}

export default NavigationBar;
