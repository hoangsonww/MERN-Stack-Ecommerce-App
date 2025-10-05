import React from 'react';
import { Link } from 'react-router-dom';
import { List, ListItem, ListItemText, ListItemAvatar, Avatar, Typography, Paper } from '@mui/material';

function SearchResults({ results, onResultClick, setSearchResults, variant = 'popover' }) {
  const handleItemClick = () => {
    onResultClick();
    setSearchResults([]);
  };

  const isModal = variant === 'modal';
  const paperSx = isModal
    ? {
        width: '100%',
        maxWidth: '100%',
        maxHeight: '60vh',
        overflowY: 'auto',
        padding: 0,
      }
    : {
        width: '100%',
        maxWidth: '50vw',
        maxHeight: '50vh',
        overflowY: 'auto',
        padding: '1rem',
      };

  const listItemSx = {
    borderBottom: '1px solid #eee',
    width: '100%',
    '&:last-child': { borderBottom: 'none' },
    '&:hover': { backgroundColor: '#f5f5f5' },
    px: isModal ? 2 : 1,
  };
  const limit = isModal ? 6 : 3;

  return (
    <Paper elevation={3} sx={paperSx}>
      <List>
        {results.length > 0 ? (
          results.slice(0, limit).map(product => {
            const pid = product._id || product.id;
            return (
              <ListItem key={pid} alignItems="flex-start" component={Link} to={`/product/${pid}`} onClick={handleItemClick} sx={listItemSx}>
                <ListItemAvatar>
                  <Avatar alt={product.name} src={product.image} sx={{ borderRadius: '0' }} />
                </ListItemAvatar>
                <ListItemText
                  primary={product.name}
                  secondary={
                    <React.Fragment>
                      <Typography sx={{ display: 'inline' }} component="span" variant="body2" color="text.primary">
                        ${product.price}
                      </Typography>
                      {' - ' + product.description.slice(0, 50) + '...'}
                    </React.Fragment>
                  }
                />
              </ListItem>
            );
          })
        ) : (
          <ListItem>
            <ListItemText primary="No results found." />
          </ListItem>
        )}
      </List>
    </Paper>
  );
}

export default SearchResults;
