'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  User,
  Palette,
  Image as ImageIcon,
  Award,
  Crown,
  Package,
  Coins,
  Check,
  Sparkles,
  Gem,
  Star,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { CoinDisplay } from '@/components/economy/CoinDisplay';
import {
  useWallet,
  useStoreCatalog,
  usePurchaseStoreItem,
  useCoinPacks,
  usePurchasePack,
  useInventory,
  useEquipItem,
  useUnequipItem,
} from '@/hooks';
import { cn } from '@/lib/utils';
import type { StoreItem, StoreItemType, StoreItemRarity } from '@/types';

type StoreTab = 'shop' | 'packs' | 'inventory';

const TYPE_ICON: Record<StoreItemType, typeof User> = {
  avatar: User,
  theme: Palette,
  frame: ImageIcon,
  badge: Award,
  premium: Crown,
  consumable: Package,
};

const RARITY_STYLES: Record<StoreItemRarity, string> = {
  common: 'border-gray-400/30 text-gray-300 bg-gray-400/10',
  uncommon: 'border-green-400/30 text-green-400 bg-green-400/10',
  rare: 'border-blue-400/30 text-blue-400 bg-blue-400/10',
  epic: 'border-purple-400/30 text-purple-400 bg-purple-400/10',
  legendary: 'border-amber-400/30 text-amber-400 bg-amber-400/10',
};

const EQUIPPABLE: StoreItemType[] = ['avatar', 'theme', 'frame', 'badge'];

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Items' },
  { value: 'avatar', label: 'Avatars' },
  { value: 'theme', label: 'Themes' },
  { value: 'frame', label: 'Frames' },
  { value: 'badge', label: 'Badges' },
  { value: 'premium', label: 'Premium' },
  { value: 'consumable', label: 'Consumables' },
];

function StoreItemCard({
  item,
  owned,
  equipped,
  coins,
  onPurchase,
  onEquip,
  onUnequip,
  isPurchasing,
  isEquipping,
}: {
  item: StoreItem;
  owned: boolean;
  equipped: boolean;
  coins: number;
  onPurchase: () => void;
  onEquip: () => void;
  onUnequip: () => void;
  isPurchasing: boolean;
  isEquipping: boolean;
}) {
  const Icon = TYPE_ICON[item.type];
  const canAfford = coins >= item.price;
  const outOfStock = item.stock === 0;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="h-full flex flex-col" hover>
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center border',
              RARITY_STYLES[item.rarity]
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
          <Badge variant="purple" className="capitalize">
            {item.rarity}
          </Badge>
        </div>
        <h3 className="text-base font-semibold text-theme-primary font-display mb-1">{item.name}</h3>
        <p className="text-sm text-theme-muted mb-4 flex-1">{item.description}</p>

        <div className="flex items-center justify-between mt-auto">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-500">
            <Coins className="w-4 h-4" /> {item.price.toLocaleString()}
          </span>
          {owned ? (
            EQUIPPABLE.includes(item.type) ? (
              <Button
                size="sm"
                variant={equipped ? 'outline' : 'primary'}
                isLoading={isEquipping}
                onClick={equipped ? onUnequip : onEquip}
              >
                {equipped ? 'Unequip' : 'Equip'}
              </Button>
            ) : (
              <Badge variant="success">
                <Check className="w-3 h-3 mr-1" /> Owned
              </Badge>
            )
          ) : (
            <Button
              size="sm"
              disabled={!canAfford || outOfStock}
              isLoading={isPurchasing}
              onClick={onPurchase}
            >
              {outOfStock ? 'Sold Out' : canAfford ? 'Buy' : 'Not Enough'}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export default function StorePage() {
  const [tab, setTab] = useState<StoreTab>('shop');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data: walletRes } = useWallet();
  const coins = walletRes?.data.coins ?? 0;

  const type = typeFilter === 'all' ? undefined : (typeFilter as StoreItemType);
  const { data: catalogRes, isLoading: catalogLoading, isError: catalogError, refetch: refetchCatalog } =
    useStoreCatalog(type, page, 24);
  const { data: packsRes, isLoading: packsLoading } = useCoinPacks();
  const { data: inventoryRes, isLoading: inventoryLoading } = useInventory();

  const purchaseItem = usePurchaseStoreItem();
  const purchasePack = usePurchasePack();
  const equipItem = useEquipItem();
  const unequipItem = useUnequipItem();

  const catalogPage = catalogRes?.data;
  const items = catalogPage?.data ?? [];
  const packs = packsRes?.data ?? [];
  const inventory = inventoryRes?.data.inventory ?? [];
  const equippedMap = inventoryRes?.data.equipped ?? {};

  const ownedIds = useMemo(() => new Set(inventory.map((entry) => entry.itemId)), [inventory]);
  const equippedIds = useMemo(() => new Set(Object.values(equippedMap).filter(Boolean)), [equippedMap]);

  const tabs = [
    { id: 'shop', label: 'Shop', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'packs', label: 'Coin Packs', icon: <Coins className="w-4 h-4" /> },
    { id: 'inventory', label: 'Inventory', icon: <Gem className="w-4 h-4" />, count: inventory.length },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="page-heading">Store</h1>
            <p className="text-theme-muted mt-2 text-base">Spend your coins on avatars, themes, and more</p>
          </div>
          <CoinDisplay value={coins} size="lg" />
        </motion.div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Tabs tabs={tabs} activeTab={tab} onChange={(t) => setTab(t as StoreTab)} />
          {tab === 'shop' && (
            <Select
              options={TYPE_FILTERS}
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-44"
            />
          )}
        </div>

        {tab === 'shop' && (
          <>
            {catalogError ? (
              <ErrorState title="Failed to load store" message="Could not fetch store items." onRetry={refetchCatalog} />
            ) : catalogLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-56 w-full rounded-3xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState icon={<ShoppingBag className="w-9 h-9 text-theme-muted" />} title="No items found" description="Try a different category." />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {items.map((item) => (
                    <StoreItemCard
                      key={item._id}
                      item={item}
                      owned={ownedIds.has(item._id)}
                      equipped={equippedIds.has(item._id)}
                      coins={coins}
                      isPurchasing={purchaseItem.isPending}
                      isEquipping={equipItem.isPending || unequipItem.isPending}
                      onPurchase={() => purchaseItem.mutate(item._id)}
                      onEquip={() => equipItem.mutate(item._id)}
                      onUnequip={() => unequipItem.mutate(item._id)}
                    />
                  ))}
                </div>
                {catalogPage && catalogPage.pages > 1 && (
                  <div className="flex justify-center">
                    <Pagination currentPage={page} totalPages={catalogPage.pages} onPageChange={setPage} />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === 'packs' && (
          <>
            {packsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-52 w-full rounded-3xl" />
                ))}
              </div>
            ) : packs.length === 0 ? (
              <EmptyState icon={<Coins className="w-9 h-9 text-theme-muted" />} title="No coin packs available" description="Check back later." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {packs.map((pack, i) => (
                  <motion.div key={pack._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <Card
                      className={cn('h-full flex flex-col items-center text-center relative', pack.isFeatured && 'glow-border')}
                      glow={pack.isFeatured}
                    >
                      {pack.isFeatured && (
                        <Badge variant="purple" className="absolute top-4 right-4">
                          <Star className="w-3 h-3 mr-1" /> Best Value
                        </Badge>
                      )}
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-glow-purple mb-4">
                        <Coins className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-display font-bold text-theme-primary">
                        {pack.coins.toLocaleString()}
                        {pack.bonusCoins > 0 && (
                          <span className="text-theme-success text-sm font-semibold"> +{pack.bonusCoins}</span>
                        )}
                      </h3>
                      <p className="text-xs text-theme-muted mb-1">{pack.name}</p>
                      <p className="text-sm text-theme-muted mb-5 flex-1">{pack.description}</p>
                      <Button
                        className="w-full"
                        isLoading={purchasePack.isPending}
                        onClick={() => purchasePack.mutate(pack._id)}
                      >
                        {pack.priceLabel}
                      </Button>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'inventory' && (
          <>
            {inventoryLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-3xl" />
                ))}
              </div>
            ) : inventory.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="w-9 h-9 text-theme-muted" />}
                title="Your inventory is empty"
                description="Purchase items from the shop to see them here."
                action={{ label: 'Browse Shop', onClick: () => setTab('shop') }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {inventory.map((entry) => {
                  const item = entry.item;
                  if (!item) return null;
                  const Icon = TYPE_ICON[item.type];
                  const isEquipped = entry.equipped;
                  return (
                    <motion.div key={entry.itemId} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="h-full flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center border', RARITY_STYLES[item.rarity])}>
                            <Icon className="w-5 h-5" />
                          </div>
                          {isEquipped && <Badge variant="success">Equipped</Badge>}
                        </div>
                        <h3 className="text-sm font-semibold text-theme-primary font-display mb-1">{item.name}</h3>
                        <p className="text-xs text-theme-muted mb-4 flex-1 capitalize">{item.type} · {item.rarity}</p>
                        {EQUIPPABLE.includes(item.type) && (
                          <Button
                            size="sm"
                            variant={isEquipped ? 'outline' : 'primary'}
                            className="w-full"
                            isLoading={equipItem.isPending || unequipItem.isPending}
                            onClick={() =>
                              isEquipped ? unequipItem.mutate(entry.itemId) : equipItem.mutate(entry.itemId)
                            }
                          >
                            {isEquipped ? 'Unequip' : 'Equip'}
                          </Button>
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
