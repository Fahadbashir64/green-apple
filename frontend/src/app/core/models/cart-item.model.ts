import { MenuItem } from './menu-item.model';
import { PizzaSize } from '../utils/menu-pricing';

export interface CartItem {
  item: MenuItem;
  quantity: number;
  sizeLabel?: PizzaSize;
  /** Set at add-to-cart so totals match chosen pizza size and paid addons */
  unitPrice?: number;
  /** Serialized as `groupId:optionId` tokens */
  addons?: string[];
  instructions?: string;
}
