import { useState } from 'react';

const overviewCards = [
  { label: 'Wedding Bookings', value: '184', trend: '+12%' },
  { label: 'Electronics Orders', value: '2,430', trend: '+18%' },
  { label: 'Monthly Revenue', value: '₨ 8.6M', trend: '+9%' },
  { label: 'Support Tickets', value: '26', trend: '-3%' }
];

const recentBookings = [
  { name: 'Luxury Garden Wedding', client: 'Ayesha Khan', status: 'Confirmed', amount: '₨ 245,000' },
  { name: 'Corporate Event Setup', client: 'Blue Rock Ltd.', status: 'In progress', amount: '₨ 180,500' },
  { name: 'Smartwatch Bundle', client: 'Talha Noor', status: 'Ready to ship', amount: '₨ 34,700' }
];

const inventoryItems = [
  { item: 'ZIA Pulse Pro', stock: '54 units', low: 'Low alert' },
  { item: 'ZIA Nova Buds', stock: '128 units', low: 'Healthy' },
  { item: 'Wedding Decor Kit', stock: '18 sets', low: 'Low alert' }
];

export default function App() {
  const [section, setSection] = useState('Overview');

  const nav = ['Overview', 'Bookings', 'Orders', 'Inventory', 'Customers', 'Reports'];

  return (
    <div className="admin-app-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-mark">Z</div>
          <div>
            <p>ZIA</p>
            <small>Private Admin</small>
          </div>
        </div>

        <nav className="admin-nav">
          {nav.map((item) => (
            <button
              key={item}
              className={section === item ? 'admin-link active' : 'admin-link'}
              onClick={() => setSection(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="admin-logout">Secure session</div>
      </aside>

      <main className="admin-content">
        <header className="admin-header">
          <div>
            <p className="eyebrow admin-eyebrow">Operations dashboard</p>
            <h1>{section}</h1>
          </div>
          <div className="admin-actions">
            <button className="ghost-button">Export</button>
            <button className="primary-button">Create booking</button>
          </div>
        </header>

        <section className="overview-grid">
          {overviewCards.map((card) => (
            <div key={card.label} className="stat-card">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <em>{card.trend}</em>
            </div>
          ))}
        </section>

        <section className="admin-panels">
          <div className="panel-large">
            <div className="panel-head">
              <h3>Recent activity</h3>
              <button>View all</button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.client}</td>
                      <td><span className="status-badge">{row.status}</span></td>
                      <td>{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel-side">
            <div className="panel-head">
              <h3>Inventory</h3>
              <button>Manage</button>
            </div>

            <div className="inventory-list">
              {inventoryItems.map((item) => (
                <div key={item.item} className="inventory-item">
                  <div>
                    <strong>{item.item}</strong>
                    <small>{item.stock}</small>
                  </div>
                  <span className={item.low === 'Low alert' ? 'alert' : 'ok'}>{item.low}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
