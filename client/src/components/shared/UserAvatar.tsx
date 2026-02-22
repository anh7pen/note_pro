'use client';

import Image from 'next/image';

interface UserAvatarProps {
    avatarUrl?: string | null;
    name?: string | null;
    email: string;
    size?: number;
    className?: string;
    variant?: 'default' | 'owner';
}

export function UserAvatar({
    avatarUrl,
    name,
    email,
    size = 32,
    className = '',
    variant = 'default',
}: UserAvatarProps) {
    const displayName = name || email;
    const initial = displayName.charAt(0).toUpperCase();

    const bgClass = variant === 'owner' ? 'bg-primary/10' : 'bg-muted';
    const textClass = variant === 'owner' ? 'text-primary' : '';

    if (avatarUrl) {
        return (
            <Image
                src={avatarUrl}
                alt={`${displayName} avatar`}
                className={`rounded-full object-cover ${className}`}
                width={size}
                height={size}
            />
        );
    }

    return (
        <div
            className={`rounded-full ${bgClass} flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}>
            <span className={`text-sm font-medium ${textClass}`}>
                {initial}
            </span>
        </div>
    );
}
