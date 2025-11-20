import { useNavigate } from 'react-router-dom';
import { NavigationHelper, createNavigationHelper } from '../utils/navigation';

/**
 * Custom hook for programmatic navigation
 * 
 * Provides a convenient way to access navigation helpers throughout the app
 * 
 * Usage:
 * const nav = useNavigation();
 * nav.goToProducts();
 * nav.goToProductDetail('123');
 * 
 * Requirements: 1.2.1, 1.2.2, 1.2.3, 1.2.4
 */
export const useNavigation = (): NavigationHelper => {
    const navigate = useNavigate();
    return createNavigationHelper(navigate);
};
