/**
 * Real Product Preview Components for Display Styles
 * Premium, clean design with actual product cards
 */

'use client';

interface ProductPreviewData {
  id: string;
  title: string;
  price: number;
  image: string;
  compareAtPrice?: number;
}

// Sample products for preview (realistic demo data)
const SAMPLE_PRODUCTS: ProductPreviewData[] = [
  {
    id: '1',
    title: 'Premium Leather Wallet',
    price: 49.99,
    compareAtPrice: 69.99,
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop',
  },
  {
    id: '2',
    title: 'Wireless Earbuds Pro',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop',
  },
  {
    id: '3',
    title: 'Minimalist Watch',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
  },
];

type DisplayStyle = 'carousel' | 'list' | 'banner' | 'cards' | 'frequently-bought';

interface DisplayStylePreviewProps {
  style: DisplayStyle;
}

export default function DisplayStylePreview({ style }: DisplayStylePreviewProps) {
  const getPreviewComponent = () => {
    switch (style) {
      case 'carousel':
        return <CarouselPreview />;
      case 'list':
        return <ListPreview />;
      case 'banner':
        return <BannerPreview />;
      case 'cards':
        return <CardsPreview />;
      case 'frequently-bought':
        return <FrequentlyBoughtPreview />;
      default:
        return null;
    }
  };

  return (
    <div className="mobile-product-page-wrapper">
      <div className="mobile-device-frame">
        <div className="mobile-header">
          <span className="mobile-icon">🛒</span>
          <span className="mobile-title">Cart Drawer</span>
        </div>

        <div className="mobile-content">
          {/* Cart Header */}
          <div className="cart-header-section">
            <h2 className="cart-title">Your Cart</h2>
            <span className="cart-count">3 items</span>
          </div>

          {/* Cart Items (without images) */}
          <div className="cart-items-section">
            <div className="cart-item">
              <div className="cart-item-placeholder"></div>
              <div className="cart-item-details">
                <h4 className="cart-item-title">Product Name</h4>
                <p className="cart-item-variant">Size: M</p>
                <p className="cart-item-price">$49.99</p>
              </div>
            </div>
            <div className="cart-item">
              <div className="cart-item-placeholder"></div>
              <div className="cart-item-details">
                <h4 className="cart-item-title">Another Product</h4>
                <p className="cart-item-variant">Color: Blue</p>
                <p className="cart-item-price">$29.99</p>
              </div>
            </div>
          </div>

          {/* Upsell Position Indicator */}
          <div className="upsell-position-indicator">
            <div className="indicator-arrow">↓</div>
            <span className="indicator-text">Your upsell appears here</span>
            <div className="indicator-arrow">↓</div>
          </div>

          {/* The actual preview component (with images) */}
          <div className="upsell-preview-section">
            {getPreviewComponent()}
          </div>

          {/* Cart Footer */}
          <div className="cart-footer-section">
            <div className="cart-subtotal">
              <span className="subtotal-label">Subtotal</span>
              <span className="subtotal-price">$79.98</span>
            </div>
            <button className="checkout-btn">
              Checkout
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .mobile-product-page-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 8px;
        }

        .mobile-device-frame {
          width: 100%;
          max-width: 420px;
          background: #f5f5f5;
          border: 2px solid #000;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .mobile-header {
          background: #000;
          color: white;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .mobile-icon {
          font-size: 14px;
        }

        .mobile-title {
          color: white;
        }

        .mobile-content {
          background: white;
          max-height: 750px;
          overflow-y: auto;
        }

        .cart-header-section {
          padding: 16px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cart-title {
          font-size: 18px;
          font-weight: 700;
          color: #000;
          margin: 0;
        }

        .cart-count {
          font-size: 14px;
          color: #666;
        }

        .cart-items-section {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .cart-item {
          display: flex;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #eee;
        }

        .cart-item-placeholder {
          width: 60px;
          height: 60px;
          background: #e0e0e0;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .cart-item-details {
          flex: 1;
        }

        .cart-item-title {
          font-size: 14px;
          font-weight: 600;
          color: #000;
          margin: 0 0 4px 0;
        }

        .cart-item-variant {
          font-size: 12px;
          color: #666;
          margin: 0 0 4px 0;
        }

        .cart-item-price {
          font-size: 14px;
          font-weight: 700;
          color: #000;
          margin: 0;
        }

        .upsell-position-indicator {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          padding: 8px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin: 16px 0;
        }

        .indicator-arrow {
          font-size: 18px;
          color: white;
          font-weight: 700;
        }

        .indicator-text {
          font-size: 12px;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .upsell-preview-section {
          padding: 0 16px;
          margin-bottom: 16px;
        }

        .cart-footer-section {
          padding: 16px;
          border-top: 1px solid #eee;
          background: #fafafa;
        }

        .cart-subtotal {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .subtotal-label {
          font-size: 14px;
          font-weight: 600;
          color: #000;
        }

        .subtotal-price {
          font-size: 18px;
          font-weight: 700;
          color: #000;
        }

        .checkout-btn {
          width: 100%;
          padding: 16px;
          background: #000;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .checkout-btn:hover {
          background: #333;
        }

        /* Scrollbar for mobile content */
        .mobile-content::-webkit-scrollbar {
          width: 4px;
        }

        .mobile-content::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .mobile-content::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .mobile-content::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}

function CarouselPreview() {
  return (
    <div className="preview-container">
      <div className="preview-header">
        <h3 className="preview-title">You might also like</h3>
      </div>

      <div className="carousel-container">
        <button className="carousel-arrow" aria-label="Previous">←</button>

        <div className="carousel-track">
          {SAMPLE_PRODUCTS.map((product) => (
            <div key={product.id} className="carousel-card">
              <div className="product-image-wrapper">
                <img src={product.image} alt={product.title} className="product-image" />
              </div>
              <div className="product-info">
                <h4 className="product-title">{product.title}</h4>
                <div className="product-price-row">
                  {product.compareAtPrice && (
                    <span className="compare-price">${product.compareAtPrice.toFixed(2)}</span>
                  )}
                  <span className="product-price">${product.price.toFixed(2)}</span>
                </div>
                <button className="add-button">Add to Cart</button>
              </div>
            </div>
          ))}
        </div>

        <button className="carousel-arrow" aria-label="Next">→</button>
      </div>

      <style jsx>{`
        .preview-container {
          background: white;
          padding: 24px;
          border-radius: 8px;
          border: 1px solid #000;
        }

        .preview-header {
          margin-bottom: 20px;
        }

        .preview-title {
          font-size: 18px;
          font-weight: 600;
          color: #000;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .carousel-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .carousel-arrow {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          border: 2px solid #000;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .carousel-arrow:hover {
          background: #000;
          color: white;
        }

        .carousel-track {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scroll-behavior: smooth;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .carousel-track::-webkit-scrollbar {
          display: none;
        }

        .carousel-card {
          flex: 0 0 160px;
          border: 1px solid #000;
          border-radius: 8px;
          overflow: hidden;
          background: white;
        }

        .product-image-wrapper {
          width: 100%;
          height: 160px;
          overflow: hidden;
          background: #f5f5f5;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-info {
          padding: 12px;
        }

        .product-title {
          font-size: 14px;
          font-weight: 600;
          color: #000;
          margin: 0 0 8px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .product-price-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .compare-price {
          font-size: 13px;
          color: #999;
          text-decoration: line-through;
        }

        .product-price {
          font-size: 16px;
          font-weight: 700;
          color: #000;
        }

        .add-button {
          width: 100%;
          padding: 8px 16px;
          background: #000;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-button:hover {
          background: #333;
        }
      `}</style>
    </div>
  );
}

function ListPreview() {
  return (
    <div className="preview-container">
      <div className="preview-header">
        <h3 className="preview-title">Complete your order</h3>
      </div>

      <div className="list-container">
        {SAMPLE_PRODUCTS.map((product, index) => (
          <div key={product.id} className="list-item">
            <input type="checkbox" id={`product-${index}`} className="checkbox" />
            <label htmlFor={`product-${index}`} className="list-item-content">
              <div className="list-item-image-wrapper">
                <img src={product.image} alt={product.title} className="list-item-image" />
              </div>
              <div className="list-item-info">
                <h4 className="list-item-title">{product.title}</h4>
                <div className="list-item-price-row">
                  {product.compareAtPrice && (
                    <span className="compare-price">${product.compareAtPrice.toFixed(2)}</span>
                  )}
                  <span className="list-item-price">${product.price.toFixed(2)}</span>
                </div>
              </div>
              <button className="list-add-button">Add</button>
            </label>
          </div>
        ))}
      </div>

      <style jsx>{`
        .preview-container {
          background: white;
          padding: 24px;
          border-radius: 8px;
          border: 1px solid #000;
        }

        .preview-header {
          margin-bottom: 20px;
        }

        .preview-title {
          font-size: 18px;
          font-weight: 600;
          color: #000;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .list-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .list-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid #000;
          border-radius: 4px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .list-item-content {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid #000;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .list-item-content:hover {
          background: #f9f9f9;
        }

        .list-item-image-wrapper {
          width: 60px;
          height: 60px;
          border-radius: 4px;
          overflow: hidden;
          flex-shrink: 0;
          background: #f5f5f5;
        }

        .list-item-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .list-item-info {
          flex: 1;
        }

        .list-item-title {
          font-size: 14px;
          font-weight: 600;
          color: #000;
          margin: 0 0 4px 0;
        }

        .list-item-price-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .compare-price {
          font-size: 12px;
          color: #999;
          text-decoration: line-through;
        }

        .list-item-price {
          font-size: 15px;
          font-weight: 700;
          color: #000;
        }

        .list-add-button {
          padding: 8px 20px;
          background: #000;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .list-add-button:hover {
          background: #333;
        }
      `}</style>
    </div>
  );
}

function BannerPreview() {
  const product = SAMPLE_PRODUCTS[0]!;
  const savings = product.compareAtPrice ? product.compareAtPrice - product.price : 10;

  return (
    <div className="preview-container">
      <div className="banner-container">
        <div className="banner-image-wrapper">
          <img src={product.image} alt={product.title} className="banner-image" />
        </div>
        <div className="banner-content">
          <div className="banner-badge">Limited Offer</div>
          <h3 className="banner-title">{product.title}</h3>
          <p className="banner-description">Complete your purchase with this premium addition</p>
          <div className="banner-price-row">
            {product.compareAtPrice && (
              <span className="banner-compare-price">${product.compareAtPrice.toFixed(2)}</span>
            )}
            <span className="banner-price">${product.price.toFixed(2)}</span>
            <span className="banner-savings">Save ${savings.toFixed(2)}!</span>
          </div>
        </div>
        <button className="banner-button">Add to Cart</button>
      </div>

      <style jsx>{`
        .preview-container {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 2px solid #000;
        }

        .banner-container {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .banner-image-wrapper {
          width: 120px;
          height: 120px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
          background: #f5f5f5;
          border: 1px solid #000;
        }

        .banner-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .banner-content {
          flex: 1;
        }

        .banner-badge {
          display: inline-block;
          padding: 4px 12px;
          background: #000;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          border-radius: 12px;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
          background-image: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          position: relative;
        }

        .banner-badge::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #000;
          border-radius: 12px;
          z-index: -1;
        }

        .banner-title {
          font-size: 18px;
          font-weight: 700;
          color: #000;
          margin: 0 0 6px 0;
        }

        .banner-description {
          font-size: 13px;
          color: #666;
          margin: 0 0 12px 0;
        }

        .banner-price-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .banner-compare-price {
          font-size: 14px;
          color: #999;
          text-decoration: line-through;
        }

        .banner-price {
          font-size: 22px;
          font-weight: 700;
          color: #000;
        }

        .banner-savings {
          font-size: 13px;
          font-weight: 600;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .banner-button {
          padding: 14px 32px;
          background: #000;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .banner-button:hover {
          background: #333;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}

function CardsPreview() {
  return (
    <div className="preview-container">
      <div className="preview-header">
        <h3 className="preview-title">Recommended for you</h3>
      </div>

      <div className="cards-grid">
        {SAMPLE_PRODUCTS.map((product) => (
          <div key={product.id} className="card">
            <div className="card-image-wrapper">
              <img src={product.image} alt={product.title} className="card-image" />
            </div>
            <div className="card-content">
              <h4 className="card-title">{product.title}</h4>
              <div className="card-price-row">
                {product.compareAtPrice && (
                  <span className="compare-price">${product.compareAtPrice.toFixed(2)}</span>
                )}
                <span className="card-price">${product.price.toFixed(2)}</span>
              </div>
              <button className="card-button">Quick Add</button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .preview-container {
          background: white;
          padding: 24px;
          border-radius: 8px;
          border: 1px solid #000;
        }

        .preview-header {
          margin-bottom: 20px;
        }

        .preview-title {
          font-size: 18px;
          font-weight: 600;
          color: #000;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .card {
          border: 1px solid #000;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s;
          background: white;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .card-image-wrapper {
          width: 100%;
          aspect-ratio: 1;
          overflow: hidden;
          background: #f5f5f5;
        }

        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .card-content {
          padding: 12px;
        }

        .card-title {
          font-size: 13px;
          font-weight: 600;
          color: #000;
          margin: 0 0 8px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .card-price-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;
        }

        .compare-price {
          font-size: 11px;
          color: #999;
          text-decoration: line-through;
        }

        .card-price {
          font-size: 15px;
          font-weight: 700;
          color: #000;
        }

        .card-button {
          width: 100%;
          padding: 8px;
          background: #000;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .card-button:hover {
          background: #333;
        }
      `}</style>
    </div>
  );
}

function FrequentlyBoughtPreview() {
  const cartItem = SAMPLE_PRODUCTS[0]!;
  const upsellItem = SAMPLE_PRODUCTS[1]!;
  const bundlePrice = cartItem.price + upsellItem.price;
  const savings = 15.99;
  const finalPrice = bundlePrice - savings;

  return (
    <div className="preview-container">
      <div className="preview-header">
        <h3 className="preview-title">Frequently bought together</h3>
      </div>

      <div className="bundle-container">
        <div className="bundle-item">
          <div className="bundle-checkbox-wrapper">
            <input type="checkbox" checked disabled className="bundle-checkbox" />
            <span className="bundle-label">This item</span>
          </div>
          <div className="bundle-item-card">
            <div className="bundle-image-wrapper">
              <img src={cartItem.image} alt={cartItem.title} className="bundle-image" />
            </div>
            <div className="bundle-item-info">
              <h4 className="bundle-item-title">{cartItem.title}</h4>
              <span className="bundle-item-price">${cartItem.price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bundle-plus">+</div>

        <div className="bundle-item">
          <div className="bundle-checkbox-wrapper">
            <input type="checkbox" defaultChecked className="bundle-checkbox" />
            <span className="bundle-label">Add this</span>
          </div>
          <div className="bundle-item-card">
            <div className="bundle-image-wrapper">
              <img src={upsellItem.image} alt={upsellItem.title} className="bundle-image" />
            </div>
            <div className="bundle-item-info">
              <h4 className="bundle-item-title">{upsellItem.title}</h4>
              <span className="bundle-item-price">${upsellItem.price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bundle-equals">=</div>

        <div className="bundle-total">
          <div className="bundle-total-label">Bundle Price</div>
          <div className="bundle-total-price">${finalPrice.toFixed(2)}</div>
          <div className="bundle-total-savings">Save ${savings.toFixed(2)}</div>
          <button className="bundle-button">Add Both to Cart</button>
        </div>
      </div>

      <style jsx>{`
        .preview-container {
          background: white;
          padding: 24px;
          border-radius: 8px;
          border: 1px solid #000;
        }

        .preview-header {
          margin-bottom: 20px;
        }

        .preview-title {
          font-size: 18px;
          font-weight: 600;
          color: #000;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .bundle-container {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .bundle-item {
          flex: 1;
        }

        .bundle-checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .bundle-checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid #000;
          border-radius: 3px;
          cursor: pointer;
        }

        .bundle-label {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .bundle-item-card {
          border: 1px solid #000;
          border-radius: 6px;
          padding: 12px;
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .bundle-image-wrapper {
          width: 60px;
          height: 60px;
          border-radius: 4px;
          overflow: hidden;
          flex-shrink: 0;
          background: #f5f5f5;
        }

        .bundle-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .bundle-item-info {
          flex: 1;
        }

        .bundle-item-title {
          font-size: 13px;
          font-weight: 600;
          color: #000;
          margin: 0 0 6px 0;
        }

        .bundle-item-price {
          font-size: 14px;
          font-weight: 700;
          color: #000;
        }

        .bundle-plus,
        .bundle-equals {
          font-size: 24px;
          font-weight: 700;
          color: #000;
          flex-shrink: 0;
        }

        .bundle-total {
          flex: 0 0 160px;
          text-align: center;
          padding: 16px;
          border: 2px solid #000;
          border-radius: 8px;
          background: white;
        }

        .bundle-total-label {
          font-size: 11px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .bundle-total-price {
          font-size: 24px;
          font-weight: 700;
          color: #000;
          margin-bottom: 4px;
        }

        .bundle-total-savings {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .bundle-button {
          width: 100%;
          padding: 10px 16px;
          background: #000;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .bundle-button:hover {
          background: #333;
        }
      `}</style>
    </div>
  );
}
