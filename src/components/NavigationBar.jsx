import * as React from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Badge, InputBase, useMediaQuery, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import SearchResults from './SearchResults';

function NavigationBar({ cartItemCount }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const searchBarRef = React.useRef(null);
  const open = Boolean(anchorEl);
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width:600px)');

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSearchChange = event => {
    setSearchQuery(event.target.value);
  };

  const handleSearchResultClick = () => {
    setSearchResults([]);
  };

  const handleSearchSubmit = async event => {
    event.preventDefault();
    try {
      const response = await axios.get(`http://localhost:5000/api/search?q=${searchQuery}`); // Specify port 5000
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error fetching search results:', error);
      setSearchResults([]);
    }
  };

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
            <form className="search-bar" onSubmit={handleSearchSubmit} ref={searchBarRef}>
              <SearchIcon sx={{ color: 'white' }} />
              <InputBase placeholder="Search for a product..." inputProps={{ 'aria-label': 'search' }} value={searchQuery} onChange={handleSearchChange} />
            </form>
            <Button
              color="inherit"
              component={Link}
              to="/"
              className={location.pathname === '/' ? 'active' : ''}
              sx={{ fontSize: '1rem', marginLeft: '1rem', marginRight: '1rem' }}
            >
              Home
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/shop"
              className={location.pathname === '/shop' ? 'active' : ''}
              sx={{ fontSize: '1rem', marginLeft: '1rem', marginRight: '1rem' }}
            >
              Shop
            </Button>
            <IconButton color="inherit" component={Link} to="/cart">
              <Badge badgeContent={cartItemCount} color="secondary">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </>
        )}
      </Toolbar>

      {searchResults.length > 0 && (
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              zIndex: 10,
              textAlign: 'center',
            }}
          >
            <SearchResults results={searchResults} onResultClick={handleSearchResultClick} setSearchResults={setSearchResults} />
          </Box>
        </Box>
      )}
    </AppBar>
  );
}

export default NavigationBar;
