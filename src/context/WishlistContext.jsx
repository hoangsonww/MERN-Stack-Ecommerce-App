import * as React from 'react';
import { apiClient } from '../services/apiClient';
import { useNotifier } from './NotificationProvider';

const WishlistContext = React.createContext({
  wishlist: [],
  wishlistCount: 0,
  loading: false,
  isInWishlist: () => false,
  addToWishlist: async () => {},
  removeFromWishlist: async () => {},
  refreshWishlist: async () => {},
});

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const { notify } = useNotifier();

  const isLoggedIn = React.useCallback(() => Boolean(localStorage.getItem('MERNEcommerceToken')), []);

  const authHeader = React.useCallback(() => {
    const token = localStorage.getItem('MERNEcommerceToken');
    return token ? { 'x-auth-token': token } : {};
  }, []);

  const refreshWishlist = React.useCallback(async () => {
    if (!isLoggedIn()) {
      setWishlist([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.get('wishlist', { headers: authHeader() });
      setWishlist(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      if (err?.response?.status !== 401) {
        console.error('Failed to fetch wishlist:', err.message);
      }
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, [authHeader, isLoggedIn]);

  // Fetch on mount and whenever auth state changes
  React.useEffect(() => {
    refreshWishlist();
    const interval = setInterval(refreshWishlist, 30000);
    return () => clearInterval(interval);
  }, [refreshWishlist]);

  const isInWishlist = React.useCallback(
    productId => {
      if (!productId) return false;
      const pidStr = String(productId);
      return wishlist.some(p => {
        const wid = p._id || p.id;
        return wid && String(wid) === pidStr;
      });
    },
    [wishlist]
  );

  const addToWishlist = React.useCallback(
    async productId => {
      if (!isLoggedIn()) {
        notify({ severity: 'warning', message: 'Please sign in to save items to your wishlist.' });
        return;
      }
      // Optimistic update — fill the heart immediately
      const pidStr = String(productId);
      setWishlist(prev => [...prev, { _id: pidStr, id: pidStr }]);
      try {
        await apiClient.post('wishlist', { productId }, { headers: authHeader() });
        await refreshWishlist(); // replace placeholder with full product data
        notify({ severity: 'success', message: 'Added to wishlist!' });
      } catch (err) {
        // Revert optimistic update
        setWishlist(prev => prev.filter(p => String(p._id || p.id) !== pidStr));
        const msg = err?.response?.data?.msg || 'Could not add to wishlist.';
        notify({ severity: 'error', message: msg });
      }
    },
    [authHeader, isLoggedIn, notify, refreshWishlist]
  );

  const removeFromWishlist = React.useCallback(
    async productId => {
      if (!isLoggedIn()) return;
      // Optimistic update — unfill the heart immediately
      const pidStr = String(productId);
      setWishlist(prev => prev.filter(p => String(p._id || p.id) !== pidStr));
      try {
        await apiClient.delete(`wishlist/${productId}`, { headers: authHeader() });
        notify({ severity: 'info', message: 'Removed from wishlist.' });
      } catch (err) {
        // Revert by fetching true state from server
        await refreshWishlist();
        const msg = err?.response?.data?.msg || 'Could not remove from wishlist.';
        notify({ severity: 'error', message: msg });
      }
    },
    [authHeader, isLoggedIn, notify, refreshWishlist]
  );

  const value = React.useMemo(
    () => ({
      wishlist,
      wishlistCount: wishlist.length,
      loading,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      refreshWishlist,
    }),
    [wishlist, loading, isInWishlist, addToWishlist, removeFromWishlist, refreshWishlist]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => React.useContext(WishlistContext);
