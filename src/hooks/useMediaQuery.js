import { useState, useEffect } from 'react';

function useMediaQuery(query) {
  const getInitialMatch = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState(getInitialMatch);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia(query);

    // Define a listener function to update state on change
    const handleChange = (event) => setMatches(event.matches);

    // Add event listener
    mediaQuery.addEventListener('change', handleChange);

    // Clean up the event listener on component unmount
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]); // Re-run effect if the query string changes

  return matches;
}

export default useMediaQuery;
