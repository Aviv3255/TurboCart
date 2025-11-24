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

type DisplayStyle = 'minimal-strip' | 'list' | 'banner' | 'cards' | 'frequently-bought' | 'masonry-grid' | 'carousel-arrows' | 'vertical-scroll' | 'spotlight' | 'sticky-tabs';

interface DisplayStylePreviewProps {
  style: DisplayStyle;
}

export default function DisplayStylePreview({ style }: DisplayStylePreviewProps) {
  const getPreviewComponent = () => {
    switch (style) {
      case 'minimal-strip':
        return <MinimalStripPreview />;
      case 'list':
        return <ListPreview />;
      case 'banner':
        return <BannerPreview />;
      case 'cards':
        return <CardsPreview />;
      case 'frequently-bought':
        return <FrequentlyBoughtPreview />;
      case 'masonry-grid':
        return <MasonryGridPreview />;
      case 'carousel-arrows':
        return <CarouselArrowsPreview />;
      case 'vertical-scroll':
        return <VerticalScrollPreview />;
      case 'spotlight':
        return <SpotlightPreview />;
      case 'sticky-tabs':
        return <StickyTabsPreview />;
      default:
        return null;
    }
  };

  return (
    <div className="preview-wrapper">
      {getPreviewComponent()}

      <style jsx>{`
        .preview-wrapper {
          width: 100%;
          max-width: 380px;
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

function MinimalStripPreview() {
  const displayProducts = SAMPLE_PRODUCTS.slice(0, 3);

  return (
    <div className="preview-container">
      <h3 className="title">You might also like</h3>

      <div className="strip">
        {displayProducts.map((product) => (
          <div key={product.id} className="card">
            <img src={product.image} alt={product.title} className="image" />
            <div className="info">
              <h4 className="name">{product.title}</h4>
              <div className="price-row">
                {product.compareAtPrice && (
                  <span className="old">${product.compareAtPrice.toFixed(2)}</span>
                )}
                <span className="price">${product.price.toFixed(2)}</span>
              </div>
              <button className="btn">Add</button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .preview-container {
          background: white;
          padding: 14px;
        }

        .title {
          font-size: 13px;
          font-weight: 600;
          color: #000;
          margin: 0 0 12px 0;
        }

        .strip {
          display: flex;
          gap: 8px;
          overflow-x: auto;
        }

        .card {
          flex: 0 0 105px;
          border-radius: 6px;
          overflow: hidden;
          background: #fafafa;
        }

        .image {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
        }

        .info {
          padding: 8px;
        }

        .name {
          font-size: 10px;
          font-weight: 600;
          color: #000;
          margin: 0 0 6px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .price-row {
          display: flex;
          gap: 4px;
          margin-bottom: 8px;
          align-items: center;
        }

        .old {
          font-size: 9px;
          color: #999;
          text-decoration: line-through;
        }

        .price {
          font-size: 11px;
          font-weight: 700;
          color: #000;
        }

        .btn {
          width: 100%;
          padding: 5px;
          background: #000;
          color: white;
          border: none;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function ListPreview() {
  return (
    <div className="preview-container">
      <h3 className="title">Complete your order</h3>

      <div className="list">
        {SAMPLE_PRODUCTS.slice(0, 3).map((product) => (
          <div key={product.id} className="item">
            <img src={product.image} alt={product.title} className="image" />
            <div className="info">
              <h4 className="name">{product.title}</h4>
              <div className="price-row">
                {product.compareAtPrice && (
                  <span className="old">${product.compareAtPrice.toFixed(2)}</span>
                )}
                <span className="price">${product.price.toFixed(2)}</span>
              </div>
            </div>
            <button className="btn">Add</button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .preview-container {
          background: white;
          padding: 12px;
        }

        .title {
          font-size: 13px;
          font-weight: 600;
          color: #000;
          margin: 0 0 10px 0;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
        }

        .image {
          width: 40px;
          height: 40px;
          border-radius: 3px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .info {
          flex: 1;
          min-width: 0;
        }

        .name {
          font-size: 11px;
          font-weight: 600;
          color: #000;
          margin: 0 0 3px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .price-row {
          display: flex;
          gap: 4px;
        }

        .old {
          font-size: 10px;
          color: #999;
          text-decoration: line-through;
        }

        .price {
          font-size: 12px;
          font-weight: 700;
          color: #000;
        }

        .btn {
          padding: 5px 12px;
          background: #000;
          color: white;
          border: none;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}

function BannerPreview() {
  const product = SAMPLE_PRODUCTS[0]!;

  return (
    <div className="preview-container">
      <img src={product.image} alt={product.title} className="image" />
      <div className="content">
        <span className="badge">SELLING FAST</span>
        <h3 className="name">{product.title}</h3>
        <div className="price-row">
          {product.compareAtPrice && (
            <span className="old">${product.compareAtPrice.toFixed(2)}</span>
          )}
          <span className="price">${product.price.toFixed(2)}</span>
        </div>
      </div>
      <button className="btn">Add</button>

      <style jsx>{`
        .preview-container {
          background: white;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .image {
          width: 70px;
          height: 70px;
          border-radius: 4px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .content {
          flex: 1;
          min-width: 0;
        }

        .badge {
          display: inline-block;
          padding: 2px 6px;
          background: #000;
          color: white;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          border-radius: 8px;
          margin-bottom: 4px;
        }

        .name {
          font-size: 12px;
          font-weight: 700;
          color: #000;
          margin: 0 0 4px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .price-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .old {
          font-size: 10px;
          color: #999;
          text-decoration: line-through;
        }

        .price {
          font-size: 14px;
          font-weight: 700;
          color: #000;
        }

        .save {
          font-size: 10px;
          font-weight: 600;
          color: #10b981;
        }

        .btn {
          padding: 8px 14px;
          background: #000;
          color: white;
          border: none;
          border-radius: 3px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}

function CardsPreview() {
  return (
    <div className="preview-container">
      <h3 className="title">Recommended for you</h3>

      <div className="grid">
        {SAMPLE_PRODUCTS.slice(0, 2).map((product) => (
          <div key={product.id} className="card">
            <img src={product.image} alt={product.title} className="image" />
            <div className="content">
              <h4 className="name">{product.title}</h4>
              <div className="price-row">
                {product.compareAtPrice && (
                  <span className="old">${product.compareAtPrice.toFixed(2)}</span>
                )}
                <span className="price">${product.price.toFixed(2)}</span>
              </div>
              <button className="btn">Add</button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .preview-container {
          background: white;
          padding: 12px;
        }

        .title {
          font-size: 13px;
          font-weight: 600;
          color: #000;
          margin: 0 0 10px 0;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .card {
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }

        .image {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
        }

        .content {
          padding: 8px;
        }

        .name {
          font-size: 10px;
          font-weight: 600;
          color: #000;
          margin: 0 0 4px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .price-row {
          display: flex;
          gap: 4px;
          margin-bottom: 6px;
        }

        .old {
          font-size: 9px;
          color: #999;
          text-decoration: line-through;
        }

        .price {
          font-size: 11px;
          font-weight: 700;
          color: #000;
        }

        .btn {
          width: 100%;
          padding: 4px;
          background: #000;
          color: white;
          border: none;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function FrequentlyBoughtPreview() {
  const product1 = SAMPLE_PRODUCTS[1]!;
  const product2 = SAMPLE_PRODUCTS[2]!;

  return (
    <div className="preview-container">
      <div className="addon-item">
        <img src={product1.image} alt={product1.title} className="image" />
        <div className="info">
          <span className="badge">57% ADDED THIS</span>
          <h4 className="name">{product1.title}</h4>
          <div className="price-row">
            {product1.compareAtPrice && (
              <span className="old">${product1.compareAtPrice.toFixed(2)}</span>
            )}
            <span className="price">${product1.price.toFixed(2)}</span>
          </div>
        </div>
        <button className="btn">Add</button>
      </div>

      <div className="addon-item">
        <img src={product2.image} alt={product2.title} className="image" />
        <div className="info">
          <span className="badge">49% ADDED THIS</span>
          <h4 className="name">{product2.title}</h4>
          <div className="price-row">
            {product2.compareAtPrice && (
              <span className="old">${product2.compareAtPrice.toFixed(2)}</span>
            )}
            <span className="price">${product2.price.toFixed(2)}</span>
          </div>
        </div>
        <button className="btn">Add</button>
      </div>

      <style jsx>{`
        .preview-container {
          background: white;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 7.5px;
        }

        .addon-item {
          display: flex;
          align-items: center;
          gap: 9.3px;
          padding: 9.3px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          background: white;
        }

        .image {
          width: 68px;
          height: 68px;
          border-radius: 4px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .info {
          flex: 1;
          min-width: 0;
        }

        .badge {
          display: inline-block;
          padding: 1.86px 5.58px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15));
          color: #8b5cf6;
          font-size: 7.44px;
          font-weight: 700;
          border-radius: 3px;
          margin-bottom: 3.72px;
          letter-spacing: 0.3px;
        }

        .name {
          font-size: 10.23px;
          font-weight: 600;
          color: #000;
          margin: 0 0 3.72px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .price-row {
          display: flex;
          align-items: center;
          gap: 3.72px;
        }

        .old {
          font-size: 9.3px;
          color: #999;
          text-decoration: line-through;
        }

        .price {
          font-size: 11.16px;
          font-weight: 700;
          color: #000;
        }

        .btn {
          padding: 5.58px 13.02px;
          background: #000;
          color: white;
          border: none;
          border-radius: 3px;
          font-size: 9.3px;
          font-weight: 600;
          cursor: pointer;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}

function MasonryGridPreview() {
  return (
    <div className="preview-container">
      <h3 className="title">You might also like</h3>

      <div className="masonry">
        {SAMPLE_PRODUCTS.map((product, idx) => (
          <div key={product.id} className={`card ${idx === 0 ? 'tall' : ''}`}>
            <img src={product.image} alt={product.title} className="image" />
            <div className="content">
              <h4 className="name">{product.title}</h4>
              <div className="price-row">
                {product.compareAtPrice && (
                  <span className="old">${product.compareAtPrice.toFixed(2)}</span>
                )}
                <span className="price">${product.price.toFixed(2)}</span>
              </div>
              <button className="btn">Add</button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .preview-container {
          background: white;
          padding: 12px;
        }

        .title {
          font-size: 13px;
          font-weight: 600;
          color: #000;
          margin: 0 0 10px 0;
        }

        .masonry {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-auto-rows: 80px;
          gap: 8px;
        }

        .card {
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .card.tall {
          grid-row: span 2;
        }

        .image {
          width: 100%;
          height: 60px;
          object-fit: cover;
        }

        .card.tall .image {
          height: 100px;
        }

        .content {
          padding: 6px;
          flex: 1;
        }

        .name {
          font-size: 9px;
          font-weight: 600;
          color: #000;
          margin: 0 0 4px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .price-row {
          display: flex;
          gap: 4px;
          margin-bottom: 4px;
        }

        .old {
          font-size: 8px;
          color: #999;
          text-decoration: line-through;
        }

        .price {
          font-size: 10px;
          font-weight: 700;
          color: #000;
        }

        .btn {
          width: 100%;
          padding: 3px;
          background: #000;
          color: white;
          border: none;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function CarouselArrowsPreview() {
  return (
    <div className="preview-container">
      <h3 className="title">Recommended products</h3>

      <div className="carousel">
        <button className="arrow left">‹</button>
        <div className="cards">
          {SAMPLE_PRODUCTS.map((product) => (
            <div key={product.id} className="card">
              <img src={product.image} alt={product.title} className="image" />
              <div className="info">
                <h4 className="name">{product.title}</h4>
                <div className="price-row">
                  {product.compareAtPrice && (
                    <span className="old">${product.compareAtPrice.toFixed(2)}</span>
                  )}
                  <span className="price">${product.price.toFixed(2)}</span>
                </div>
                <button className="btn">Add</button>
              </div>
            </div>
          ))}
        </div>
        <button className="arrow right">›</button>
      </div>

      <div className="dots">
        <span className="dot active"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>

      <style jsx>{`
        .preview-container {
          background: white;
          padding: 12px;
        }

        .title {
          font-size: 13px;
          font-weight: 600;
          color: #000;
          margin: 0 0 10px 0;
        }

        .carousel {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .arrow {
          width: 24px;
          height: 24px;
          background: #000;
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 18px;
          cursor: pointer;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .cards {
          display: flex;
          gap: 8px;
          overflow: hidden;
          flex: 1;
        }

        .card {
          flex: 0 0 90px;
          background: #fafafa;
          border-radius: 6px;
          overflow: hidden;
        }

        .image {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
        }

        .info {
          padding: 6px;
        }

        .name {
          font-size: 9px;
          font-weight: 600;
          color: #000;
          margin: 0 0 4px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .price-row {
          display: flex;
          gap: 4px;
          margin-bottom: 6px;
        }

        .old {
          font-size: 8px;
          color: #999;
          text-decoration: line-through;
        }

        .price {
          font-size: 10px;
          font-weight: 700;
          color: #000;
        }

        .btn {
          width: 100%;
          padding: 4px;
          background: #000;
          color: white;
          border: none;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 600;
          cursor: pointer;
        }

        .dots {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-top: 8px;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ddd;
        }

        .dot.active {
          background: #000;
        }
      `}</style>
    </div>
  );
}

function VerticalScrollPreview() {
  return (
    <div className="preview-container">
      <h3 className="title">Scroll to explore</h3>

      <div className="scroll-container">
        {SAMPLE_PRODUCTS.map((product) => (
          <div key={product.id} className="item">
            <img src={product.image} alt={product.title} className="image" />
            <div className="overlay">
              <h4 className="name">{product.title}</h4>
              <div className="price-row">
                {product.compareAtPrice && (
                  <span className="old">${product.compareAtPrice.toFixed(2)}</span>
                )}
                <span className="price">${product.price.toFixed(2)}</span>
              </div>
              <button className="btn">Add to Cart</button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .preview-container {
          background: white;
          padding: 12px;
        }

        .title {
          font-size: 13px;
          font-weight: 600;
          color: #000;
          margin: 0 0 10px 0;
        }

        .scroll-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 200px;
          overflow-y: auto;
        }

        .item {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          min-height: 120px;
        }

        .image {
          width: 100%;
          height: 120px;
          object-fit: cover;
        }

        .overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
          padding: 12px;
          color: white;
        }

        .name {
          font-size: 11px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .price-row {
          display: flex;
          gap: 6px;
          margin-bottom: 6px;
        }

        .old {
          font-size: 9px;
          color: #ccc;
          text-decoration: line-through;
        }

        .price {
          font-size: 12px;
          font-weight: 700;
          color: white;
        }

        .btn {
          padding: 5px 10px;
          background: white;
          color: #000;
          border: none;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function SpotlightPreview() {
  const product = SAMPLE_PRODUCTS[0]!;

  return (
    <div className="preview-container">
      <div className="spotlight">
        <div className="badge-container">
          <span className="badge">★ FEATURED</span>
          <span className="auto-rotate">Auto-rotating</span>
        </div>

        <img src={product.image} alt={product.title} className="image" />

        <div className="content">
          <h3 className="name">{product.title}</h3>
          <div className="price-row">
            {product.compareAtPrice && (
              <span className="old">${product.compareAtPrice.toFixed(2)}</span>
            )}
            <span className="price">${product.price.toFixed(2)}</span>
          </div>
          <button className="btn">Add to Cart</button>
        </div>
      </div>

      <style jsx>{`
        .preview-container {
          background: white;
          padding: 16px;
        }

        .spotlight {
          border: 2px solid #000;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          background: linear-gradient(135deg, #fafafa 0%, #fff 100%);
        }

        .badge-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .badge {
          display: inline-block;
          padding: 4px 10px;
          background: #000;
          color: #ffd700;
          font-size: 10px;
          font-weight: 700;
          border-radius: 4px;
        }

        .auto-rotate {
          font-size: 8px;
          color: #666;
          font-style: italic;
        }

        .image {
          width: 100%;
          max-width: 150px;
          aspect-ratio: 1;
          object-fit: cover;
          border-radius: 8px;
          margin: 0 auto 10px;
        }

        .content {
          padding: 8px;
        }

        .name {
          font-size: 13px;
          font-weight: 700;
          color: #000;
          margin: 0 0 6px 0;
        }

        .price-row {
          display: flex;
          gap: 6px;
          justify-content: center;
          margin-bottom: 10px;
        }

        .old {
          font-size: 11px;
          color: #999;
          text-decoration: line-through;
        }

        .price {
          font-size: 16px;
          font-weight: 700;
          color: #000;
        }

        .btn {
          width: 100%;
          max-width: 150px;
          padding: 8px 16px;
          background: #000;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function StickyTabsPreview() {
  return (
    <div className="preview-container">
      <div className="tabs">
        <button className="tab active">Best Sellers</button>
        <button className="tab">New</button>
        <button className="tab">Sale</button>
      </div>

      <div className="products">
        {SAMPLE_PRODUCTS.map((product) => (
          <div key={product.id} className="card">
            <img src={product.image} alt={product.title} className="image" />
            <div className="info">
              <h4 className="name">{product.title}</h4>
              <div className="price-row">
                {product.compareAtPrice && (
                  <span className="old">${product.compareAtPrice.toFixed(2)}</span>
                )}
                <span className="price">${product.price.toFixed(2)}</span>
              </div>
              <button className="btn">Add</button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .preview-container {
          background: white;
          padding: 12px;
        }

        .tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 12px;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 4px;
        }

        .tab {
          padding: 4px 10px;
          background: transparent;
          color: #666;
          border: none;
          border-radius: 4px 4px 0 0;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab.active {
          background: #000;
          color: white;
        }

        .products {
          display: flex;
          gap: 8px;
          overflow-x: auto;
        }

        .card {
          flex: 0 0 90px;
          background: #fafafa;
          border-radius: 6px;
          overflow: hidden;
        }

        .image {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
        }

        .info {
          padding: 6px;
        }

        .name {
          font-size: 9px;
          font-weight: 600;
          color: #000;
          margin: 0 0 4px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .price-row {
          display: flex;
          gap: 4px;
          margin-bottom: 6px;
        }

        .old {
          font-size: 8px;
          color: #999;
          text-decoration: line-through;
        }

        .price {
          font-size: 10px;
          font-weight: 700;
          color: #000;
        }

        .btn {
          width: 100%;
          padding: 4px;
          background: #000;
          color: white;
          border: none;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
