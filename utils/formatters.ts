import { formatDistanceToNow, format, parseISO, isValid } from 'date-fns';

/**
 * Format Ethereum address for display
 * @param address Full Ethereum address
 * @param startLength Number of characters to show at start (default: 6)
 * @param endLength Number of characters to show at end (default: 4)
 * @returns Shortened address with ellipsis
 */
export function formatAddress(
  address: string,
  startLength: number = 6,
  endLength: number = 4
): string {
  if (!address) return '';
  if (address.length <= startLength + endLength) return address;
  
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Format large numbers with appropriate suffixes
 * @param num Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Format token amounts with appropriate decimal places
 * @param amount Token amount
 * @param decimals Number of decimal places (default: 18)
 * @param displayDecimals Number of decimal places to display (default: 4)
 * @returns Formatted token amount
 */
export function formatTokenAmount(
  amount: string | number | bigint,
  decimals: number = 18,
  displayDecimals: number = 4
): string {
  try {
    const value = typeof amount === 'bigint' ? amount : BigInt(amount.toString());
    const divisor = BigInt(10 ** decimals);
    const quotient = value / divisor;
    const remainder = value % divisor;
    
    if (remainder === BigInt(0)) {
      return quotient.toString();
    }
    
    const fractionalPart = remainder.toString().padStart(decimals, '0');
    const trimmedFractional = fractionalPart.slice(0, displayDecimals).replace(/0+$/, '');
    
    if (trimmedFractional === '') {
      return quotient.toString();
    }
    
    return `${quotient}.${trimmedFractional}`;
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return '0';
  }
}

/**
 * Format currency values
 * @param amount Amount to format
 * @param currency Currency code (default: 'USD')
 * @param locale Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${amount} ${currency}`;
  }
}

/**
 * Format percentage values
 * @param value Decimal value (e.g., 0.1234 for 12.34%)
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return `${(value * 100).toFixed(decimals)}%`;
  }
}

/**
 * Format dates in various styles
 * @param date Date string, Date object, or timestamp
 * @param formatStyle Style of formatting
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | number,
  formatStyle: 'short' | 'long' | 'relative' | 'time' | 'datetime' | 'iso' = 'short'
): string {
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }
    
    switch (formatStyle) {
      case 'short':
        return format(dateObj, 'MMM d, yyyy');
      case 'long':
        return format(dateObj, 'MMMM d, yyyy');
      case 'time':
        return format(dateObj, 'h:mm a');
      case 'datetime':
        return format(dateObj, 'MMM d, yyyy h:mm a');
      case 'iso':
        return dateObj.toISOString();
      case 'relative':
        return formatDistanceToNow(dateObj, { addSuffix: true });
      default:
        return format(dateObj, 'MMM d, yyyy');
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format time duration in human-readable format
 * @param seconds Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

/**
 * Format file sizes in human-readable format
 * @param bytes File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format badge rarity for display
 * @param rarity Badge rarity level
 * @returns Formatted rarity string
 */
export function formatRarity(rarity: string): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1).toLowerCase();
}

/**
 * Format event status for display
 * @param status Event status
 * @returns Formatted status string
 */
export function formatStatus(status: string): string {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

/**
 * Format blockchain transaction hash
 * @param txHash Transaction hash
 * @param length Length of displayed hash (default: 10)
 * @returns Formatted transaction hash
 */
export function formatTxHash(txHash: string, length: number = 10): string {
  if (!txHash) return '';
  return `${txHash.slice(0, length)}...`;
}

/**
 * Format block number with thousand separators
 * @param blockNumber Block number
 * @returns Formatted block number string
 */
export function formatBlockNumber(blockNumber: number): string {
  return new Intl.NumberFormat('en-US').format(blockNumber);
}

/**
 * Format gas values
 * @param gas Gas amount
 * @param unit Gas unit ('wei', 'gwei', 'eth')
 * @returns Formatted gas string
 */
export function formatGas(gas: string | number | bigint, unit: 'wei' | 'gwei' | 'eth' = 'gwei'): string {
  try {
    const gasValue = typeof gas === 'bigint' ? gas : BigInt(gas.toString());
    
    switch (unit) {
      case 'wei':
        return gasValue.toString() + ' wei';
      case 'gwei':
        const gwei = gasValue / BigInt(1e9);
        return gwei.toString() + ' gwei';
      case 'eth':
        const eth = Number(gasValue) / 1e18;
        return eth.toFixed(6) + ' ETH';
      default:
        return gasValue.toString();
    }
  } catch (error) {
    console.error('Error formatting gas:', error);
    return '0';
  }
}

/**
 * Format URL for display (removes protocol and www)
 * @param url Full URL
 * @returns Formatted URL string
 */
export function formatUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '') + urlObj.pathname;
  } catch (error) {
    return url;
  }
}

/**
 * Format JSON for pretty display
 * @param obj Object to format
 * @param indent Number of spaces for indentation (default: 2)
 * @returns Formatted JSON string
 */
export function formatJSON(obj: any, indent: number = 2): string {
  try {
    return JSON.stringify(obj, null, indent);
  } catch (error) {
    console.error('Error formatting JSON:', error);
    return String(obj);
  }
}

/**
 * Format error messages for user display
 * @param error Error object or string
 * @returns User-friendly error message
 */
export function formatError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    // Extract meaningful part from common error messages
    const message = error.message;
    
    // Handle common Web3 errors
    if (message.includes('user rejected')) {
      return 'Transaction was rejected by user';
    }
    if (message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction';
    }
    if (message.includes('execution reverted')) {
      const revertReason = message.match(/execution reverted: (.+)/);
      return revertReason ? revertReason[1] : 'Transaction failed';
    }
    if (message.includes('network error')) {
      return 'Network error. Please check your connection.';
    }
    
    return message;
  }
  
  if (error?.code) {
    switch (error.code) {
      case 4001:
        return 'Transaction was rejected by user';
      case -32603:
        return 'Internal error occurred';
      case -32602:
        return 'Invalid parameters';
      default:
        return `Error code: ${error.code}`;
    }
  }
  
  return 'An unexpected error occurred';
}

/**
 * Capitalize first letter of each word
 * @param text Text to capitalize
 * @returns Capitalized text
 */
export function capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Truncate text with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Format search query for display
 * @param query Search query
 * @param maxLength Maximum length (default: 50)
 * @returns Formatted query
 */
export function formatSearchQuery(query: string, maxLength: number = 50): string {
  const trimmed = query.trim();
  return truncateText(trimmed, maxLength);
}
