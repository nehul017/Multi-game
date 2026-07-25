'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Coins,
  Plus,
  Pencil,
  Trash2,
  User,
  Palette,
  Image as ImageIcon,
  Award,
  Crown,
  Package,
  Star,
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useAdminStoreItems,
  useCreateStoreItem,
  useUpdateStoreItem,
  useDeleteStoreItem,
  useAdminCoinPacks,
  useCreateCoinPack,
  useUpdateCoinPack,
  useDeleteCoinPack,
} from '@/hooks';
import type { StoreItem, CoinPack, StoreItemType, StoreItemRarity } from '@/types';

const TYPE_ICON: Record<StoreItemType, typeof User> = {
  avatar: User,
  theme: Palette,
  frame: ImageIcon,
  badge: Award,
  premium: Crown,
  consumable: Package,
};

const TYPE_OPTIONS = [
  { value: 'avatar', label: 'Avatar' },
  { value: 'theme', label: 'Theme' },
  { value: 'frame', label: 'Frame' },
  { value: 'badge', label: 'Badge' },
  { value: 'premium', label: 'Premium' },
  { value: 'consumable', label: 'Consumable' },
];

const RARITY_OPTIONS = [
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'epic', label: 'Epic' },
  { value: 'legendary', label: 'Legendary' },
];

const ITEM_FORM_DEFAULT = {
  name: '',
  description: '',
  type: 'avatar' as StoreItemType,
  rarity: 'common' as StoreItemRarity,
  price: '100',
  image: '',
  stock: '-1',
  isPremium: false,
};

const PACK_FORM_DEFAULT = {
  name: '',
  description: '',
  coins: '100',
  bonusCoins: '0',
  priceLabel: '$0.99',
  sortOrder: '0',
  isFeatured: false,
};

type AdminTab = 'items' | 'packs';

export default function AdminStorePage() {
  const [tab, setTab] = useState<AdminTab>('items');

  const [itemModal, setItemModal] = useState<{ mode: 'create' | 'edit'; id?: string } | null>(null);
  const [itemForm, setItemForm] = useState(ITEM_FORM_DEFAULT);

  const [packModal, setPackModal] = useState<{ mode: 'create' | 'edit'; id?: string } | null>(null);
  const [packForm, setPackForm] = useState(PACK_FORM_DEFAULT);

  const { data: itemsRes, isLoading: itemsLoading, isError: itemsError, refetch: refetchItems } = useAdminStoreItems();
  const { data: packsRes, isLoading: packsLoading, isError: packsError, refetch: refetchPacks } = useAdminCoinPacks();

  const createItem = useCreateStoreItem();
  const updateItem = useUpdateStoreItem();
  const deleteItem = useDeleteStoreItem();

  const createPack = useCreateCoinPack();
  const updatePack = useUpdateCoinPack();
  const deletePack = useDeleteCoinPack();

  const items = itemsRes?.data.data ?? [];
  const packs = packsRes?.data.data ?? [];

  const openCreateItem = () => {
    setItemForm(ITEM_FORM_DEFAULT);
    setItemModal({ mode: 'create' });
  };

  const openEditItem = (item: StoreItem) => {
    setItemForm({
      name: item.name,
      description: item.description,
      type: item.type,
      rarity: item.rarity,
      price: String(item.price),
      image: item.image || '',
      stock: String(item.stock),
      isPremium: item.isPremium,
    });
    setItemModal({ mode: 'edit', id: item._id });
  };

  const handleItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: itemForm.name.trim(),
      description: itemForm.description.trim(),
      type: itemForm.type,
      rarity: itemForm.rarity,
      price: Number(itemForm.price),
      image: itemForm.image.trim(),
      stock: Number(itemForm.stock),
      isPremium: itemForm.isPremium,
    };
    if (!payload.name || !payload.description) return;

    if (itemModal?.mode === 'create') {
      createItem.mutate(payload, { onSuccess: () => setItemModal(null) });
    } else if (itemModal?.id) {
      updateItem.mutate({ id: itemModal.id, data: payload }, { onSuccess: () => setItemModal(null) });
    }
  };

  const openCreatePack = () => {
    setPackForm(PACK_FORM_DEFAULT);
    setPackModal({ mode: 'create' });
  };

  const openEditPack = (pack: CoinPack) => {
    setPackForm({
      name: pack.name,
      description: pack.description,
      coins: String(pack.coins),
      bonusCoins: String(pack.bonusCoins),
      priceLabel: pack.priceLabel,
      sortOrder: String(pack.sortOrder),
      isFeatured: pack.isFeatured,
    });
    setPackModal({ mode: 'edit', id: pack._id });
  };

  const handlePackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: packForm.name.trim(),
      description: packForm.description.trim(),
      coins: Number(packForm.coins),
      bonusCoins: Number(packForm.bonusCoins),
      priceLabel: packForm.priceLabel.trim(),
      sortOrder: Number(packForm.sortOrder),
      isFeatured: packForm.isFeatured,
    };
    if (!payload.name || !payload.description || !payload.priceLabel) return;

    if (packModal?.mode === 'create') {
      createPack.mutate(payload, { onSuccess: () => setPackModal(null) });
    } else if (packModal?.id) {
      updatePack.mutate({ id: packModal.id, data: payload }, { onSuccess: () => setPackModal(null) });
    }
  };

  const tabs = [
    { id: 'items', label: 'Store Items', icon: <ShoppingBag className="w-4 h-4" />, count: items.length },
    { id: 'packs', label: 'Coin Packs', icon: <Coins className="w-4 h-4" />, count: packs.length },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Store Management</h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">Manage shop items and coin packs</p>
          </div>
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={tab === 'items' ? openCreateItem : openCreatePack}
            className="w-full sm:w-auto shrink-0"
          >
            {tab === 'items' ? 'Add Item' : 'Add Pack'}
          </Button>
        </motion.div>

        <Tabs tabs={tabs} activeTab={tab} onChange={(t) => setTab(t as AdminTab)} />

        {tab === 'items' && (
          <>
            {itemsError ? (
              <ErrorState title="Failed to load store items" onRetry={refetchItems} />
            ) : itemsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-52 w-full rounded-2xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState title="No store items" description="Add your first store item." action={{ label: 'Add Item', onClick: openCreateItem }} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item, i) => {
                  const Icon = TYPE_ICON[item.type];
                  return (
                    <motion.div key={item._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-primary-500/20 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-primary-400" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                              <p className="text-xs text-gray-400 capitalize">{item.type} · {item.rarity}</p>
                            </div>
                          </div>
                          <Switch
                            checked={item.isActive}
                            onChange={(checked) => updateItem.mutate({ id: item._id, data: { isActive: checked } })}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{item.description}</p>
                        <div className="flex items-center justify-between text-sm mb-3">
                          <span className="flex items-center gap-1 text-amber-400 font-semibold">
                            <Coins className="w-3.5 h-3.5" /> {item.price}
                          </span>
                          <span className="text-gray-400">{item.stock === -1 ? 'Unlimited' : `${item.stock} left`}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" leftIcon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEditItem(item)}>
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => confirm(`Delete "${item.name}"?`) && deleteItem.mutate(item._id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === 'packs' && (
          <>
            {packsError ? (
              <ErrorState title="Failed to load coin packs" onRetry={refetchPacks} />
            ) : packsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-52 w-full rounded-2xl" />
                ))}
              </div>
            ) : packs.length === 0 ? (
              <EmptyState title="No coin packs" description="Add your first coin pack." action={{ label: 'Add Pack', onClick: openCreatePack }} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {packs.map((pack, i) => (
                  <motion.div key={pack._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                            <Coins className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                              {pack.name}
                              {pack.isFeatured && <Star className="w-3.5 h-3.5 text-amber-400" />}
                            </h3>
                            <p className="text-xs text-gray-400">{pack.priceLabel}</p>
                          </div>
                        </div>
                        <Switch
                          checked={pack.isActive}
                          onChange={(checked) => updatePack.mutate({ id: pack._id, data: { isActive: checked } })}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mb-3 line-clamp-2">{pack.description}</p>
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-white font-semibold">
                          {pack.coins.toLocaleString()}
                          {pack.bonusCoins > 0 && <span className="text-green-400"> +{pack.bonusCoins}</span>}
                        </span>
                        <Badge variant={pack.isFeatured ? 'purple' : 'default'}>{pack.isFeatured ? 'Featured' : 'Standard'}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" leftIcon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEditPack(pack)}>
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => confirm(`Delete "${pack.name}"?`) && deletePack.mutate(pack._id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Item Modal */}
        <Modal isOpen={itemModal !== null} onClose={() => setItemModal(null)} title={itemModal?.mode === 'edit' ? 'Edit Item' : 'Add Store Item'} size="md">
          <form className="space-y-4" onSubmit={handleItemSubmit}>
            <Input label="Name" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} required />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
              <textarea
                className="w-full bg-surface border border-surface-lighter rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 min-h-[70px] resize-y"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Type" options={TYPE_OPTIONS} value={itemForm.type} onChange={(e) => setItemForm({ ...itemForm, type: e.target.value as StoreItemType })} />
              <Select label="Rarity" options={RARITY_OPTIONS} value={itemForm.rarity} onChange={(e) => setItemForm({ ...itemForm, rarity: e.target.value as StoreItemRarity })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price (coins)" type="number" min={0} value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} required />
              <Input label="Stock (-1 = unlimited)" type="number" value={itemForm.stock} onChange={(e) => setItemForm({ ...itemForm, stock: e.target.value })} required />
            </div>
            <Input label="Image URL (optional)" value={itemForm.image} onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })} />
            <Switch checked={itemForm.isPremium} onChange={(checked) => setItemForm({ ...itemForm, isPremium: checked })} label="Premium item" />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setItemModal(null)}>Cancel</Button>
              <Button type="submit" className="flex-1" isLoading={createItem.isPending || updateItem.isPending}>
                {itemModal?.mode === 'edit' ? 'Save Changes' : 'Create Item'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Pack Modal */}
        <Modal isOpen={packModal !== null} onClose={() => setPackModal(null)} title={packModal?.mode === 'edit' ? 'Edit Coin Pack' : 'Add Coin Pack'} size="md">
          <form className="space-y-4" onSubmit={handlePackSubmit}>
            <Input label="Name" value={packForm.name} onChange={(e) => setPackForm({ ...packForm, name: e.target.value })} required />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
              <textarea
                className="w-full bg-surface border border-surface-lighter rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 min-h-[70px] resize-y"
                value={packForm.description}
                onChange={(e) => setPackForm({ ...packForm, description: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Coins" type="number" min={1} value={packForm.coins} onChange={(e) => setPackForm({ ...packForm, coins: e.target.value })} required />
              <Input label="Bonus Coins" type="number" min={0} value={packForm.bonusCoins} onChange={(e) => setPackForm({ ...packForm, bonusCoins: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price Label" placeholder="e.g. $4.99" value={packForm.priceLabel} onChange={(e) => setPackForm({ ...packForm, priceLabel: e.target.value })} required />
              <Input label="Sort Order" type="number" value={packForm.sortOrder} onChange={(e) => setPackForm({ ...packForm, sortOrder: e.target.value })} />
            </div>
            <Switch checked={packForm.isFeatured} onChange={(checked) => setPackForm({ ...packForm, isFeatured: checked })} label="Featured (Best Value)" />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setPackModal(null)}>Cancel</Button>
              <Button type="submit" className="flex-1" isLoading={createPack.isPending || updatePack.isPending}>
                {packModal?.mode === 'edit' ? 'Save Changes' : 'Create Pack'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
