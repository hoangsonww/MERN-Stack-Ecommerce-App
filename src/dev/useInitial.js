import { useState } from 'react';

export const useInitial = () => {
  const [status, setStatus] = useState({
    loading: false,
    error: false,
  });

  console.log(setStatus);

  return status;
};
