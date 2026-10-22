
import { useCallback, useEffect, useState } from "react";
import {
  createProduct,
  getArtisanProducts,
} from "../services/marketplace";
import "./ArtisanDashboard.css";

const INITIAL_FORM = {
  title: "",
  description: "",
  category: "Home Decor",
  price: "",
  stock: "1",
  imageUrl: "",
  published: true,
};

const CATEGORIES = [
  "Home Decor",
  "Pottery",
  "Textiles",
  "Jewelry",
  "Paintings",
  "Woodwork",
  "Bamboo Crafts",
  "Accessories",
  "Other",
];

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export default function ArtisanDashboard({
  user,
  onClose,
  onProductSaved,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const loadProducts = useCallback(async () => {
    if (!user?.uid) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await getArtisanProducts(user.uid);
      setProducts(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("Unable to load artisan products:", err);
      setError(
        err?.code === "permission-denied"
          ? "Firestore denied access. Check your published Firestore rules."
          : err?.message || "Could not load your products."
      );
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const title = form.title.trim();
    const description = form.description.trim();
    const category = form.category.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);
    const imageUrl = form.imageUrl.trim();

    if (!user?.uid) {
      setError("Please sign in before adding a product.");
      return;
    }

    if (!title || !description || !category) {
      setError("Please fill in the title, description, and category.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid, non-negative price.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setError("Stock must be a whole number of zero or more.");
      return;
    }

    if (imageUrl) {
      try {
        const parsedUrl = new URL(imageUrl);

        if (
          parsedUrl.protocol !== "https:" &&
          parsedUrl.protocol !== "http:"
        ) {
          throw new Error("Invalid image URL");
        }
      } catch {
        setError("Enter a valid image URL beginning with https:// or http://.");
        return;
      }
    }

    setSaving(true);

    try {
      await createProduct(user, {
        title,
        description,
        category,
        price,
        stock,
        imageUrl,
        published: form.published,
      });

      setForm(INITIAL_FORM);
setNotice("Your product has been saved successfully.");
setActiveTab("products");
await loadProducts();

if (onProductSaved) {
  onProductSaved();
}
    } catch (err) {
      console.error("Unable to create product:", err);
      setError(
        err?.code === "permission-denied"
          ? "Permission denied. Confirm your profile role is artisan and Firestore rules are published."
          : err?.message || "Unable to save the product."
      );
    } finally {
      setSaving(false);
    }
  }

  const publishedCount = products.filter(
    (product) => product.published === true
  ).length;

  const totalStock = products.reduce(
    (total, product) => total + (Number(product.stock) || 0),
    0
  );

  return (
    <div
      className="ks-artisan-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ks-artisan-title"
    >
      <div className="ks-artisan-dashboard">
        <header className="ks-artisan-header">
          <div className="ks-artisan-brand">
            <div className="ks-artisan-brand-icon">K</div>
            <div>
              <p className="ks-artisan-eyebrow">KALASETU MARKETPLACE</p>
              <h2 id="ks-artisan-title">Artisan Studio</h2>
              <p className="ks-artisan-subtitle">
                Your craft. Your story. Your marketplace.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="ks-artisan-close"
            onClick={onClose}
            aria-label="Close Artisan Studio"
          >
            ×
          </button>
        </header>

        <div className="ks-artisan-welcome">
          <div>
            <p className="ks-artisan-eyebrow">YOUR WORKSPACE</p>
            <h3>Welcome, {user?.displayName || "Artisan"}!</h3>
            <p>
              Manage your handmade products and keep your catalogue up to date.
            </p>
          </div>
          <div className="ks-artisan-avatar" aria-hidden="true">
            {(user?.displayName || user?.email || "A")
              .trim()
              .charAt(0)
              .toUpperCase()}
          </div>
        </div>

        <nav className="ks-artisan-tabs" aria-label="Artisan dashboard">
          <button
            type="button"
            className={activeTab === "overview" ? "active" : ""}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            type="button"
            className={activeTab === "add" ? "active" : ""}
            onClick={() => {
              setError("");
              setNotice("");
              setActiveTab("add");
            }}
          >
            + Add Product
          </button>
          <button
            type="button"
            className={activeTab === "products" ? "active" : ""}
            onClick={() => setActiveTab("products")}
          >
            My Products
          </button>
        </nav>

        <main className="ks-artisan-content">
          {error && (
            <div className="ks-artisan-alert error" role="alert">
              {error}
            </div>
          )}

          {notice && (
            <div className="ks-artisan-alert success" role="status">
              {notice}
            </div>
          )}

          {activeTab === "overview" && (
            <section>
              <div className="ks-artisan-section-heading">
                <div>
                  <p className="ks-artisan-eyebrow">YOUR BUSINESS</p>
                  <h3>Dashboard overview</h3>
                </div>
                <button
                  type="button"
                  className="ks-artisan-primary"
                  onClick={() => {
                    setError("");
                    setNotice("");
                    setActiveTab("add");
                  }}
                >
                  + Add a product
                </button>
              </div>

              <div className="ks-artisan-stats">
                <article className="ks-artisan-stat">
                  <span className="ks-artisan-stat-icon">◇</span>
                  <p>Total products</p>
                  <strong>{loading ? "—" : products.length}</strong>
                  <span>Products in your catalogue</span>
                </article>

                <article className="ks-artisan-stat">
                  <span className="ks-artisan-stat-icon">✓</span>
                  <p>Published</p>
                  <strong>{loading ? "—" : publishedCount}</strong>
                  <span>Listings marked as published</span>
                </article>

                <article className="ks-artisan-stat">
                  <span className="ks-artisan-stat-icon">▦</span>
                  <p>Total stock</p>
                  <strong>{loading ? "—" : totalStock}</strong>
                  <span>Units across your listings</span>
                </article>
              </div>

              <div className="ks-artisan-panel">
                <div className="ks-artisan-section-heading">
                  <div>
                    <p className="ks-artisan-eyebrow">RECENT LISTINGS</p>
                    <h3>Your products</h3>
                  </div>
                  <button
                    type="button"
                    className="ks-artisan-text-button"
                    onClick={() => setActiveTab("products")}
                  >
                    View all →
                  </button>
                </div>

                {loading ? (
                  <p className="ks-artisan-muted">Loading your products...</p>
                ) : products.length === 0 ? (
                  <div className="ks-artisan-empty">
                    <span>✳</span>
                    <h4>Your craft journey starts here.</h4>
                    <p>
                      Add your first handmade product to begin building your
                      online catalogue.
                    </p>
                    <button
                      type="button"
                      className="ks-artisan-primary"
                      onClick={() => setActiveTab("add")}
                    >
                      Add your first product
                    </button>
                  </div>
                ) : (
                  <div className="ks-artisan-recent-list">
                    {products.slice(0, 4).map((product) => (
                      <article
                        className="ks-artisan-recent-item"
                        key={product.id}
                      >
                        <div className="ks-artisan-mini-image">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.title}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <span>✳</span>
                          )}
                        </div>
                        <div className="ks-artisan-recent-info">
                          <strong>{product.title}</strong>
                          <span>
                            {product.category || "Craft"} · Stock:{" "}
                            {Number(product.stock) || 0}
                          </span>
                        </div>
                        <strong className="ks-artisan-product-price">
                          {formatPrice(product.price)}
                        </strong>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === "add" && (
            <section className="ks-artisan-form-section">
              <div className="ks-artisan-section-heading">
                <div>
                  <p className="ks-artisan-eyebrow">GROW YOUR STORE</p>
                  <h3>Add a handmade product</h3>
                  <p className="ks-artisan-muted">
                    Share the details that make your craft special.
                  </p>
                </div>
              </div>

              <form
                className="ks-artisan-form"
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="ks-artisan-field">
                  <label htmlFor="ks-product-title">Product title *</label>
                  <input
                    id="ks-product-title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Hand-painted terracotta vase"
                    maxLength={120}
                    required
                  />
                </div>

                <div className="ks-artisan-field">
                  <label htmlFor="ks-product-description">
                    Product description *
                  </label>
                  <textarea
                    id="ks-product-description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe the materials, technique, and story behind your craft..."
                    rows={5}
                    maxLength={3000}
                    required
                  />
                  <span className="ks-artisan-field-hint">
                    {form.description.length}/3000 characters
                  </span>
                </div>

                <div className="ks-artisan-form-grid">
                  <div className="ks-artisan-field">
                    <label htmlFor="ks-product-category">Category *</label>
                    <select
                      id="ks-product-category"
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      required
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ks-artisan-field">
                    <label htmlFor="ks-product-price">Price (₹) *</label>
                    <input
                      id="ks-product-price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="e.g. 799"
                      required
                    />
                  </div>

                  <div className="ks-artisan-field">
                    <label htmlFor="ks-product-stock">Available stock *</label>
                    <input
                      id="ks-product-stock"
                      name="stock"
                      type="number"
                      min="0"
                      step="1"
                      value={form.stock}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="ks-artisan-field">
                    <label htmlFor="ks-product-image">Image URL</label>
                    <input
                      id="ks-product-image"
                      name="imageUrl"
                      type="url"
                      value={form.imageUrl}
                      onChange={handleChange}
                      placeholder="https://example.com/craft.jpg"
                    />
                  </div>
                </div>

                {form.imageUrl.trim() && (
                  <div className="ks-artisan-image-preview">
                    <span>Image preview</span>
                    <img
                      src={form.imageUrl}
                      alt="Product preview"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                      onLoad={(event) => {
                        event.currentTarget.style.display = "block";
                      }}
                    />
                  </div>
                )}

                <label className="ks-artisan-publish-option">
                  <input
                    type="checkbox"
                    name="published"
                    checked={form.published}
                    onChange={handleChange}
                  />
                  <span>
                    <strong>Publish this product</strong>
                    <small>
                      Published listings can be made available to marketplace
                      visitors.
                    </small>
                  </span>
                </label>

                <div className="ks-artisan-form-actions">
                  <button
                    type="button"
                    className="ks-artisan-secondary"
                    onClick={() => setActiveTab("overview")}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ks-artisan-primary"
                    disabled={saving}
                  >
                    {saving ? "Saving product..." : "Save product"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeTab === "products" && (
            <section>
              <div className="ks-artisan-section-heading">
                <div>
                  <p className="ks-artisan-eyebrow">YOUR CATALOGUE</p>
                  <h3>My products</h3>
                  <p className="ks-artisan-muted">
                    Products saved to your artisan account.
                  </p>
                </div>
                <button
                  type="button"
                  className="ks-artisan-primary"
                  onClick={() => {
                    setError("");
                    setNotice("");
                    setActiveTab("add");
                  }}
                >
                  + Add product
                </button>
              </div>

              {loading ? (
                <p className="ks-artisan-muted">Loading your products...</p>
              ) : products.length === 0 ? (
                <div className="ks-artisan-empty">
                  <span>✳</span>
                  <h4>No products yet</h4>
                  <p>Your products will appear here after you add them.</p>
                </div>
              ) : (
                <div className="ks-artisan-product-grid">
                  {products.map((product) => (
                    <article
                      className="ks-artisan-product-card"
                      key={product.id}
                    >
                      <div className="ks-artisan-product-image">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span>✳</span>
                        )}
                        <span
                          className={`ks-artisan-status ${
                            product.published ? "published" : "draft"
                          }`}
                        >
                          {product.published ? "Published" : "Draft"}
                        </span>
                      </div>
                      <div className="ks-artisan-product-card-body">
                        <span className="ks-artisan-product-category">
                          {product.category || "Craft"}
                        </span>
                        <h4>{product.title}</h4>
                        <p className="ks-artisan-product-description">
                          {product.description}
                        </p>
                        <div className="ks-artisan-product-meta">
                          <strong>{formatPrice(product.price)}</strong>
                          <span>
                            Stock: {Number(product.stock) || 0}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>

        <footer className="ks-artisan-footer">
          <span>Made with care for the people who make things by hand.</span>
          <span>KalaSetu · Artisan Studio</span>
        </footer>
      </div>
    </div>
  );
}
