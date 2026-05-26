import { FulfillmentType } from './fulfillment.model';

export type PaymentMethod = 'cod' | 'paypal';
export type OrderStatus = 'pending' | 'preparing' | 'delivered';

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address: string;
}

export interface OrderItemDetail {
  itemName: string;
  sizeLabel?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber?: string;
  customer: CustomerInfo;
  items: OrderItemDetail[];
  paymentMethod: PaymentMethod;
  fulfillmentType: FulfillmentType;
  status: OrderStatus;
  subtotal?: number;
  deliveryFee?: number;
  total: number;
  createdAt: Date;
}
