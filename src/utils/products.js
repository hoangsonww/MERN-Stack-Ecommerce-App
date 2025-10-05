export const normalizeProduct = product => {
  if (!product) {
    return product;
  }

  const canonicalId = product._id || product.id;
  return { ...product, _id: canonicalId, id: canonicalId };
};

export const normalizeProductList = items => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map(normalizeProduct);
};
