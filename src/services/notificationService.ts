import api from './api';

export interface SendNotificationRequest {
    order_id: string;
    notification_type: 'status_change' | 'refund' | 'payment_success' | 'payment_failed';
    message?: string;
    tracking_info?: string;
}

export const notificationService = {
    /**
     * Send notification to customer
     * This is typically triggered automatically by the backend when order status changes,
     * but can also be manually triggered by admin
     */
    sendNotification: async (data: SendNotificationRequest): Promise<{ success: boolean; message: string }> => {
        const response = await api.post<{ success: boolean; message: string }>('/admin/notifications/send', data);
        return response.data;
    },

    /**
     * Send order status change notification
     */
    sendOrderStatusNotification: async (orderId: string, newStatus: string, trackingInfo?: string): Promise<{ success: boolean; message: string }> => {
        return notificationService.sendNotification({
            order_id: orderId,
            notification_type: 'status_change',
            message: `Your order status has been updated to: ${newStatus}`,
            tracking_info: trackingInfo,
        });
    },
};
