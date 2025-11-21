import { useState, useEffect } from 'react';

function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    // Set initial match state
    setMatches(mediaQuery.matches);

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
