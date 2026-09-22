import { useEffect, useMemo, useState } from 'react';
import { money, supabase } from './lib/supabase';

const demoProducts = [
  { id: 'demo-watch', name: 'ZIA Pulse Pro', category: 'Smart Watches', price: 28500, stock_quantity: 54, description: 'AMOLED fitness smartwatch with calling and seven-day battery.' },
  { id: 'demo-buds', name: 'ZIA Nova Buds', category: 'Earbuds', price: 16900, stock_quantity: 128, description: 'Noise-cancelling wireless earbuds with a charging case.' },
  { id: 'demo-handsfree', name: 'ZIA Air Handsfree', category: 'Handsfree', price: 6900, stock_quantity: 87, description: 'Clear-call Bluetooth handsfree for everyday use.' },
  { id: 'demo-charger', name: 'ZIA Charge Dock', category: 'Chargers', price: 4200, stock_quantity: 42, description: 'Fast USB-C charging dock for travel.' }
];
const categories = ['All', 'Smart Watches', 'Earbuds', 'Handsfree', 'Chargers'];
const nav = ['Home', 'Wedding & Events', 'Smart Gadget Store', 'Bookings', 'Orders', 'Cart', 'Account'];

export default function App() {
  const [tab, setTab] = useState('Home');
  const [products, setProducts] = useState(demoProducts);
  const [packages, setPackages] = useState([]);
  const [halls, setHalls] = useState([]);
  const [services, setServices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };
  const refreshHistory = async (currentUser) => {
    if (!supabase || !currentUser) return;
    const [{ data: orderRows }, { data: bookingRows }] = await Promise.all([
      supabase.from('orders').select('*, order_items(*)').eq('customer_id', currentUser.id).order('created_at', { ascending: false }),
      supabase.from('event_bookings').select('*, wedding_packages(title), payment_methods(name)').eq('customer_id', currentUser.id).order('created_at', { ascending: false })
    ]);
    setOrders(orderRows || []); setBookings(bookingRows || []);
  };

  useEffect(() => {
    let channel;
    const load = async () => {
      if (!supabase) { setStatus('ready'); return; }
      const [p, w, h, s, pm, sessionResult] = await Promise.all([
        supabase.from('electronics_products').select('*, electronics_categories(name)').eq('is_active', true),
        supabase.from('wedding_packages').select('*').eq('is_active', true),
        supabase.from('wedding_halls').select('*').eq('is_active', true),
        supabase.from('event_services').select('*').eq('is_active', true),
        supabase.from('payment_methods').select('*').eq('is_enabled', true),
        supabase.auth.getSession()
      ]);
      if (p.error || w.error || h.error || s.error || pm.error) { setError('The latest ZIA data could not be loaded. Please refresh.'); setStatus('error'); return; }
      if (p.data?.length) setProducts(p.data.map(item => ({ ...item, category: item.electronics_categories?.name || 'Smart Gadget Store' })));
      setPackages(w.data || []); setHalls(h.data || []); setServices(s.data || []); setPayments(pm.data || []);
      const currentUser = sessionResult.data.session?.user || null; setUser(currentUser); await refreshHistory(currentUser); setStatus('ready');
    };
    load();
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
      const auth = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user || null); refreshHistory(session?.user); });
      channel = supabase.channel('zia-customer-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'electronics_products' }, load)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wedding_packages' }, load)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wedding_halls' }, load)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_methods' }, load).subscribe();
      return () => { auth.data.subscription.unsubscribe(); supabase.removeChannel(channel); };
    }
  }, []);

  const addToCart = (product) => setCart(current => { const old = current.find(item => item.id === product.id); notify('Added to cart'); return old ? current.map(item => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock_quantity) } : item) : [...current, { ...product, quantity: 1 }]; });
  const filteredProducts = useMemo(() => products.filter(item => `${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase())), [products, query]);
  const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  if (status === 'loading') return <Shell tab={tab} setTab={setTab} cart={cart}><State title="Loading ZIA" text="Fetching the latest products and experiences…" busy /></Shell>;
  if (status === 'error') return <Shell tab={tab} setTab={setTab} cart={cart}><State title="Unable to load" text={error} action={() => window.location.reload()} /></Shell>;
  return <Shell tab={tab} setTab={setTab} cart={cart}><div className="search-bar"><span>⌕</span><input aria-label="Search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search products and events…" /></div>
    {tab === 'Home' && <Home products={products} packages={packages} go={setTab} add={addToCart} />}
    {tab === 'Smart Gadget Store' && <Store products={filteredProducts} add={addToCart} />}
    {tab === 'Wedding & Events' && <Events packages={packages} halls={halls} services={services} user={user} notify={notify} refresh={() => refreshHistory(user)} />}
    {tab === 'Cart' && <Cart cart={cart} setCart={setCart} total={total} user={user} payments={payments} complete={() => { setCart([]); setTab('Orders'); notify('Order placed successfully'); }} />}
    {tab === 'Orders' && <History title="Order history" rows={orders} empty="Your orders will appear here." />}
    {tab === 'Bookings' && <History title="Booking history" rows={bookings} booking empty="Your event bookings will appear here." />}
    {tab === 'Account' && <Account user={user} setUser={setUser} refresh={refreshHistory} notify={notify} />}
    {toast && <div className="toast" role="status">✓ {toast}</div>}
  </Shell>;
}
function Shell({ children, tab, setTab, cart }) { return <div className="app-shell"><header className="topbar"><div className="brand-group"><div className="brand-mark">Z</div><div><p className="eyebrow">Event and Wedding Planner</p><h1>ZIA</h1></div></div><strong className="brand-business">ZIA Event and Wedding Planner</strong></header><nav className="nav-bar" aria-label="Customer navigation">{nav.map(item => <button key={item} className={tab === item ? 'nav-item active' : 'nav-item'} onClick={() => setTab(item)}>{item}{item === 'Cart' && cart.length ? ` (${cart.length})` : ''}</button>)}</nav>{children}<footer className="bottom-actions"><button className="feature-button" onClick={() => alert('ZIA offers are updated weekly')}>Offers</button><button className="feature-button" onClick={() => alert('Support: hello@zia.pk')}>Support</button></footer></div> }
function State({ title, text, action, busy }) { return <div className="state-card"><h2>{title}</h2><p>{text}</p>{busy && <span className="spinner" />}{action && <button className="primary-full" onClick={action}>Try again</button>}</div> }
function Home({ products, packages, go, add }) { return <><section className="hero-card"><p className="eyebrow">ZIA Event and Wedding Planner</p><h2>Celebrate beautifully. Shop smarter.</h2><p>Plan meaningful events and discover technology for everyday life.</p><div className="hero-actions"><button onClick={() => go('Wedding & Events')}>Plan an event</button><button className="secondary" onClick={() => go('Smart Gadget Store')}>Open Smart Gadget Store</button></div></section><div className="mini-grid"><div className="mini-card accent-pink"><span>Weddings</span><strong>Beautifully planned</strong></div><div className="mini-card accent-gold"><span>Smart gadgets</span><strong>Fresh arrivals</strong></div><div className="mini-card accent-blue"><span>Payments</span><strong>PKR made easy</strong></div></div><Section title="Featured packages" action="View all" click={() => go('Wedding & Events')} /><div className="card-grid">{packages.slice(0, 3).map(item => <Card item={item} key={item.id} action="View" click={() => go('Wedding & Events')} />)}</div><Section title="Smart Gadget Store" action="Shop all" click={() => go('Smart Gadget Store')} /><div className="card-grid">{products.slice(0, 4).map(item => <Card item={item} key={item.id} action="Add" click={() => add(item)} />)}</div></> }
function Section({ title, action, click }) { return <div className="section-header"><h3>{title}</h3>{action && <button onClick={click}>{action}</button>}</div> }
function Card({ item, action, click }) { return <article className="listing-card"><div className="card-image image-tech pink" /><div className="card-body"><span className="tag">{item.category}</span><h4>{item.title || item.name}</h4><p className="description">{item.description}</p><div className="row-between"><strong>{money(item.price)}</strong><button onClick={click}>{action}</button></div></div></article> }
function Store({ products, add }) { const [category, setCategory] = useState('All'); const list = category === 'All' ? products : products.filter(item => item.category === category); return <><Section title="Smart Gadget Store" /><div className="chips-row">{categories.map(item => <button className={category === item ? 'chip selected' : 'chip'} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="card-grid">{list.map(item => <Card item={item} key={item.id} action={item.stock_quantity ? 'Add to cart' : 'Sold out'} click={() => item.stock_quantity && add(item)} />)}</div>{!list.length && <State title="No products found" text="Try another search or category." />}</> }
function Events({ packages, halls, services, user, notify, refresh }) { const [selected, setSelected] = useState(null); return <><section className="hero-card"><p className="eyebrow">ZIA Event and Wedding Planner</p><h2>Beautiful venues. Thoughtful details.</h2><p>Choose a package, hall and services, then reserve with a 20% advance.</p></section><Section title="Wedding and event packages" /><div className="card-grid">{packages.map(item => <Card item={item} key={item.id} action="Book" click={() => setSelected(item)} />)}</div><section className="panel-block"><h3>Event services</h3><p>{services.length ? services.map(item => item.name).join(' · ') : 'Services will appear here when published.'}</p></section>{selected && <Booking item={selected} halls={halls} user={user} close={() => setSelected(null)} notify={notify} refresh={refresh} />}</> }
function Booking({ item, halls, user, close, notify, refresh }) { const [busy, setBusy] = useState(false); const submit = async event => { event.preventDefault(); if (!user) { notify('Sign in from Account before booking'); return; } setBusy(true); const form = new FormData(event.currentTarget); const { error } = await supabase.from('event_bookings').insert({ customer_id: user.id, package_id: item.id, hall_id: form.get('hall_id') || null, event_date: form.get('event_date'), venue: form.get('venue'), guest_count: Number(form.get('guest_count')), total_amount: Number(item.price), advance_amount: Number(item.price) * .2, payment_status: 'unpaid', status: 'pending' }); setBusy(false); if (error) notify(error.message); else { notify('Booking request submitted'); await refresh(); close(); } }; return <div className="modal-backdrop"><form className="modal form-grid" onSubmit={submit}><div className="section-header"><h3>Book {item.title}</h3><button type="button" onClick={close}>×</button></div><select name="hall_id"><option value="">Choose a hall</option>{halls.map(hall => <option key={hall.id} value={hall.id}>{hall.name} · {hall.city} · {hall.capacity} guests</option>)}</select><input name="event_date" type="date" required min={new Date().toISOString().slice(0, 10)} /><input name="venue" required minLength="3" placeholder="Venue or hall name" /><input name="guest_count" required min="1" type="number" placeholder="Expected guests" /><p className="checkout-total">Advance: <b>{money(item.price * .2)}</b> · Remaining: <b>{money(item.price * .8)}</b></p><button className="primary-full" disabled={busy}>{busy ? 'Submitting…' : 'Submit booking request'}</button></form></div> }
function Cart({ cart, setCart, total, user, payments, complete }) { const [open, setOpen] = useState(false); return <section className="panel-block"><Section title={`Cart (${cart.length})`} />{cart.map(item => <div className="detail-row" key={item.id}><div><b>{item.name}</b><p>{money(item.price)} × {item.quantity}</p></div><button onClick={() => setCart(current => current.filter(row => row.id !== item.id))}>Remove</button></div>)}{cart.length ? <><div className="cart-total"><span>Total</span><b>{money(total)}</b></div><button className="primary-full" onClick={() => setOpen(true)}>Checkout</button></> : <State title="Your cart is empty" text="Add something special from the Smart Gadget Store." />}{open && <Checkout cart={cart} total={total} user={user} payments={payments} close={() => setOpen(false)} complete={complete} />}</section> }
function Checkout({ cart, total, user, payments, close, complete }) { const [busy, setBusy] = useState(false); const submit = async event => { event.preventDefault(); if (!user) { alert('Sign in from Account before checkout'); return; } setBusy(true); const form = new FormData(event.currentTarget); const { data: order, error } = await supabase.from('orders').insert({ customer_id: user.id, payment_method_id: form.get('payment_method_id'), status: 'pending', payment_status: 'unpaid', subtotal: total, total, delivery_address: form.get('address') }).select().single(); if (!error) { const { error: itemError } = await supabase.from('order_items').insert(cart.map(item => ({ order_id: order.id, product_id: item.id, item_name: item.name, quantity: item.quantity, price: item.price }))); if (itemError) alert(itemError.message); } setBusy(false); if (error) alert(error.message); else { complete(); close(); } }; return <div className="modal-backdrop"><form className="modal form-grid" onSubmit={submit}><div className="section-header"><h3>Secure checkout</h3><button type="button" onClick={close}>×</button></div><input name="full_name" required minLength="2" placeholder="Full name" /><input name="phone" required pattern="03[0-9]{9}" placeholder="03XXXXXXXXX" title="Enter a Pakistani mobile number" /><textarea name="address" required minLength="8" placeholder="Delivery address" /><select name="payment_method_id" required><option value="">Choose payment method</option>{payments.map(method => <option key={method.id} value={method.id}>{method.name}</option>)}</select><p className="checkout-total">Payable: <b>{money(total)}</b></p><button className="primary-full" disabled={busy}>{busy ? 'Placing…' : 'Place order'}</button></form></div> }
function History({ title, rows, booking, empty }) { return <section className="panel-block"><h3>{title}</h3>{rows.length ? rows.map(row => <div className="detail-row" key={row.id}><div><b>{booking ? row.wedding_packages?.title || 'Event booking' : row.id}</b><p>{booking ? `${row.event_date} · ${row.venue} · ${row.status}` : `${row.status} · ${row.payment_status}`}</p></div><span>{money(booking ? row.advance_amount : row.total)}<small>{booking ? ' advance' : ''}</small></span></div>) : <State title="Nothing here yet" text={empty} />}</section> }
function Account({ user, setUser, refresh, notify }) { const [busy, setBusy] = useState(false); const submit = async event => { event.preventDefault(); setBusy(true); const form = new FormData(event.currentTarget); const { data, error } = await supabase.auth.signInWithPassword({ email: form.get('email'), password: form.get('password') }); setBusy(false); if (error) notify(error.message); else { setUser(data.user); await refresh(data.user); notify('Welcome back to ZIA'); } }; return <section className="panel-block account-page">{user ? <><div className="avatar">Z</div><h2>My ZIA account</h2><p>{user.email}</p><button className="primary-full" onClick={() => supabase.auth.signOut().then(() => setUser(null))}>Sign out</button></> : <><h2>Sign in securely</h2><p>Sign in to save orders and bookings across devices.</p><form className="form-grid" onSubmit={submit}><input name="email" required type="email" placeholder="Email address" /><input name="password" required minLength="8" type="password" placeholder="Password" /><button className="primary-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form></>}</section> }
