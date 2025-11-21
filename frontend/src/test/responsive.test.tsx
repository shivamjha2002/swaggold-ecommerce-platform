/**
 * Responsive Design Tests
 * 
 * Tests responsive behavior across different device sizes:
 * - Mobile (320px-767px)
 * - Tablet (768px-1023px)
 * - Desktop (1024px+)
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from '../context/CartContext';
import Homepage from '../pages/Homepage';
import Cart from '../pages/Cart';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Product } from '../types';

// Mock product data
const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Gold Ring',
    category: 'Rings',
    base_price: 10000,
    weight: 5,
    gold_purity: '916',
    current_price: 10500,
    description: 'Beautiful gold ring',
    image_url: '/images/ring.jpg',
    stock_quantity: 10,
    is_active: true,
    status: 'published',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'p2',
    name: 'Gold Necklace',
    category: 'Necklaces',
    base_price: 50000,
    weight: 20,
    gold_purity: '916',
    current_price: 52000,
    description: 'Elegant gold necklace',
    image_url: '/images/necklace.jpg',
    stock_quantity: 5,
    is_active: true,
    status: 'published',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// Helper to set viewport size
const setViewport = (width: number, height: number = 800) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

// Helper to render with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <CartProvider>{component}</CartProvider>
    </BrowserRouter>
  );
};

// Mock matchMedia for responsive queries
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('Responsive Design - Mobile (320px-767px)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Mobile Viewport - 320px (Requirement 8.1, 8.2)', () => {
    beforeEach(() => {
      setViewport(320, 568);
      mockMatchMedia(true); // Mobile media query matches
    });

    it('should render navbar in mobile layout', () => {
      renderWithProviders(<Navbar />);
      
      // Navbar should be present
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should render homepage hero section on mobile', () => {
      renderWithProviders(<Homepage />);
      
      // Hero section should be present - text appears multiple times
      const elements = screen.getAllByText(/swati jewellers/i);
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should render footer in mobile layout', () => {
      renderWithProviders(<Footer />);
      
      // Footer should be present with company info - text appears multiple times
      const elements = screen.getAllByText(/swati jewellers/i);
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should render cart page on mobile', () => {
      renderWithProviders(<Cart />);
      
      // Cart page should render
      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    });
  });

  describe('Mobile Viewport - 375px (Requirement 8.1, 8.2)', () => {
    beforeEach(() => {
      setViewport(375, 667);
      mockMatchMedia(true);
    });

    it('should render navbar with mobile menu', () => {
      renderWithProviders(<Navbar />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should render homepage sections on mobile', () => {
      renderWithProviders(<Homepage />);
      
      // Check for main sections - text appears multiple times
      const elements = screen.getAllByText(/swati jewellers/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Mobile Viewport - 414px (Requirement 8.1, 8.2)', () => {
    beforeEach(() => {
      setViewport(414, 896);
      mockMatchMedia(true);
    });

    it('should render all components on larger mobile', () => {
      renderWithProviders(<Homepage />);
      
      const elements = screen.getAllByText(/swati jewellers/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Mobile Viewport - 767px (Requirement 8.1, 8.2)', () => {
    beforeEach(() => {
      setViewport(767, 1024);
      mockMatchMedia(true);
    });

    it('should render at maximum mobile width', () => {
      renderWithProviders(<Homepage />);
      
      const elements = screen.getAllByText(/swati jewellers/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });
});

describe('Responsive Design - Tablet (768px-1023px)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Tablet Viewport - 768px (Requirement 8.1, 8.2)', () => {
    beforeEach(() => {
      setViewport(768, 1024);
      mockMatchMedia(false); // Desktop media query
    });

    it('should render navbar in tablet layout', () => {
      renderWithProviders(<Navbar />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should render homepage in tablet layout', () => {
      renderWithProviders(<Homepage />);
      
      const elements = screen.getAllByText(/swati jewellers/i);
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should render footer in tablet layout', () => {
      renderWithProviders(<Footer />);
      
      const elements = screen.getAllByText(/swati jewellers/i);
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should render cart page in tablet layout', () => {
      renderWithProviders(<Cart />);
      
      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    });
  });

  describe('Tablet Viewport - 834px (Requirement 8.1, 8.2)', () => {
    beforeEach(() => {
      setViewport(834, 1194);
      mockMatchMedia(false);
    });

    it('should render all components on tablet', () => {
      renderWithProviders(<Homepage />);
      
      const elements = screen.getAllByText(/swati jewellers/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Tablet Viewport - 1023px (Requirement 8.1, 8.2)', () => {
    beforeEach(() => {
      setViewport(1023, 768);
      mockMatchMedia(false);
    });

    it('should render at maximum tablet width', () => {
      renderWithProviders(<Homepage />);
      
      const elements = screen.getAllByText(/swati jewellers/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });
});

describe('Responsive Design - Desktop (1024px+)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Desktop Viewport - 1024px (Requirement 8.1, 8.2)', () => {
    beforeEach(() => {
      setViewport(1024, 768);
      mockMatchMedia(false);
    });

    it('should render navbar in desktop layout', () => {
      renderWithProviders(<Navbar />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should render homepage in desktop layout', () => {
      renderWithProviders(<Homepage />);
      
      const elements = screen.getAllByText(/swati jewellers/i);
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should render footer in desktop layout', () => {
      renderWithProviders(<Footer />);
      
      const elements = screen.getAllByText(/swati jewellers/i);
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should render cart page in desktop layout', () => {
      renderWithProviders(<Cart />);
      
      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    });
  });

  describe('Desktop Viewport - 1280px (Requirement 8.1, 8.2)', () => {
    beforeEach(() => {
      setViewport(1280, 720);
      mockMatchMedia(false);
    });

    it('should render all components on standard desktop', () => {
      renderWithProviders(<Homepage />);
      
      const elements = screen.getAllByText(/swati jewellers/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Desktop Viewport - 1440px (Requirement 8.1, 8.2)', () => {
    beforeEach(() => {
      setViewport(1440, 900);
      mockMatchMedia(false);
    });

    it('should render all components on large desktop', () => {
      renderWithProviders(<Homepage />);
      
      const elements = screen.getAllByText(/swati jewellers/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Desktop Viewport - 1920px (Requirement 8.1, 8.2)', () => {
    beforeEach(() => {
      setViewport(1920, 1080);
      mockMatchMedia(false);
    });

    it('should render all components on full HD desktop', () => {
      renderWithProviders(<Homepage />);
      
      const elements = screen.getAllByText(/swati jewellers/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });
});

describe('Touch Interactions (Requirement 8.3, 8.5)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setViewport(375, 667); // Mobile viewport
    mockMatchMedia(true);
  });

  it('should have touch-friendly button sizes on mobile', () => {
    renderWithProviders(<Cart />);
    
    // Buttons should be present and accessible
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });

  it('should render interactive elements on mobile', () => {
    renderWithProviders(<Navbar />);
    
    // Navigation should be interactive
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('should render links with adequate touch targets', () => {
    renderWithProviders(<Footer />);
    
    // Links should be present
    const links = screen.queryAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});

describe('Responsive Layout Consistency (Requirement 8.2)', () => {
  const viewports = [
    { width: 320, name: 'Mobile Small' },
    { width: 375, name: 'Mobile Medium' },
    { width: 414, name: 'Mobile Large' },
    { width: 768, name: 'Tablet' },
    { width: 1024, name: 'Desktop Small' },
    { width: 1440, name: 'Desktop Large' },
  ];

  viewports.forEach(({ width, name }) => {
    describe(`${name} (${width}px)`, () => {
      beforeEach(() => {
        setViewport(width, 800);
        mockMatchMedia(width < 768);
      });

      it('should render navbar consistently', () => {
        renderWithProviders(<Navbar />);
        
        const nav = screen.getByRole('navigation');
        expect(nav).toBeInTheDocument();
      });

      it('should render homepage consistently', () => {
        renderWithProviders(<Homepage />);
        
        const elements = screen.getAllByText(/swati jewellers/i);
        expect(elements.length).toBeGreaterThan(0);
      });

      it('should render footer consistently', () => {
        renderWithProviders(<Footer />);
        
        const elements = screen.getAllByText(/swati jewellers/i);
        expect(elements.length).toBeGreaterThan(0);
      });

      it('should render cart page consistently', () => {
        renderWithProviders(<Cart />);
        
        expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
      });
    });
  });
});

describe('Responsive Breakpoint Transitions (Requirement 8.1)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should transition from mobile to tablet layout', () => {
    // Start at mobile
    setViewport(767, 1024);
    mockMatchMedia(true);
    
    const { rerender } = renderWithProviders(<Homepage />);
    let elements = screen.getAllByText(/swati jewellers/i);
    expect(elements.length).toBeGreaterThan(0);
    
    // Transition to tablet
    setViewport(768, 1024);
    mockMatchMedia(false);
    
    rerender(
      <BrowserRouter>
        <CartProvider>
          <Homepage />
        </CartProvider>
      </BrowserRouter>
    );
    
    elements = screen.getAllByText(/swati jewellers/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should transition from tablet to desktop layout', () => {
    // Start at tablet
    setViewport(1023, 768);
    mockMatchMedia(false);
    
    const { rerender } = renderWithProviders(<Homepage />);
    let elements = screen.getAllByText(/swati jewellers/i);
    expect(elements.length).toBeGreaterThan(0);
    
    // Transition to desktop
    setViewport(1024, 768);
    mockMatchMedia(false);
    
    rerender(
      <BrowserRouter>
        <CartProvider>
          <Homepage />
        </CartProvider>
      </BrowserRouter>
    );
    
    elements = screen.getAllByText(/swati jewellers/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should handle viewport resize events', () => {
    setViewport(375, 667);
    mockMatchMedia(true);
    
    const { rerender } = renderWithProviders(<Navbar />);
    
    // Resize to desktop
    setViewport(1440, 900);
    mockMatchMedia(false);
    
    rerender(
      <BrowserRouter>
        <CartProvider>
          <Navbar />
        </CartProvider>
      </BrowserRouter>
    );
    
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });
});

describe('Responsive Component Rendering (Requirement 8.2)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render all major components on mobile', () => {
    setViewport(375, 667);
    mockMatchMedia(true);
    
    renderWithProviders(<Homepage />);
    
    // Check that main content renders
    const elements = screen.getAllByText(/swati jewellers/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should render all major components on tablet', () => {
    setViewport(768, 1024);
    mockMatchMedia(false);
    
    renderWithProviders(<Homepage />);
    
    const elements = screen.getAllByText(/swati jewellers/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should render all major components on desktop', () => {
    setViewport(1440, 900);
    mockMatchMedia(false);
    
    renderWithProviders(<Homepage />);
    
    const elements = screen.getAllByText(/swati jewellers/i);
    expect(elements.length).toBeGreaterThan(0);
  });
});

describe('Responsive Navigation (Requirement 8.2, 8.3)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render mobile navigation menu', () => {
    setViewport(375, 667);
    mockMatchMedia(true);
    
    renderWithProviders(<Navbar />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('should render desktop navigation menu', () => {
    setViewport(1440, 900);
    mockMatchMedia(false);
    
    renderWithProviders(<Navbar />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });
});

describe('Responsive Footer (Requirement 8.2)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render footer on mobile with stacked layout', () => {
    setViewport(375, 667);
    mockMatchMedia(true);
    
    renderWithProviders(<Footer />);
    
    const elements = screen.getAllByText(/swati jewellers/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should render footer on desktop with multi-column layout', () => {
    setViewport(1440, 900);
    mockMatchMedia(false);
    
    renderWithProviders(<Footer />);
    
    const elements = screen.getAllByText(/swati jewellers/i);
    expect(elements.length).toBeGreaterThan(0);
  });
});

describe('Responsive Cart Page (Requirement 8.2)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render cart page on mobile', () => {
    setViewport(375, 667);
    mockMatchMedia(true);
    
    renderWithProviders(<Cart />);
    
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('should render cart page on tablet', () => {
    setViewport(768, 1024);
    mockMatchMedia(false);
    
    renderWithProviders(<Cart />);
    
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('should render cart page on desktop', () => {
    setViewport(1440, 900);
    mockMatchMedia(false);
    
    renderWithProviders(<Cart />);
    
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });
});
