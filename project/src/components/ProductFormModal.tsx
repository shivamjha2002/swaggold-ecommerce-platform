import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { Product, CreateProductRequest, UpdateProductRequest } from '../types';
import { getErrorMessage } from '../utils/errorHandler';
import { getImageUrl } from '../utils/imageUtils';
import api from '../services/api';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductRequest | UpdateProductRequest) => Promise<void>;
  product?: Product | null;
  mode: 'create' | 'edit';
}

const CATEGORIES = [
  'Nath',
  'Pendant Set',
  'Tika',
  'Necklace',
  'Earrings',
  'Bangles',
  'Ring',
  'Bracelet',
  'Bridal Set',
];

const GOLD_PURITIES = ['916', '750', '585'];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  product,
  mode,
}) => {
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    category: 'Nath',
    base_price: 0,
    weight: 0,
    gold_purity: '916',
    description: '',
    image_url: '',
    stock_quantity: 0,
    status: 'draft',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (product && mode === 'edit') {
      setFormData({
        name: product.name,
        category: product.category,
        base_price: product.base_price,
        weight: product.weight,
        gold_purity: product.gold_purity,
        description: product.description,
        image_url: product.image_url,
        stock_quantity: product.stock_quantity,
        status: product.status || 'draft',
      });
      setImagePreview(product.image_url ? getImageUrl(product.image_url) : '');
    } else {
      setFormData({
        name: '',
        category: 'Nath',
        base_price: 0,
        weight: 0,
        gold_purity: '916',
        description: '',
        image_url: '',
        stock_quantity: 0,
        status: 'draft',
      });
      setImagePreview('');
    }
    setError(null);
    setFieldErrors({});
    setImageFile(null);
  }, [product, mode, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'base_price' || name === 'weight' || name === 'stock_quantity'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please upload PNG, JPG, GIF, or WebP images.');
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('File size exceeds 5MB limit.');
        return;
      }

      setImageFile(file);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData((prev) => ({ ...prev, image_url: '' }));
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return formData.image_url || '';

    setUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', imageFile);

      // Don't set Content-Type header - let browser set it with boundary
      const response = await api.post('/uploads/image', formDataUpload);

      if (response.data.success && response.data.data?.image_url) {
        return response.data.data.image_url;
      } else {
        throw new Error(response.data.error?.message || 'Failed to upload image');
      }
    } catch (err) {
      throw new Error(getErrorMessage(err));
    } finally {
      setUploadingImage(false);
    }
  };

  const extractFieldErrors = (error: unknown): Record<string, string> => {
    const fieldErrors: Record<string, string> = {};
    
    // Check if it's an Axios error with validation details
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      const data = axiosError.response?.data;
      
      // Format 1: { error: { details: { field: "message" } } }
      if (data?.error?.details && typeof data.error.details === 'object') {
        Object.entries(data.error.details).forEach(([field, message]) => {
          fieldErrors[field] = String(message);
        });
      }
      
      // Format 2: { details: { field: "message" } }
      if (data?.details && typeof data.details === 'object') {
        Object.entries(data.details).forEach(([field, message]) => {
          fieldErrors[field] = String(message);
        });
      }
    }
    
    return fieldErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      // Upload image first if a new file is selected
      let imageUrl = formData.image_url;
      if (imageFile) {
        try {
          imageUrl = await uploadImage();
        } catch (uploadErr) {
          setError(`Image upload failed: ${getErrorMessage(uploadErr)}`);
          setLoading(false);
          return;
        }
      }

      // Submit form with image URL
      await onSubmit({ ...formData, image_url: imageUrl });
      
      // Only close modal if submission was successful
      onClose();
    } catch (err) {
      // Extract field-specific validation errors
      const validationErrors = extractFieldErrors(err);
      
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
        setError('Please fix the validation errors below');
      } else {
        // General error message
        setError(getErrorMessage(err));
      }
      
      // Don't close modal on error - let user fix issues
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-yellow-400 to-yellow-500 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
          <h2 className="text-lg sm:text-2xl font-bold text-black">
            {mode === 'create' ? 'Add New Product' : 'Edit Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-black hover:text-gray-700 transition-colors p-2 min-w-touch min-h-touch flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`w-full px-3 py-3 text-base border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                  fieldErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Traditional Gold Nath Set"
              />
              {fieldErrors.name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className={`w-full px-3 py-3 text-base border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                  fieldErrors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {fieldErrors.category && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Base Price (₹) *
              </label>
              <input
                type="number"
                name="base_price"
                value={formData.base_price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                inputMode="decimal"
                className={`w-full px-3 py-3 text-base border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                  fieldErrors.base_price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 120000"
              />
              {fieldErrors.base_price && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.base_price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Weight (grams) *
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                required
                min="0"
                step="0.001"
                inputMode="decimal"
                className={`w-full px-3 py-3 text-base border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                  fieldErrors.weight ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 4.110"
              />
              {fieldErrors.weight && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.weight}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Gold Purity *
              </label>
              <select
                name="gold_purity"
                value={formData.gold_purity}
                onChange={handleChange}
                required
                className={`w-full px-3 py-3 text-base border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                  fieldErrors.gold_purity ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {GOLD_PURITIES.map((purity) => (
                  <option key={purity} value={purity}>
                    {purity} (
                    {purity === '916'
                      ? '22K'
                      : purity === '750'
                      ? '18K'
                      : '14K'}
                    )
                  </option>
                ))}
              </select>
              {fieldErrors.gold_purity && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.gold_purity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                required
                min="0"
                step="1"
                inputMode="numeric"
                className={`w-full px-3 py-3 text-base border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                  fieldErrors.stock_quantity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 5"
              />
              {fieldErrors.stock_quantity && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.stock_quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Status *
              </label>
              <div className="flex items-center space-x-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={formData.status === 'draft'}
                    onChange={handleChange}
                    className="w-4 h-4 text-yellow-500 focus:ring-yellow-400 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-700">Draft</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={formData.status === 'published'}
                    onChange={handleChange}
                    className="w-4 h-4 text-yellow-500 focus:ring-yellow-400 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-700">Published</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Draft products are only visible to admins. Published products are visible to all users.
              </p>
              {fieldErrors.status && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.status}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Image
            </label>
            
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-full h-48 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={loading || uploadingImage}
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <div className="bg-gray-100 p-3 rounded-full mb-2">
                    <Upload className="h-6 w-6 text-gray-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Click to upload image
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF, WebP up to 5MB
                  </p>
                </label>
              </div>
            )}
            
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Or enter image URL
              </label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                inputMode="url"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                  fieldErrors.image_url ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://example.com/image.jpg"
                disabled={!!imageFile}
              />
              {fieldErrors.image_url && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.image_url}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={`w-full px-3 py-3 text-base border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-y ${
                fieldErrors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter product description..."
            />
            {fieldErrors.description && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 min-h-touch border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 min-h-touch bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || uploadingImage}
            >
              {uploadingImage ? 'Uploading Image...' : loading ? 'Saving...' : mode === 'create' ? 'Add Product' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
