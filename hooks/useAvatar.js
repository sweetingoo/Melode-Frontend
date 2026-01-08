"use client";

import { useState, useEffect, useRef } from "react";
import { extractAvatarFileReference, getAvatarUrl } from "@/utils/avatar";

/**
 * Hook to get fresh avatar URL from file reference or URL
 * Handles caching and automatic refresh of expired URLs
 * @param {string|number|null} avatarValue - Avatar URL or file reference
 * @returns {object} { avatarUrl, isLoading, error }
 */
export function useAvatar(avatarValue) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const urlCacheRef = useRef(new Map()); // Cache URLs by file reference
  const refreshTimerRef = useRef(null);

  useEffect(() => {
    if (!avatarValue) {
      setAvatarUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Extract file reference from avatar value
    const fileReference = extractAvatarFileReference(avatarValue);
    
    // If it's already a valid URL (not a file reference), use it directly
    if (!fileReference && typeof avatarValue === 'string' && avatarValue.startsWith('http')) {
      setAvatarUrl(avatarValue);
      setIsLoading(false);
      setError(null);
      return;
    }

    // If no file reference found, clear state
    if (!fileReference) {
      setAvatarUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Check cache first
    const cacheKey = String(fileReference);
    const cached = urlCacheRef.current.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      setAvatarUrl(cached.url);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Fetch fresh URL
    const fetchAvatarUrl = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const url = await getAvatarUrl(fileReference);
        
        if (url) {
          // Cache the URL (assume 10 minutes expiry, refresh 1 minute before)
          const expiresIn = 600; // 10 minutes
          urlCacheRef.current.set(cacheKey, {
            url,
            expiresAt: Date.now() + expiresIn * 1000 - 60000, // Refresh 1 minute before expiry
          });

          setAvatarUrl(url);
          
          // Schedule refresh 1 minute before expiry
          if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
          }
          
          refreshTimerRef.current = setTimeout(() => {
            // Clear cache to force refresh on next access
            urlCacheRef.current.delete(cacheKey);
            // Trigger refresh by updating state
            setAvatarUrl(null);
            setIsLoading(true);
          }, (expiresIn - 60) * 1000);
        } else {
          throw new Error('No URL received from file service');
        }
      } catch (err) {
        console.error('Failed to fetch avatar URL:', err);
        setError(err);
        setAvatarUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvatarUrl();

    // Cleanup timer on unmount or value change
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [avatarValue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      urlCacheRef.current.clear();
    };
  }, []);

  return { avatarUrl, isLoading, error };
}
