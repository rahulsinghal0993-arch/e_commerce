import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, TextField, TextArea, Select, useToastStore, type SelectOption } from '@arghya/ui';
import { inr } from '@arghya/utils';
import type { Category, ProductStatus } from '@arghya/api-client';
import { api, type SellerProduct } from '../lib/api.js';

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'active', label: 'Active — visible in the shop' },
  { value: 'draft', label: 'Draft — hidden while you finish it' },
  { value: 'out_of_stock', label: 'Out of stock — hidden until restocked' },
];

interface ListingForm {
  name: string;
  description: string;
  price: string;
  discount_percent: string;
  stock: string;
  status: ProductStatus;
  category_id: string;
}

const EMPTY_FORM: ListingForm = {
  name: '',
  description: '',
  price: '',
  discount_percent: '0',
  stock: '0',
  status: 'active',
  category_id: '',
};

type StringField = 'name' | 'description' | 'price' | 'discount_percent' | 'stock' | 'category_id';

export default function SellerListingEdit() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<ListingForm>(EMPTY_FORM);
  const [product, setProduct] = useState<SellerProduct | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cats = await api.categories();
        if (!active) return;
        setCategories(cats ?? []);

        if (isEditing) {
          // No single-product seller endpoint — same pattern as orders: fetch
          // the list and find this one client-side.
          const { items } = await api.sellerProducts();
          const found = items.find((p) => p.id === id);
          if (!active) return;
          if (!found) {
            setError(new Error('This listing was not found in your store.'));
          } else {
            setProduct(found);
            setForm({
              name: found.name,
              description: found.description || '',
              price: String(found.price),
              discount_percent: String(found.discount_percent ?? 0),
              stock: String(found.stock ?? 0),
              status: found.status,
              category_id: found.category?.id || '',
            });
          }
        }
      } catch (err) {
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isEditing]);

  const set = (key: StringField) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const setStatus = (e: ChangeEvent<HTMLSelectElement>) =>
    setForm((f) => ({ ...f, status: e.target.value as ProductStatus }));

  const salePreview = useMemo(() => {
    const price = Number(form.price) || 0;
    const discount = Number(form.discount_percent) || 0;
    return price - Math.round((price * discount) / 100);
  }, [form.price, form.discount_percent]);

  const toPayload = () => ({
    name: form.name.trim(),
    description: form.description.trim(),
    price: Number(form.price),
    discount_percent: Number(form.discount_percent) || 0,
    stock: Number(form.stock) || 0,
    status: form.status,
    category_id: form.category_id || null,
  });

  const uploadStagedImages = async (productId: string, files: File[]) => {
    if (!files.length) return;
    setUploadingImages(true);
    try {
      await api.uploadProductImages(productId, files);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing && id) {
        await api.updateProduct(id, toPayload());
        if (product?.approvalStatus === 'rejected') {
          await api.resubmitProduct(id);
        }
        await uploadStagedImages(id, pendingFiles);
        useToastStore.getState().addToast('Listing saved', 'success');
      } else {
        const created = await api.createProduct(toPayload());
        await uploadStagedImages(created.id, pendingFiles);
        useToastStore.getState().addToast('Listing created — it goes live once reviewed', 'success');
      }
      navigate('/listings');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save this listing';
      useToastStore.getState().addToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFilesChosen = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPendingFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  if (loading) {
    return <div className="animate-pulse font-heading text-xl text-neutral-700">Loading listing…</div>;
  }

  if (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong reaching Arghya.';
    return (
      <div>
        <p className="mb-4 text-sm text-accent-700">{message}</p>
        <Button as={Link} to="/listings" variant="quiet">
          Back to listings
        </Button>
      </div>
    );
  }

  const categoryOptions: SelectOption[] = [
    { value: '', label: 'Uncategorised' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/listings')}
        className="mb-4 text-xs font-bold text-neutral-700 hover:text-text"
      >
        ← Back to listings
      </button>

      <div className="mb-5 flex flex-wrap items-end gap-3.5">
        <div>
          <h1 className="text-2xl md:text-3xl">{isEditing ? product?.name : 'New listing'}</h1>
          {isEditing && (
            <div className="mt-1 text-xs text-neutral-700">
              {product?.approvalStatus === 'pending' && 'In moderation'}
              {product?.approvalStatus === 'rejected' && 'Rejected — edit and resubmit'}
              {product?.approvalStatus === 'approved' && 'Live'}
            </div>
          )}
        </div>
        <Button type="submit" form="listing-form" disabled={saving || uploadingImages} className="ml-auto">
          {saving
            ? 'Saving…'
            : isEditing
              ? product?.approvalStatus === 'rejected'
                ? 'Save & resubmit'
                : 'Save changes'
              : 'Create listing'}
        </Button>
      </div>

      {product?.approvalStatus === 'rejected' && (
        <div className="mb-5 rounded-2xl border border-accent-300 bg-accent-100 p-4 text-sm text-accent-900">
          <strong className="mb-0.5 block">Held by moderation</strong>
          {product.rejectionReason || 'This listing needs changes before it can go live again.'}
        </div>
      )}
      {product?.approvalStatus === 'pending' && (
        <div className="mb-5 rounded-2xl border border-accent-300 bg-accent-100 p-4 text-sm text-accent-900">
          Your changes are reviewed before this listing goes live.
        </div>
      )}

      <form id="listing-form" onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField label="Item name" id="le-name" required value={form.name} onChange={set('name')} />
            </div>
            <Select label="Category" id="le-cat" value={form.category_id} onChange={set('category_id')} options={categoryOptions} />
            <Select label="Status" id="le-status" value={form.status} onChange={setStatus} options={STATUS_OPTIONS} />
            <TextField
              label="Shelf price the customer pays (₹)"
              id="le-price"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.price}
              onChange={set('price')}
            />
            <TextField
              label="Discount %"
              id="le-discount"
              type="number"
              min="0"
              max="100"
              value={form.discount_percent}
              onChange={set('discount_percent')}
            />
            <TextField
              label="Stock on hand"
              id="le-stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={set('stock')}
            />
            <div className="sm:col-span-2">
              <TextArea label="Description" id="le-desc" rows={4} value={form.description} onChange={set('description')} />
            </div>
          </div>

          <div>
            <span className="lbl mb-1.5 block text-xs text-neutral-700">Photos</span>
            <div className="flex flex-wrap gap-3">
              {(product?.images ?? []).map((img) => (
                <div key={img.id} className="relative h-24 w-24 overflow-hidden rounded-2xl">
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  {img.isCover && (
                    <span className="absolute bottom-1 left-1 rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold text-bg">
                      Cover
                    </span>
                  )}
                </div>
              ))}
              {pendingFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="ph relative h-24 w-24 overflow-hidden rounded-2xl border-2 border-accent text-[9px]"
                >
                  {file.name}
                </div>
              ))}
              <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-2xl border border-dashed border-neutral-400 text-[11px] text-neutral-700">
                + Add
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFilesChosen} />
              </label>
            </div>
            {!isEditing && pendingFiles.length > 0 && (
              <p className="mt-2 text-xs text-neutral-700">Photos upload once the listing is created.</p>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-3.5">
          <Card className="border border-divider p-5">
            <h2 className="mb-3 text-base">Price preview</h2>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-700">Listed price</span>
                <span>{inr(Number(form.price) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-700">Discount</span>
                <span>{form.discount_percent || 0}%</span>
              </div>
              <div className="flex justify-between border-t border-divider pt-2.5 font-heading text-lg">
                <span>Customer pays</span>
                <span>{inr(salePreview)}</span>
              </div>
            </div>
          </Card>
        </aside>
      </form>
    </div>
  );
}
