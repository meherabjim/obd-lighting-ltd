/**
 * API Client
 *
 * Local:
 *   VITE_API_URL=http://localhost:4000
 *
 * Production:
 *   VITE_API_URL=https://obdlighting-api.onrender.com
 */

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:4000";


const TOKEN_KEY = "obd.admin.token";


export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};


export const setToken = (t) => {
  try {
    if (t) {
      localStorage.setItem(TOKEN_KEY, t);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // private mode
  }
};


async function request(
  path,
  {
    method = "GET",
    body,
    auth = false,
    isForm = false,
  } = {}
) {

  const headers = {};

  if (!isForm && body !== undefined) {
    headers["Content-Type"] = "application/json";
  }


  if (auth) {
    const token = getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }


  let res;

  try {

    res = await fetch(`${API_BASE}/api${path}`, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : isForm
          ? body
          : JSON.stringify(body),
    });

  } catch (error) {

    throw new Error(
      "Cannot reach the server. Please check API connection."
    );

  }


  if (res.status === 204) {
    return null;
  }


  let data = null;

  try {
    data = await res.json();
  } catch {
    // empty response
  }


  if (!res.ok) {

    if (res.status === 401 && auth) {
      setToken(null);
    }

    throw new Error(
      data?.error || `Request failed (${res.status})`
    );
  }


  return data;
}



const qs = (params) => {

  const s = new URLSearchParams();


  Object.entries(params || {}).forEach(([key, value]) => {

    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "all"
    ) {
      s.set(key, value);
    }

  });


  const out = s.toString();

  return out ? `?${out}` : "";
};




export const api = {


  // =====================
  // PUBLIC
  // =====================

  categories: () =>
    request("/categories"),


  settings: () =>
    request("/settings"),


  products: (params) =>
    request(`/products${qs(params)}`),


  product: (slug) =>
    request(`/products/${encodeURIComponent(slug)}`),


  sendEnquiry: (payload) =>
    request("/enquiries", {
      method: "POST",
      body: payload,
    }),




  // =====================
  // AUTH
  // =====================

  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: {
        email,
        password,
      },
    }),


  me: () =>
    request("/auth/me", {
      auth: true,
    }),


  changePassword: (
    currentPassword,
    newPassword
  ) =>
    request("/auth/password", {
      method: "POST",
      auth: true,
      body: {
        currentPassword,
        newPassword,
      },
    }),




  // =====================
  // ADMIN PRODUCTS
  // =====================

  adminStats: () =>
    request("/admin/stats", {
      auth: true,
    }),


  adminProducts: (params) =>
    request(`/admin/products${qs(params)}`, {
      auth: true,
    }),


  adminProduct: (id) =>
    request(`/admin/products/${id}`, {
      auth: true,
    }),


  createProduct: (form) =>
    request("/admin/products", {
      method: "POST",
      auth: true,
      body: form,
      isForm: true,
    }),


  updateProduct: (id, form) =>
    request(`/admin/products/${id}`, {
      method: "PUT",
      auth: true,
      body: form,
      isForm: true,
    }),


  deleteProduct: (id) =>
    request(`/admin/products/${id}`, {
      method: "DELETE",
      auth: true,
    }),




  // =====================
  // ADMIN CATEGORIES
  // =====================

  adminCategories: () =>
    request("/admin/categories", {
      auth: true,
    }),


  createCategory: (body) =>
    request("/admin/categories", {
      method: "POST",
      auth: true,
      body,
    }),


  updateCategory: (id, body) =>
    request(`/admin/categories/${id}`, {
      method: "PUT",
      auth: true,
      body,
    }),


  deleteCategory: (id) =>
    request(`/admin/categories/${id}`, {
      method: "DELETE",
      auth: true,
    }),




  // =====================
  // ENQUIRIES
  // =====================

  adminEnquiries: (params) =>
    request(`/admin/enquiries${qs(params)}`, {
      auth: true,
    }),


  updateEnquiry: (id, body) =>
    request(`/admin/enquiries/${id}`, {
      method: "PUT",
      auth: true,
      body,
    }),


  deleteEnquiry: (id) =>
    request(`/admin/enquiries/${id}`, {
      method: "DELETE",
      auth: true,
    }),




  // =====================
  // SETTINGS
  // =====================

  adminSettings: () =>
    request("/admin/settings", {
      auth: true,
    }),


  updateSettings: (body) =>
    request("/admin/settings", {
      method: "PUT",
      auth: true,
      body,
    }),

};