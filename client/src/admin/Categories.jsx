import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useCatalogue } from '../context/CatalogueContext.jsx';
import NoPhoto from '../components/NoPhoto.jsx';
import Spinner, { ErrorNote } from '../components/Spinner.jsx';
import { IconPlus, IconEdit, IconTrash } from '../components/Icons.jsx';

const BLANK = { id: '', name: '', nameBn: '', blurb: '', blurbBn: '', icon: 'bulbA', subs: [] };

export default function Categories() {
  const { reload } = useCatalogue();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);   // null | BLANK | a row
  const [subsText, setSubsText] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.adminCategories()
      .then((r) => { setRows(r); setError(null); })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const open = (row) => {
    setEditing(row ? { ...row } : { ...BLANK });
    setSubsText(row ? row.subs.map((s) => `${s.name} | ${s.nameBn}`).join('\n') : '');
  };

  const save = async (e) => {
    e.preventDefault();
    const subs = subsText.split('\n').map((line) => {
      const [name, nameBn] = line.split('|').map((x) => (x || '').trim());
      return { name, nameBn: nameBn || name };
    }).filter((s) => s.name);

    try {
      const body = { ...editing, subs };
      if (rows.some((r) => r.id === editing.id)) await api.updateCategory(editing.id, body);
      else await api.createCategory(body);
      setEditing(null);
      reload();
      load();
    } catch (err) { setError(err); }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete the “${row.name}” category?`)) return;
    try { await api.deleteCategory(row.id); reload(); load(); }
    catch (err) { setError(err); }
  };

  const set = (k) => (e) => setEditing((c) => ({ ...c, [k]: e.target.value }));

  return (
    <>
      <div className="admin-head">
        <h1>Categories <span className="count-badge">{rows.length}</span></h1>
        <button type="button" className="btn btn-primary" onClick={() => open(null)}>
          <IconPlus /> Add category
        </button>
      </div>

      <ErrorNote error={error} onRetry={load} />

      {editing && (
        <form className="panel" onSubmit={save}>
          <h3>{rows.some((r) => r.id === editing.id) ? 'Edit category' : 'New category'}</h3>
          <div className="fields">
            <div className="field">
              <label htmlFor="cId">Short id <span className="req">*</span></label>
              <input id="cId" required value={editing.id} onChange={set('id')}
                     disabled={rows.some((r) => r.id === editing.id)}
                     placeholder="street" />
            </div>
            <div className="field">
              <label htmlFor="cName">Name (English) <span className="req">*</span></label>
              <input id="cName" required value={editing.name} onChange={set('name')} />
            </div>
            <div className="field">
              <label htmlFor="cNameBn">Name (বাংলা)</label>
              <input id="cNameBn" value={editing.nameBn || ''} onChange={set('nameBn')} />
            </div>
            <div className="field">
              <label htmlFor="cBlurb">Short line (English)</label>
              <input id="cBlurb" value={editing.blurb || ''} onChange={set('blurb')} />
            </div>
            <div className="field">
              <label htmlFor="cBlurbBn">Short line (বাংলা)</label>
              <input id="cBlurbBn" value={editing.blurbBn || ''} onChange={set('blurbBn')} />
            </div>
            <div className="field full">
              <label htmlFor="cSubs">Sub-categories — one per line, <code>English | বাংলা</code></label>
              <textarea id="cSubs" rows="5" value={subsText} onChange={(e) => setSubsText(e.target.value)}
                        placeholder={'T8 LED tube | T8 LED টিউব\nT5 batten | T5 ব্যাটেন'} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">Save</button>
            <button className="btn btn-ghost" type="button" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <Spinner /> : (
        <div className="tbl-wrap">
          <table className="data">
            <thead>
              <tr><th></th><th>Category</th><th>Id</th><th className="num">Products</th><th>Sub-categories</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="cell-art"><NoPhoto name={c.name} size={34} label={false} /></td>
                  <td><div className="pname">{c.name}</div><div className="psub">{c.nameBn}</div></td>
                  <td className="mono sm">{c.id}</td>
                  <td className="num">{c.productCount}</td>
                  <td className="sm">{c.subs.length}</td>
                  <td>{c.isActive ? <span className="pill pill-ok">Visible</span> : <span className="pill">Hidden</span>}</td>
                  <td className="row-actions">
                    <button type="button" className="icon-only" onClick={() => open(c)} aria-label="Edit"><IconEdit /></button>
                    <button type="button" className="icon-only danger" onClick={() => remove(c)} aria-label="Delete"><IconTrash /></button>
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
