"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAvatar } from "@/hooks/useAvatar";
import { Loader2 } from "lucide-react";

/**
 * Avatar component that handles file references and fetches fresh URLs
 * @param {object} props
 * @param {string|number|null} props.avatarValue - Avatar URL or file reference
 * @param {string} props.alt - Alt text for the avatar
 * @param {string} props.fallback - Fallback text/initials
 * @param {string} props.className - Additional CSS classes
 * @param {object} props.avatarProps - Additional props to pass to Avatar component
 * @param {object} props.imageProps - Additional props to pass to AvatarImage component
 * @param {object} props.fallbackProps - Additional props to pass to AvatarFallback component
 */
export function AvatarWithUrl({
  avatarValue,
  alt = "Avatar",
  fallback = "U",
  className,
  avatarProps = {},
  imageProps = {},
  fallbackProps = {},
  onImageLoad,
}) {
  const { avatarUrl, isLoading } = useAvatar(avatarValue);

  const handleImageLoad = () => {
    if (onImageLoad) {
      onImageLoad();
    }
  };

  return (
    <Avatar className={className} {...avatarProps}>
      {isLoading ? (
        <AvatarFallback className="flex items-center justify-center" {...fallbackProps}>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </AvatarFallback>
      ) : (
        <>
          {avatarUrl && (
            <AvatarImage 
              src={avatarUrl} 
              alt={alt} 
              {...imageProps}
              onLoad={handleImageLoad}
            />
          )}
          <AvatarFallback {...fallbackProps}>{fallback}</AvatarFallback>
        </>
      )}
    </Avatar>
  );
}
