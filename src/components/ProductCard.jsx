
import "./ProductCard.css";

function formatPrice(value) {
  if (typeof value === "number") return `₹${value.toLocaleString("en-IN")}`;
  const parsed = Number(String(value ?? "0").replace(/[^0-9.]/g, ""));
  return `₹${(Number.isFinite(parsed) ? parsed : 0).toLocaleString("en-IN")}`;
}

function ProductCard({ product, isFavorite, onToggleFavorite, onAddToCart, onViewDetails }) {
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        {product.image
          ? <img className="product-image" src={product.image} alt={product.name} loading="lazy" />
          : <div className="product-image-fallback" aria-hidden="true">✳</div>}
        {product.tag && <span className="product-tag">{product.tag}</span>}
        <button
          className={`favorite-button${isFavorite ? " is-favorite" : ""}`}
          type="button"
          aria-label={isFavorite ? `Remove ${product.name} from favourites` : `Add ${product.name} to favourites`}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(product.id)}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      </div>
      <div className="product-info">
        <p className="product-category">{product.category || "Handmade craft"}</p>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-artisan">{product.artisan || "Independent artisan"}</p>
        <div className="product-bottom">
          <strong className="product-price">{formatPrice(product.price)}</strong>
          <button className="add-cart-button" type="button" onClick={() => onAddToCart(product)}>
            Add to bag <span aria-hidden="true">+</span>
          </button>
        </div>
        <button className="view-details-button" type="button" onClick={() => onViewDetails(product)}>
          View product details <span aria-hidden="true">↗</span>
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
