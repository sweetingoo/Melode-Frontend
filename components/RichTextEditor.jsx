"use client";

import React, { useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { mergeAttributes } from "@tiptap/core";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import UnderlineExtension from "@tiptap/extension-underline";
import { useUploadFile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import apiClient from "@/services/api-client";

// Get API base URL helper
const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://melode-api-prod.onrender.com/api/v1';
};
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
} from "lucide-react";

const RichTextEditor = ({ value, onChange, placeholder = "Enter text content..." }) => {
  const uploadFileMutation = useUploadFile({ silent: true });
  const [imageResizeDialog, setImageResizeDialog] = React.useState({ open: false, imageNode: null, imagePos: null, width: '', height: '', align: null });
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const isInternalUpdate = React.useRef(false);
  const lastValueRef = React.useRef(value);
  const isResizingRef = React.useRef(false);
  const onChangeTimeoutRef = React.useRef(null);

  // Initialize editor
  const editor = useEditor({
    immediatelyRender: false, // Required for SSR compatibility in Next.js
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
              parseHTML: element => {
                const width = element.getAttribute('width') || element.style.width;
                if (width) {
                  // Extract number from "100px" or "100"
                  const num = parseInt(width);
                  return isNaN(num) ? null : num;
                }
                return null;
              },
              renderHTML: attributes => {
                if (!attributes.width) {
                  return {};
                }
                // Ensure it's a number, add px if needed
                const width = typeof attributes.width === 'number' 
                  ? `${attributes.width}px` 
                  : attributes.width;
                return {
                  width: width,
                  style: `width: ${width};`,
                };
              },
            },
            height: {
              default: null,
              parseHTML: element => {
                const height = element.getAttribute('height') || element.style.height;
                if (height) {
                  // Extract number from "100px" or "100"
                  const num = parseInt(height);
                  return isNaN(num) ? null : num;
                }
                return null;
              },
              renderHTML: attributes => {
                if (!attributes.height) {
                  return {};
                }
                // Ensure it's a number, add px if needed
                const height = typeof attributes.height === 'number' 
                  ? `${attributes.height}px` 
                  : attributes.height;
                return {
                  height: height,
                  style: `height: ${height};`,
                };
              },
            },
            align: {
              default: null,
              parseHTML: element => element.getAttribute('data-align') || element.style.float || null,
              renderHTML: attributes => {
                if (!attributes.align) {
                  return {};
                }
                return {
                  'data-align': attributes.align,
                  style: `float: ${attributes.align};`,
                };
              },
            },
            'data-src-id': {
              default: null,
              parseHTML: element => element.getAttribute('data-src-id'),
              renderHTML: attributes => {
                if (!attributes['data-src-id']) {
                  return {};
                }
                return {
                  'data-src-id': attributes['data-src-id'],
                };
              },
            },
          };
        },
      }).configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'resizable-image',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      TextStyle,
      Color,
      UnderlineExtension,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: placeholder,
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      // Don't trigger onChange during resize or internal updates
      if (isInternalUpdate.current || isResizingRef.current) {
        return;
      }

      // Clear any pending onChange timeout
      if (onChangeTimeoutRef.current) {
        clearTimeout(onChangeTimeoutRef.current);
      }

      // Debounce onChange to prevent rapid-fire updates
      // Use longer debounce during resize operations
      const debounceTime = isResizingRef.current ? 500 : 150;
      onChangeTimeoutRef.current = setTimeout(() => {
        if (!isInternalUpdate.current && !isResizingRef.current) {
          const html = editor.getHTML();
          // Only update if content actually changed (prevent unnecessary updates)
          if (html !== lastValueRef.current) {
            lastValueRef.current = html;
            onChange(html);
          }
        }
      }, debounceTime);
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4",
      },
    },
  });

  // Handle image upload - store file_reference_id as data-src-id in content
  const handleImageUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        return;
      }

      try {
        // Set uploading state and reset progress
        setIsUploading(true);
        setUploadProgress(0);

        // Upload image with progress tracking
        const formData = new FormData();
        formData.append('file', file);

        // Upload with progress tracking using axios directly
        // Note: apiClient interceptor will automatically add Authorization header and handle Content-Type for FormData
        const uploadResult = await apiClient.post('/settings/files/upload', formData, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
            }
          },
        });

        const uploadResultData = uploadResult.data || uploadResult;
        
        // Get file_reference_id for storage (permanent reference)
        // Backend now returns file_reference_id instead of file_reference_url
        const fileReferenceId = uploadResultData.file_reference_id || 
                               uploadResultData.id || 
                               uploadResultData.file_id;

        // Use download_url for immediate preview during editing (valid for 10 minutes)
        const previewUrl = uploadResultData.download_url || uploadResultData.url || uploadResultData.file_url;
        
        if (!fileReferenceId) {
          throw new Error("No file_reference_id received from upload");
        }

        // Insert image into editor
        // Use download_url for immediate preview, but store file_reference_id as data-src-id in content
        if (editor) {
          // Insert with download_url for immediate preview (so image shows right away)
          const urlToInsert = previewUrl || "#";
          
          // Insert image with both src (for preview) and data-src-id (for storage)
          editor.chain().focus().setImage({ 
            src: urlToInsert,
            'data-src-id': fileReferenceId.toString(),
            width: null, // Let it use natural size initially
            height: null,
            align: null
          }).run();
          
          // After insertion, ensure data-src-id is set and optionally replace src with placeholder
          // The useFileReferences hook will handle replacing data-src-id with fresh URLs when rendering
          setTimeout(() => {
            isInternalUpdate.current = true;
            const currentHtml = editor.getHTML();
            
            // Ensure data-src-id is present in the HTML
            // Parse and update if needed
            const parser = new DOMParser();
            const doc = parser.parseFromString(currentHtml, "text/html");
            const images = doc.querySelectorAll('img');
            
            images.forEach((img) => {
              // Find the image that matches our uploaded file
              // Check if it has the preview URL or needs data-src-id
              const imgSrc = img.getAttribute('src');
              if (imgSrc === previewUrl && !img.getAttribute('data-src-id')) {
                img.setAttribute('data-src-id', fileReferenceId.toString());
              }
            });
            
            const updatedHtml = doc.documentElement.innerHTML;
            if (updatedHtml !== currentHtml) {
              editor.commands.setContent(updatedHtml);
              lastValueRef.current = updatedHtml;
            }
            
            // Reset flag after update
            requestAnimationFrame(() => {
              isInternalUpdate.current = false;
            });
          }, 100);
        }

        // Reset upload state
        setIsUploading(false);
        setUploadProgress(0);

        toast.success("Image uploaded successfully");
      } catch (error) {
        console.error("Failed to upload image:", error);
        setIsUploading(false);
        setUploadProgress(0);
        toast.error("Failed to upload image", {
          description: error.response?.data?.detail || error.message
        });
      }
    };
  }, [uploadFileMutation, editor]);


  // Set content when value prop changes externally (but not from our own updates)
  React.useEffect(() => {
    if (!editor) return;
    
    // Don't update during resize
    if (isResizingRef.current) {
      return;
    }
    
    // Normalize HTML for comparison (remove extra whitespace, normalize attributes)
    const normalizeHTML = (html) => {
      if (!html) return '';
      // Remove extra whitespace, normalize quotes, sort attributes for consistent comparison
      // Also normalize blob URLs to prevent comparison issues
      return html
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .replace(/="([^"]*)"/g, '="$1"') // Normalize quotes
        .replace(/\s+style="[^"]*"/g, '') // Remove inline styles for comparison (they change during resize)
        .replace(/\s+class="[^"]*"/g, '') // Remove classes for comparison
        .replace(/\s+data-[^=]*="[^"]*"/g, '') // Remove data attributes
        .replace(/blob:[^"'\s]*/g, 'BLOB_URL'); // Normalize blob URLs for comparison
    };
    
    const currentHtml = normalizeHTML(editor.getHTML());
    const newValue = normalizeHTML(value || '');
    const lastValue = normalizeHTML(lastValueRef.current || '');
    
    // Only update if value actually changed from an external source
    // Skip if the normalized values are the same (prevents refresh loop)
    // Also skip during resize operations
    if (newValue !== currentHtml && newValue !== lastValue && newValue !== '' && !isInternalUpdate.current && !isResizingRef.current) {
      // Check if this is really a different value (not just formatting)
      const editorHtml = editor.getHTML();
      if (editorHtml !== (value || '')) {
        isInternalUpdate.current = true;
        editor.commands.setContent(value || "");
        lastValueRef.current = value || '';
        
        // Reset flag after update completes
        requestAnimationFrame(() => {
          isInternalUpdate.current = false;
        });
      }
    } else if (newValue === currentHtml && !isResizingRef.current) {
      // Content matches, just update the ref to prevent future unnecessary updates
      lastValueRef.current = value || '';
    }
  }, [value, editor]);

  // Add image resize functionality with corner handles
  useEffect(() => {
    if (!editor) return;

    let selectedImage = null;
    let imageNode = null;
    let imagePos = null;
    let isResizing = false;
    let resizeCorner = null;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    let aspectRatio = 1;

    // Wrap all images in the editor
    const wrapAllImages = () => {
      const editorElement = editor.view.dom;
      const images = editorElement.querySelectorAll('img:not(.resize-handle img)');
      
      images.forEach((img) => {
        // Skip if already wrapped
        if (img.parentElement?.classList.contains('image-wrapper')) {
          return;
        }
        
        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';
        wrapper.style.cssText = `
          position: relative;
          display: inline-block;
          margin: 0.25rem;
          vertical-align: middle;
        `;
        
        // Wrap the image
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);
      });
    };

    const createResizeHandles = (img) => {
      // Find or create wrapper
      let wrapper = img.closest('.image-wrapper');
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';
        wrapper.style.cssText = `
          position: relative;
          display: inline-block;
          margin: 0.25rem;
          vertical-align: middle;
        `;
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);
      }

      // Remove existing handles
      const existingHandles = wrapper.querySelector('.image-resize-handles');
      if (existingHandles) {
        existingHandles.remove();
      }

      // Create container for handles
      const handlesContainer = document.createElement('div');
      handlesContainer.className = 'image-resize-handles';
      handlesContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
      `;

      // Create corner handles
      const corners = ['nw', 'ne', 'sw', 'se'];
      corners.forEach(corner => {
        const handle = document.createElement('div');
        handle.className = `resize-handle resize-handle-${corner}`;
        handle.style.cssText = `
          position: absolute;
          width: 16px;
          height: 16px;
          background: hsl(var(--primary));
          border: 2px solid white;
          border-radius: 4px;
          pointer-events: all;
          cursor: ${corner === 'nw' ? 'nw-resize' : corner === 'ne' ? 'ne-resize' : corner === 'sw' ? 'sw-resize' : 'se-resize'};
          z-index: 1001;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          transition: transform 0.1s, background-color 0.1s;
        `;
        
        // Add hover effect
        handle.addEventListener('mouseenter', () => {
          handle.style.transform = 'scale(1.2)';
          handle.style.backgroundColor = 'hsl(var(--primary) / 0.9)';
        });
        handle.addEventListener('mouseleave', () => {
          handle.style.transform = 'scale(1)';
          handle.style.backgroundColor = 'hsl(var(--primary))';
        });

        // Position handles
        if (corner.includes('n')) handle.style.top = '-8px';
        if (corner.includes('s')) handle.style.bottom = '-8px';
        if (corner.includes('w')) handle.style.left = '-8px';
        if (corner.includes('e')) handle.style.right = '-8px';

        handle.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          isResizing = true;
          isResizingRef.current = true; // Mark that resize has started
          resizeCorner = corner;
          startX = e.clientX;
          startY = e.clientY;
          
          // Get actual rendered size - use computed style if available
          const rect = img.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(img);
          startWidth = parseFloat(computedStyle.width) || rect.width;
          startHeight = parseFloat(computedStyle.height) || rect.height;
          
          // If image has width/height attributes, use those
          if (img.hasAttribute('width') && img.hasAttribute('height')) {
            const attrWidth = parseInt(img.getAttribute('width'));
            const attrHeight = parseInt(img.getAttribute('height'));
            if (attrWidth > 0 && attrHeight > 0) {
              startWidth = attrWidth;
              startHeight = attrHeight;
            }
          }
          
          aspectRatio = startWidth / startHeight;
          
          // Add visual feedback
          if (img.parentElement) {
            img.parentElement.style.outline = '2px dashed hsl(var(--primary))';
          }

          // Find image node - try multiple methods to match
          const { state } = editor;
          const imgSrc = img.src || img.getAttribute('src') || '';
          
          state.doc.descendants((node, pos) => {
            if (node.type.name === 'image') {
              const nodeAttrs = node.attrs;
              const nodeSrc = nodeAttrs.src || '';
              
              // Try exact match first
              if (nodeSrc === imgSrc || nodeSrc === img.getAttribute('src')) {
                imageNode = node;
                imagePos = pos;
                return false;
              }
              
              // Try URL pathname match
              try {
                const imgSrcUrl = new URL(imgSrc, window.location.origin);
                const nodeSrcUrl = new URL(nodeSrc, window.location.origin);
                if (imgSrcUrl.pathname === nodeSrcUrl.pathname) {
                  imageNode = node;
                  imagePos = pos;
                  return false;
                }
              } catch (e) {
                // URL parsing failed, try filename match
                const imgFilename = imgSrc.split('/').pop();
                const nodeFilename = nodeSrc.split('/').pop();
                if (imgFilename && nodeFilename && imgFilename === nodeFilename) {
                  imageNode = node;
                  imagePos = pos;
                  return false;
                }
              }
              
              // Fallback: check if src includes the filename
              if (nodeSrc?.includes(imgSrc.split('/').pop())) {
                imageNode = node;
                imagePos = pos;
                return false;
              }
            }
          });

          document.addEventListener('mousemove', handleResize);
          document.addEventListener('mouseup', stopResize);
        });

        handlesContainer.appendChild(handle);
      });

      wrapper.appendChild(handlesContainer);
      return wrapper;
    };

    const handleResize = (e) => {
      if (!isResizing || !selectedImage) return;

      // Mark that we're resizing to prevent onChange
      isResizingRef.current = true;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      // Calculate new dimensions based on corner
      if (resizeCorner === 'se') {
        // Southeast: drag right and down
        newWidth = startWidth + deltaX;
        newHeight = newWidth / aspectRatio;
      } else if (resizeCorner === 'sw') {
        // Southwest: drag left and down
        newWidth = startWidth - deltaX;
        newHeight = newWidth / aspectRatio;
      } else if (resizeCorner === 'ne') {
        // Northeast: drag right and up
        newWidth = startWidth + deltaX;
        newHeight = newWidth / aspectRatio;
      } else if (resizeCorner === 'nw') {
        // Northwest: drag left and up
        newWidth = startWidth - deltaX;
        newHeight = newWidth / aspectRatio;
      }

      // Maintain minimum size
      newWidth = Math.max(50, Math.round(newWidth));
      newHeight = Math.max(50, Math.round(newHeight));

      // Update image visually - ensure it updates in real-time
      // Only update DOM, don't trigger editor update during drag
      if (selectedImage) {
        selectedImage.style.width = `${newWidth}px`;
        selectedImage.style.height = `${newHeight}px`;
        selectedImage.style.maxWidth = 'none';
        selectedImage.style.maxHeight = 'none';
        selectedImage.setAttribute('width', newWidth);
        selectedImage.setAttribute('height', newHeight);
      }
    };

    const stopResize = () => {
      if (!isResizing) {
        return;
      }

      // Find image node again in case it changed
      if (selectedImage && imagePos === null) {
        const { state } = editor;
        const imgSrc = selectedImage.src || selectedImage.getAttribute('src') || '';
        
        state.doc.descendants((node, pos) => {
          if (node.type.name === 'image') {
            const nodeAttrs = node.attrs;
            const nodeSrc = nodeAttrs.src || '';
            
            if (nodeSrc === imgSrc || nodeSrc?.includes(imgSrc.split('/').pop())) {
              imageNode = node;
              imagePos = pos;
              return false;
            }
          }
        });
      }

      if (selectedImage && imageNode && imagePos !== null) {
        const finalWidth = parseInt(selectedImage.style.width) || selectedImage.offsetWidth;
        const finalHeight = parseInt(selectedImage.style.height) || selectedImage.offsetHeight;

        // Ensure valid dimensions
        if (finalWidth > 0 && finalHeight > 0) {
          // Prevent onChange from firing during resize update
          isInternalUpdate.current = true;
          
          // Update image node attributes - store as numbers (Tiptap handles px conversion)
          const attrs = { ...imageNode.attrs };
          attrs.width = finalWidth;
          attrs.height = finalHeight;

          // Use transaction to ensure update happens
          const tr = editor.state.tr;
          tr.setNodeMarkup(imagePos, null, attrs);
          editor.view.dispatch(tr);
          
          // Also update the visual image element to match
          if (selectedImage) {
            selectedImage.setAttribute('width', finalWidth);
            selectedImage.setAttribute('height', finalHeight);
            selectedImage.style.width = `${finalWidth}px`;
            selectedImage.style.height = `${finalHeight}px`;
          }
          
          // Update lastValueRef to prevent unnecessary onChange
          lastValueRef.current = editor.getHTML();
          
          // Reset flag after update
          requestAnimationFrame(() => {
            isInternalUpdate.current = false;
          });
        }
      }

      // Remove visual feedback
      if (selectedImage && selectedImage.parentElement) {
        selectedImage.parentElement.style.outline = '';
      }
      
      isResizing = false;
      isResizingRef.current = false; // Clear resize flag
      resizeCorner = null;
      imageNode = null;
      imagePos = null;
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
    };

    const handleImageClick = (event) => {
      const img = event.target.closest('img');
      const handle = event.target.closest('.resize-handle');
      
      if (handle) return; // Don't process if clicking on handle

      // Remove handles from previously selected image
      if (selectedImage && selectedImage !== img) {
        const oldWrapper = selectedImage.closest('.image-wrapper');
        if (oldWrapper) {
          oldWrapper.classList.remove('selected');
          const oldHandles = oldWrapper.querySelector('.image-resize-handles');
          if (oldHandles) oldHandles.remove();
        }
      }

      if (img) {
        event.preventDefault();
        event.stopPropagation();

        selectedImage = img;
        
        // Create wrapper and handles
        const wrapper = createResizeHandles(img);
        if (wrapper) {
          wrapper.classList.add('selected');
          // Remove from other wrappers
          const editorElement = editor.view.dom;
          editorElement.querySelectorAll('.image-wrapper.selected').forEach(w => {
            if (w !== wrapper) w.classList.remove('selected');
          });
        }
      } else {
        // Click outside - remove handles
        if (selectedImage) {
          const wrapper = selectedImage.closest('.image-wrapper');
          if (wrapper) {
            wrapper.classList.remove('selected');
            const handles = wrapper.querySelector('.image-resize-handles');
            if (handles) handles.remove();
          }
          selectedImage = null;
        }
      }
    };

    const handleImageDoubleClick = (event) => {
      const img = event.target.closest('img');
      const handle = event.target.closest('.resize-handle');
      
      if (handle || !img) return;

      const { state } = editor;
      let clickedImageNode = null;
      let clickedImagePos = null;
      
      state.doc.descendants((node, pos) => {
        if (node.type.name === 'image') {
          const nodeAttrs = node.attrs;
          const imgSrc = img.src || img.getAttribute('src') || '';
          if (nodeAttrs.src === imgSrc || nodeAttrs.src?.includes(imgSrc.split('/').pop())) {
            clickedImageNode = node;
            clickedImagePos = pos;
            return false;
          }
        }
      });

      if (clickedImageNode && clickedImagePos !== null) {
        const currentWidth = clickedImageNode.attrs.width ? 
          (typeof clickedImageNode.attrs.width === 'string' ? parseInt(clickedImageNode.attrs.width.replace('px', '')) : clickedImageNode.attrs.width) : 
          (img.naturalWidth || '');
        const currentHeight = clickedImageNode.attrs.height ? 
          (typeof clickedImageNode.attrs.height === 'string' ? parseInt(clickedImageNode.attrs.height.replace('px', '')) : clickedImageNode.attrs.height) : 
          (img.naturalHeight || '');
        const currentAlign = clickedImageNode.attrs.align || null;

        setImageResizeDialog({
          open: true,
          imageNode: clickedImageNode,
          imagePos: clickedImagePos,
          width: currentWidth || '',
          height: currentHeight || '',
          align: currentAlign,
        });
      }
    };

    const editorElement = editor.view.dom;
    
    // Wrap all existing images
    setTimeout(() => wrapAllImages(), 100);
    
    // Listen for clicks
    editorElement.addEventListener('click', handleImageClick);
    editorElement.addEventListener('dblclick', handleImageDoubleClick);
    
    // Watch for new images being added
    const observer = new MutationObserver(() => {
      setTimeout(() => wrapAllImages(), 50);
    });
    
    observer.observe(editorElement, {
      childList: true,
      subtree: true,
    });

    return () => {
      editorElement.removeEventListener('click', handleImageClick);
      editorElement.removeEventListener('dblclick', handleImageDoubleClick);
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
      observer.disconnect();
      // Clear any pending timeouts
      if (onChangeTimeoutRef.current) {
        clearTimeout(onChangeTimeoutRef.current);
      }
      isResizingRef.current = false;
    };
  }, [editor]);

  // Handle image resize
  const handleImageResize = () => {
    if (!editor || !imageResizeDialog.imageNode || imageResizeDialog.imagePos === null) return;

    const attrs = { ...imageResizeDialog.imageNode.attrs };
    
    if (imageResizeDialog.width) {
      attrs.width = `${imageResizeDialog.width}px`;
    } else {
      delete attrs.width;
    }
    
    if (imageResizeDialog.height) {
      attrs.height = `${imageResizeDialog.height}px`;
    } else {
      delete attrs.height;
    }

    // Set alignment
    if (imageResizeDialog.align) {
      attrs.align = imageResizeDialog.align;
    } else {
      delete attrs.align;
    }

    // Update the image node
    editor.chain()
      .focus()
      .setNodeSelection(imageResizeDialog.imagePos)
      .updateAttributes('image', attrs)
      .run();

    setImageResizeDialog({ open: false, imageNode: null, imagePos: null, width: '', height: '', align: null });
  };

  // Handle image removal
  const handleImageRemove = () => {
    if (!editor || imageResizeDialog.imagePos === null) return;

    editor.chain()
      .focus()
      .setNodeSelection(imageResizeDialog.imagePos)
      .deleteSelection()
      .run();

    setImageResizeDialog({ open: false, imageNode: null, imagePos: null, width: '', height: '', align: null });
  };

  if (!editor) {
    return <div className="min-h-[200px] border rounded-md p-4">Loading editor...</div>;
  }

  return (
    <div className="rich-text-editor border rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted">
        {/* Text Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-accent" : ""}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-accent" : ""}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "bg-accent" : ""}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive("strike") ? "bg-accent" : ""}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Headings */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive("heading", { level: 3 }) ? "bg-accent" : ""}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-accent" : ""}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-accent" : ""}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "bg-accent" : ""}
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={editor.isActive({ textAlign: "left" }) ? "bg-accent" : ""}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={editor.isActive({ textAlign: "center" }) ? "bg-accent" : ""}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={editor.isActive({ textAlign: "right" }) ? "bg-accent" : ""}
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Links and Images */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (editor.isActive("link")) {
              editor.chain().focus().unsetLink().run();
            } else {
              const url = window.prompt("Enter URL:");
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }
          }}
          className={editor.isActive("link") ? "bg-accent" : ""}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleImageUpload}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="px-4 py-2 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Uploading image...</span>
            <div className="flex-1">
              <Progress value={uploadProgress} className="h-1.5" />
            </div>
            <span className="text-xs text-muted-foreground min-w-[3rem] text-right">{uploadProgress}%</span>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="min-h-[200px] p-4">
        <EditorContent editor={editor} />
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .rich-text-editor .ProseMirror {
          outline: none;
          min-height: 200px;
        }
        .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }
        .rich-text-editor .ProseMirror img {
          max-width: 100%;
          height: auto;
          display: inline-block;
          margin: 0;
          cursor: pointer;
          transition: outline 0.2s;
          vertical-align: middle;
        }
        .rich-text-editor .ProseMirror img[width] {
          max-width: none;
        }
        .rich-text-editor .ProseMirror img[height] {
          height: auto;
        }
        .rich-text-editor .ProseMirror img.resizable-image {
          position: relative;
        }
        .rich-text-editor .ProseMirror img[data-align="left"] {
          float: left;
          margin-right: 1rem;
          margin-bottom: 0.5rem;
        }
        .rich-text-editor .ProseMirror img[data-align="right"] {
          float: right;
          margin-left: 1rem;
          margin-bottom: 0.5rem;
        }
        .rich-text-editor .ProseMirror img[data-align="center"] {
          display: block;
          margin: 1rem auto;
        }
        .rich-text-editor .ProseMirror img:hover {
          outline: 2px solid hsl(var(--primary));
          outline-offset: 2px;
        }
        .rich-text-editor .image-wrapper {
          position: relative;
          display: inline-block;
          margin: 0.25rem;
          vertical-align: middle;
        }
        .rich-text-editor .image-wrapper.selected {
          outline: 2px solid hsl(var(--primary));
          outline-offset: 2px;
        }
        .rich-text-editor .image-resize-handles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 10;
        }
        .rich-text-editor .resize-handle {
          position: absolute;
          width: 14px;
          height: 14px;
          background: hsl(var(--primary));
          border: 2px solid hsl(var(--background));
          border-radius: 3px;
          pointer-events: all;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          transition: transform 0.1s;
        }
        .rich-text-editor .resize-handle:hover {
          transform: scale(1.2);
          background: hsl(var(--primary) / 0.9);
        }
        .rich-text-editor .resize-handle-nw {
          top: -6px;
          left: -6px;
          cursor: nw-resize;
        }
        .rich-text-editor .resize-handle-ne {
          top: -6px;
          right: -6px;
          cursor: ne-resize;
        }
        .rich-text-editor .resize-handle-sw {
          bottom: -6px;
          left: -6px;
          cursor: sw-resize;
        }
        .rich-text-editor .resize-handle-se {
          bottom: -6px;
          right: -6px;
          cursor: se-resize;
        }
        .rich-text-editor .ProseMirror a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
        .rich-text-editor .ProseMirror ul,
        .rich-text-editor .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .rich-text-editor .ProseMirror blockquote {
          border-left: 3px solid hsl(var(--border));
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
        }
        .rich-text-editor .ProseMirror h1,
        .rich-text-editor .ProseMirror h2,
        .rich-text-editor .ProseMirror h3 {
          font-weight: bold;
          margin: 1rem 0 0.5rem 0;
        }
        .rich-text-editor .ProseMirror h1 {
          font-size: 2em;
        }
        .rich-text-editor .ProseMirror h2 {
          font-size: 1.5em;
        }
        .rich-text-editor .ProseMirror h3 {
          font-size: 1.25em;
        }
      `}} />

      {/* Image Resize Dialog */}
      <Dialog open={imageResizeDialog.open} onOpenChange={(open) => {
        if (!open) {
          setImageResizeDialog({ open: false, imageNode: null, imagePos: null, width: '', height: '', align: null });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resize Image</DialogTitle>
            <DialogDescription>
              Adjust the image dimensions. Leave empty to maintain aspect ratio or use original size.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-width">Width (px)</Label>
              <Input
                id="image-width"
                type="number"
                value={imageResizeDialog.width}
                onChange={(e) => setImageResizeDialog({
                  ...imageResizeDialog,
                  width: e.target.value
                })}
                placeholder="Auto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-height">Height (px)</Label>
              <Input
                id="image-height"
                type="number"
                value={imageResizeDialog.height}
                onChange={(e) => setImageResizeDialog({
                  ...imageResizeDialog,
                  height: e.target.value
                })}
                placeholder="Auto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-align">Alignment</Label>
              <select
                id="image-align"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={imageResizeDialog.align || 'inline'}
                onChange={(e) => setImageResizeDialog({
                  ...imageResizeDialog,
                  align: e.target.value === 'inline' ? null : e.target.value
                })}
              >
                <option value="inline">Inline (with text)</option>
                <option value="left">Left (text wraps around)</option>
                <option value="right">Right (text wraps around)</option>
                <option value="center">Center (block)</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              onClick={handleImageRemove}
            >
              Remove Image
            </Button>
            <Button
              type="button"
              onClick={handleImageResize}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
