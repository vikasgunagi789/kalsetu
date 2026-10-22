
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { products } from "./data/products";
import ProductCard from "./components/ProductCard";
import AuthModal from "./components/AuthModal";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

import ArtisanDashboard from "./components/ArtisanDashboard";

import RoleSetupModal from "./components/RoleSetupModal";
import { getUserProfile } from "./services/marketplace";

const categories = ["All Crafts", "Kasuti", "Pottery", "Weaving"];

const stories = [
  {
    name: "A tradition stitched by hand",
    maker: "Kasuti embroidery · Karnataka",
    image:
      "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=85",
    search: "Indian Kasuti embroidery artisan making process",
    length: "MAKER STORY",
  },
  {
    name: "From earth to everyday art",
    maker: "Terracotta · India",
    image:
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=85",
    search: "Indian terracotta pottery artisan making process",
    length: "CRAFT FILM",
  },
  {
    name: "Weaving stories, thread by thread",
    maker: "Handloom & weaving · India",
    image:
      "https://images.unsplash.com/photo-1590736969955-71cc94901144?auto=format&fit=crop&w=900&q=85",
    search: "Indian traditional weaving artisan process",
    length: "BEHIND THE CRAFT",
  },
];

// Illustrative testimonials, not verified customer reviews.
const reviews = [
  {
    quote:
      "The embroidery is even more beautiful in person. I loved learning about the hands and tradition behind it.",
    name: "Ananya R.",
    location: "Bengaluru",
    item: "Kasuti embroidered saree",
    initials: "AR",
  },
  {
    quote:
      "The pottery has so much character. It feels special to buy something made slowly by a real artisan.",
    name: "Meera S.",
    location: "Mysuru",
    item: "Handmade terracotta vase",
    initials: "MS",
  },
  {
    quote:
      "A thoughtful gift with a story. The maker details made the whole experience feel personal.",
    name: "Kavya P.",
    location: "Pune",
    item: "Woven artisan gift",
    initials: "KP",
  },
];

const promises = [
  {
    icon: "✳",
    title: "Made by hand",
    text: "Discover the skill and care behind every piece.",
  },
  {
    icon: "♡",
    title: "Artisan first",
    text: "Celebrate makers, their stories, and their livelihoods.",
  },
  {
    icon: "♧",
    title: "Craft with a story",
    text: "Learn about the materials, region, and tradition.",
  },
  {
    icon: "✧",
    title: "Thoughtful finds",
    text: "Choose meaningful pieces made to be treasured.",
  },
];

const features = [
  {
    icon: "🎙️",
    title: "Kannada Voice-to-Shop",
    text: "Help artisans turn spoken Kannada product descriptions into clear listings.",
  },
  {
    icon: "⌕",
    title: "CraftProof Passport",
    text: "A QR-linked story can share an artisan's name, materials, origin, and making journey.",
  },
  {
    icon: "₹",
    title: "Fair-Price Intelligence",
    text: "Estimate a fair price using materials, working hours, and other costs.",
  },
];

function App() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Crafts");

  const [artisanDashboardOpen, setArtisanDashboardOpen] = useState(false);

  const [userProfile, setUserProfile] = useState(null);
const [profileLoading, setProfileLoading] = useState(false);
const [profileError, setProfileError] = useState("");

const [marketplaceProducts, setMarketplaceProducts] = useState([]);
const [marketplaceLoading, setMarketplaceLoading] = useState(true);
const [marketplaceError, setMarketplaceError] = useState("");
const [marketplaceRefreshKey, setMarketplaceRefreshKey] = useState(0);

  // Authentication
  const [authOpen, setAuthOpen] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
  let active = true;

  async function loadProfile() {
    if (!authUser) {
      setUserProfile(null);
      setProfileError("");
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    setProfileError("");

    try {
      const profile = await getUserProfile(authUser.uid);

      if (active) {
        setUserProfile(profile);
      }
    } catch (error) {
      console.error("Could not load KalaSetu profile:", error);

      if (active) {
        setProfileError(
          "We could not load your profile. Check your connection and Firestore rules."
        );
      }
    } finally {
      if (active) {
        setProfileLoading(false);
      }
    }
  }

  loadProfile();

  return () => {
    active = false;
  };
}, [authUser]);

  // Favourites
  const [favorites, setFavorites] = useState([]);

  // Restore the shopping bag after refresh.
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = window.localStorage.getItem("kalasetu-cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  
useEffect(() => {
  let active = true;

  async function loadMarketplaceProducts() {
    setMarketplaceLoading(true);
    setMarketplaceError("");

    try {
      const result = await getPublishedProducts();

      if (!active) return;

      const normalizedProducts = (Array.isArray(result) ? result : [])
        .filter((product) => product.published === true)
        .map((product) => ({
          ...product,
          // Keep Firestore IDs distinct from local demo-product IDs.
          id: `firestore-${product.id}`,
          name: product.title || product.name || "Handmade craft",
          artisan: product.artisanName || "KalaSetu artisan",
          image: product.imageUrl || product.image || "",
          price: Number(product.price) || 0,
          category: product.category || "Other",
          description: product.description || "",
          tag: "Artisan listing",
        }));

      setMarketplaceProducts(normalizedProducts);
    } catch (error) {
      console.error("Could not load published products:", error);

      if (active) {
        setMarketplaceError(
          "Live artisan products could not be loaded. Your existing collection is still available."
        );
      }
    } finally {
      if (active) setMarketplaceLoading(false);
    }
  }

  loadMarketplaceProducts();

  return () => {
    active = false;
  };
}, [marketplaceRefreshKey]);


  // Persist the shopping bag in this browser.
  useEffect(() => {
    try {
      window.localStorage.setItem("kalasetu-cart", JSON.stringify(cart));
    } catch {
      // The app can still work if browser storage is unavailable.
    }
  }, [cart]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [reviewIndex, setReviewIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Product search and category filtering
  
const allProducts = useMemo(
  () => [...products, ...marketplaceProducts],
  [marketplaceProducts]
);

const displayCategories = useMemo(
  () => [
    ...new Set([
      ...categories,
      ...marketplaceProducts
        .map((product) => product.category)
        .filter(Boolean),
    ]),
  ],
  [marketplaceProducts]
);

const filteredProducts = useMemo(() => {
  const term = search.trim().toLowerCase();

  return allProducts.filter((product) => {
    const matchesCategory =
      category === "All Crafts" || product.category === category;

    const searchableFields = [
      product.name,
      product.artisan,
      product.category,
      product.description,
    ];

    const matchesSearch =
      !term ||
      searchableFields.some((value) =>
        String(value || "").toLowerCase().includes(term)
      );

    return matchesCategory && matchesSearch;
  });
}, [allProducts, search, category]);


  function toggleFavorite(id) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  // Shopping bag
  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });

    setNotice(`${product.name} added to your bag.`);
    setIsCartOpen(true);
    window.setTimeout(() => setNotice(""), 2800);
  }

  function changeCartQuantity(id, change) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + change }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(id) {
    setCart((current) => current.filter((item) => item.id !== id));
  }

  function getPrice(value) {
    if (typeof value === "number") return value;

    const parsed = Number(String(value ?? "0").replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartSubtotal = cart.reduce(
    (total, item) => total + getPrice(item.price) * item.quantity,
    0
  );

  const deliveryEstimate =
    cartSubtotal === 0 || cartSubtotal >= 1999 ? 0 : 99;

  const cartTotal = cartSubtotal + deliveryEstimate;

  const formatPrice = (amount) =>
    `₹${amount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  // Firebase sign-out
  async function handleSignOut() {
    try {
      await signOut(auth);
      setNotice("You have signed out successfully.");
    } catch (error) {
      console.error("Sign-out failed:", error);
      setNotice("Unable to sign out. Please try again.");
    }

    window.setTimeout(() => setNotice(""), 2800);
  }

  return (
    <div className="site-shell" id="home">
      <div className="top-note">
        A little more meaning in everything you bring home{" "}
        <span>✳</span> Discover handmade India
      </div>

      <header className="site-header">
        <a className="wordmark" href="#home" aria-label="KalaSetu home">
          <span className="brand-mark">
            K<span>✳</span>
          </span>

          <span className="brand-words">
            <strong>KalaSetu</strong>
            <small>CRAFTED WITH A STORY</small>
          </span>
        </a>

        <nav className="main-nav" aria-label="Main navigation">
          <a href="#crafts">Shop crafts</a>
          <a href="#stories">Meet the makers</a>
          <a href="#reviews">Kind words</a>
          <a href="#our-purpose">Our purpose</a>
        </nav>

        <div className="header-tools">
          <a className="icon-link" href="#crafts" aria-label="Search crafts">
            ⌕
          </a>

          <button
            className="bag-link"
            type="button"
            onClick={() => setIsCartOpen(true)}
          >
            Bag <span>{cartCount}</span>
          </button>

          <a className="header-cta" href="#artisan">
            For artisans <span>↗</span>
          </a>

          {authUser ? (
            <button
              type="button"
              className="header-cta"
              onClick={handleSignOut}
            >
              Sign out <span>↗</span>
            </button>
          ) : (
            <button
              type="button"
              className="header-cta"
              onClick={() => setAuthOpen(true)}
            >
              Sign in <span>↗</span>
            </button>
          )}
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-line" /> ROOTED IN INDIA. MADE BY HAND.
            </p>

            <h1>
              Bring home a little <em>piece of</em>{" "}
              <span>someone's story.</span>
            </h1>

            <p className="hero-intro">
              Discover thoughtful, handmade treasures shaped by generations of
              skill, culture, and imagination.
            </p>

            <div className="hero-buttons">
              <a className="btn btn-dark" href="#crafts">
                Explore the collection <span>↗</span>
              </a>

              <a className="under-link" href="#stories">
                Watch the stories <span>→</span>
              </a>
            </div>

            <div className="hero-footnote">
              <div className="mini-avatars">
                <span>✿</span>
                <span>❋</span>
                <span>✳</span>
              </div>

              <p>
                <strong>Made by real hands</strong>
                <small>Every piece carries a human story.</small>
              </p>
            </div>
          </div>

          <div className="hero-art">
            <img
              className="hero-main-image"
              src="https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1300&q=90"
              alt="Creative handmade craft workspace"
            />

            <div className="hero-image-label">
              <span>THE ART OF SLOW MADE</span>
              <strong>
                Objects with soul.
                <br />
                Stories that stay.
              </strong>
            </div>

            <div className="round-seal">
              <span>HANDMADE</span>
              <b>✳</b>
              <span>WITH HEART</span>
            </div>
          </div>
        </section>

        <section className="promise-row" aria-label="KalaSetu values">
          {promises.map((item) => (
            <div className="promise-item" key={item.title}>
              <span className="promise-icon">{item.icon}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="collection-section section-wrap" id="crafts">
          <div className="section-topline">
            <p className="eyebrow">THE HANDMADE EDIT</p>
            <span>01 / FIND YOUR FAVOURITE</span>
          </div>

          <div className="section-heading">
            <div>
              <h2>
                Made with meaning.
                <br />
                <em>Found by you.</em>
              </h2>
              <p>
                Everyday objects, heirloom-worthy details, and one-of-a-kind
                pieces.
              </p>
            </div>

            <a className="under-link" href="#crafts">
              Browse the edit <span>→</span>
            </a>
          </div>

          <div className="catalogue-controls">
            <div className="category-pills">
              {displayCategories.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={
                    category === item
                      ? "category-pill active"
                      : "category-pill"
                  }
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <label className="search-field">
              <span>⌕</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search crafts or makers"
              />
              <kbd>/</kbd>
            </label>
          </div>

          {notice && (
            <div className="toast" role="status">
              ✓ {notice}
            </div>
          )}

          
{marketplaceLoading && (
  <p className="marketplace-status" role="status">
    Discovering handmade products from our artisans...
  </p>
)}

{marketplaceError && (
  <p className="marketplace-status marketplace-status-error" role="status">
    {marketplaceError}
  </p>
)}


          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isFavorite={favorites.includes(product.id)}
                onToggleFavorite={toggleFavorite}
                onAddToCart={addToCart}
                onViewDetails={setSelectedProduct}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="empty-state">
              <span>⌕</span>
              <h3>No crafts found just yet</h3>
              <p>Try another search or browse all crafts.</p>
              <button
                className="btn btn-dark"
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("All Crafts");
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          <div className="collection-bottom">
            <span>✳</span> A little imperfection is the beauty of something made
            by hand. <span>✳</span>
          </div>
        </section>

        <section className="maker-section" id="stories">
          <div className="maker-intro">
            <p className="eyebrow">BEHIND THE BEAUTY</p>
            <h2>
              Meet the hands.
              <br />
              <em>Hear the stories.</em>
            </h2>
            <p>
              A craft is more than the finished piece. It's a place, a practice,
              and a person who has poured their heart into it.
            </p>
            <a
              className="btn btn-light"
              href="https://www.youtube.com/results?search_query=Indian+traditional+artisans+craft+stories"
              target="_blank"
              rel="noreferrer"
            >
              Explore craft films <span>↗</span>
            </a>
          </div>

          <div className="story-cards">
            {stories.map((story, index) => (
              <a
                className={`story-card story-card-${index + 1}`}
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                  story.search
                )}`}
                target="_blank"
                rel="noreferrer"
                key={story.name}
              >
                <img src={story.image} alt={story.maker} loading="lazy" />
                <span className="story-play" aria-hidden="true">
                  ▶
                </span>
                <span className="story-type">{story.length}</span>
                <div className="story-card-caption">
                  <small>{story.maker}</small>
                  <strong>{story.name}</strong>
                  <span className="story-arrow">↗</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="review-section section-wrap" id="reviews">
          <div className="review-heading">
            <p className="eyebrow">NOT JUST OUR WORD</p>
            <h2>
              Little notes of <em>love.</em>
            </h2>
            <p>
              Stories from people who choose to bring handmade into their homes.
            </p>

            <div className="review-controls">
              <button
                type="button"
                aria-label="Previous review"
                onClick={() =>
                  setReviewIndex(
                    (reviewIndex + reviews.length - 1) % reviews.length
                  )
                }
              >
                ←
              </button>

              <span>
                0{reviewIndex + 1} <i>/</i> 0{reviews.length}
              </span>

              <button
                type="button"
                aria-label="Next review"
                onClick={() =>
                  setReviewIndex((reviewIndex + 1) % reviews.length)
                }
              >
                →
              </button>
            </div>
          </div>

          <div className="review-feature">
            <div className="review-quote-mark">“</div>
            <div className="stars" aria-label="Illustrative five-star review">
              ★★★★★
            </div>
            <blockquote>{reviews[reviewIndex].quote}</blockquote>

            <div className="review-author">
              <span className="review-avatar">
                {reviews[reviewIndex].initials}
              </span>
              <div>
                <strong>{reviews[reviewIndex].name}</strong>
                <small>
                  {reviews[reviewIndex].location} · {reviews[reviewIndex].item}
                </small>
              </div>
              <span className="verified-note">♡ Community note</span>
            </div>
          </div>

          <p className="review-disclaimer">
            Prototype content: these are sample testimonials for layout
            demonstration, not verified customer reviews. Replace them with
            real, permissioned feedback before launch.
          </p>
        </section>

        <section className="purpose-section" id="our-purpose">
          <div className="purpose-image">
            <img
              src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1100&q=85"
              alt="A maker's creative workspace"
              loading="lazy"
            />
            <span className="image-caption">MADE SLOWLY. KEPT CLOSE.</span>
          </div>

          <div className="purpose-copy">
            <p className="eyebrow">A MARKETPLACE WITH A HEART</p>
            <h2>
              Good things happen when <em>craft finds care.</em>
            </h2>
            <p>
              KalaSetu brings traditional makers and thoughtful buyers closer
              together. We want every artisan to share their story, price their
              work fairly, and reach people who value the time behind every
              creation.
            </p>
            <a className="under-link" href="#artisan">
              What we believe <span>→</span>
            </a>

            <div className="purpose-stat">
              <strong>One craft at a time.</strong>
              <span>Celebrating living traditions across India.</span>
            </div>
          </div>
        </section>

        <section className="innovation-section section-wrap" id="artisan">
          <div className="section-topline">
            <p className="eyebrow">THE KALASETU DIFFERENCE</p>
            <span>TOOLS FOR THE PEOPLE WHO MAKE</span>
          </div>

          <div className="section-heading">
            <div>
              <h2>
                Old-world skill.
                <br />
                <em>New ways to thrive.</em>
              </h2>
              <p>
                Thoughtful technology designed to support, not replace, the
                artisan.
              </p>
            </div>
          </div>

          <div className="innovation-grid">
            {features.map((feature, index) => (
              <article className="innovation-card" key={feature.title}>
                <span className="innovation-number">0{index + 1}</span>
                <div className="innovation-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                <a href="#artisan">
                  Explore the idea <span>↗</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="artisan-banner">
          <div>
            <p className="eyebrow">FOR THE HANDS THAT CREATE</p>
            <h2>
              Your craft deserves
              <br />
              <em>to be seen.</em>
            </h2>
            <p>
              Bring your work, your story, and your tradition to KalaSetu.
            </p>
          </div>

          <a className="btn btn-light" href="mailto:hello@kalasetu.example">
            Become an artisan partner <span>↗</span>
          </a>

          <span className="banner-flower">✳</span>
        </section>
      </main>

      {/* Product details */}
      {selectedProduct && (
        <div
          className="product-detail-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedProduct(null);
            }
          }}
        >
          <section
            className="product-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-detail-title"
          >
            <button
              className="product-detail-close"
              type="button"
              onClick={() => setSelectedProduct(null)}
              aria-label="Close product details"
            >
              ×
            </button>

            <div className="product-detail-image">
              {selectedProduct.image ? (
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                />
              ) : (
                <div
                  className="product-detail-image-fallback"
                  aria-hidden="true"
                >
                  ✳
                </div>
              )}

              {selectedProduct.tag && (
                <span className="product-tag">{selectedProduct.tag}</span>
              )}
            </div>

            <div className="product-detail-content">
              <p className="eyebrow">
                {selectedProduct.category || "HANDMADE CRAFT"}
              </p>
              <h2 id="product-detail-title">{selectedProduct.name}</h2>
              <p className="product-detail-maker">
                Made by {selectedProduct.artisan || "an independent artisan"}
              </p>
              <strong className="product-detail-price">
                {formatPrice(getPrice(selectedProduct.price))}
              </strong>

              <p className="product-detail-description">
                {selectedProduct.description ||
                  "A thoughtful handmade find from KalaSetu. The artisan's verified story, making process, and care instructions can be added when those details are available."}
              </p>

              <div className="product-detail-facts">
                <div>
                  <span>Craft category</span>
                  <strong>
                    {selectedProduct.category || "Not specified"}
                  </strong>
                </div>
                <div>
                  <span>Materials</span>
                  <strong>
                    {selectedProduct.materials ||
                      "Details to be confirmed by the artisan"}
                  </strong>
                </div>
                <div>
                  <span>Origin</span>
                  <strong>
                    {selectedProduct.origin ||
                      "Ask the artisan for origin details"}
                  </strong>
                </div>
                <div>
                  <span>Care instructions</span>
                  <strong>
                    {selectedProduct.care ||
                      "Care instructions to be added"}
                  </strong>
                </div>
              </div>

              <div className="product-detail-actions">
                <button
                  className="btn btn-dark"
                  type="button"
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                >
                  Add to bag <span>↗</span>
                </button>

                <button
                  className={
                    favorites.includes(selectedProduct.id)
                      ? "detail-favorite is-favorite"
                      : "detail-favorite"
                  }
                  type="button"
                  onClick={() => toggleFavorite(selectedProduct.id)}
                >
                  {favorites.includes(selectedProduct.id)
                    ? "♥ Saved to favourites"
                    : "♡ Save to favourites"}
                </button>
              </div>

              <p className="product-detail-note">
                Materials, origin, and care details are displayed from the
                product data when supplied.
              </p>
            </div>
          </section>
        </div>
      )}

      {/* Shopping bag */}
      {isCartOpen && (
        <div
          className="cart-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsCartOpen(false);
            }
          }}
        >
          <aside
            className="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
          >
            <div className="cart-drawer-header">
              <div>
                <p className="eyebrow">YOUR HANDPICKED FINDS</p>
                <h2 id="cart-title">
                  Your bag <span>({cartCount})</span>
                </h2>
              </div>

              <button
                className="cart-close"
                type="button"
                onClick={() => setIsCartOpen(false)}
                aria-label="Close cart"
              >
                ×
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <span aria-hidden="true">♡</span>
                <h3>Your bag is waiting for a story.</h3>
                <p>Explore handmade finds and add something meaningful.</p>
                <button
                  className="btn btn-dark"
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                >
                  Continue exploring
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <article className="cart-item" key={item.id}>
                      <div className="cart-item-image">
                        {item.image ? (
                          <img src={item.image} alt={item.name} />
                        ) : (
                          <span aria-hidden="true">✳</span>
                        )}
                      </div>

                      <div className="cart-item-details">
                        <h3>{item.name}</h3>
                        <p>{item.artisan || item.category || "Handmade craft"}</p>
                        <strong>{formatPrice(getPrice(item.price))}</strong>

                        <div className="cart-item-actions">
                          <div
                            className="quantity-control"
                            aria-label={`Quantity for ${item.name}`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                changeCartQuantity(item.id, -1)
                              }
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() =>
                                changeCartQuantity(item.id, 1)
                              }
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          <button
                            className="cart-remove"
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="cart-summary">
                  <div>
                    <span>Subtotal</span>
                    <strong>{formatPrice(cartSubtotal)}</strong>
                  </div>

                  <div>
                    <span>Estimated delivery</span>
                    <strong>
                      {deliveryEstimate === 0
                        ? "Free"
                        : formatPrice(deliveryEstimate)}
                    </strong>
                  </div>

                  <p className="cart-delivery-note">
                    Prototype estimate: delivery is free on orders of ₹1,999
                    or more; otherwise ₹99.
                  </p>

                  <div className="cart-total">
                    <span>Estimated total</span>
                    <strong>{formatPrice(cartTotal)}</strong>
                  </div>

                  <button
                    className="btn btn-dark cart-checkout"
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      setNotice(
                        "Your cart is ready. Checkout and payment are not connected yet."
                      );
                      window.setTimeout(() => setNotice(""), 4000);
                    }}
                  >
                    Continue to checkout <span>↗</span>
                  </button>

                  <p className="cart-checkout-note">
                    Checkout is a demo only. No order or payment will be
                    submitted.
                  </p>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {/* Firebase authentication modal */}
      
      {/* Firebase authentication modal */}
      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onLogin={() => setAuthOpen(false)}
        />
      )}

      {/* Loading the user's Firestore profile */}
      {authUser && profileLoading && (
        <div className="ks-profile-loading" role="status">
          Loading your KalaSetu profile...
        </div>
      )}

      {/* Show an error if the profile could not be loaded */}
      {authUser && profileError && (
        <div className="ks-profile-error" role="alert">
          {profileError}
        </div>
      )}

      {/* Ask new users to choose Buyer or Artisan */}
      {authUser &&
        !profileLoading &&
        !profileError &&
        !userProfile && (
          <RoleSetupModal
            user={authUser}
            onComplete={(profile) => {
              setUserProfile(profile);
              setProfileError("");
            }}
          />
        )}

        
{/* Artisan Studio entry point */}
{authUser &&
  userProfile?.role === "artisan" &&
  !profileLoading &&
  !profileError && (
    <button
      type="button"
      className="ks-artisan-launcher"
      onClick={() => setArtisanDashboardOpen(true)}
    >
      <span aria-hidden="true">✳</span>
      Artisan Studio
    </button>
  )}

{/* Artisan dashboard */}
{artisanDashboardOpen &&
  authUser &&
  userProfile?.role === "artisan" && (
    <ArtisanDashboard
  user={authUser}
  onClose={() => setArtisanDashboardOpen(false)}
  onProductSaved={() =>
    setMarketplaceRefreshKey((current) => current + 1)
  }
/>
  )}


      {/* Existing footer — keep all its contents */}
      <footer className="site-footer">

        <div className="footer-main">
          <a className="wordmark footer-wordmark" href="#home">
            <span className="brand-mark">
              K<span>✳</span>
            </span>
            <span className="brand-words">
              <strong>KalaSetu</strong>
              <small>CRAFTED WITH A STORY</small>
            </span>
          </a>

          <p>
            For the things we make.
            <br />
            For the people who make them.
          </p>

          <div className="footer-links">
            <a href="#crafts">Shop crafts</a>
            <a href="#stories">Maker stories</a>
            <a href="#reviews">Reviews</a>
            <a href="#artisan">For artisans</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} KalaSetu · Student project prototype
          </span>
          <a href="#home">Back to top ↑</a>
          <span>Made with care in India ✳</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
