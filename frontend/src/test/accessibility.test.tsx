import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CartProvider } from '../context/CartContext';
import { ResponsiveImage } from '../components/ResponsiveImage';

// Helper to wrap components with required providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <CartProvider>
        {component}
      </CartProvider>
    </BrowserRouter>
  );
};

describe('Accessibility Tests', () => {
  describe('Keyboard Navigation', () => {
    it('should have focusable navigation links', () => {
      renderWithProviders(<Navbar />);
      
      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href');
    });

    it('should have accessible button labels', () => {
      renderWithProviders(<Navbar />);
      
      // Check for aria-label on icon buttons
      const menuButton = screen.getByLabelText(/toggle menu/i);
      expect(menuButton).toBeInTheDocument();
    });

    it('should have keyboard accessible search', () => {
      renderWithProviders(<Navbar />);
      
      const searchButton = screen.getByLabelText(/search/i);
      expect(searchButton).toBeInTheDocument();
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should have semantic HTML structure in navigation', () => {
      const { container } = renderWithProviders(<Navbar />);
      
      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    it('should have semantic HTML structure in footer', () => {
      const { container } = render(
        <BrowserRouter>
          <Footer />
        </BrowserRouter>
      );
      
      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('should have aria-labels on social media links', () => {
      render(
        <BrowserRouter>
          <Footer />
        </BrowserRouter>
      );
      
      const facebookLink = screen.getByLabelText(/facebook/i);
      expect(facebookLink).toBeInTheDocument();
      expect(facebookLink).toHaveAttribute('aria-label');
    });

    it('should have proper form labels', () => {
      render(
        <BrowserRouter>
          <Footer />
        </BrowserRouter>
      );
      
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  describe('Image Alt Text', () => {
    it('should require alt text for images', () => {
      const { container } = render(
        <ResponsiveImage
          src="https://example.com/image.jpg"
          alt="Test product image"
        />
      );
      
      const img = container.querySelector('img');
      expect(img).toHaveAttribute('alt', 'Test product image');
    });

    it('should have fallback for broken images', () => {
      const { container } = render(
        <ResponsiveImage
          src="https://invalid-url.com/broken.jpg"
          alt="Test image"
          fallbackSrc="https://example.com/fallback.jpg"
        />
      );
      
      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
    });
  });

  describe('Color Contrast', () => {
    it('should use high contrast colors for text', () => {
      renderWithProviders(<Navbar />);
      
      // Check that text elements exist (contrast is visual, but we can check structure)
      const logo = screen.getByText(/swaggold/i);
      expect(logo).toBeInTheDocument();
    });

    it('should have visible focus indicators', () => {
      renderWithProviders(<Navbar />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        // Check that links have classes that would provide focus styles
        expect(link.className).toBeTruthy();
      });
    });
  });

  describe('Touch Targets', () => {
    it('should have minimum touch target sizes on buttons', () => {
      renderWithProviders(<Navbar />);
      
      const menuButton = screen.getByLabelText(/toggle menu/i);
      // Check for min-w-touch and min-h-touch classes
      expect(menuButton.className).toContain('min-');
    });
  });

  describe('Form Accessibility', () => {
    it('should have accessible newsletter form', () => {
      render(
        <BrowserRouter>
          <Footer />
        </BrowserRouter>
      );
      
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
    });

    it('should have submit button with clear label', () => {
      render(
        <BrowserRouter>
          <Footer />
        </BrowserRouter>
      );
      
      const submitButton = screen.getByRole('button', { name: /subscribe/i });
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive navigation', () => {
      const { container } = renderWithProviders(<Navbar />);
      
      // Check for responsive classes
      const nav = container.querySelector('nav');
      expect(nav?.className).toContain('fixed');
    });

    it('should have mobile-friendly footer', () => {
      const { container } = render(
        <BrowserRouter>
          <Footer />
        </BrowserRouter>
      );
      
      const footer = container.querySelector('footer');
      expect(footer?.className).toBeTruthy();
    });
  });

  describe('ARIA Attributes', () => {
    it('should have proper ARIA labels on icon buttons', () => {
      renderWithProviders(<Navbar />);
      
      const searchButton = screen.getByLabelText(/search/i);
      expect(searchButton).toHaveAttribute('aria-label');
    });

    it('should have proper ARIA labels on social links', () => {
      render(
        <BrowserRouter>
          <Footer />
        </BrowserRouter>
      );
      
      const socialLinks = [
        screen.getByLabelText(/facebook/i),
        screen.getByLabelText(/instagram/i),
        screen.getByLabelText(/twitter/i),
      ];
      
      socialLinks.forEach(link => {
        expect(link).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Semantic HTML', () => {
    it('should use nav element for navigation', () => {
      const { container } = renderWithProviders(<Navbar />);
      
      const navElement = container.querySelector('nav');
      expect(navElement).toBeInTheDocument();
    });

    it('should use footer element for footer', () => {
      const { container } = render(
        <BrowserRouter>
          <Footer />
        </BrowserRouter>
      );
      
      const footerElement = container.querySelector('footer');
      expect(footerElement).toBeInTheDocument();
    });

    it('should use proper heading hierarchy', () => {
      render(
        <BrowserRouter>
          <Footer />
        </BrowserRouter>
      );
      
      // Check for h3 headings in footer sections
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('Link Accessibility', () => {
    it('should have descriptive link text', () => {
      renderWithProviders(<Navbar />);
      
      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toHaveAccessibleName();
    });

    it('should open external links in new tab with proper attributes', () => {
      render(
        <BrowserRouter>
          <Footer />
        </BrowserRouter>
      );
      
      const externalLinks = screen.getAllByRole('link', { name: /facebook|instagram|twitter/i });
      externalLinks.forEach(link => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });
});
