import { Coupon, CouponDocument, ICoupon } from '../models/coupon.model';
import { NotFoundError, ValidationError } from '../../../core/errors';

interface CouponListParams {
  page: number;
  limit: number;
  isActive?: boolean;
  search?: string;
}

export class CouponService {
  async validateCoupon(code: string, amount?: number): Promise<CouponDocument> {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) throw new NotFoundError('Coupon');
    if (!coupon.isActive) throw new ValidationError('Coupon is not active');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ValidationError('Coupon has expired');
    if (coupon.maxUses != null && coupon.currentUses >= coupon.maxUses) throw new ValidationError('Coupon usage limit reached');
    if (amount !== undefined && coupon.minAmount && amount < coupon.minAmount) {
      throw new ValidationError(`Minimum order amount of ${coupon.minAmount} required`);
    }
    return coupon;
  }

  async applyCoupon(code: string): Promise<CouponDocument> {
    const coupon = await Coupon.findOneAndUpdate(
      { code: code.toUpperCase() },
      { $inc: { currentUses: 1 } },
      { new: true }
    );
    if (!coupon) throw new NotFoundError('Coupon');
    return coupon;
  }

  async create(data: Partial<ICoupon>): Promise<CouponDocument> {
    if (data.discountType === 'percentage' && (data.discountValue! < 1 || data.discountValue! > 100)) {
      throw new ValidationError('Percentage discount must be between 1 and 100');
    }
    return Coupon.create(data);
  }

  async update(id: string, data: Partial<ICoupon>): Promise<CouponDocument> {
    const coupon = await Coupon.findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!coupon) throw new NotFoundError('Coupon');
    return coupon;
  }

  async delete(id: string): Promise<void> {
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) throw new NotFoundError('Coupon');
  }

  async list(params: CouponListParams) {
    const { page, limit, isActive, search } = params;
    const filter: Record<string, unknown> = {};
    if (isActive !== undefined) filter.isActive = isActive;
    if (search) filter.code = { $regex: search, $options: 'i' };

    const [coupons, total] = await Promise.all([
      Coupon.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Coupon.countDocuments(filter),
    ]);

    return {
      data: coupons,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string): Promise<CouponDocument> {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw new NotFoundError('Coupon');
    return coupon;
  }

  async seedDefaults(): Promise<void> {
    const defaults = [
      { code: 'WELCOME50', description: '50% off your first purchase', discountType: 'percentage' as const, discountValue: 50, maxUses: null },
      { code: 'GRE20', description: '20% off everything', discountType: 'percentage' as const, discountValue: 20, maxUses: null },
      { code: 'AI30', description: '30% off AI features', discountType: 'percentage' as const, discountValue: 30, maxUses: 100 },
      { code: 'STUDENT15', description: '15% off for students', discountType: 'percentage' as const, discountValue: 15, maxUses: 500 },
      { code: 'SUMMER25', description: '25% off summer sale', discountType: 'percentage' as const, discountValue: 25, maxUses: 200 },
    ];

    for (const coupon of defaults) {
      const exists = await Coupon.findOne({ code: coupon.code });
      if (!exists) {
        await Coupon.create(coupon);
      }
    }
  }
}

export const couponService = new CouponService();
