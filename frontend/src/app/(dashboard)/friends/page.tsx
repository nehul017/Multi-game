'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, MessageSquare, Gamepad2, Check, X, Clock, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useFriends, useFriendRequests, useSearchUsers, useAcceptFriend, useSendFriendRequest } from '@/hooks';
import { usePresence } from '@/socket/hooks';

interface FriendItem {
  _id?: string;
  id?: string;
  userId?: string;
  username: string;
  elo: number;
  status?: 'online' | 'in-game' | 'offline';
  lastSeen?: string;
  isOnline?: boolean;
}

interface FriendRequestItem {
  _id?: string;
  id?: string;
  from?: { _id?: string; id?: string; username: string; elo: number; avatar?: string };
  fromUser?: { _id?: string; id?: string; username: string; elo: number; avatar?: string };
  to?: { _id?: string; id?: string; username: string };
  toUser?: { _id?: string; id?: string; username: string };
  status: string;
}

interface SearchedUser {
  _id?: string;
  id?: string;
  username: string;
  elo: number;
  avatar?: string;
}

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState('friends');
  const [search, setSearch] = useState('');
  const [findQuery, setFindQuery] = useState('');

  const { data: friendsData, isLoading: friendsLoading, isError: friendsError, refetch: refetchFriends } = useFriends();
  const { data: requestsData, isLoading: requestsLoading } = useFriendRequests();
  const { data: searchData, isLoading: searchLoading } = useSearchUsers(findQuery);
  const acceptFriend = useAcceptFriend();
  const sendRequest = useSendFriendRequest();
  const { isUserOnline } = usePresence();

  const friendPayload = friendsData?.data as unknown;
  const friends: FriendItem[] = (Array.isArray(friendPayload) ? friendPayload : (friendPayload as Record<string, unknown>)?.data ?? []) as FriendItem[];
  const reqPayload = requestsData?.data as unknown;
  const requests: FriendRequestItem[] = (() => {
    if (!reqPayload) return [];
    if (Array.isArray(reqPayload)) return reqPayload as FriendRequestItem[];
    const rp = reqPayload as Record<string, unknown>;
    return [...(rp.incoming as FriendRequestItem[] || []), ...(rp.outgoing as FriendRequestItem[] || [])];
  })();
  const searchPayload = searchData?.data as unknown;
  const searchResults: SearchedUser[] = (Array.isArray(searchPayload) ? searchPayload : (searchPayload as Record<string, unknown>)?.data ?? []) as SearchedUser[];

  const incomingRequests = requests.filter((r) => r.status === 'pending' && (r.from || r.fromUser));
  const outgoingRequests = requests.filter((r) => r.status === 'pending' && (r.to || r.toUser));

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { id: 'friends', label: 'Friends', count: friends.length },
    { id: 'requests', label: 'Requests', count: incomingRequests.length },
    { id: 'find', label: 'Find Players' },
  ];

  const getFriendStatus = (friend: FriendItem): 'online' | 'in-game' | 'offline' => {
    const id = friend.userId || friend._id || friend.id || '';
    if (isUserOnline(id)) return 'online';
    return friend.status || 'offline';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Friends</h1>
          <p className="text-gray-400 mt-1">Manage your friends and connections</p>
        </motion.div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'friends' && (
          <div className="space-y-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Search friends..." />

            {friendsError && (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">Failed to load friends</p>
                <Button variant="outline" size="sm" onClick={() => refetchFriends()} leftIcon={<RefreshCw className="w-4 h-4" />}>Retry</Button>
              </div>
            )}

            {friendsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {!friendsLoading && !friendsError && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFriends.map((friend) => {
                  const friendId = friend._id || friend.userId || friend.id || '';
                  const status = getFriendStatus(friend);
                  return (
                    <Card key={friendId} className="flex items-center gap-4">
                      <Avatar name={friend.username} size="md" online={status === 'online'} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{friend.username}</span>
                          <StatusBadge status={status} />
                        </div>
                        <p className="text-xs text-gray-400">{friend.elo} ELO</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm"><MessageSquare className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm"><Gamepad2 className="w-4 h-4" /></Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {!friendsLoading && !friendsError && filteredFriends.length === 0 && (
              <EmptyState title="No friends found" description={search ? 'Try a different search term' : 'Add friends to get started!'} />
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4">
            {requestsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </Card>
                ))}
              </div>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-gray-400 uppercase">Incoming Requests</h3>
                {incomingRequests.length === 0 && <p className="text-sm text-gray-500">No incoming requests</p>}
                {incomingRequests.map((req) => {
                  const sender = req.from || req.fromUser;
                  const reqId = req._id || req.id || '';
                  return (
                    <Card key={reqId} className="flex items-center gap-4">
                      <Avatar name={sender?.username} size="md" />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-white">{sender?.username}</span>
                        <p className="text-xs text-gray-400">{sender?.elo} ELO</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Check className="w-4 h-4" />}
                          onClick={() => acceptFriend.mutate(reqId)}
                          disabled={acceptFriend.isPending}
                        >
                          Accept
                        </Button>
                        <Button variant="ghost" size="sm" leftIcon={<X className="w-4 h-4" />}>Decline</Button>
                      </div>
                    </Card>
                  );
                })}

                <h3 className="text-sm font-semibold text-gray-400 uppercase mt-6">Outgoing Requests</h3>
                {outgoingRequests.length === 0 && <p className="text-sm text-gray-500">No outgoing requests</p>}
                {outgoingRequests.map((req) => {
                  const target = req.to || req.toUser;
                  const reqId = req._id || req.id || '';
                  return (
                    <Card key={reqId} className="flex items-center gap-4">
                      <Avatar name={target?.username} size="md" />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-white">{target?.username}</span>
                      </div>
                      <Badge variant="warning"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
                    </Card>
                  );
                })}
              </>
            )}
          </div>
        )}

        {activeTab === 'find' && (
          <div className="space-y-4">
            <SearchInput value={findQuery} onChange={setFindQuery} placeholder="Search by username..." />

            {searchLoading && findQuery.length >= 2 && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </Card>
                ))}
              </div>
            )}

            {!searchLoading && searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((u) => {
                  const uid = u._id || u.id || '';
                  return (
                    <Card key={uid} className="flex items-center gap-4">
                      <Avatar name={u.username} size="md" />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-white">{u.username}</span>
                        <p className="text-xs text-gray-400">{u.elo} ELO</p>
                      </div>
                      <Button
                        size="sm"
                        leftIcon={<UserPlus className="w-4 h-4" />}
                        onClick={() => sendRequest.mutate(uid)}
                        disabled={sendRequest.isPending}
                      >
                        Add Friend
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}

            {!searchLoading && findQuery.length >= 2 && searchResults.length === 0 && (
              <EmptyState title="No players found" description={`No results for "${findQuery}"`} />
            )}

            {findQuery.length < 2 && (
              <EmptyState
                icon={<UserPlus className="w-8 h-8 text-gray-500" />}
                title="Find Players"
                description="Search for players by username to send friend requests"
              />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
