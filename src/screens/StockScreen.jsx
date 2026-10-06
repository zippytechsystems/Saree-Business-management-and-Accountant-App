import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  RotateCw,
  Tag,
  AlertCircle,
  PackageCheck,
} from 'lucide-react';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import Button from '../components/common/Button';
import { getTodayDateString, formatDate } from '../utils/formatters';

export default function StockScreen() {
  const [varieties, setVarieties] = useState([]);
  const [stockSummary, setStockSummary] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modals
  const [isAddVarietyOpen, setIsAddVarietyOpen] = useState(false);
  const [isMovementOpen, setIsMovementOpen] = useState(false);

  // Form States
  const [newVarietyName, setNewVarietyName] = useState('');
  const [varietyError, setVarietyError] = useState('');
  const [isSubmittingVariety, setIsSubmittingVariety] = useState(false);

  const [movementForm, setMovementForm] = useState({
    product_id: '',
    movement_type: 'IN',
    quantity: '',
    entry_date: getTodayDateString(),
    notes: '',
  });
  const [movementError, setMovementError] = useState('');
  const [isSubmittingMovement, setIsSubmittingMovement] = useState(false);

  const loadStockData = async () => {
    setLoading(true);
    try {
      const [varietiesRes, summaryRes, historyRes] = await Promise.all([
        fetch('/api/stock/varieties').then((r) => r.json()),
        fetch('/api/stock/summary').then((r) => r.json()),
        fetch('/api/stock/history?limit=50').then((r) => r.json()),
      ]);

      if (varietiesRes.success) setVarieties(varietiesRes.data);
      if (summaryRes.success) setStockSummary(summaryRes.data);
      if (historyRes.success) setStockHistory(historyRes.data);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load stock data: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStockData();
  }, []);

  // Handle Add Variety
  const handleAddVariety = async (e) => {
    e.preventDefault();
    if (!newVarietyName.trim()) {
      setVarietyError('Please enter a variety name.');
      return;
    }
    setVarietyError('');
    setIsSubmittingVariety(true);

    try {
      const res = await fetch('/api/stock/varieties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newVarietyName.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add variety.');
      }

      setToast({ type: 'success', message: `Product variety "${data.data.name}" added successfully!` });
      setNewVarietyName('');
      setIsAddVarietyOpen(false);
      loadStockData();
    } catch (err) {
      setVarietyError(err.message);
    } finally {
      setIsSubmittingVariety(false);
    }
  };

  // Handle Record Movement (IN or OUT)
  const handleRecordMovement = async (e) => {
    e.preventDefault();
    if (!movementForm.product_id) {
      setMovementError('Please select a product variety.');
      return;
    }
    const qty = Number(movementForm.quantity);
    if (isNaN(qty) || qty <= 0) {
      setMovementError('Quantity must be greater than 0.');
      return;
    }
    if (!movementForm.entry_date) {
      setMovementError('Date is required.');
      return;
    }

    setMovementError('');
    setIsSubmittingMovement(true);

    try {
      const res = await fetch('/api/stock/movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: Number(movementForm.product_id),
          movement_type: movementForm.movement_type,
          quantity: qty,
          entry_date: movementForm.entry_date,
          notes: movementForm.notes,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record stock movement.');
      }

      const actionText = movementForm.movement_type === 'IN' ? 'IN (Arrival)' : 'OUT (Dispatched)';
      setToast({
        type: 'success',
        message: `Recorded ${qty} units ${actionText} for ${data.data.product_name}.`,
      });

      setMovementForm({
        product_id: '',
        movement_type: 'IN',
        quantity: '',
        entry_date: getTodayDateString(),
        notes: '',
      });
      setIsMovementOpen(false);
      loadStockData();
    } catch (err) {
      setMovementError(err.message);
    } finally {
      setIsSubmittingMovement(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              <Boxes size={24} style={{ color: 'var(--accent-cyan)' }} />
              <span>Stock Management</span>
            </h1>
            <p className="page-subtitle">
              Manage product varieties and date-wise IN / OUT stock movements
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadStockData}
              isLoading={loading}
              title="Refresh Stock Data"
              icon={RotateCw}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsAddVarietyOpen(true)}
              icon={Plus}
            >
              Add Variety
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsMovementOpen(true)}
              icon={Boxes}
            >
              Update Stock (IN / OUT)
            </Button>
          </div>
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* KPI Overview Cards */}
      <div className="kpi-grid kpi-grid-3">
        <Card
          title="Current Stock on Hand"
          icon={<Boxes size={18} />}
          value={loading ? '...' : `${stockSummary?.current_stock ?? 0} units`}
          subtext="Total available across all varieties"
          accent="cyan"
        />
        <Card
          title="Total IN (Arrivals)"
          icon={<ArrowDownLeft size={18} />}
          value={loading ? '...' : `${stockSummary?.total_in ?? 0} units`}
          subtext="Cumulative arrivals"
          accent="green"
        />
        <Card
          title="Total OUT (Dispatches)"
          icon={<ArrowUpRight size={18} />}
          value={loading ? '...' : `${stockSummary?.total_out ?? 0} units`}
          subtext="Cumulative outgoing"
          accent="amber"
        />
      </div>

      {/* Product Varieties & Stock Levels Table */}
      <div className="section-heading">
        <Tag size={18} style={{ color: 'var(--accent-cyan)' }} />
        <span>Product Varieties & Live Stock</span>
      </div>

      <div className="data-table-container">
        {loading ? (
          <div className="empty-state">
            <div className="empty-state-text">Loading stock levels...</div>
          </div>
        ) : varieties.length === 0 ? (
          <div className="empty-state">
            <Boxes size={36} className="empty-state-icon" />
            <div className="empty-state-text">No product varieties created yet.</div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddVarietyOpen(true)}
              icon={Plus}
              style={{ marginTop: '12px' }}
            >
              Add Your First Variety
            </Button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Variety</th>
                <th style={{ textAlign: 'center' }}>Total IN</th>
                <th style={{ textAlign: 'center' }}>Total OUT</th>
                <th style={{ textAlign: 'right' }}>Current Stock</th>
                <th style={{ textAlign: 'center' }}>Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {varieties.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 600 }}>{v.name}</td>
                  <td style={{ textAlign: 'center', color: '#34d399' }}>+{v.total_in}</td>
                  <td style={{ textAlign: 'center', color: '#fbbf24' }}>-{v.total_out}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: v.current_stock < 0 ? '#fb7185' : '#22d3ee',
                      }}
                    >
                      {v.current_stock} units
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setMovementForm((prev) => ({ ...prev, product_id: String(v.id) }));
                        setIsMovementOpen(true);
                      }}
                    >
                      Update
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stock Movement History */}
      <div className="section-heading" style={{ marginTop: '32px' }}>
        <History size={18} style={{ color: 'var(--accent-blue)' }} />
        <span>Recent Stock Movement Log</span>
      </div>

      <div className="data-table-container">
        {loading ? (
          <div className="empty-state">
            <div className="empty-state-text">Loading movement logs...</div>
          </div>
        ) : stockHistory.length === 0 ? (
          <div className="empty-state">
            <History size={36} className="empty-state-icon" />
            <div className="empty-state-text">No stock movement recorded yet.</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product Variety</th>
                <th>Movement</th>
                <th style={{ textAlign: 'right' }}>Quantity</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {stockHistory.map((item) => (
                <tr key={item.id}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                    {formatDate(item.entry_date)}
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                  <td>
                    {item.movement_type === 'IN' ? (
                      <span className="badge badge-in">
                        <ArrowDownLeft size={13} />
                        <span>IN STOCK</span>
                      </span>
                    ) : (
                      <span className="badge badge-out">
                        <ArrowUpRight size={13} />
                        <span>OUT STOCK</span>
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    {item.movement_type === 'IN' ? `+${item.quantity}` : `-${item.quantity}`}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {item.notes || '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL 1: Add Variety */}
      <Modal isOpen={isAddVarietyOpen} title="Add Product Variety" onClose={() => setIsAddVarietyOpen(false)}>
        <form onSubmit={handleAddVariety}>
          <div className="form-group">
            <label className="form-label">Variety Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Banarasi Silk Saree, Cotton Handloom"
              value={newVarietyName}
              onChange={(e) => setNewVarietyName(e.target.value)}
              autoFocus
            />
            {varietyError && <div className="form-error">{varietyError}</div>}
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0 0' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddVarietyOpen(false)}
              disabled={isSubmittingVariety}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingVariety}
              loadingText="Saving..."
            >
              Save Variety
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Record Movement (IN or OUT) */}
      <Modal
        isOpen={isMovementOpen}
        title="Record Stock Movement"
        onClose={() => setIsMovementOpen(false)}
      >
        <form onSubmit={handleRecordMovement}>
          <div className="form-group">
            <label className="form-label">Product Variety *</label>
            <select
              className="form-select"
              value={movementForm.product_id}
              onChange={(e) => setMovementForm({ ...movementForm, product_id: e.target.value })}
            >
              <option value="">-- Select Product Variety --</option>
              {varieties.map((v) => (
                 <option key={v.id} value={v.id}>
                  {v.name} (Current: {v.current_stock} units)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Movement Direction *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Button
                type="button"
                variant={movementForm.movement_type === 'IN' ? 'success' : 'secondary'}
                onClick={() => setMovementForm({ ...movementForm, movement_type: 'IN' })}
                icon={ArrowDownLeft}
              >
                IN (Arrival / Purchase)
              </Button>
              <Button
                type="button"
                variant={movementForm.movement_type === 'OUT' ? 'danger' : 'secondary'}
                onClick={() => setMovementForm({ ...movementForm, movement_type: 'OUT' })}
                icon={ArrowUpRight}
              >
                OUT (Dispatch / Sold)
              </Button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Quantity *</label>
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              className="form-input"
              placeholder="e.g. 25"
              value={movementForm.quantity}
              onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date *</label>
            <input
              type="date"
              className="form-input"
              value={movementForm.entry_date}
              onChange={(e) => setMovementForm({ ...movementForm, entry_date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Optional Notes</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Supplier invoice #104, Shop display"
              value={movementForm.notes}
              onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
            />
          </div>

          {movementError && <div className="form-error" style={{ marginBottom: '12px' }}>{movementError}</div>}

          <div className="modal-footer" style={{ padding: '16px 0 0 0' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsMovementOpen(false)}
              disabled={isSubmittingMovement}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingMovement}
              loadingText="Recording..."
            >
              Record Movement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
