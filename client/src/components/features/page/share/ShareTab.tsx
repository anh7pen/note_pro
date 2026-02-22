'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { FiShare2 } from 'react-icons/fi';
import { SharedUsersList, SharedUser } from './SharedUsersList';
import {
    UserEmailAutocomplete,
    UserSearchResult,
} from './UserEmailAutocomplete';
import {
    useShareDocumentWithUserMutation,
    useRemoveDocumentAccessMutation,
    useUpdateDocumentPermissionMutation,
    useGetDocumentSharedUsersQuery,
} from '@/graphql/mutations/__generated__/document-share.generated';
import { useUserId } from '@/hooks/useAuth';
import { useDocumentPermission } from '@/hooks/useDocumentPermission';
import {
    handleMutationError,
    handleMutationSuccess,
} from '@/lib/error-handler';
import { PermissionType as PermissionTypeEnum } from '@/types/types';

interface ShareTabProps {
    documentId: string;
}

export function ShareTab({ documentId }: ShareTabProps) {
    const currentUserId = useUserId();
    const { permissionType } = useDocumentPermission(documentId);
    const isOwner = permissionType === PermissionTypeEnum.OWNER;
    const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
    const [owner, setOwner] = useState<SharedUser | null>(null);

    const { data, refetch } = useGetDocumentSharedUsersQuery({
        variables: { documentId },
        skip: !documentId,
    });

    const [shareDocument] = useShareDocumentWithUserMutation();
    const [removeAccess] = useRemoveDocumentAccessMutation();
    const [updatePermission] = useUpdateDocumentPermissionMutation();

    // Transform GraphQL data to SharedUser format
    const mapToSharedUser = useCallback(
        (ar: NonNullable<typeof data>['access_requests'][0]): SharedUser => ({
            id: ar.requester_id,
            email: ar.requester?.email || '',
            name: ar.requester?.name || undefined,
            role: ar.permission_type === 'write' ? 'editor' : 'viewer',
            avatar_url: ar.requester?.avatar_url || undefined,
        }),
        []
    );

    const mapToOwner = useCallback(
        (
            ownerData: NonNullable<typeof data>['blocks_by_pk']
        ): SharedUser | null => {
            if (!ownerData?.user) return null;
            return {
                id: ownerData.user.id,
                email: ownerData.user.email,
                name: ownerData.user.name || undefined,
                role: 'owner',
                avatar_url: ownerData.user.avatar_url || undefined,
            };
        },
        []
    );

    useEffect(() => {
        if (data?.access_requests) {
            setSharedUsers(data.access_requests.map(mapToSharedUser));
        }

        if (data?.blocks_by_pk) {
            setOwner(mapToOwner(data.blocks_by_pk));
        }
    }, [data, mapToSharedUser, mapToOwner]);

    const excludeUserIds = useMemo(() => {
        const ids = sharedUsers.map((user) => user.id);
        if (owner) ids.push(owner.id);
        return ids;
    }, [sharedUsers, owner]);

    const handleSelectUser = async (user: UserSearchResult) => {
        if (!currentUserId) return;

        try {
            await shareDocument({
                variables: {
                    documentId,
                    userId: user.id,
                    ownerId: currentUserId,
                    permissionType: 'read',
                },
            });

            handleMutationSuccess(`Shared document with ${user.email}`);
            refetch();
        } catch (error) {
            handleMutationError(error, 'share document');
        }
    };

    const handleRoleChange = async (
        userId: string,
        newRole: 'viewer' | 'editor'
    ) => {
        try {
            await updatePermission({
                variables: {
                    documentId,
                    userId,
                    permissionType: newRole === 'editor' ? 'write' : 'read',
                },
            });

            handleMutationSuccess('Permission updated');
            refetch();
        } catch (error) {
            handleMutationError(error, 'update permission');
        }
    };

    const handleRemoveUser = async (userId: string) => {
        try {
            await removeAccess({
                variables: {
                    documentId,
                    userId,
                },
            });

            handleMutationSuccess('Access removed');
            refetch();
        } catch (error) {
            handleMutationError(error, 'remove access');
        }
    };

    return (
        <div className="py-4 px-2">
            <div className="flex items-center gap-2">
                <FiShare2 className="h-4 w-4" />
                <h3 className="text-sm font-bold">Invite to Collaborate</h3>
            </div>
            <p className="text-sm text-muted-foreground my-2">
                For easy collaboration with anyone, even without a Bin account
            </p>

            {isOwner && (
                <UserEmailAutocomplete
                    onSelectUser={handleSelectUser}
                    excludeUserIds={excludeUserIds}
                    placeholder="Add emails to invite"
                />
            )}

            <SharedUsersList
                users={sharedUsers}
                owner={owner}
                onRoleChange={handleRoleChange}
                onRemoveUser={handleRemoveUser}
                currentUserId={currentUserId || undefined}
                canManageUsers={isOwner}
                isLoading={!data}
            />
        </div>
    );
}
