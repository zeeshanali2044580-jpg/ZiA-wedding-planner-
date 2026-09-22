import { useEffect, useMemo, useState } from 'react';
import { money, supabase } from './lib/supabase';

const nav = ['Overview', 'Products', 'Categories', 'Packages', 'Halls', 'Services', 'Orders', 'Bookings', 'Payments', 'Customers', 'Audit Log'];

const demo = {
  products: [
    { id: 'p1', name: 'Auralite Pro X', category_id: null, short_description: 'Premium smartwatch', price: 28999, stock: 12, is_active: true },
    { id: 'p2', name: 'EchoBuds Air', category_id: null, short_description: 'Wireless earbuds', price: 16499, stock: 9, is_active: true },
    { id: 'p3', name: 'MoveMax 5W', category_id: null, short_description: 'Lightweight handsfree', price: 8999, stock: 15, is_active: true },
  ],
  categories: [
    { id: 'c1', name: 'Smart Watches', slug: 'smart-watches' },
    { id: 'c2', name: 'Earbuds', slug: 'earbuds' },
    { id: 'c3', name: 'Handsfree', slug: 'handsfree' },
    { id: 'c4', name: 'Chargers', slug: 'chargers' },
  ],
  packages: [
    { id: 'pkg1', title: 'Signature Wedding', category: 'Wedding', price: 135000, is_active: true, description: 'Complete wedding coordination.' },
    { id: 'pkg2', title: 'Luxury Reception', category: 'Reception', price: 245000, is_active: true, description: 'Premium reception styling.' },
  ],
  halls: [
    { id: 'h1', name: 'Pearl Grand Hall', city: 'Lahore', capacity: 700, price_from: 180000, is_active: true },
    { id: 'h2', name: 'Rosewood Gardens', city: 'Karachi', capacity: 520, price_from: 160000, is_active: true },
  ],
  services: [
    { id: 's1', name: 'Catering', price_from: 60000, is_active: true, description: 'Chef-managed catering.' },
    { id: 's2', name: 'Photography', price_from: 75000, is_active: true, description: 'Professional event coverage.' },
  ],
  orders: [
    { id: 'ord1', created_at: '2026-09-10', customer_name: 'Ayesha Khan', total: 24999, status: 'Delivered', payment_status: 'Paid' },
    { id: 'ord2', created_at: '2026-09-15', customer_name: 'Hamza Ali', total: 16499, status: 'Processing', payment_status: 'Pending' },
  ],
  bookings: [
    { id: 'bk1', created_at: '2026-09-11', customer_name: 'Sara Ahmed', package_title: 'Signature Wedding', hall_name: 'Pearl Grand Hall', total: 135000, status: 'Confirmed', payment_status: 'Paid' },
    { id: 'bk2', created_at: '2026-09-18', customer_name: 'Usman Raza', package_title: 'Luxury Reception', hall_name: 'Rosewood Gardens', total: 245000, status: 'Pending', payment_status: 'Unpaid' },
  ],
  payments: [
    { id: 'pay1', created_at: '2026-09-10', customer_name: 'Ayesha Khan', method: 'JazzCash', amount: 24999, status: 'Paid', notes: '' },
    { id: 'pay2', created_at: '2026-09-18', customer_name: 'Usman Raza', method: 'Card payment', amount: 135000, status: 'Pending', notes: '' },
  ],
  customers: [
    { id: 'u1', full_name: 'Ayesha Khan', email: 'ayesha@example.com', phone: '+92 300 1112222', created_at: '2026-08-10' },
    { id: 'u2', full_name: 'Hamza Ali', email: 'hamza@example.com', phone: '+92 301 3334444', created_at: '2026-08-16' },
    { id: 'u3', full_name: 'Sara Ahmed', email: 'sara@example.com', phone: '+92 302 5556666', created_at: '2026-08-21' },
  ],
  audit: [
    { id: 'a1', created_at: '2026-09-22', action: 'Product price updated', entity_type: 'electronics_products', actor: 'Admin' },
    { id: 'a2', created_at: '2026-09-21', action: 'Payment verified', entity_type: 'payment_records', actor: 'Admin' },
  ],
};

const configs = {
  Categories: { key: 'categories', table: 'electronics_categories', title: 'Categories', fields: [['name', 'Name'], ['slug', 'Slug']] },
  Packages: { key: 'packages', table: 'wedding_packages', title: 'Wedding packages', fields: [['title', 'Title'], ['category', 'Category'], ['price', 'Price'], ['description', 'Description'], ['is_active', 'Active']] },
  Halls: { key: 'halls', table: 'wedding_halls', title: 'Wedding halls', fields: [['name', 'Name'], ['city', 'City'], ['capacity', 'Capacity'], ['price_from', 'Starting price'], ['is_active', 'Active']] },
  Services: { key: 'services', table: 'event_services', title: 'Event services', fields: [['name', 'Name'], ['price_from', 'Starting price'], ['description', 'Description'], ['is_active', 'Active']] },
};

const statusOptions = ['Pending', 'Processing', 'Confirmed', 'Paid', 'In Transit', 'Delivered', 'Cancelled', 'Rejected'];

function normalizeRows(data) {
  return (data || []).map((row) => ({
    ...row,
    customer_name: row.profiles?.full_name || row.customer_name || 'Customer',
    package_title: row.wedding_packages?.title || row.package_title || 'Package',
    hall_name: row.wedding_halls?.name || row.hall_name || 'Hall',
    method: row.payment_methods?.name || row.method || 'Payment method',
  }));
}

function Login({ onSubmit, message }) {
  return (
    <div className="admin-login">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="admin-mark">Z</div>
        <span className="eyebrow">Private operations</span>
        <h1>ZIA Private Admin Panel</h1>
        <p>Secure control centre for the ZIA customer experience.</p>
        <label>Email<input name="email" type="email" required placeholder="admin@zia.com" /></label>
        <label>Password<input name="password" type="password" required placeholder="••••••••" /></label>
        {message && <div className="alert">{message}</div>}
        <button type="submit" className="primary wide">Sign in securely</button>
        <small>Only users listed in the Supabase admin_users table can access production data.</small>
      </form>
    </div>
  );
}

function Metric({ label, value, detail }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function Table({ columns, rows, renderCell, empty = 'No records found.' }) {
  return rows.length ? (
    <div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{columns.map((column) => <td key={column}>{renderCell(row, column)}</td>)}</tr>)}</tbody></table></div>
  ) : <div className="empty">{empty}</div>;
}

function Crud({ config, rows, onSave, onDelete, flash }) {
  const [form, setForm] = useState({ is_active: true, is_enabled: true });
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const edit = (row) => { setEditing(row.id); setForm({ ...row }); setOpen(true); };
  const reset = () => { setEditing(null); setForm({ is_active: true, is_enabled: true }); setOpen(false); };
  const save = async (event) => { event.preventDefault(); await onSave(config, form, editing); reset(); };
  return <section className="panel">
    <div className="section-head"><div><span className="eyebrow">Catalog management</span><h2>{config.title}</h2></div><button className="primary" onClick={() => { setForm({ is_active: true }); setEditing(null); setOpen(true); }}>+ Add new</button></div>
    {open && <form className="editor" onSubmit={save}><div className="editor-grid">{config.fields.map(([field, label]) => <label key={field}>{label}{field === 'is_active' ? <input type="checkbox" checked={form[field] !== false} onChange={(event) => setForm({ ...form, [field]: event.target.checked })} /> : <input type={['price', 'price_from', 'capacity'].includes(field) ? 'number' : 'text'} required={field !== 'description'} value={form[field] ?? ''} onChange={(event) => setForm({ ...form, [field]: ['price', 'price_from', 'capacity'].includes(field) ? Number(event.target.value) : event.target.value })} />}</label>)}</div><div className="form-actions"><button className="primary" type="submit">{editing ? 'Save changes' : 'Create record'}</button><button type="button" className="secondary" onClick={reset}>Cancel</button></div></form>}
    <Table columns={['Name', 'Price / details', 'Status', 'Actions']} rows={rows} renderCell={(row, column) => { if (column === 'Name') return <strong>{row.name || row.title}</strong>; if (column === 'Price / details') return row.price !== undefined ? money(row.price) : row.price_from !== undefined ? money(row.price_from) : row.slug || row.city || row.description || '—'; if (column === 'Status') return <span className={row.is_active === false ? 'status muted' : 'status success'}>{row.is_active === false ? 'Hidden' : 'Active'}</span>; return <div className="actions"><button onClick={() => edit(row)}>Edit</button><button className="danger-link" onClick={() => onDelete(config, row.id)}>Delete</button></div>; }} />
    {flash && <div className="inline-note">{flash}</div>}
  </section>;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [section, setSection] = useState('Overview');
  const [message, setMessage] = useState('');
  const [flash, setFlash] = useState('');
  const [data, setData] = useState(demo);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: result }) => setSession(result.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, current) => setSession(current));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !supabase) return;
    loadAll();
  }, [session]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const queries = await Promise.all([
        supabase.from('electronics_products').select('*').order('created_at', { ascending: false }),
        supabase.from('electronics_categories').select('*').order('name'),
        supabase.from('wedding_packages').select('*').order('created_at', { ascending: false }),
        supabase.from('wedding_halls').select('*').order('name'),
        supabase.from('event_services').select('*').order('name'),
        supabase.from('orders').select('*,profiles(full_name),payment_methods(name),order_items(*)').order('created_at', { ascending: false }),
        supabase.from('event_bookings').select('*,profiles(full_name),wedding_packages(title),wedding_halls(name)').order('created_at', { ascending: false }),
        supabase.from('payment_records').select('*,profiles(full_name),payment_methods(name)').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
      ]);
      const values = queries.map((query) => query.data);
      setData({ products: values[0] || [], categories: values[1] || [], packages: values[2] || [], halls: values[3] || [], services: values[4] || [], orders: normalizeRows(values[5]), bookings: normalizeRows(values[6]), payments: normalizeRows(values[7]), customers: values[8] || [], audit: values[9] || [] });
    } catch (error) { setFlash(error.message || 'Unable to refresh data.'); }
    finally { setLoading(false); }
  };

  const signIn = async (event) => {
    event.preventDefault();
    const credentials = Object.fromEntries(new FormData(event.currentTarget));
    if (!supabase) { setSession({ user: { email: credentials.email } }); setMessage('Demo admin access enabled.'); return; }
    const { data: result, error } = await supabase.auth.signInWithPassword(credentials);
    if (error) { setMessage(error.message); return; }
    const { data: admin } = await supabase.from('admin_users').select('id').eq('id', result.user.id).eq('is_active', true).maybeSingle();
    if (!admin) { await supabase.auth.signOut(); setMessage('This account is not authorized for the private panel.'); return; }
    setSession(result.session);
  };

  const signOut = async () => { if (supabase) await supabase.auth.signOut(); setSession(null); setMessage(''); };
  const notify = (text) => { setFlash(text); window.setTimeout(() => setFlash(''), 4000); };

  const saveCrud = async (config, form, editing) => {
    const payload = { ...form }; delete payload.id; delete payload.created_at; delete payload.updated_at;
    if (supabase && session) {
      const result = editing ? await supabase.from(config.table).update(payload).eq('id', editing) : await supabase.from(config.table).insert(payload);
      if (result.error) { notify(result.error.message); return; }
      await loadAll();
    } else {
      setData((current) => ({ ...current, [config.key]: editing ? current[config.key].map((row) => row.id === editing ? { ...row, ...form } : row) : [{ ...form, id: `${config.key}-${Date.now()}` }, ...current[config.key]] }));
    }
    notify(editing ? 'Record updated.' : 'Record created.');
  };

  const deleteCrud = async (config, id) => {
    if (!window.confirm('Delete this record?')) return;
    if (supabase && session) { const result = await supabase.from(config.table).delete().eq('id', id); if (result.error) { notify(result.error.message); return; } await loadAll(); }
    else setData((current) => ({ ...current, [config.key]: current[config.key].filter((row) => row.id !== id) }));
    notify('Record deleted.');
  };

  const updateRecord = async (table, id, field, value, label) => {
    if (supabase && session) { const result = await supabase.from(table).update({ [field]: value }).eq('id', id); if (result.error) { notify(result.error.message); return; } await loadAll(); }
    else setData((current) => ({ ...current, [table === 'orders' ? 'orders' : 'bookings']: current[table === 'orders' ? 'orders' : 'bookings'].map((row) => row.id === id ? { ...row, [field]: value } : row) }));
    notify(label || 'Status updated.');
  };

  const verifyPayment = async (payment, status) => {
    if (supabase && session) { const result = await supabase.rpc('admin_verify_payment', { p_payment_id: payment.id, p_status: status, p_notes: payment.notes || '' }); if (result.error) { notify(result.error.message); return; } await loadAll(); }
    else setData((current) => ({ ...current, payments: current.payments.map((row) => row.id === payment.id ? { ...row, status } : row) }));
    notify(`Payment marked ${status.toLowerCase()}.`);
  };

  const filtered = (key) => data[key].filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase()));
  const revenue = data.orders.reduce((sum, order) => sum + Number(order.total || 0), 0) + data.bookings.reduce((sum, booking) => sum + Number(booking.total || 0), 0);
  const pendingPayments = data.payments.filter((payment) => ['pending', 'unpaid'].includes(String(payment.status).toLowerCase())).length;

  if (!session) return <Login onSubmit={signIn} message={message} />;

  const overview = <section className="stack"><div className="welcome"><div><span className="eyebrow">Good day, ZIA team</span><h2>Operations overview</h2><p>Monitor your store, events, and customers from one private workspace.</p></div><button className="secondary" onClick={loadAll}>{loading ? 'Refreshing…' : '↻ Refresh data'}</button></div><div className="metrics"><Metric label="Revenue tracked" value={money(revenue)} detail="Orders + bookings" /><Metric label="Active products" value={data.products.filter((item) => item.is_active !== false).length} detail="Visible in the store" /><Metric label="Open bookings" value={data.bookings.filter((item) => !['cancelled', 'completed'].includes(String(item.status).toLowerCase())).length} detail="Need follow-up" /><Metric label="Pending payments" value={pendingPayments} detail="Awaiting verification" /></div><div className="dashboard-grid"><div className="panel"><div className="section-head"><h3>Recent orders</h3><button onClick={() => setSection('Orders')}>View all</button></div><Table columns={['Customer', 'Amount', 'Status']} rows={data.orders.slice(0, 5)} renderCell={(row, column) => column === 'Customer' ? row.customer_name : column === 'Amount' ? money(row.total) : <span className="status">{row.status}</span>} /></div><div className="panel"><div className="section-head"><h3>Payment queue</h3><button onClick={() => setSection('Payments')}>Review</button></div><Table columns={['Customer', 'Amount', 'Status']} rows={data.payments.slice(0, 5)} renderCell={(row, column) => column === 'Customer' ? row.customer_name : column === 'Amount' ? money(row.amount) : <span className="status">{row.status}</span>} /></div></div></section>;

  const content = section === 'Overview' ? overview : configs[section] ? <Crud config={configs[section]} rows={filtered(configs[section].key)} onSave={saveCrud} onDelete={deleteCrud} flash={flash} /> : section === 'Products' ? <Crud config={{ ...configs.Packages, key: 'products', table: 'electronics_products', title: 'Products', fields: [['name', 'Name'], ['short_description', 'Description'], ['price', 'Price'], ['stock', 'Stock'], ['is_active', 'Active']] }} rows={filtered('products')} onSave={saveCrud} onDelete={deleteCrud} flash={flash} /> : section === 'Orders' ? <DataSection title="Orders" columns={['Order', 'Customer', 'Amount', 'Payment', 'Status']} rows={filtered('orders')} render={(row, column) => column === 'Order' ? row.id : column === 'Customer' ? row.customer_name : column === 'Amount' ? money(row.total) : column === 'Payment' ? row.payment_status : <select value={row.status} onChange={(event) => updateRecord('orders', row.id, 'status', event.target.value, 'Order status updated.')}><option value={row.status}>{row.status}</option>{statusOptions.filter((item) => item !== row.status).map((item) => <option key={item}>{item}</option>)}</select>} /> : section === 'Bookings' ? <DataSection title="Bookings" columns={['Booking', 'Customer', 'Package / hall', 'Amount', 'Status']} rows={filtered('bookings')} render={(row, column) => column === 'Booking' ? row.id : column === 'Customer' ? row.customer_name : column === 'Package / hall' ? `${row.package_title} · ${row.hall_name}` : column === 'Amount' ? money(row.total) : <select value={row.status} onChange={(event) => updateRecord('event_bookings', row.id, 'status', event.target.value, 'Booking status updated.')}><option value={row.status}>{row.status}</option>{statusOptions.filter((item) => item !== row.status).map((item) => <option key={item}>{item}</option>)}</select>} /> : section === 'Payments' ? <Payments rows={filtered('payments')} onVerify={verifyPayment} /> : section === 'Customers' ? <DataSection title="Customers" columns={['Name', 'Email', 'Phone', 'Joined']} rows={filtered('customers')} render={(row, column) => column === 'Name' ? <strong>{row.full_name || 'Unnamed customer'}</strong> : column === 'Email' ? row.email : column === 'Phone' ? row.phone || '—' : row.created_at?.slice(0, 10)} /> : <DataSection title="Audit log" columns={['Date', 'Action', 'Entity', 'Actor']} rows={filtered('audit')} render={(row, column) => column === 'Date' ? row.created_at?.slice(0, 10) : column === 'Action' ? row.action : column === 'Entity' ? row.entity_type : row.actor || row.actor_id || 'Admin'} />;

  return <div className="admin-shell"><aside className="sidebar"><div className="side-brand"><div className="admin-mark">Z</div><div><strong>ZIA</strong><small>Private admin</small></div></div><nav>{nav.map((item) => <button key={item} className={section === item ? 'side-link active' : 'side-link'} onClick={() => setSection(item)}><span>{item === 'Overview' ? '⌂' : item === 'Products' ? '▣' : item === 'Payments' ? '◈' : item === 'Customers' ? '♙' : '•'}</span>{item}</button>)}</nav><button className="logout" onClick={signOut}>↪ Sign out</button></aside><main className="admin-main"><header className="admin-topbar"><div><span className="eyebrow">ZIA Event and Wedding Planner</span><h1>{section}</h1></div><div className="top-actions"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records…" /><span className="admin-avatar">A</span></div></header><div className="admin-content">{content}</div>{flash && <div className="toast">{flash}</div>}</main></div>;
}

function DataSection({ title, columns, rows, render }) {
  return <section className="panel"><div className="section-head"><div><span className="eyebrow">Live data</span><h2>{title}</h2></div><span className="record-count">{rows.length} records</span></div><Table columns={columns} rows={rows} renderCell={render} /></section>;
}

function Payments({ rows, onVerify }) {
  return <section className="panel"><div className="section-head"><div><span className="eyebrow">Financial controls</span><h2>Payment verification</h2></div><span className="record-count">{rows.length} records</span></div><Table columns={['Reference', 'Customer', 'Method', 'Amount', 'Status', 'Actions']} rows={rows} renderCell={(row, column) => column === 'Reference' ? row.id : column === 'Customer' ? row.customer_name : column === 'Method' ? row.method : column === 'Amount' ? money(row.amount) : column === 'Status' ? <span className={String(row.status).toLowerCase() === 'paid' ? 'status success' : 'status warning'}>{row.status}</span> : <div className="actions"><button onClick={() => onVerify(row, 'Paid')}>Verify</button><button className="danger-link" onClick={() => onVerify(row, 'Rejected')}>Reject</button></div>} /></section>;
}
