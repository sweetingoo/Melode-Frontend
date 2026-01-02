"use client";

import { useEffect, useRef, useState } from "react";
import { filesService } from "@/services/files";

/**
 * Hook to process HTML content and replace data-src-id attributes with fresh pre-signed URLs
 * Also handles URL refresh on expiration and migration from old URL patterns
 */
export function useFileReferences(htmlContent) {
  const [processedHtml, setProcessedHtml] = useState(htmlContent || "");
  const urlCacheRef = useRef(new Map()); // Cache URLs by file_id
  const refreshTimersRef = useRef(new Map()); // Track refresh timers
  const containerRef = useRef(null);

  // Migrate old content patterns to data-src-id
  const migrateOldContent = (html) => {
    if (!html) return html;

    let migrated = html;

    // Convert old API download patterns to data-src-id
    // Pattern: /api/v1/files/{id}/download or /files/{id}/download
    migrated = migrated.replace(
      /(src|href)=["']([^"']*\/api\/v1\/files\/(\d+)\/download[^"']*)["']/gi,
      (match, attr, url, fileId) => {
        return `${attr}="#" data-src-id="${fileId}"`;
      }
    );

    // Also handle patterns without /api/v1 prefix
    migrated = migrated.replace(
      /(src|href)=["']([^"']*\/files\/(\d+)\/download[^"']*)["']/gi,
      (match, attr, url, fileId) => {
        return `${attr}="#" data-src-id="${fileId}"`;
      }
    );

    return migrated;
  };

  // Load file URL for a given file ID
  const loadFileUrl = async (fileId) => {
    if (!fileId) return null;

    // Check cache first
    const cached = urlCacheRef.current.get(fileId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }

    try {
      const response = await filesService.getFileUrl(fileId);
      const url = response.url;
      const expiresIn = response.expires_in_seconds || 600; // Default 10 minutes

      // Cache the URL
      urlCacheRef.current.set(fileId, {
        url,
        expiresAt: Date.now() + expiresIn * 1000 - 60000, // Refresh 1 minute before expiry
      });

      // Schedule refresh 1 minute before expiry
      if (refreshTimersRef.current.has(fileId)) {
        clearTimeout(refreshTimersRef.current.get(fileId));
      }

      const refreshTimer = setTimeout(() => {
        // Clear cache to force refresh on next access
        urlCacheRef.current.delete(fileId);
        refreshTimersRef.current.delete(fileId);
        // Refresh all elements with this file_id
        if (containerRef.current) {
          refreshFileReferences(containerRef.current);
        }
      }, (expiresIn - 60) * 1000);

      refreshTimersRef.current.set(fileId, refreshTimer);

      return url;
    } catch (error) {
      console.error(`Failed to load file URL for file ${fileId}:`, error);
      return null;
    }
  };

  // Process HTML and replace data-src-id with URLs
  const processHtmlContent = async (html) => {
    if (!html) return html;

    // First migrate old content
    let processed = migrateOldContent(html);

    // Parse HTML to find all elements with data-src-id
    const parser = new DOMParser();
    const doc = parser.parseFromString(processed, "text/html");
    const elements = doc.querySelectorAll("[data-src-id]");

    // Collect all file IDs
    const fileIds = Array.from(elements).map((el) => {
      const fileId = el.getAttribute("data-src-id");
      return fileId ? parseInt(fileId, 10) : null;
    }).filter(Boolean);

    // Load all URLs in parallel
    const urlPromises = fileIds.map(async (fileId) => {
      const url = await loadFileUrl(fileId);
      return { fileId, url };
    });

    const urlResults = await Promise.all(urlPromises);
    const urlMap = new Map(urlResults.map(({ fileId, url }) => [fileId, url]));

    // Replace data-src-id with actual URLs
    elements.forEach((el) => {
      const fileId = el.getAttribute("data-src-id");
      if (!fileId) return;

      const fileIdNum = parseInt(fileId, 10);
      const url = urlMap.get(fileIdNum);

      if (url) {
        if (el.tagName === "IMG") {
          el.setAttribute("src", url);
          // Keep data-src-id for error handling
        } else if (el.tagName === "A") {
          el.setAttribute("href", url);
          // Keep data-src-id for error handling
        }
      }
    });

    // Return the body's innerHTML (not the full document)
    // DOMParser.parseFromString with "text/html" always creates a full document
    // The body will contain our content
    return doc.body.innerHTML;
  };

  // Refresh file references in a container element
  const refreshFileReferences = async (container) => {
    if (!container) return;

    const elements = container.querySelectorAll("[data-src-id]");
    
    for (const element of elements) {
      const fileId = element.getAttribute("data-src-id");
      if (!fileId) continue;

      try {
        const url = await loadFileUrl(parseInt(fileId, 10));
        if (url) {
          if (element.tagName === "IMG") {
            element.src = url;
          } else if (element.tagName === "A") {
            element.href = url;
          }
        }
      } catch (error) {
        console.error(`Failed to refresh URL for file ${fileId}:`, error);
      }
    }
  };

  // Process HTML content when it changes
  useEffect(() => {
    if (htmlContent) {
      processHtmlContent(htmlContent).then(setProcessedHtml);
    } else {
      setProcessedHtml("");
    }
  }, [htmlContent]);

  // Set up error handlers for expired URLs
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const images = container.querySelectorAll("img[data-src-id]");
    const links = container.querySelectorAll("a[data-src-id]");

    const handleImageError = async function () {
      const fileId = this.getAttribute("data-src-id");
      if (fileId) {
        try {
          const freshUrl = await loadFileUrl(parseInt(fileId, 10));
          if (freshUrl) {
            this.src = freshUrl;
          }
        } catch (error) {
          console.error(`Failed to refresh expired image URL for file ${fileId}:`, error);
        }
      }
    };

    const handleLinkError = async function (e) {
      // For links, we can't detect "expired" easily, but we can refresh on click if needed
      const fileId = this.getAttribute("data-src-id");
      if (fileId && (!this.href || this.href === "#")) {
        try {
          const freshUrl = await loadFileUrl(parseInt(fileId, 10));
          if (freshUrl) {
            this.href = freshUrl;
          }
        } catch (error) {
          console.error(`Failed to refresh link URL for file ${fileId}:`, error);
        }
      }
    };

    images.forEach((img) => {
      img.addEventListener("error", handleImageError);
    });

    links.forEach((link) => {
      link.addEventListener("click", handleLinkError);
    });

    return () => {
      images.forEach((img) => {
        img.removeEventListener("error", handleImageError);
      });
      links.forEach((link) => {
        link.removeEventListener("click", handleLinkError);
      });
    };
  }, [processedHtml]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      refreshTimersRef.current.forEach((timer) => clearTimeout(timer));
      refreshTimersRef.current.clear();
      urlCacheRef.current.clear();
    };
  }, []);

  return {
    processedHtml,
    containerRef,
    refreshFileReferences: () => refreshFileReferences(containerRef.current),
  };
}

