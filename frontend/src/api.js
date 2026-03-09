const API_BASE = "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  return response.json();
}

export const api = {
  listGiftCardTypes: () => request("/admin/gift-card-types"),
  createGiftCardType: (payload) =>
    request("/admin/gift-card-types", { method: "POST", body: JSON.stringify(payload) }),

  listMerchants: () => request("/admin/merchants"),
  suggestMerchants: (prefix, limit = 8) =>
    request(`/admin/merchants/suggest?prefix=${encodeURIComponent(prefix)}&limit=${limit}`),
  createMerchant: (payload) =>
    request("/admin/merchants", { method: "POST", body: JSON.stringify(payload) }),

  linkMerchantToType: (giftcardTypeId, merchantId) =>
    request(`/admin/gift-card-types/${giftcardTypeId}/merchants/${merchantId}`, {
      method: "POST",
    }),
  unlinkMerchantFromType: (giftcardTypeId, merchantId) =>
    request(`/admin/gift-card-types/${giftcardTypeId}/merchants/${merchantId}`, {
      method: "DELETE",
    }),
  listGiftCardTypeMerchants: () => request("/admin/gift-card-type-merchants"),

  listUserGiftCards: () => request("/user-gift-cards"),
  createUserGiftCard: (payload) =>
    request("/user-gift-cards", { method: "POST", body: JSON.stringify(payload) }),
  updateUserGiftCard: (id, payload) =>
    request(`/user-gift-cards/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteUserGiftCard: (id) => request(`/user-gift-cards/${id}`, { method: "DELETE" }),

  searchByMerchant: (merchant) =>
    request(`/search?merchant=${encodeURIComponent(merchant)}`),
};
