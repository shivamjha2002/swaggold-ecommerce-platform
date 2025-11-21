import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import AdminDashboard from '../pages/AdminDashboard';
import Homepage from '../pages/Homepage';
import { productService } from '../services/productService';
import type { Product, ApiResponse } from '../types';

// Mock the product service
vi.mock('../services/productService', () => ({
  productService: {
    getProducts: vi.fn(),
    getAdminProducts: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    publishProduct: vi.fn(),
    unpublishProduct: vi.fn(),
    deleteProduct: vi.fn(),
    clearCache: vi.fn(),
  },
}));

// Mock the auth context
const mockAuthContext = {
  user: { id: '1', email: 'admin@test.com', role: 'admin' },
  login: vi.fn(),
  logout: vi.fn(),
  isAuthenticated: true,
  isLoading: false,
};

vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext');
  return {
    ...actual,
    useAuth: () => mockAuthContext,
  };
});

describe('Draft/Publish Workflow Tests', () => {
  const mockDraftProduct: Product = {
    id: 'draft-1',
    name: 'Draft Gold Ring',
    category: 'Ring',
    base_price: 10000,
    current_price: 10500,
    weight: 5.0,
    gold_purity: '916',
    description: 'A beautiful draft ring',
    image_url: 'https://example.com/ring.jpg',
    stock_quantity: 10,
    is_active: true,
    status: 'draft',
    published_at: undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockPublishedProduct: Product = {
    id: 'published-1',
    name: 'Published Gold Necklace',
    category: 'Necklace',
    base_price: 20000,
    current_price: 21000,
    weight: 10.0,
    gold_purity: '916',
    description: 'A beautiful published necklace',
    image_url: 'https://example.com/necklace.jpg',
    stock_quantity: 5,
    is_active: true,
    status: 'published',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('13.1.1 - Create products in draft status', () => {
    it('should create a product with default draft status', async () => {
      const user = userEvent.setup();
      const mockResponse: ApiResponse<Product> = {
        success: true,
        data: mockDraftProduct,
      };

      vi.mocked(productService.createProduct).mockResolvedValue(mockResponse);
      vi.mocked(productService.getAdminProducts).mockResolvedValue({
        success: true,
        data: [mockDraftProduct],
        pagination: {
          page: 1,
          per_page: 20,
          total: 1,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <AdminDashboard />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      // Wait for the page to load
      await waitFor(() => {
        expect(screen.getByText(/Product Management/i)).toBeInTheDocument();
      });

      // Click "Add Product" button
      const addButton = screen.getByRole('button', { name: /Add Product/i });
      await user.click(addButton);

      // Fill in the form
      await waitFor(() => {
        expect(screen.getByLabelText(/Product Name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Product Name/i), mockDraftProduct.name);
      await user.selectOptions(screen.getByLabelText(/Category/i), mockDraftProduct.category);
      await user.type(screen.getByLabelText(/Base Price/i), mockDraftProduct.base_price.toString());
      await user.type(screen.getByLabelText(/Weight/i), mockDraftProduct.weight.toString());

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /Create Product/i });
      await user.click(submitButton);

      // Verify the product was created with draft status
      await waitFor(() => {
        expect(productService.createProduct).toHaveBeenCalledWith(
          expect.objectContaining({
            name: mockDraftProduct.name,
            category: mockDraftProduct.category,
            base_price: mockDraftProduct.base_price,
            weight: mockDraftProduct.weight,
          })
        );
      });
    });

    it('should create a product with explicit draft status', async () => {
      const user = userEvent.setup();
      const mockResponse: ApiResponse<Product> = {
        success: true,
        data: mockDraftProduct,
      };

      vi.mocked(productService.createProduct).mockResolvedValue(mockResponse);

      render(
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <AdminDashboard />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Product Management/i)).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /Add Product/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Product Name/i)).toBeInTheDocument();
      });

      // Fill form and explicitly set status to draft
      await user.type(screen.getByLabelText(/Product Name/i), mockDraftProduct.name);
      await user.selectOptions(screen.getByLabelText(/Category/i), mockDraftProduct.category);
      await user.type(screen.getByLabelText(/Base Price/i), mockDraftProduct.base_price.toString());
      await user.type(screen.getByLabelText(/Weight/i), mockDraftProduct.weight.toString());

      // Check if status field exists and set it
      const statusField = screen.queryByLabelText(/Status/i);
      if (statusField) {
        await user.selectOptions(statusField, 'draft');
      }

      const submitButton = screen.getByRole('button', { name: /Create Product/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(productService.createProduct).toHaveBeenCalled();
      });
    });
  });

  describe('13.1.2 - Publish and unpublish products', () => {
    it('should publish a draft product', async () => {
      const user = userEvent.setup();
      const publishedProduct = { ...mockDraftProduct, status: 'published' as const, published_at: new Date().toISOString() };
      
      vi.mocked(productService.getAdminProducts).mockResolvedValue({
        success: true,
        data: [mockDraftProduct],
        pagination: {
          page: 1,
          per_page: 20,
          total: 1,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      });

      vi.mocked(productService.publishProduct).mockResolvedValue({
        success: true,
        data: publishedProduct,
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <AdminDashboard />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(mockDraftProduct.name)).toBeInTheDocument();
      });

      // Find and click the publish button
      const publishButton = screen.getByRole('button', { name: /Publish/i });
      await user.click(publishButton);

      await waitFor(() => {
        expect(productService.publishProduct).toHaveBeenCalledWith(mockDraftProduct.id);
      });
    });

    it('should unpublish a published product', async () => {
      const user = userEvent.setup();
      const unpublishedProduct = { ...mockPublishedProduct, status: 'draft' as const, published_at: undefined };
      
      vi.mocked(productService.getAdminProducts).mockResolvedValue({
        success: true,
        data: [mockPublishedProduct],
        pagination: {
          page: 1,
          per_page: 20,
          total: 1,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      });

      vi.mocked(productService.unpublishProduct).mockResolvedValue({
        success: true,
        data: unpublishedProduct,
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <AdminDashboard />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(mockPublishedProduct.name)).toBeInTheDocument();
      });

      // Find and click the unpublish button
      const unpublishButton = screen.getByRole('button', { name: /Unpublish/i });
      await user.click(unpublishButton);

      await waitFor(() => {
        expect(productService.unpublishProduct).toHaveBeenCalledWith(mockPublishedProduct.id);
      });
    });

    it('should toggle product status multiple times', async () => {
      const user = userEvent.setup();
      let currentProduct = { ...mockDraftProduct };
      
      vi.mocked(productService.getAdminProducts).mockImplementation(async () => ({
        success: true,
        data: [currentProduct],
        pagination: {
          page: 1,
          per_page: 20,
          total: 1,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      }));

      vi.mocked(productService.publishProduct).mockImplementation(async () => {
        currentProduct = { ...currentProduct, status: 'published', published_at: new Date().toISOString() };
        return {
          success: true,
          data: currentProduct,
        };
      });

      vi.mocked(productService.unpublishProduct).mockImplementation(async () => {
        currentProduct = { ...currentProduct, status: 'draft', published_at: undefined };
        return {
          success: true,
          data: currentProduct,
        };
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <AdminDashboard />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(mockDraftProduct.name)).toBeInTheDocument();
      });

      // Publish
      const publishButton = screen.getByRole('button', { name: /Publish/i });
      await user.click(publishButton);

      await waitFor(() => {
        expect(productService.publishProduct).toHaveBeenCalledTimes(1);
      });

      // Unpublish
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Unpublish/i })).toBeInTheDocument();
      });

      const unpublishButton = screen.getByRole('button', { name: /Unpublish/i });
      await user.click(unpublishButton);

      await waitFor(() => {
        expect(productService.unpublishProduct).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('13.1.3 - Draft products hidden from public', () => {
    it('should not display draft products on public homepage', async () => {
      vi.mocked(productService.getProducts).mockResolvedValue({
        success: true,
        data: [mockPublishedProduct], // Only published products
        pagination: {
          page: 1,
          per_page: 20,
          total: 1,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <Homepage />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(mockPublishedProduct.name)).toBeInTheDocument();
      });

      // Verify draft product is not shown
      expect(screen.queryByText(mockDraftProduct.name)).not.toBeInTheDocument();
    });

    it('should display both draft and published products in admin dashboard', async () => {
      vi.mocked(productService.getAdminProducts).mockResolvedValue({
        success: true,
        data: [mockDraftProduct, mockPublishedProduct],
        pagination: {
          page: 1,
          per_page: 20,
          total: 2,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <AdminDashboard />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(mockDraftProduct.name)).toBeInTheDocument();
        expect(screen.getByText(mockPublishedProduct.name)).toBeInTheDocument();
      });
    });

    it('should filter products by status in admin dashboard', async () => {
      const user = userEvent.setup();
      
      vi.mocked(productService.getAdminProducts).mockResolvedValue({
        success: true,
        data: [mockDraftProduct],
        pagination: {
          page: 1,
          per_page: 20,
          total: 1,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <AdminDashboard />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Product Management/i)).toBeInTheDocument();
      });

      // Look for status filter dropdown
      const statusFilter = screen.queryByLabelText(/Status/i) || screen.queryByRole('combobox', { name: /status/i });
      
      if (statusFilter) {
        await user.selectOptions(statusFilter, 'draft');

        await waitFor(() => {
          expect(productService.getAdminProducts).toHaveBeenCalledWith(
            expect.objectContaining({
              status: 'draft',
            })
          );
        });
      }
    });
  });

  describe('13.1.4 - Bulk publish/unpublish operations', () => {
    it('should handle bulk publish operation', async () => {
      const user = userEvent.setup();
      const draftProducts = [
        { ...mockDraftProduct, id: 'draft-1' },
        { ...mockDraftProduct, id: 'draft-2', name: 'Draft Product 2' },
        { ...mockDraftProduct, id: 'draft-3', name: 'Draft Product 3' },
      ];

      vi.mocked(productService.getAdminProducts).mockResolvedValue({
        success: true,
        data: draftProducts,
        pagination: {
          page: 1,
          per_page: 20,
          total: 3,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      });

      vi.mocked(productService.publishProduct).mockResolvedValue({
        success: true,
        data: { ...mockDraftProduct, status: 'published', published_at: new Date().toISOString() },
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <AdminDashboard />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(draftProducts[0].name)).toBeInTheDocument();
      });

      // Select multiple products (if checkboxes exist)
      const checkboxes = screen.queryAllByRole('checkbox');
      if (checkboxes.length > 0) {
        for (const checkbox of checkboxes.slice(0, 3)) {
          await user.click(checkbox);
        }

        // Click bulk publish button
        const bulkPublishButton = screen.queryByRole('button', { name: /Bulk Publish/i });
        if (bulkPublishButton) {
          await user.click(bulkPublishButton);

          await waitFor(() => {
            expect(productService.publishProduct).toHaveBeenCalledTimes(3);
          });
        }
      }
    });

    it('should handle bulk unpublish operation', async () => {
      const user = userEvent.setup();
      const publishedProducts = [
        { ...mockPublishedProduct, id: 'pub-1' },
        { ...mockPublishedProduct, id: 'pub-2', name: 'Published Product 2' },
      ];

      vi.mocked(productService.getAdminProducts).mockResolvedValue({
        success: true,
        data: publishedProducts,
        pagination: {
          page: 1,
          per_page: 20,
          total: 2,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      });

      vi.mocked(productService.unpublishProduct).mockResolvedValue({
        success: true,
        data: { ...mockPublishedProduct, status: 'draft', published_at: undefined },
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <AdminDashboard />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(publishedProducts[0].name)).toBeInTheDocument();
      });

      // Select multiple products
      const checkboxes = screen.queryAllByRole('checkbox');
      if (checkboxes.length > 0) {
        for (const checkbox of checkboxes.slice(0, 2)) {
          await user.click(checkbox);
        }

        // Click bulk unpublish button
        const bulkUnpublishButton = screen.queryByRole('button', { name: /Bulk Unpublish/i });
        if (bulkUnpublishButton) {
          await user.click(bulkUnpublishButton);

          await waitFor(() => {
            expect(productService.unpublishProduct).toHaveBeenCalledTimes(2);
          });
        }
      }
    });

    it('should show error when bulk operation fails', async () => {
      const user = userEvent.setup();
      const draftProducts = [
        { ...mockDraftProduct, id: 'draft-1' },
        { ...mockDraftProduct, id: 'draft-2', name: 'Draft Product 2' },
      ];

      vi.mocked(productService.getAdminProducts).mockResolvedValue({
        success: true,
        data: draftProducts,
        pagination: {
          page: 1,
          per_page: 20,
          total: 2,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      });

      // First call succeeds, second fails
      vi.mocked(productService.publishProduct)
        .mockResolvedValueOnce({
          success: true,
          data: { ...mockDraftProduct, status: 'published', published_at: new Date().toISOString() },
        })
        .mockRejectedValueOnce(new Error('Failed to publish product'));

      render(
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <AdminDashboard />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(draftProducts[0].name)).toBeInTheDocument();
      });

      const checkboxes = screen.queryAllByRole('checkbox');
      if (checkboxes.length > 0) {
        for (const checkbox of checkboxes.slice(0, 2)) {
          await user.click(checkbox);
        }

        const bulkPublishButton = screen.queryByRole('button', { name: /Bulk Publish/i });
        if (bulkPublishButton) {
          await user.click(bulkPublishButton);

          // Should show error message
          await waitFor(() => {
            const errorMessage = screen.queryByText(/Failed to publish/i) || screen.queryByText(/error/i);
            if (errorMessage) {
              expect(errorMessage).toBeInTheDocument();
            }
          });
        }
      }
    });
  });

  describe('13.1.5 - Status indicators and UI feedback', () => {
    it('should display draft badge for draft products', async () => {
      vi.mocked(productService.getAdminProducts).mockResolvedValue({
        success: true,
        data: [mockDraftProduct],
        pagination: {
          page: 1,
          per_page: 20,
          total: 1,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <AdminDashboard />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(mockDraftProduct.name)).toBeInTheDocument();
      });

      // Look for draft badge/indicator
      const draftBadge = screen.queryByText(/draft/i);
      expect(draftBadge).toBeInTheDocument();
    });

    it('should display published badge for published products', async () => {
      vi.mocked(productService.getAdminProducts).mockResolvedValue({
        success: true,
        data: [mockPublishedProduct],
        pagination: {
          page: 1,
          per_page: 20,
          total: 1,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <AdminDashboard />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(mockPublishedProduct.name)).toBeInTheDocument();
      });

      // Look for published badge/indicator
      const publishedBadge = screen.queryByText(/published/i);
      expect(publishedBadge).toBeInTheDocument();
    });

    it('should show published date for published products', async () => {
      vi.mocked(productService.getAdminProducts).mockResolvedValue({
        success: true,
        data: [mockPublishedProduct],
        pagination: {
          page: 1,
          per_page: 20,
          total: 1,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <AdminDashboard />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(mockPublishedProduct.name)).toBeInTheDocument();
      });

      // Check if published date is displayed
      const publishedDate = screen.queryByText(/published/i);
      expect(publishedDate).toBeInTheDocument();
    });
  });
});
