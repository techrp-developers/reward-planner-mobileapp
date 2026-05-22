const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toStringValue = (value: unknown, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  return String(value);
};

export const normalizeProduct = (item: any) => {
  const rewardCoins = toNumber(
    item?.rewardCoins ??
      item?.reward_coins ??
      item?.reward?.coins ??
      item?.points ??
      item?.reward_points,
    0
  );

  const redeemCoins = toNumber(
    item?.redeem_coins ??
      item?.redeemCoins ??
      item?.redeem_points ??
      item?.reward?.redeem,
    0
  );

  return {
    ...item,
    rewardCoins,
    redeem_coins: redeemCoins,
    price: toStringValue(
      item?.price ??
        item?.selling_price ??
        item?.sale_price ??
        item?.final_price ??
        item?.variant_price,
      ""
    ),
    originalPrice: toStringValue(
      item?.originalPrice ??
        item?.original_price ??
        item?.mrp ??
        item?.compare_at_price ??
        item?.regular_price,
      ""
    ),
    discount: toStringValue(
      item?.discount ??
        item?.off_percent ??
        item?.discount_percent ??
        item?.discountPercentage,
      ""
    ),
    rp_price: toStringValue(item?.rp_price ?? item?.rpPrice, ""),
    rewardLabel:
      item?.reward?.label ??
      item?.rewardLabel ??
      null,
  };
};
