// NSE 2026 holiday list (hardcoded as per spec)
// TODO: update yearly
const NSE_2026_HOLIDAYS = [
  '2026-01-26', // Republic Day
  '2026-03-02', // Holi
  '2026-03-31', // Ram Navami
  '2026-04-01', // Annual closing of Banks
  '2026-04-10', // Mahavir Jayanti
  '2026-04-11', // Bank Holiday (Annual Closing)
  '2026-04-14', // Dr. Babasaheb Ambedkar Jayanti
  '2026-04-21', // Ramzan-Id (Id-Ul-Fitr) (Shawal-1)
  '2026-05-01', // Maharashtra Day
  '2026-08-15', // Independence Day
  '2026-08-27', // Ganesh Chaturthi
  '2026-10-02', // Mahatma Gandhi Jayanti
  '2026-10-12', // Dussehra (Vijay Dashami)
  '2026-10-21', // Diwali-Laxmi Pujan
  '2026-10-22', // Diwali-Balipratipada
  '2026-11-05', // Gurunanak Jayanti
  '2026-12-25', // Christmas
];

/**
 * Check if today is a market day (Monday-Friday and not a holiday)
 */
export function isMarketDay(): boolean {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  // Check if it's weekend (0 = Sunday, 6 = Saturday)
  const dayOfWeek = istTime.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false; // Weekend
  }
  
  // Check if it's a holiday
  const dateString = istTime.toISOString().split('T')[0]; // YYYY-MM-DD
  if (NSE_2026_HOLIDAYS.includes(dateString)) {
    return false; // Holiday
  }
  
  return true;
}

/**
 * Check if current time is within market hours (9:15 AM - 3:30 PM IST)
 */
export function isMarketHours(): boolean {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  // Market opens at 9:15 AM (9*60 + 15 = 555 minutes)
  // Market closes at 3:30 PM (15*60 + 30 = 930 minutes)
  const marketOpen = 9 * 60 + 15; // 555
  const marketClose = 15 * 60 + 30; // 930
  
  return totalMinutes >= marketOpen && totalMinutes <= marketClose;
}

/**
 * Get next market open time (for debugging/logging)
 */
export function getNextMarketOpen(): Date {
  const now = new Date();
  let nextOpen = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  // If it's weekend, move to Monday
  let dayOfWeek = nextOpen.getDay();
  if (dayOfWeek === 0) { // Sunday
    nextOpen.setDate(nextOpen.getDate() + 1);
  } else if (dayOfWeek === 6) { // Saturday
    nextOpen.setDate(nextOpen.getDate() + 2);
  }
  
  // Set time to 9:15 AM
  nextOpen.setHours(9, 15, 0, 0);
  
  // If it's a holiday, keep incrementing until we find a market day
  while (!isMarketDayForDate(nextOpen)) {
    nextOpen.setDate(nextOpen.getDate() + 1);
    // Also need to check if we crossed weekend boundary
    dayOfWeek = nextOpen.getDay();
    if (dayOfWeek === 0) { // Sunday
      nextOpen.setDate(nextOpen.getDate() + 1);
    } else if (dayOfWeek === 6) { // Saturday
      nextOpen.setDate(nextOpen.getDate() + 2);
    }
  }
  
  return nextOpen;
}

// Helper function to check if a specific date is a market day
function isMarketDayForDate(date: Date): boolean {
  // Check if it's weekend (0 = Sunday, 6 = Saturday)
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false; // Weekend
  }
  
  // Check if it's a holiday
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
  if (NSE_2026_HOLIDAYS.includes(dateString)) {
    return false; // Holiday
  }
  
  return true;
}

export { NSE_2026_HOLIDAYS };
