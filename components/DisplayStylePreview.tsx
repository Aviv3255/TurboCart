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
    <div className="preview-wrapper">
      {getPreviewComponent()}

      <style jsx>{`
        .preview-wrapper {
          width: 100%;
          max-width: 340px;
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

function CarouselPreview() {
  const displayProducts = SAMPLE_PRODUCTS.slice(0, 2);

  return (
    <div className="preview-container">
      <h3 className="title">You might also like</h3>

      <div className="carousel">
        <button className="arrow">←</button>

        <div className="track">
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

        <button className="arrow">→</button>
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
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .arrow {
          width: 24px;
          height: 24px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 50%;
          font-size: 12px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .track {
          display: flex;
          gap: 8px;
          flex: 1;
          overflow: hidden;
        }

        .card {
          flex: 1;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }

        .image {
          width: 100%;
          height: 100px;
          object-fit: cover;
        }

        .info {
          padding: 8px;
        }

        .name {
          font-size: 11px;
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
  const savings = product.compareAtPrice ? product.compareAtPrice - product.price : 10;

  return (
    <div className="preview-container">
      <img src={product.image} alt={product.title} className="image" />
      <div className="content">
        <span className="badge">Limited</span>
        <h3 className="name">{product.title}</h3>
        <div className="price-row">
          {product.compareAtPrice && (
            <span className="old">${product.compareAtPrice.toFixed(2)}</span>
          )}
          <span className="price">${product.price.toFixed(2)}</span>
          <span className="save">Save ${savings.toFixed(2)}</span>
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
  const cartItem = SAMPLE_PRODUCTS[0]!;
  const upsellItem = SAMPLE_PRODUCTS[1]!;
  const bundlePrice = cartItem.price + upsellItem.price;
  const savings = 15.99;
  const finalPrice = bundlePrice - savings;

  return (
    <div className="preview-container">
      <h3 className="title">Frequently bought together</h3>

      <div className="bundle">
        <div className="item">
          <input type="checkbox" checked disabled className="check" />
          <img src={cartItem.image} alt={cartItem.title} className="image" />
          <div className="info">
            <h4 className="name">{cartItem.title}</h4>
            <span className="price">${cartItem.price.toFixed(2)}</span>
          </div>
        </div>

        <div className="plus">+</div>

        <div className="item">
          <input type="checkbox" defaultChecked className="check" />
          <img src={upsellItem.image} alt={upsellItem.title} className="image" />
          <div className="info">
            <h4 className="name">{upsellItem.title}</h4>
            <span className="price">${upsellItem.price.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="footer">
        <div className="total">
          Total: <strong>${finalPrice.toFixed(2)}</strong>
          <span className="save"> (Save ${savings.toFixed(2)})</span>
        </div>
        <button className="btn">Add Both</button>
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

        .bundle {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 10px;
        }

        .item {
          flex: 1;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 6px;
          text-align: center;
        }

        .check {
          width: 14px;
          height: 14px;
          margin-bottom: 4px;
        }

        .image {
          width: 50px;
          height: 50px;
          border-radius: 3px;
          object-fit: cover;
          margin-bottom: 4px;
        }

        .info {
          width: 100%;
        }

        .name {
          font-size: 10px;
          font-weight: 600;
          color: #000;
          margin: 0 0 3px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .price {
          font-size: 11px;
          font-weight: 700;
          color: #000;
        }

        .plus {
          font-size: 16px;
          font-weight: 700;
          color: #000;
          align-self: center;
          margin-top: 14px;
        }

        .footer {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 10px;
          border-top: 1px solid #e0e0e0;
        }

        .total {
          flex: 1;
          font-size: 10px;
          color: #666;
        }

        .total strong {
          font-size: 13px;
          color: #000;
        }

        .save {
          font-size: 10px;
          font-weight: 600;
          color: #10b981;
        }

        .btn {
          padding: 6px 12px;
          background: #000;
          color: white;
          border: none;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
