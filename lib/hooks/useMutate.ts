import { mutate } from 'swr';

export const useMutate = () => {
  const clearCache = () => {
    mutate(() => true, undefined, { revalidate: false });
  };

  return {
    clearCache
  };
};