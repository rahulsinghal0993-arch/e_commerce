import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button, Card, TextField, TextArea, useToastStore } from '@arghya/ui';
import { useAuth } from '../context/AuthContext.js';
import { useStore } from '../context/StoreContext.js';
import { api } from '../lib/api.js';

function ComingSoonField({ label }: { label: string }) {
  return (
    <div>
      <label className="lbl mb-1.5 block text-xs text-neutral-700">{label}</label>
      <input
        disabled
        placeholder="Coming soon"
        className="min-h-[44px] w-full rounded-full border border-dashed border-divider bg-neutral-100 px-4 text-sm text-neutral-600 outline-none"
      />
    </div>
  );
}

interface StoreForm {
  name: string;
  description: string;
}

interface AccountForm {
  fullName: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
}

export default function SellerProfile() {
  const { user, applyUserPatch } = useAuth();
  const { store, loading: storeLoading, setStore } = useStore();

  const [storeForm, setStoreForm] = useState<StoreForm>({ name: '', description: '' });
  const [savingStore, setSavingStore] = useState(false);

  const [accountForm, setAccountForm] = useState<AccountForm>({ fullName: '' });
  const [savingAccount, setSavingAccount] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [emailForm, setEmailForm] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({ currentPassword: '', newPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (store) setStoreForm({ name: store.name || '', description: store.description || '' });
  }, [store]);

  useEffect(() => {
    if (user) setAccountForm({ fullName: user.fullName || '' });
  }, [user]);

  const handleSaveStore = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingStore(true);
    try {
      const updated = await api.updateSellerStore(storeForm);
      setStore(updated);
      useToastStore.getState().addToast('Store profile saved', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save your store profile';
      useToastStore.getState().addToast(message, 'error');
    } finally {
      setSavingStore(false);
    }
  };

  const handleSaveAccount = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingAccount(true);
    try {
      const updated = await api.updateProfile({ fullName: accountForm.fullName });
      applyUserPatch(updated);
      useToastStore.getState().addToast('Account details saved', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save your account details';
      useToastStore.getState().addToast(message, 'error');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const updated = await api.uploadAvatar(file);
      applyUserPatch(updated);
      useToastStore.getState().addToast('Photo updated', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload that photo';
      useToastStore.getState().addToast(message, 'error');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleChangeEmail = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!emailForm) return;
    setSavingEmail(true);
    try {
      const updated = await api.changeEmail(emailForm);
      applyUserPatch(updated);
      setEmailForm('');
      useToastStore.getState().addToast('Email updated', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update your email';
      useToastStore.getState().addToast(message, 'error');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await api.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      useToastStore.getState().addToast('Password updated', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update your password';
      useToastStore.getState().addToast(message, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl">Store profile</h1>
        <div className="mt-1 text-xs text-neutral-700">This is what a customer sees on your seller page.</div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          <Card className="p-5">
            <form onSubmit={handleSaveStore} className="flex flex-col gap-3.5">
              <h2 className="text-lg">Store</h2>
              <TextField
                label="Store name"
                id="sp-name"
                required
                disabled={storeLoading}
                value={storeForm.name}
                onChange={(e) => setStoreForm((f) => ({ ...f, name: e.target.value }))}
              />
              <TextArea
                label="About, shown on your seller page"
                id="sp-about"
                rows={4}
                disabled={storeLoading}
                value={storeForm.description}
                onChange={(e) => setStoreForm((f) => ({ ...f, description: e.target.value }))}
              />
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <ComingSoonField label="City" />
                <ComingSoonField label="Daily dispatch cut-off" />
              </div>
              <Button type="submit" disabled={savingStore || storeLoading} className="self-start">
                {savingStore ? 'Saving…' : 'Save store profile'}
              </Button>
            </form>
          </Card>

          <Card className="p-5">
            <form onSubmit={handleSaveAccount} className="flex flex-col gap-3.5">
              <h2 className="text-lg">Your account</h2>
              <div className="flex items-center gap-3.5">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <span className="ph grid h-14 w-14 place-items-center rounded-full text-xs">
                    {(user?.fullName || user?.email || '?').slice(0, 2).toUpperCase()}
                  </span>
                )}
                <label className="cursor-pointer text-xs font-bold text-accent-700">
                  {avatarUploading ? 'Uploading…' : 'Change photo'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
              <TextField
                label="Your name"
                id="sp-fullname"
                value={accountForm.fullName}
                onChange={(e) => setAccountForm({ fullName: e.target.value })}
              />
              <Button type="submit" disabled={savingAccount} className="self-start">
                {savingAccount ? 'Saving…' : 'Save account details'}
              </Button>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3.5 text-lg">Security</h2>
            <form onSubmit={handleChangeEmail} className="mb-5 flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <TextField
                  label={`Change email (current: ${user?.email || ''})`}
                  id="sp-email"
                  type="email"
                  placeholder="new@email.com"
                  value={emailForm}
                  onChange={(e) => setEmailForm(e.target.value)}
                />
              </div>
              <Button type="submit" variant="quiet" disabled={savingEmail || !emailForm}>
                {savingEmail ? 'Saving…' : 'Update email'}
              </Button>
            </form>
            <form onSubmit={handleChangePassword} className="flex flex-wrap items-end gap-3">
              <div className="min-w-[180px] flex-1">
                <TextField
                  label="Current password"
                  id="sp-current-password"
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
                />
              </div>
              <div className="min-w-[180px] flex-1">
                <TextField
                  label="New password"
                  id="sp-new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                />
              </div>
              <Button
                type="submit"
                variant="quiet"
                disabled={savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
              >
                {savingPassword ? 'Saving…' : 'Update password'}
              </Button>
            </form>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-dashed border-divider p-5 text-sm text-neutral-700">
            <h2 className="mb-2 text-base text-text">Your standing</h2>
            Rating, on-time dispatch and return rate aren't tracked yet — this panel is coming soon.
          </div>
          <div className="rounded-2xl border border-dashed border-divider p-5 text-sm text-neutral-700">
            <h2 className="mb-2 text-base text-text">Documents on file</h2>
            GST, FSSAI and bank verification aren't stored yet — this panel is coming soon.
          </div>
        </aside>
      </div>
    </div>
  );
}
