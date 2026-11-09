import { useEffect, useState } from 'react';
import { localToday } from '../domain/global-season';

/** The real date in a timezone, refreshed each minute. */
export function useToday(timezone?: string) {
  const [today, setToday] = useState(() => localToday(timezone));
  useEffect(() => {
    const update = () => setToday(localToday(timezone));
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [timezone]);
  return today;
}
