import { useEffect, useMemo, useState } from 'react';
import { money, supabase } from './lib/supabase';

const nav = ['Home', 'Wedding & Events', 'Smart Gadget Store', 'Bookings', 'Orders', 'Cart', 'Account'];
const categories = ['All', 'Smart Watches', 'Earbuds', 'Handsfree', 'Chargers'];

const demoProducts = [
  { id: 'p1', name: 'Auralite Pro X', category: 'Smart Watches', price: 28999, stock: 12, image: '⌚', description: 'Premium smartwatch with health tracking and long battery life.' },
  { id: 'p2', name: 'EchoBuds Air', category: 'Earbuds', price: 16499, stock: 9, image: '🎧', description: 'Sweat resistant wireless earbuds with deep bass.' },
  { id: 'p3', name: 'MoveMax 5W', category: 'Handsfree', price: 8999, stock: 15, image: '🎧', description: 'Comfortable lightweight handsfree for daily commuting.' },
  { id: 'p4', name: 'VoltDock Mini', category: 'Chargers', price: 5999, stock: 18, image: '🔌', description: 'Compact charger with fast USB-C output.' },
];

const demoPackages = [
  { id: 'pkg1', title: 'Signature Wedding', category: 'Wedding', price: 135000, description: 'Event planning, decor styling, and guest coordination.' },
  { id: 'pkg2', title: 'Luxury Reception', category: 'Reception', price: 245000, description: 'Premium venue styling and coordination package.' },
  { id: 'pkg3', title: 'Premium Mehndi', category: 'Ceremony', price: 60000, description: 'Traditional setup with styling and event coverage.' },
];

const demoHalls = [
  { id: 'hall1', name: 'Pearl Grand Hall', city: 'Lahore', capacity: 700, price_from: 180000 },
  { id: 'hall2', name: 'Rosewood Gardens', city: 'Karachi', capacity: 520, price_from: 160000 },
  { id: 'hall3', name: 'Crescent Ballroom', city: 'Islamabad', capacity: 400, price_from: 120000 },
];

const demoServices = [
  { id: 'svc1', name: 'Catering', price_from: 60000, description: 'Multi-course menus and chef-managed catering.' },
  { id: 'svc2', name: 'Photography', price_from: 75000, description: 'Professional photography and cinematic coverage.' },
  { id: 'svc3', name: 'Makeup & Styling', price_from: 40000, description: 'Beauty and styling team for weddings and events.' },
];

const demoOrders = [
  { id: 'ord1', created_at: '2026-09-10', total: 24999, status: 'Delivered', payment_status: 'Paid', items: 'Auralite Pro X × 1' },
  { id: 'ord2', created_at: '2026-09-15', total: 16499, status: 'In Transit', payment_status: 'Paid', items: 'EchoBuds Air × 1' },
];

const demoBookings = [
  { id: 'bk1', created_at: '2026-09-11', package_title: 'Signature Wedding', hall_name: 'Pearl Grand Hall', status: 'Confirmed', total: 135000 },
  { id: 'bk2', created_at: '2026-09-18', package_title: 'Luxury Reception', hall_name: 'Rosewood Gardens', status: 'Pending', total: 245000 },
];

const demoPayments = [
  { id: 'pay1', method: 'JazzCash', amount: 24999, status: 'Paid' },
  { id: 'pay2', method: 'Card payment', amount: 135000, status: 'Pending' },
];

const demoProfile = { full_name: 'Zeeshan Ali', phone: '+92 300 1234567', email: 'guest@zia.example' };

function getStoredCart() {
  try {
    const raw = localStorage.getItem('zia-cart');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [tab, setTab] = useState('Home');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState(() => getStoredCart());
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(demoProfile);
  const [products, setProducts] = useState(demoProducts);
  const [packages, setPackages] = useState(demoPackages);
  const [halls, setHalls] = useState(demoHalls);
  const [services, setServices] = useState(demoServices);
  const [orders, setOrders] = useState(demoOrders);
  const [bookings, setBookings] = useState(demoBookings);
  const [payments, setPayments] = useState(demoPayments);
  const [authMode, setAuthMode] = useState('login');
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', password: '', address: '' });
  const [notice, setNotice] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('Card payment');

  useEffect(() => {
    localStorage.setItem('zia-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!supabase) return;
    const loadSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (currentSession?.user?.email) {
        setProfile((prev) => ({ ...prev, email: currentSession.user.email }));
      }
    };
    loadSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const loadData = async () => {
      const [{ data: liveProducts }, { data: livePackages }, { data: liveHalls }, { data: liveServices }] = await Promise.all([
        supabase.from('electronics_products').select('*').eq('is_active', true).limit(20),
        supabase.from('wedding_packages').select('*').eq('is_active', true).limit(20),
        supabase.from('wedding_halls').select('*').eq('is_active', true).limit(20),
        supabase.from('event_services').select('*').eq('is_active', true).limit(20),
      ]);
      if (liveProducts) setProducts(liveProducts);
      if (livePackages) setPackages(livePackages);
      if (liveHalls) setHalls(liveHalls);
      if (liveServices) setServices(liveServices);
    };
    loadData().catch(() => {});
  }, []);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'All') return products;
    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory, products]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price) * Number(item.qty || 1), 0),
    [cart]
  );

  const addToCart = (item, quantity = 1) => {
    setCart((current) => {
      const existing = current.find((entry) => entry.id === item.id);
      if (existing) {
        return current.map((entry) =>
          entry.id === item.id ? { ...entry, qty: Number(entry.qty || 1) + quantity } : entry
        );
      }
      return [...current, { ...item, qty: quantity }];
    });
    setTab('Cart');
    setNotice(`${item.name} added to cart.`);
  };

  const updateCartQty = (id, delta) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, qty: Math.max(0, Number(item.qty || 1) + delta) } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const signUpOrIn = async (event) => {
    event.preventDefault();

    if (!supabase) {
      setSession({ user: { email: form.email || 'demo@zia.local' } });
      setProfile({ ...demoProfile, ...{ full_name: form.full_name || demoProfile.full_name, phone: form.phone || demoProfile.phone, email: form.email || demoProfile.email } });
      setNotice(authMode === 'signup' ? 'Demo account created successfully.' : 'Demo login successful.');
      return;
    }

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.full_name, phone: form.phone } },
        });
        if (error) throw error;
        setNotice('Account created. Check your email to finish signup.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        setSession(data.session);
        setNotice('Login successful.');
      }
    } catch (error) {
      setNotice(error.message || 'Authentication failed.');
    }
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setProfile(demoProfile);
    setNotice('Signed out successfully.');
  };

  const checkout = async () => {
    if (!cart.length) {
      setNotice('Your cart is empty. Add something before checking out.');
      return;
    }

    const orderData = {
      id: `ORD-${Date.now()}`,
      created_at: new Date().toISOString().slice(0, 10),
      total: subtotal,
      status: 'Confirmed',
      payment_status: 'Paid',
      items: cart.map((item) => `${item.name} × ${item.qty}`).join(', '),
    };

    if (supabase && session) {
      try {
        const payload = cart.map((item) => ({
          product_id: item.id,
          quantity: item.qty,
          unit_price: Number(item.price || 0),
        }));

        const { data, error } = await supabase.rpc('checkout_cart', {
          p_items: payload,
          p_payment_method_id: null,
          p_delivery_address: form.address || 'Customer address',
        });

        if (error) throw error;
        setNotice(`Order placed successfully. Reference: ${data || orderData.id}`);
      } catch (error) {
        setNotice(error.message || 'Checkout could not be completed.');
      }
    } else {
      setOrders((current) => [orderData, ...current]);
      setPayments((current) => [
        { id: `PAY-${Date.now()}`, method: selectedMethod, amount: subtotal, status: 'Paid' },
        ...current,
      ]);
      setCart([]);
      setNotice('Demo checkout completed successfully.');
    }
  };

  const protectedContent = (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">Z</div>
          <div>
            <p className="eyebrow">Event and Wedding Planner</p>
            <h1>ZIA Customer App</h1>
          </div>
        </div>
        <nav className="nav">
          {nav.map((item) => (
            <button
              key={item}
              className={tab === item ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {tab === 'Home' && (
          <section className="hero panel">
            <div>
              <span className="pill">Smart Gadget Store</span>
              <h2>Celebrate beautifully, shop smarter.</h2>
              <p>
                From wedding planning and premium event packages to everyday tech essentials, ZIA brings together celebration and convenience in one place.
              </p>
              <div className="cta-row">
                <button onClick={() => setTab('Wedding & Events')}>Explore weddings</button>
                <button className="secondary" onClick={() => setTab('Smart Gadget Store')}>Browse gadgets</button>
              </div>
            </div>
            <div className="hero-card">
              <div className="mini-stat">
                <strong>4.9/5</strong>
                <span>Customer satisfaction</span>
              </div>
              <div className="mini-stat">
                <strong>2.4k+</strong>
                <span>Happy events planned</span>
              </div>
            </div>
          </section>
        )}

        {tab === 'Wedding & Events' && (
          <section className="stack">
            <div className="panel">
              <h3>Wedding packages</h3>
              <div className="card-grid">
                {packages.map((item) => (
                  <div key={item.id} className="card">
                    <span className="badge">{item.category}</span>
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                    <div className="card-row">
                      <strong>{money(item.price)}</strong>
                      <button onClick={() => setTab('Bookings')}>Book now</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel">
              <h3>Wedding halls</h3>
              <div className="list-grid">
                {halls.map((hall) => (
                  <div key={hall.id} className="list-item">
                    <div>
                      <h4>{hall.name}</h4>
                      <small>{hall.city}</small>
                    </div>
                    <div>
                      <strong>{hall.capacity} guests</strong>
                      <span>{money(hall.price_from)}+</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel">
              <h3>Event services</h3>
              <div className="list-grid">
                {services.map((service) => (
                  <div key={service.id} className="list-item">
                    <div>
                      <h4>{service.name}</h4>
                      <small>{service.description}</small>
                    </div>
                    <strong>{money(service.price_from)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {tab === 'Smart Gadget Store' && (
          <section className="panel">
            <div className="toolbar">
              <div className="category-pills">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={activeCategory === category ? 'chip active' : 'chip'}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            <div className="card-grid product-grid">
              {filteredProducts.map((product) => (
                <div key={product.id} className="card product-card">
                  <div className="product-icon">{product.image}</div>
                  <span className="badge">{product.category}</span>
                  <h4>{product.name}</h4>
                  <p>{product.description}</p>
                  <div className="card-row">
                    <strong>{money(product.price)}</strong>
                    <button onClick={() => addToCart(product)}>Add to cart</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'Bookings' && (
          <section className="panel">
            <h3>Bookings</h3>
            <div className="list-grid">
              {bookings.map((booking) => (
                <div key={booking.id} className="list-item">
                  <div>
                    <h4>{booking.package_title}</h4>
                    <small>{booking.hall_name}</small>
                  </div>
                  <div>
                    <strong>{booking.status}</strong>
                    <span>{money(booking.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'Orders' && (
          <section className="panel">
            <h3>Orders</h3>
            <div className="list-grid">
              {orders.map((order) => (
                <div key={order.id} className="list-item">
                  <div>
                    <h4>{order.id}</h4>
                    <small>{order.items}</small>
                  </div>
                  <div>
                    <strong>{order.status}</strong>
                    <span>{money(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'Cart' && (
          <section className="panel cart-panel">
            <h3>Shopping Cart</h3>
            {cart.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <>
                <div className="cart-list">
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div>
                        <h4>{item.name}</h4>
                        <small>{money(item.price)} each</small>
                      </div>
                      <div className="qty-controls">
                        <button onClick={() => updateCartQty(item.id, -1)}>-</button>
                        <span>{item.qty}</span>
                        <button onClick={() => updateCartQty(item.id, 1)}>+</button>
                      </div>
                      <strong>{money((Number(item.price) || 0) * Number(item.qty || 1))}</strong>
                    </div>
                  ))}
                </div>
                <div className="checkout-box">
                  <div className="field-group">
                    <label>Delivery address</label>
                    <input
                      value={form.address}
                      onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                      placeholder="Your address"
                    />
                  </div>
                  <div className="field-group">
                    <label>Payment method</label>
                    <select value={selectedMethod} onChange={(event) => setSelectedMethod(event.target.value)}>
                      {['Cash on Delivery', 'Card payment', 'JazzCash'].map((method) => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                  <div className="totals">
                    <span>Subtotal</span>
                    <strong>{money(subtotal)}</strong>
                  </div>
                  <button className="checkout-btn" onClick={checkout}>Complete checkout</button>
                </div>
              </>
            )}
          </section>
        )}

        {tab === 'Account' && (
          <section className="panel account-panel">
            <h3>Account</h3>
            {!session ? (
              <div className="auth-box">
                <div className="tab-toggle">
                  <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Login</button>
                  <button className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>Sign up</button>
                </div>
                <form onSubmit={signUpOrIn} className="auth-form">
                  {authMode === 'signup' && (
                    <div className="field-group">
                      <label>Full name</label>
                      <input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
                    </div>
                  )}
                  <div className="field-group">
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                  </div>
                  {authMode === 'signup' && (
                    <div className="field-group">
                      <label>Phone</label>
                      <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                    </div>
                  )}
                  <div className="field-group">
                    <label>Password</label>
                    <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
                  </div>
                  <button type="submit">{authMode === 'login' ? 'Login' : 'Create account'}</button>
                </form>
              </div>
            ) : (
              <div className="account-details">
                <div className="profile-card">
                  <h4>{profile.full_name}</h4>
                  <p>{profile.email}</p>
                  <p>{profile.phone}</p>
                </div>
                <div className="account-stats">
                  <div>
                    <strong>{orders.length}</strong>
                    <span>Orders</span>
                  </div>
                  <div>
                    <strong>{bookings.length}</strong>
                    <span>Bookings</span>
                  </div>
                  <div>
                    <strong>{payments.length}</strong>
                    <span>Payments</span>
                  </div>
                </div>
                <button className="secondary" onClick={signOut}>Sign out</button>
              </div>
            )}
          </section>
        )}
      </main>

      {notice && <div className="toast">{notice}</div>}
    </div>
  );

  return protectedContent;
}
