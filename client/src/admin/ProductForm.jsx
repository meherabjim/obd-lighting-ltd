import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useCatalogue } from '../context/CatalogueContext.jsx';
import NoPhoto from '../components/NoPhoto.jsx';
import Spinner, { ErrorNote } from '../components/Spinner.jsx';
import { IconPlus, IconTrash, IconArrow } from '../components/Icons.jsx';

/**
 * Add or edit one product.
 *
 * The spec sheet is a repeating key/value list, so any row the catalogue
 * needs can be typed in without a code change. "Fill standard specs"
 * drops in the shared electrical block from the OBD catalogue.
 */
const STANDARD_SPECS = [
  ['Wattage', ''], ['Luminous flux', ''], ['CCT', '6500 K'],
  ['CCT options', '2700–6500 K'], ['Type', ''], ['IP', 'IP54'],
  ['Input voltage', 'AC 85–265 V'], ['Frequency', '50–60 Hz'],
  ['Output voltage', 'DC 36–42 V'], ['Power factor', 'PF > 0.96'],
  ['THD', '< 8%'], ['Driver', 'Isolated'], ['CRI', 'Ra > 80–90'],
  ['Efficacy', '110 lm/W'], ['Lumen maintenance', '97% up to 10,000 h'],
  ['Service life', '50,000 hours'], ['Material', 'Aluminium + PC diffuser'],
  ['Operating temp', '−20 °C to 45 °C'], ['Certification', 'CE · UL · LM-80 · RoHS'],
  ['Warranty', '3 years (replacement)'],
];

/** OBD-IN-018 from "Industrial Light 18W" — a starting point the user can edit. */
function suggestSku(name) {
  const words = String(name).replace(/[^a-zA-Z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const letters = words.filter((w) => /[a-zA-Z]/.test(w[0])).slice(0, 2)
    .map((w) => w[0].toUpperCase()).join('') || 'PR';
  const watt = (String(name).match(/(\d+)\s*W/i) || [, ''])[1];
  return `OBD-${letters}-${watt ? String(watt).padStart(3, '0') : '001'}`;
}

const BLANK = {
  name: '', nameBn: '', sku: '', categoryId: '', price: '', oldPrice: '',
  stock: '0', wattage: '', cct: '', art: 'none',
  isFeatured: false, isNew: false, isActive: true,
};

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = id && id !== 'new';
  const navigate = useNavigate();
  const { categories, reload } = useCatalogue();

  const [form, setForm] = useState(BLANK);
  const [specs, setSpecs] = useState([{ key: '', value: '' }]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // A new category can be created here rather than leaving the half-typed
  // product behind to go to the Categories page.
  const [newCat, setNewCat] = useState(null);
  const [catSaving, setCatSaving] = useState(false);

  const saveNewCategory = async () => {
    const name = (newCat?.name || '').trim();
    if (!name) return;
    setCatSaving(true);
    try {
      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
      await api.createCategory({ id, name, nameBn: (newCat.nameBn || '').trim() || name, icon: 'bulbA' });
      await reload();
      setForm((f) => ({ ...f, categoryId: id }));
      setNewCat(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCatSaving(false);
    }
  };

  useEffect(() => {
    if (!isEdit) {
      setForm((f) => ({ ...f, categoryId: f.categoryId || categories[0]?.id || '' }));
      return;
    }
    api.adminProduct(id)
      .then((p) => {
        setForm({
          name: p.name, nameBn: p.nameBn, sku: p.sku, categoryId: p.categoryId,
          price: String(p.price), oldPrice: p.oldPrice == null ? '' : String(p.oldPrice),
          stock: String(p.stock), wattage: p.wattage ?? '', cct: p.cct ?? '',
          art: p.art, isFeatured: p.isFeatured, isNew: p.isNew, isActive: p.isActive,
        });
        setSpecs(p.specs.length ? p.specs : [{ key: '', value: '' }]);
        setExistingImage(p.image);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id, isEdit, categories]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const setSpec = (i, field) => (e) => {
    setSpecs((rows) => rows.map((r, n) => (n === i ? { ...r, [field]: e.target.value } : r)));
  };
  const addSpec = () => setSpecs((r) => [...r, { key: '', value: '' }]);
  const removeSpec = (i) => setSpecs((r) => (r.length === 1 ? [{ key: '', value: '' }] : r.filter((_, n) => n !== i)));
  const fillStandard = () => {
    const have = new Set(specs.filter((s) => s.key).map((s) => s.key.toLowerCase()));
    const add = STANDARD_SPECS.filter(([k]) => !have.has(k.toLowerCase())).map(([key, value]) => ({ key, value }));
    setSpecs([...specs.filter((s) => s.key || s.value), ...add]);
  };

  const pickFile = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setRemoveImage(false);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, typeof v === 'boolean' ? (v ? '1' : '0') : v));
      fd.append('specs', JSON.stringify(specs.filter((s) => s.key.trim() && s.value.trim())));
      if (file) fd.append('image', file);
      if (removeImage) fd.append('removeImage', '1');

      if (isEdit) await api.updateProduct(id, fd);
      else await api.createProduct(fd);

      reload();
      navigate('/admin/products');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  const shownImage = preview || (removeImage ? null : existingImage);

  return (
    <form onSubmit={submit}>
      <div className="admin-head">
        <h1>{isEdit ? 'Edit product' : 'Add product'}</h1>
        <Link className="btn btn-ghost btn-sm" to="/admin/products">Back to list</Link>
      </div>

      <ErrorNote error={error} />

      <div className="form-grid">
        <div>
          <div className="panel">
            <h3>Basics</h3>
            <p className="hint">The Bangla name shows when a visitor switches the site to বাংলা.</p>
            <div className="fields">
              <div className="field full">
                <label htmlFor="fName">Product name (English) <span className="req">*</span></label>
                <input id="fName" required value={form.name} onChange={set('name')}
                       placeholder="T8 Double Shade 2×20W 4ft" />
              </div>
              <div className="field full">
                <label htmlFor="fNameBn">Product name (বাংলা)</label>
                <input id="fNameBn" value={form.nameBn} onChange={set('nameBn')}
                       placeholder="T8 ডাবল শেড ২×২০ ওয়াট ৪ ফুট" />
              </div>
              <div className="field">
                <label htmlFor="fSku">Model / SKU <span className="req">*</span></label>
                <div className="input-with-action">
                  <input id="fSku" required value={form.sku} onChange={set('sku')} placeholder="OBD-ID-240" />
                  {!isEdit && form.name && !form.sku && (
                    <button type="button" className="inline-action"
                            onClick={() => setForm((f) => ({ ...f, sku: suggestSku(f.name) }))}>
                      Suggest
                    </button>
                  )}
                </div>
              </div>
              <div className="field">
                <label htmlFor="fCat">Category <span className="req">*</span></label>
                <div className="input-with-action">
                  <select id="fCat" required value={form.categoryId} onChange={set('categoryId')}>
                    <option value="" disabled>Choose…</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button type="button" className="inline-action" onClick={() => setNewCat({ name: '', nameBn: '' })}>
                    + New
                  </button>
                </div>
              </div>

              {newCat && (
                <div className="field full new-cat">
                  <label>New category</label>
                  <div className="new-cat-row">
                    <input autoFocus placeholder="LED Mirror Light" value={newCat.name}
                           onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                           onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveNewCategory(); } }} />
                    <input placeholder="LED মিরর লাইট" value={newCat.nameBn}
                           onChange={(e) => setNewCat({ ...newCat, nameBn: e.target.value })}
                           onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveNewCategory(); } }} />
                    <button type="button" className="btn btn-primary btn-sm"
                            disabled={catSaving || !newCat.name.trim()} onClick={saveNewCategory}>
                      {catSaving ? 'Saving…' : 'Create'}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setNewCat(null)}>
                      Cancel
                    </button>
                  </div>
                  <p className="hint no-mb">
                    It appears on the site immediately. Sub-categories, the drawing and the
                    Bangla blurb can be filled in later under Categories.
                  </p>
                </div>
              )}
              <div className="field">
                <label htmlFor="fPrice">Price ৳ <span className="req">*</span></label>
                <input id="fPrice" required type="number" min="0" step="1"
                       value={form.price} onChange={set('price')} />
              </div>
              <div className="field">
                <label htmlFor="fOld">Was ৳ <span className="opt">(shows a discount)</span></label>
                <input id="fOld" type="number" min="0" step="1" value={form.oldPrice} onChange={set('oldPrice')} />
              </div>
              <div className="field">
                <label htmlFor="fStock">Stock (pcs)</label>
                <input id="fStock" type="number" min="0" step="1" value={form.stock} onChange={set('stock')} />
              </div>
              <div className="field">
                <label htmlFor="fWatt">Wattage <span className="opt">(for the filter)</span></label>
                <input id="fWatt" type="number" min="0" value={form.wattage} onChange={set('wattage')}
                       placeholder="auto from specs" />
              </div>
              <div className="field">
                <label htmlFor="fCct">Colour temp K <span className="opt">(for the filter)</span></label>
                <input id="fCct" type="number" min="0" value={form.cct} onChange={set('cct')}
                       placeholder="auto from specs" />
              </div>
            </div>

            <div className="switch-row">
              <label className="check"><input type="checkbox" checked={form.isActive} onChange={set('isActive')} /> Visible on the site</label>
              <label className="check"><input type="checkbox" checked={form.isFeatured} onChange={set('isFeatured')} /> Show in “Best sellers”</label>
              <label className="check"><input type="checkbox" checked={form.isNew} onChange={set('isNew')} /> Mark as new</label>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Specification sheet</h3>
                <p className="hint no-mb">These rows become the table on the product page.</p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={fillStandard}>
                Fill standard specs
              </button>
            </div>

            <div className="spec-rows">
              {specs.map((row, i) => (
                <div className="spec-row" key={i}>
                  <input placeholder="Wattage" value={row.key} onChange={setSpec(i, 'key')} aria-label="Spec name" />
                  <input placeholder="40 W" value={row.value} onChange={setSpec(i, 'value')} aria-label="Spec value" />
                  <button type="button" className="icon-only" onClick={() => removeSpec(i)} aria-label="Remove row">
                    <IconTrash />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addSpec}>
              <IconPlus /> Add a row
            </button>
          </div>
        </div>

        <div>
          <div className="panel sticky">
            <h3>Photo</h3>
            <p className="hint">Shoot the product against a white wall. Up to 4 MB, JPG or PNG.
              Until you add one, the card shows a plain lettered tile — never a stand-in picture.</p>

            <div className="img-preview">
              {shownImage
                ? <img src={shownImage} alt="" />
                : <NoPhoto name={form.name || 'New product'} sku={form.sku} size={120} />}
            </div>

            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={pickFile} />
            {(existingImage && !preview) && (
              <label className="check">
                <input type="checkbox" checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} />
                Remove the current photo
              </label>
            )}

            <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
              {saving ? 'Saving…' : <>{isEdit ? 'Save changes' : 'Add product'} <IconArrow /></>}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
