const fs = require('fs');
const path = require('path');

const cssRules = `
/* CRITICAL EXPLICIT STYLES INJECTED FOR 100% RELIABILITY */
.bell-btn-master {
  background: linear-gradient(135deg, #15803d 0%, #16a34a 100%) !important;
  color: #ffffff !important;
  border: 2px solid #86efac !important;
  font-weight: 800 !important;
  box-shadow: 0 4px 14px rgba(22, 163, 74, 0.4) !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
}
.bell-btn-master:hover {
  background: linear-gradient(135deg, #166534 0%, #15803d 100%) !important;
  box-shadow: 0 6px 20px rgba(22, 163, 74, 0.6) !important;
}
.bell-btn-running {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important;
  color: #ffffff !important;
  border: 2px solid #6ee7b7 !important;
  font-weight: 800 !important;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35) !important;
}
.bell-btn-paused {
  background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%) !important;
  color: #ffffff !important;
  border: 2px solid #fde68a !important;
  font-weight: 800 !important;
}
.bell-btn-stop {
  background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%) !important;
  color: #ffffff !important;
  border: 2px solid #fca5a5 !important;
  font-weight: 800 !important;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35) !important;
}
.bell-btn-stop:hover {
  background: linear-gradient(135deg, #991b1b 0%, #b91c1c 100%) !important;
}
.bell-btn-long {
  background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%) !important;
  color: #ffffff !important;
  border: 2px solid #93c5fd !important;
  font-weight: 800 !important;
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.35) !important;
}
.bell-btn-period {
  background: linear-gradient(135deg, #c2410c 0%, #ea580c 100%) !important;
  color: #ffffff !important;
  border: 2px solid #fdba74 !important;
  font-weight: 800 !important;
  box-shadow: 0 4px 12px rgba(234, 88, 12, 0.35) !important;
}
.bell-btn-season-summer {
  background: linear-gradient(135deg, #ea580c 0%, #f97316 100%) !important;
  color: #ffffff !important;
  border: 2px solid #fed7aa !important;
  font-weight: 800 !important;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.35) !important;
}
.bell-btn-season-winter {
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%) !important;
  color: #ffffff !important;
  border: 2px solid #bfdbfe !important;
  font-weight: 800 !important;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35) !important;
}
.bell-btn-season-inactive {
  background: #f1f5f9 !important;
  color: #1e293b !important;
  border: 1px solid #cbd5e1 !important;
  font-weight: 700 !important;
}
.bell-btn-season-inactive:hover {
  background: #e2e8f0 !important;
}
.bell-btn-test {
  background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%) !important;
  color: #ffffff !important;
  border: 1px solid #b45309 !important;
  font-weight: 800 !important;
  padding: 4px 10px !important;
  border-radius: 6px !important;
  box-shadow: 0 2px 6px rgba(217, 119, 6, 0.35) !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
}
.bell-btn-test:hover {
  background: linear-gradient(135deg, #b45309 0%, #d97706 100%) !important;
  color: #ffffff !important;
  transform: scale(1.05) !important;
}
.bell-btn-test-active {
  background: #dc2626 !important;
  color: #ffffff !important;
  border: 2px solid #ffffff !important;
  font-weight: 900 !important;
  animation: pulse 1s infinite !important;
}
.bell-btn-sound-active {
  background: #0284c7 !important;
  color: #ffffff !important;
  border: 1px solid #0369a1 !important;
  font-weight: 700 !important;
}
.bell-btn-sound-inactive {
  background: #f1f5f9 !important;
  color: #334155 !important;
  border: 1px solid #cbd5e1 !important;
}
.bell-badge-autostart {
  background: #ecfdf5 !important;
  color: #065f46 !important;
  border: 1px solid #a7f3d0 !important;
  font-weight: 700 !important;
}
.bell-table-container {
  background: #ffffff !important;
  border: 2px solid #bae6fd !important;
  border-radius: 14px !important;
  overflow-x: auto !important;
  box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.15) !important;
}
.bell-table-header {
  background: linear-gradient(90deg, #075985 0%, #0369a1 100%) !important;
  color: #ffffff !important;
  font-weight: 800 !important;
  font-size: 13px !important;
}
.bell-table-header th {
  color: #ffffff !important;
  padding: 8px 8px !important;
}
.bell-row-even {
  background: #ffffff !important;
}
.bell-row-odd {
  background: #f8fafc !important;
}
.bell-row-current {
  background: #fef3c7 !important;
  border-left: 4px solid #f59e0b !important;
}
.bell-row-active-test {
  background: #ffedd5 !important;
  border-left: 4px solid #ea580c !important;
}
.bell-cell-time {
  color: #0369a1 !important;
  font-weight: 800 !important;
  font-family: 'Consolas', 'Courier New', monospace !important;
  font-size: 13px !important;
}
.bell-cell-label {
  color: #0f172a !important;
  font-weight: 700 !important;
  font-size: 13px !important;
}
.bell-cell-count {
  color: #475569 !important;
  font-weight: 700 !important;
  font-size: 12px !important;
}
`;

const root = path.resolve(__dirname, '..');
['raw_web/assets/index-RWMWRD8M.css', 'raw_web/index-RWMWRD8M.css'].forEach(rel => {
  const p = path.join(root, rel);
  if (fs.existsSync(p)) {
    const orig = fs.readFileSync(p, 'utf-8');
    if (!orig.includes('.bell-btn-master')) {
      fs.writeFileSync(p, orig + '\n' + cssRules, 'utf-8');
      console.log('✓ Injected CSS into', rel);
    } else {
      console.log('Already present in', rel);
    }
  }
});
