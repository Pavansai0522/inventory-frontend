import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [view, setView] = useState('inventory');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    document.body.className = darkMode ? 'dark' : '';
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const res = await fetch('http://localhost:4000/items');
    const data = await res.json();
    setItems(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const item = { name, quantity: +quantity, price: +price };

    if (editId !== null) {
      await fetch(`http://localhost:4000/items/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    } else {
      await fetch('http://localhost:4000/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    }

    setName('');
    setQuantity('');
    setPrice('');
    setEditId(null);
    fetchItems();
  };

  const handleDelete = async (id) => {
    await fetch(`http://localhost:4000/items/${id}`, { method: 'DELETE' });
    fetchItems();
  };

  const handleEdit = (item) => {
    setName(item.name);
    setQuantity(item.quantity);
    setPrice(item.price);
    setEditId(item._id);
  };

  const handleCancelEdit = () => {
    setName('');
    setQuantity('');
    setPrice('');
    setEditId(null);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const downloadCSV = () => {
    const csvHeader = 'Name,Quantity,Price\n';
    const csvRows = items.map(i => `${i.name},${i.quantity},${i.price}`).join('\n');
    const csvData = csvHeader + csvRows;
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const filteredItems = items
    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (!sortColumn) return 0;
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <div className="layout">
      <aside className="sidebar-left">
        <h2>📦 Inventory</h2>
        <nav>
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
          <button className={view === 'inventory' ? 'active' : ''} onClick={() => setView('inventory')}>Inventory</button>
          <button className={view === 'reports' ? 'active' : ''} onClick={() => setView('reports')}>Reports</button>
          <button className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}>Settings</button>
        </nav>
      </aside>

      <main className="App">
        {view === 'dashboard' && <h1>Dashboard (Coming Soon)</h1>}
        {view === 'inventory' && (
          <>
            <h1>Inventory Management</h1>
            <form onSubmit={handleSubmit}>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Item Name" required />
              <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Quantity" required />
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" required />
              <button type="submit">{editId !== null ? 'Update' : 'Add'}</button>
              {editId !== null && <button type="button" onClick={handleCancelEdit}>Cancel</button>}
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Total Inventory Value: ${totalValue.toFixed(2)}</h2>
              <button onClick={downloadCSV}>Download CSV</button>
            </div>

            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ marginBottom: '10px', padding: '8px', width: '100%' }}
            />

            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')}>Name {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th onClick={() => handleSort('quantity')}>Quantity {sortColumn === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th onClick={() => handleSort('price')}>Price {sortColumn === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(item => (
                  <tr key={item._id} className={item.quantity < 5 ? 'low-stock' : ''}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>
                      <button className="edit" onClick={() => handleEdit(item)}>Edit</button>
                      <button className="delete" onClick={() => handleDelete(item._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Previous</button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  style={{ margin: '0 4px', fontWeight: currentPage === i + 1 ? 'bold' : 'normal' }}
                >
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Next</button>
            </div>

            <div className="sidebar-scroll">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>
            </div>

            <footer className="footer">
              <p>© {new Date().getFullYear()} Inventory Manager. All rights reserved.</p>
            </footer>
          </>
        )}
        {view === 'reports' && <h1>Reports (Coming Soon)</h1>}
        {view === 'settings' && <h1>Settings (Coming Soon)</h1>}
      </main>

      <aside className="sidebar-right">
        <div className="sidebar-section">
          <strong>Total Items:</strong> {items.length}
        </div>
        <div className="sidebar-section">
          <strong>Low Stock (&lt; 5):</strong> {items.filter(i => i.quantity < 5).length}
        </div>
        <div className="sidebar-section">
          <label>
            <input
              type="checkbox"
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
            />
            Dark Mode
          </label>
        </div>
      </aside>
    </div>
  );
}

export default App;