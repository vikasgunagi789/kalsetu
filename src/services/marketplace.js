
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

const usersCollection = collection(db, "users");
const productsCollection = collection(db, "products");
const ordersCollection = collection(db, "orders");

// Get a user's saved profile.
export async function getUserProfile(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

// Create a buyer or artisan profile.
export async function createUserProfile(user, role) {
  if (!user?.uid) {
    throw new Error("You must sign in first.");
  }

  if (!["buyer", "artisan"].includes(role)) {
    throw new Error("Choose a valid account type.");
  }

  const profileRef = doc(db, "users", user.uid);
  const existing = await getDoc(profileRef);

  if (existing.exists()) {
    return {
      id: existing.id,
      ...existing.data(),
    };
  }

  const profile = {
    uid: user.uid,
    displayName: user.displayName || "",
    email: user.email || "",
    role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const { setDoc } = await import("firebase/firestore");
  await setDoc(profileRef, profile);

  return getUserProfile(user.uid);
}

// Save a product for the signed-in artisan.
export async function createProduct(user, product) {
  if (!user?.uid) {
    throw new Error("Sign in before adding a product.");
  }

  const profile = await getUserProfile(user.uid);

  if (profile?.role !== "artisan") {
    throw new Error("Only artisan accounts can add products.");
  }

  const title = String(product.title || "").trim();
  const description = String(product.description || "").trim();
  const category = String(product.category || "").trim();
  const price = Number(product.price);
  const stock = Number(product.stock);
  const imageUrl = String(product.imageUrl || "").trim();

  if (!title || !description || !category) {
    throw new Error("Enter the product title, description, and category.");
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Enter a valid product price.");
  }

  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error("Stock must be a whole number of zero or more.");
  }

  const productData = {
    ownerId: user.uid,
    title,
    description,
    category,
    price,
    stock,
    imageUrl,
    published: product.published === true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const result = await addDoc(productsCollection, productData);

  return {
    id: result.id,
    ...productData,
  };
}

// Fetch published products from Firestore.

export async function getPublishedProducts() {
  const productsQuery = query(
    collection(db, "products"),
    where("published", "==", true),
    limit(100)
  );

  const snapshot = await getDocs(productsQuery);

  return snapshot.docs.map((productDoc) => ({
    ...productDoc.data(),
    id: productDoc.id,
  }));
}


// Fetch products belonging to one artisan.

export async function getArtisanProducts(uid) {
  if (!uid) {
    throw new Error("An artisan user ID is required.");
  }

  const productsQuery = query(
    collection(db, "products"),
    where("ownerId", "==", uid),
    limit(100)
  );

  const snapshot = await getDocs(productsQuery);

  return snapshot.docs.map((productDoc) => ({
    id: productDoc.id,
    ...productDoc.data(),
  }));
}


// Place an order for the signed-in buyer.
export async function createOrder(user, order) {
  if (!user?.uid) {
    throw new Error("Sign in before placing an order.");
  }

  const profile = await getUserProfile(user.uid);

  if (profile?.role !== "buyer") {
    throw new Error("A buyer account is required to place an order.");
  }

  if (!Array.isArray(order.items) || order.items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const total = Number(order.total);

  if (!Number.isFinite(total) || total < 0) {
    throw new Error("The order total is invalid.");
  }

  const sellerIds = [
    ...new Set(
      order.items
        .map((item) => item.ownerId)
        .filter((id) => typeof id === "string" && id.length > 0)
    ),
  ];

  if (sellerIds.length === 0) {
    throw new Error("The cart has no valid artisan products.");
  }

  const orderData = {
    buyerId: user.uid,
    sellerIds,
    items: order.items,
    total,
    shippingAddress: order.shippingAddress || {},
    status: "placed",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const result = await addDoc(ordersCollection, orderData);

  return {
    id: result.id,
    ...orderData,
  };
}

// Fetch orders for the signed-in buyer.
export async function getBuyerOrders(uid) {
  const q = query(
    ordersCollection,
    where("buyerId", "==", uid),
    limit(100)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

// Fetch orders for a signed-in artisan.
// This query retrieves only orders whose sellerIds include that artisan.
export async function getArtisanOrders(uid) {
  const q = query(
    ordersCollection,
    where("sellerIds", "array-contains", uid),
    limit(100)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

// Update order status as an artisan.
export async function updateOrderStatus(orderId, status) {
  const allowedStatuses = [
    "placed",
    "confirmed",
    "preparing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid order status.");
  }

  await updateDoc(doc(db, "orders", orderId), {
    status,
    updatedAt: serverTimestamp(),
  });
}
