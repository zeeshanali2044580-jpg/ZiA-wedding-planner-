import { useMemo, useState } from 'react';

const navItems = ['Home', 'Wedding & Events', 'ZIA Electronics', 'Bookings', 'Orders', 'Cart', 'Account'];
const featureActions = ['Search', 'Notifications', 'Offers', 'Support'];

const weddingPackages = [
  { title: 'Royal Garden Wedding', price: '₨ 245,000', tag: 'Signature' },
  { title: 'Modern Luxury Event', price: '₨ 180,000', tag: 'Popular' },
  { title: 'Destination Celebration', price: '₨ 320,000', tag: 'Elite' },
  { title: 'Intimate Family Event', price: '₨ 120,000', tag: 'New' }
];

const electronicsCategories = [
  'Smart Watches',
  'Earbuds',
  'Accessories',
  'Future Products'
];

const electronicsProducts = [
  { name: 'ZIA Pulse Pro', category: 'Smart Watches', price: '₨ 28,500', accent: 'gold' },
  { name: 'ZIA Nova Buds', category: 'Earbuds', price: '₨ 16,900', accent: 'purple' },
  { name: 'ZIA Charge Dock', category: 'Accessories', price: '₨ 4,200', accent: 'blue' },
  { name: 'ZIA Vision Lens', category: 'Future Products', price: '₨ 42,000', accent: 'pink' }
];

const bookingStatus = [
  { label: 'Confirmed', value: '04' },
  { label: 'Pending', value: '02' },
  { label: 'Completed', value: '12' }
];

const recentOrders = [
  { item: 'ZIA Pulse Pro', status: 'Out for delivery', amount: '₨ 28,500' },
  { item: 'Wedding package', status: 'Confirmed', amount: '₨ 245,000' },
  { item: 'Travel accessories', status: 'Packed', amount: '₨ 9,400' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [cartCount, setCartCount] = useState(2);

  const activePanel = useMemo(() => {
    switch (activeTab) {
      case 'Wedding & Events':
        return <WeddingEventsPanel />;
      case 'ZIA Electronics':
        return <ElectronicsPanel />;
      case 'Bookings':
        return <BookingsPanel />;
      case 'Orders':
        return <OrdersPanel />;
      case 'Cart':
        return <CartPanel cartCount={cartCount} setCartCount={setCartCount} />;
      case 'Account':
        return <AccountPanel />;
      default:
        return <HomePanel setActiveTab={setActiveTab} setCartCount={setCartCount} />;
    }
  }, [activeTab, cartCount]);

  return (
    <div className="app-shell customer-shell">
      <header className="topbar">
        <div className="brand-group">
          <div className="brand-mark">Z</div>
          <div>
            <p className="eyebrow">Wedding & Event Planner</p>
            <h1>ZIA</h1>
          </div>
        </div>

        <div className="action-row">
          <button className="pill-button">Search</button>
          <button className="icon-button">🔔</button>
          <button className="icon-button">🎁</button>
          <button className="icon-button">💬</button>
        </div>
      </header>

      <div className="search-bar-wrap">
        <div className="search-bar">
          <span>⌕</span>
          <input type="text" placeholder="Search weddings, tech, offers..." />
        </div>
      </div>

      <nav className="nav-bar">
        {navItems.map((item) => (
          <button
            key={item}
            className={activeTab === item ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      <main className="content-area">{activePanel}</main>

      <footer className="bottom-actions">
        {featureActions.map((action) => (
          <button key={action} className="feature-button">
            {action}
          </button>
        ))}
      </footer>
    </div>
  );
}

function HomePanel({ setActiveTab, setCartCount }) {
  return (
    <>
      <section className="hero-card">
        <div>
          <p className="eyebrow hero-eyebrow">Premium experiences</p>
          <h2>Celebrate beautifully. Shop smarter.</h2>
          <p>From grand wedding storytelling to smart tech upgrades, ZIA brings together luxury, convenience, and effortless planning.</p>
          <div className="hero-actions">
            <button onClick={() => setActiveTab('Wedding & Events')}>Plan an Event</button>
            <button className="secondary" onClick={() => setActiveTab('ZIA Electronics')}>Explore Tech</button>
          </div>
        </div>
      </section>

      <section className="mini-grid">
        <div className="mini-card accent-pink">
          <span>Wedding packages</span>
          <strong>12 curated themes</strong>
        </div>
        <div className="mini-card accent-gold">
          <span>Electronics</span>
          <strong>Fresh arrivals</strong>
        </div>
        <div className="mini-card accent-blue">
          <span>Events</span>
          <strong>Book fast</strong>
        </div>
      </section>

      <section className="section-header">
        <h3>Featured experiences</h3>
        <button onClick={() => setActiveTab('Wedding & Events')}>View all</button>
      </section>

      <div className="card-grid">
        {weddingPackages.map((pkg) => (
          <div key={pkg.title} className="listing-card">
            <div className="card-image image-wedding" />
            <div className="card-body">
              <span className="tag">{pkg.tag}</span>
              <h4>{pkg.title}</h4>
              <div className="row-between">
                <strong>{pkg.price}</strong>
                <button onClick={() => setCartCount((v) => v + 1)}>Book</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="section-header">
        <h3>ZIA Electronics picks</h3>
        <button onClick={() => setActiveTab('ZIA Electronics')}>Shop now</button>
      </section>

      <div className="card-grid">
        {electronicsProducts.map((item) => (
          <div key={item.name} className="listing-card tech-card">
            <div className={`card-image image-tech ${item.accent}`} />
            <div className="card-body">
              <span className="tag muted">{item.category}</span>
              <h4>{item.name}</h4>
              <div className="row-between">
                <strong>{item.price}</strong>
                <button onClick={() => setCartCount((v) => v + 1)}>Add</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function WeddingEventsPanel() {
  return (
    <div className="stacked-panel">
      <section className="panel-block">
        <div className="section-header compact">
          <h3>Wedding & Events</h3>
          <button>Custom quote</button>
        </div>
        <div className="list-tiles">
          {['Bridal Styling', 'Venue Design', 'Photography', 'Luxury Decor', 'Catering', 'Entertainment'].map((service) => (
            <div key={service} className="tile-card">
              <span>{service}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-block">
        <h3>Popular packages</h3>
        {weddingPackages.map((pkg) => (
          <div key={pkg.title} className="detail-row">
            <div>
              <strong>{pkg.title}</strong>
              <p>{pkg.tag}</p>
            </div>
            <span>{pkg.price}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

function ElectronicsPanel() {
  return (
    <div className="stacked-panel">
      <section className="panel-block">
        <div className="section-header compact">
          <h3>ZIA Electronics</h3>
          <button>Filters</button>
        </div>
        <div className="chips-row">
          {electronicsCategories.map((cat) => (
            <span key={cat} className="chip">{cat}</span>
          ))}
        </div>
      </section>

      <section className="product-list">
        {electronicsProducts.map((item) => (
          <div key={item.name} className="product-row">
            <div className={`product-thumb ${item.accent}`} />
            <div className="product-info">
              <strong>{item.name}</strong>
              <span>{item.category}</span>
            </div>
            <div className="product-meta">
              <strong>{item.price}</strong>
              <button>Add</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function BookingsPanel() {
  return (
    <div className="stacked-panel">
      <section className="panel-block">
        <h3>Bookings</h3>
        <div className="status-grid">
          {bookingStatus.map((item) => (
            <div key={item.label} className="status-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-block">
        <h3>Upcoming schedule</h3>
        <div className="calendar-card">
          <div className="mini-date">
            <span>12</span>
            <small>SEP</small>
          </div>
          <div>
            <strong>Luxury Garden Wedding</strong>
            <p>Venue: Lahore • 2:00 PM</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function OrdersPanel() {
  return (
    <div className="stacked-panel">
      <section className="panel-block">
        <h3>Orders</h3>
        {recentOrders.map((order) => (
          <div key={order.item} className="detail-row">
            <div>
              <strong>{order.item}</strong>
              <p>{order.status}</p>
            </div>
            <span>{order.amount}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

function CartPanel({ cartCount, setCartCount }) {
  return (
    <div className="stacked-panel">
      <section className="panel-block">
        <h3>Cart</h3>
        <div className="cart-summary">
          <div>
            <span>Items</span>
            <strong>{cartCount}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>₨ 64,900</strong>
          </div>
        </div>
        <button className="primary-full" onClick={() => setCartCount(0)}>Checkout</button>
      </section>
    </div>
  );
}

function AccountPanel() {
  return (
    <div className="stacked-panel">
      <section className="panel-block profile-box">
        <div className="avatar">A</div>
        <div>
          <h3>Ayesha Khan</h3>
          <p>Premium member</p>
        </div>
      </section>

      <section className="panel-block">
        <div className="detail-row">
          <div>
            <strong>Saved addresses</strong>
            <p>3 locations</p>
          </div>
          <span>Manage</span>
        </div>
        <div className="detail-row">
          <div>
            <strong>Payment methods</strong>
            <p>Visa • Mastercard</p>
          </div>
          <span>Update</span>
        </div>
      </section>
    </div>
  );
}
