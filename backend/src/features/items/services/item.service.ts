import { Item, ItemDocument } from '../models/item.model';
import { NotFoundError } from '../../../core/errors';
import { IItem } from '../types';

interface QueryParams {
  userId: string;
  page: number;
  limit: number;
  search?: string;
  category?: string;
  status?: string;
  sort: string;
}

export class ItemService {
  async findAll(params: QueryParams) {
    const { userId, page, limit, search, category, status, sort } = params;
    const filter: Record<string, any> = { userId };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (status) filter.status = status;
    const sortDir = sort.startsWith('-') ? -1 : 1;
    const sortField = sort.replace('-', '');
    const [items, total] = await Promise.all([
      Item.find(filter).sort({ [sortField]: sortDir }).skip((page - 1) * limit).limit(limit).lean(),
      Item.countDocuments(filter),
    ]);
    return { data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
  async findById(id: string, userId: string): Promise<ItemDocument> {
    const item = await Item.findOne({ _id: id, userId });
    if (!item) throw new NotFoundError('Item');
    return item;
  }
  async create(data: Partial<IItem>, userId: string): Promise<ItemDocument> {
    return Item.create({ ...data, userId });
  }
  async update(id: string, data: Partial<IItem>, userId: string): Promise<ItemDocument> {
    const item = await Item.findOneAndUpdate({ _id: id, userId }, { $set: data }, { new: true });
    if (!item) throw new NotFoundError('Item');
    return item;
  }
  async delete(id: string, userId: string): Promise<void> {
    const item = await Item.findOneAndDelete({ _id: id, userId });
    if (!item) throw new NotFoundError('Item');
  }
}
export const itemService = new ItemService();
