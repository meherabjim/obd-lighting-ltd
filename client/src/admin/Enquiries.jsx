import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Spinner, { EmptyState, ErrorNote } from '../components/Spinner.jsx';
import { IconTrash, IconWhatsApp, IconPhone } from '../components/Icons.jsx';

const STATUS = [
  ['new', 'New', 'pill-warn'],
  ['quoted', 'Quoted', 'pill-blue'],
  ['site_visit', 'Site visit', 'pill-blue'],
  ['sold', 'Sold', 'pill-ok'],
  ['closed', 'Closed', ''],
];

const ago = (iso) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
};

export default function Enquiries() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('all');
  const [source, setSource] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.adminEnquiries({ status, source, limit: 200 })
      .then((r) => { setRows(r.enquiries); setTotal(r.total); setError(null); })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [status, source]);
  useEffect(load, [load]);

  const setRowStatus = async (row, value) => {
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status: value } : r)));
    try { await api.updateEnquiry(row.id, { status: value }); }
    catch (err) { setError(err); load(); }
  };

  const remove = async (row) => {
    if (!window.confirm('Delete this enquiry?')) return;
    try { await api.deleteEnquiry(row.id); load(); } catch (err) { setError(err); }
  };

  return (
    <>
      <div className="admin-head">
        <h1>Enquiries <span className="count-badge">{total}</span></h1>
      </div>
      <p className="hint page-hint">
        Every WhatsApp and call button on the site logs a line here, so you can see what
        people are asking about even before the chat comes through.
      </p>

      <div className="admin-filters">
        <select className="sel" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="sel" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="all">All sources</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="phone">Phone</option>
          <option value="form">Enquiry form</option>
        </select>
      </div>

      <ErrorNote error={error} onRetry={load} />

      {loading ? <Spinner /> : rows.length === 0 ? (
        <EmptyState title="No enquiries yet"
                    hint="They will appear the moment someone taps WhatsApp or sends the project form." />
      ) : (
        <div className="tbl-wrap">
          <table className="data">
            <thead>
              <tr><th>When</th><th>Who</th><th>Interested in</th><th>Source</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td className="sm nowrap">{ago(e.createdAt)}</td>
                  <td>
                    <div className="pname">{e.name || <span className="muted">anonymous</span>}</div>
                    {e.company ? <div className="psub">{e.company}</div> : null}
                    {e.phone ? <div className="psub mono">{e.phone}</div> : null}
                    {e.email ? <div className="psub mono">{e.email}</div> : null}
                  </td>
                  <td className="sm">
                    {e.productName ? <><b>{e.productName}</b> <span className="mono">{e.productSku}</span></>
                      : e.categoryName ? e.categoryName
                      : e.message ? <span className="enq-msg">{e.message}</span>
                      : <span className="muted">general enquiry</span>}
                    {e.productName && e.message ? <div className="enq-msg">{e.message}</div> : null}
                  </td>
                  <td>
                    {e.source === 'whatsapp' ? <span className="pill pill-wa"><IconWhatsApp size={12} /> WhatsApp</span>
                      : e.source === 'phone' ? <span className="pill pill-blue"><IconPhone /> Phone</span>
                      : <span className="pill pill-blue">Form</span>}
                  </td>
                  <td>
                    <select className="sel sel-sm" value={e.status} onChange={(ev) => setRowStatus(e, ev.target.value)}>
                      {STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </td>
                  <td className="row-actions">
                    <button type="button" className="icon-only danger" onClick={() => remove(e)} aria-label="Delete">
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
