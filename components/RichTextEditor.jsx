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
              parseHTML: element => element.getAttribute('width'),
              renderHTML: attributes => {
                if (!attributes.width) {
                  return {};
                }
                return {
                  width: attributes.width,
                };
              },
            },
            height: {
              default: null,
              parseHTML: element => element.getAttribute('height'),
              renderHTML: attributes => {
                if (!attributes.height) {
                  return {};
                }
                return {
                  height: attributes.height,
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
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4",
      },
    },
  });

  // Handle image upload
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
        // Upload image using the same endpoint as image blocks
        const uploadResult = await uploadFileMutation.mutateAsync({
          file: file
        });

        // Get the download URL from the response
        const imageUrl = uploadResult.download_url || uploadResult.url || uploadResult.file_url;

        if (!imageUrl) {
          throw new Error("No download URL received from upload");
        }

        // Insert image into editor
        if (editor) {
          editor.chain().focus().setImage({ src: imageUrl }).run();
        }

        toast.success("Image uploaded successfully");
      } catch (error) {
        console.error("Failed to upload image:", error);
        toast.error("Failed to upload image", {
          description: error.response?.data?.detail || error.message
        });
      }
    };
  }, [uploadFileMutation, editor]);

  // Set content when value prop changes externally
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
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

    const createResizeHandles = (img) => {
      // Remove existing handles
      const existingHandles = img.parentElement?.querySelector('.image-resize-handles');
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
        z-index: 10;
      `;

      // Create corner handles
      const corners = ['nw', 'ne', 'sw', 'se'];
      corners.forEach(corner => {
        const handle = document.createElement('div');
        handle.className = `resize-handle resize-handle-${corner}`;
        handle.style.cssText = `
          position: absolute;
          width: 12px;
          height: 12px;
          background: hsl(var(--primary));
          border: 2px solid hsl(var(--background));
          border-radius: 2px;
          pointer-events: all;
          cursor: ${corner === 'nw' ? 'nw-resize' : corner === 'ne' ? 'ne-resize' : corner === 'sw' ? 'sw-resize' : 'se-resize'};
        `;

        // Position handles
        if (corner.includes('n')) handle.style.top = '-6px';
        if (corner.includes('s')) handle.style.bottom = '-6px';
        if (corner.includes('w')) handle.style.left = '-6px';
        if (corner.includes('e')) handle.style.right = '-6px';

        handle.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          isResizing = true;
          resizeCorner = corner;
          startX = e.clientX;
          startY = e.clientY;
          
          // Get actual rendered size
          const rect = img.getBoundingClientRect();
          startWidth = rect.width;
          startHeight = rect.height;
          aspectRatio = startWidth / startHeight;

          // Find image node
          const { state } = editor;
          state.doc.descendants((node, pos) => {
            if (node.type.name === 'image') {
              const nodeAttrs = node.attrs;
              if (nodeAttrs.src === img.src || nodeAttrs.src === img.getAttribute('src')) {
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

      // Wrap image in container if not already wrapped
      if (!img.parentElement?.classList.contains('image-wrapper')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';
        wrapper.style.cssText = `
          position: relative;
          display: inline-block;
        `;
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);
      }

      img.parentElement.appendChild(handlesContainer);
    };

    const handleResize = (e) => {
      if (!isResizing || !selectedImage) return;

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
      newWidth = Math.max(50, newWidth);
      newHeight = Math.max(50, newHeight);

      // Update image visually
      selectedImage.style.width = `${newWidth}px`;
      selectedImage.style.height = `${newHeight}px`;
    };

    const stopResize = () => {
      if (!isResizing) {
        return;
      }

      if (selectedImage && imageNode && imagePos !== null) {
        const finalWidth = parseInt(selectedImage.style.width) || selectedImage.offsetWidth;
        const finalHeight = parseInt(selectedImage.style.height) || selectedImage.offsetHeight;

        // Update image node attributes
        const attrs = { ...imageNode.attrs };
        attrs.width = `${finalWidth}px`;
        attrs.height = `${finalHeight}px`;

        editor.chain()
          .focus()
          .setNodeSelection(imagePos)
          .updateAttributes('image', attrs)
          .run();
      }

      isResizing = false;
      resizeCorner = null;
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
    };

    const handleImageClick = (event) => {
      const img = event.target.closest('img');
      const handle = event.target.closest('.resize-handle');
      
      if (handle) return; // Don't process if clicking on handle

      // Remove handles from previously selected image
      if (selectedImage && selectedImage !== img) {
        const oldHandles = selectedImage.parentElement?.querySelector('.image-resize-handles');
        if (oldHandles) oldHandles.remove();
      }

      if (img) {
        event.preventDefault();
        event.stopPropagation();

        selectedImage = img;
        createResizeHandles(img);

        // Also allow opening dialog on double-click
        img.addEventListener('dblclick', () => {
          const { state } = editor;
          let clickedImageNode = null;
          let clickedImagePos = null;
          
          state.doc.descendants((node, pos) => {
            if (node.type.name === 'image') {
              const nodeAttrs = node.attrs;
              if (nodeAttrs.src === img.src || nodeAttrs.src === img.getAttribute('src')) {
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
        });
      } else {
        // Click outside - remove handles
        if (selectedImage) {
          const handles = selectedImage.parentElement?.querySelector('.image-resize-handles');
          if (handles) handles.remove();
          selectedImage = null;
        }
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('click', handleImageClick);

    return () => {
      editorElement.removeEventListener('click', handleImageClick);
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
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
          margin: 0.25rem;
          cursor: pointer;
          transition: outline 0.2s;
          vertical-align: middle;
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
          width: 12px;
          height: 12px;
          background: hsl(var(--primary));
          border: 2px solid hsl(var(--background));
          border-radius: 2px;
          pointer-events: all;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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

export default RichTextEditor;
