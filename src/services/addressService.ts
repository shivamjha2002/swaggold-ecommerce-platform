import api from './api';
import { ApiResponse } from '../types';

export interface Address {
    id: string;
    user_id: string;
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    is_default: boolean;
    created_at: string;
}

export interface CreateAddressRequest {
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    is_default?: boolean;
}

export interface UpdateAddressRequest extends Partial<CreateAddressRequest> { }

class AddressService {
    /**
     * Fetch all addresses for the authenticated user
     * GET /api/addresses
     */
    async getAddresses(): Promise<ApiResponse<Address[]>> {
        try {
            const response = await api.get<ApiResponse<Address[]>>('/addresses');
            return response.data;
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Create a new address
     * POST /api/addresses
     */
    async createAddress(addressData: CreateAddressRequest): Promise<ApiResponse<Address>> {
        try {
            const response = await api.post<ApiResponse<Address>>('/addresses', addressData);
            return response.data;
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Update an existing address
     * PUT /api/addresses/:id
     */
    async updateAddress(addressId: string, addressData: UpdateAddressRequest): Promise<ApiResponse<Address>> {
        try {
            const response = await api.put<ApiResponse<Address>>(`/addresses/${addressId}`, addressData);
            return response.data;
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Delete an address
     * DELETE /api/addresses/:id
     */
    async deleteAddress(addressId: string): Promise<ApiResponse<{ message: string }>> {
        try {
            const response = await api.delete<ApiResponse<{ message: string }>>(`/addresses/${addressId}`);
            return response.data;
        } catch (error: any) {
            throw error;
        }
    }
}

export const addressService = new AddressService();
