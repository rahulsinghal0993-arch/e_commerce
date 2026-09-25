'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@arghya/api-client';
import { useToastStore, Button, TextField } from '@arghya/ui';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';
import type { CustomerShippingAddress, CustomerUser } from '../../lib/serverTypes.js';

const EMPTY_ADDRESS: Required<CustomerShippingAddress> = {
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  pin: '',
  phone: '',
};

export function AccountClient() {
  const { user, userRole, loading: authLoading, logout, applyUserPatch } = useAuth();
  const addToast = useToastStore((s) => s.addToast);
  const router = useRouter();

  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '' });
  const [addressForm, setAddressForm] = useState<Required<CustomerShippingAddress>>(EMPTY_ADDRESS);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && userRole !== 'customer') {
      router.replace('/sign-in?next=/account');
    }
  }, [authLoading, userRole, router]);

  useEffect(() => {
    if (!user) return;
    setProfileForm({ fullName: user.fullName ?? '', phone: user.phone ?? '' });
    if (user.shippingAddress) {
      setAddressForm({
        firstName: user.shippingAddress.firstName ?? '',
        lastName: user.shippingAddress.lastName ?? '',
        address: user.shippingAddress.address ?? '',
        city: user.shippingAddress.city ?? '',
        pin: user.shippingAddress.pin ?? '',
        phone: user.shippingAddress.phone ?? '',
      });
    }
  }, [user]);

  if (authLoading || userRole !== 'customer') {
    return <div className="px-4 md:px-11 py-6 max-w-[720px] mx-auto w-full text-sm text-neutral-700">Checking your session…</div>;
  }

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await api.updateProfile({ fullName: profileForm.fullName, phone: profileForm.phone });
      applyUserPatch(updated as CustomerUser);
      addToast('Profile updated.', 'success');
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Could not update your profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const updated = await api.updateProfile({ shippingAddress: addressForm });
      applyUserPatch(updated as CustomerUser);
      addToast('Delivery address saved.', 'success');
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Could not save your address.', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await api.changePassword(passwordForm);
      addToast('Password updated.', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Could not update your password.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="px-4 md:px-11 py-6 max-w-[720px] mx-auto w-full flex flex-col gap-8">
      <div>
        <div className="flex items-center gap-3.5 mb-1">
          <div className="w-14 h-14 rounded-full bg-surface border border-divider grid place-items-center overflow-hidden shrink-0">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-heading text-xl text-accent-700">{(user?.fullName || 'A').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl m-0">{user?.fullName || 'Your account'}</h1>
            <p className="text-sm text-neutral-700 m-0">{user?.email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="p-5 rounded-3xl bg-surface flex flex-col gap-3.5">
        <h2 className="text-lg m-0">Your details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <TextField
            label="Full name"
            value={profileForm.fullName}
            onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
          />
          <TextField
            label="Mobile"
            type="tel"
            value={profileForm.phone}
            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
          />
        </div>
        <Button type="submit" disabled={savingProfile} className="self-start">
          {savingProfile ? 'Saving…' : 'Save changes'}
        </Button>
      </form>

      <form onSubmit={handleSaveAddress} className="p-5 rounded-3xl bg-surface flex flex-col gap-3.5">
        <h2 className="text-lg m-0">Default delivery address</h2>
        <p className="text-xs text-neutral-700 -mt-2 m-0">Used to pre-fill checkout.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <TextField
            label="First name"
            value={addressForm.firstName}
            onChange={(e) => setAddressForm({ ...addressForm, firstName: e.target.value })}
          />
          <TextField
            label="Last name"
            value={addressForm.lastName}
            onChange={(e) => setAddressForm({ ...addressForm, lastName: e.target.value })}
          />
        </div>
        <TextField
          label="Address"
          value={addressForm.address}
          onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <TextField label="City" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
          <TextField label="PIN code" value={addressForm.pin} onChange={(e) => setAddressForm({ ...addressForm, pin: e.target.value })} />
        </div>
        <TextField
          label="Phone number"
          type="tel"
          value={addressForm.phone}
          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
        />
        <Button type="submit" disabled={savingAddress} className="self-start">
          {savingAddress ? 'Saving…' : 'Save address'}
        </Button>
      </form>

      <form onSubmit={handleChangePassword} className="p-5 rounded-3xl bg-surface flex flex-col gap-3.5">
        <h2 className="text-lg m-0">Change password</h2>
        <TextField
          label="Current password"
          type="password"
          value={passwordForm.currentPassword}
          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
        />
        <TextField
          label="New password"
          type="password"
          required
          value={passwordForm.newPassword}
          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
        />
        <Button type="submit" variant="ghost" disabled={savingPassword} className="self-start">
          {savingPassword ? 'Updating…' : 'Update password'}
        </Button>
      </form>

      <Button type="button" variant="quiet" onClick={handleLogout} className="self-start">
        Sign out
      </Button>
    </div>
  );
}
