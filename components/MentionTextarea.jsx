"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

const MentionTextarea = ({
  value = "",
  onChange,
  placeholder = "Type a message...",
  users = [],
  conversationParticipantIds = [],
  className = "",
  onMentionedUsersChange,
}) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionedUsers, setMentionedUsers] = useState([]);

  // Parse mentions from value
  const parseMentions = useCallback((text) => {
    const mentionRegex = /@\[([^\]]+)\]\((\d+)\)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push({
        id: parseInt(match[2]),
        name: match[1],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
    return mentions;
  }, []);

  // Get mentioned user IDs from current value
  useEffect(() => {
    const mentions = parseMentions(value);
    const userIds = mentions.map((m) => m.id);
    const uniqueUserIds = [...new Set(userIds)];
    
    const usersList = uniqueUserIds
      .map((id) => {
        const user = users.find((u) => u.id === id);
        if (user) {
          return {
            id: user.id,
            name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || user.username || `User #${user.id}`,
            username: user.username,
            email: user.email,
            isInConversation: conversationParticipantIds.includes(user.id),
          };
        }
        return null;
      })
      .filter(Boolean);
    
    setMentionedUsers(usersList);
    if (onMentionedUsersChange) {
      onMentionedUsersChange(usersList);
    }
  }, [value, users, conversationParticipantIds, parseMentions, onMentionedUsersChange]);

  // Convert plain text to HTML with mention chips
  const textToHtml = useCallback((text) => {
    if (!text) return "";
    
    let html = "";
    let lastIndex = 0;
    const mentionRegex = /@\[([^\]]+)\]\((\d+)\)/g;
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        const textBefore = text.substring(lastIndex, match.index);
        html += textBefore.replace(/\n/g, "<br>").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }
      
      // Add mention chip
      const userId = parseInt(match[2]);
      const userName = match[1];
      const user = users.find((u) => u.id === userId);
      const isInConversation = user && conversationParticipantIds.includes(user.id);
      
      html += `<span class="mention-chip inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md text-xs font-medium ${
        isInConversation 
          ? "bg-primary text-primary-foreground" 
          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      }" data-user-id="${userId}" contenteditable="false">@${userName}</span>`;
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      const textAfter = text.substring(lastIndex);
      html += textAfter.replace(/\n/g, "<br>").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    
    return html;
  }, [users, conversationParticipantIds]);

  // Convert HTML back to plain text with mention format
  const htmlToText = useCallback((html) => {
    if (!html) return "";
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    
    // Replace mention chips with @[name](id) format
    const mentionChips = tempDiv.querySelectorAll(".mention-chip");
    mentionChips.forEach((chip) => {
      const userId = chip.getAttribute("data-user-id");
      const userName = chip.textContent.replace("@", "");
      const mentionText = `@[${userName}](${userId})`;
      chip.replaceWith(document.createTextNode(mentionText));
    });
    
    // Convert <br> to newlines
    const brs = tempDiv.querySelectorAll("br");
    brs.forEach((br) => {
      br.replaceWith(document.createTextNode("\n"));
    });
    
    return tempDiv.textContent || tempDiv.innerText || "";
  }, []);

  // Filter users for mention dropdown
  const filteredUsers = useMemo(() => {
    if (!users || users.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[MentionTextarea] No users available');
      }
      return [];
    }
    
    if (!mentionQuery) {
      // Show first 10 users when @ is typed with no query
      return users.slice(0, 10);
    }
    
    const queryLower = mentionQuery.toLowerCase();
    const filtered = users
      .filter((user) => {
        const name = `${user.first_name || ""} ${user.last_name || ""}`.trim();
        const displayName = name || user.email || user.username || "";
        return (
          displayName.toLowerCase().includes(queryLower) ||
          user.email?.toLowerCase().includes(queryLower) ||
          user.username?.toLowerCase().includes(queryLower)
        );
      })
      .slice(0, 10);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[MentionTextarea] Filtered users:', filtered.length, 'query:', mentionQuery);
    }
    
    return filtered;
  }, [users, mentionQuery]);

  // Get text before cursor from contentEditable
  const getTextBeforeCursor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return { text: "", range: null };
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // If no selection, try to get text from editor
      const text = htmlToText(editor.innerHTML);
      return { text, range: null };
    }
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editor);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    // Get text content (excluding mention chips - they're already converted to text format)
    const textContent = preCaretRange.toString();
    
    return { text: textContent, range };
  }, [htmlToText]);

  // Handle input in contentEditable
  const handleInput = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    
    const html = editor.innerHTML;
    const text = htmlToText(html);
    
    // Get text content directly from editor (more reliable for @ detection)
    const editorText = editor.textContent || editor.innerText || text;
    
    // Check for @ mention in the text
    const lastAtIndex = editorText.lastIndexOf("@");
    
    if (lastAtIndex !== -1) {
      const textAfterAt = editorText.substring(lastAtIndex + 1);
      // Check if there's a space, newline, or mention format after @
      // Allow empty string (just @) or text without spaces/brackets
      if (textAfterAt === "" || !textAfterAt.match(/[\s\n\[\(]/)) {
        // Show mention dropdown
        setMentionQuery(textAfterAt);
        setShowMentionDropdown(true);
        setSelectedMentionIndex(0);
        
        // Position dropdown intelligently based on available space
        const selection = window.getSelection();
        const containerRect = containerRef.current?.getBoundingClientRect();
        
        if (selection && selection.rangeCount > 0 && containerRect) {
          try {
            const range = selection.getRangeAt(0);
            const cursorRect = range.getBoundingClientRect();
            
            // Dropdown dimensions
            const dropdownWidth = 250;
            const dropdownHeight = 200;
            const padding = 8;
            
            // Get viewport dimensions
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Use container bottom as reference point (where textarea ends)
            const containerBottom = containerRect.bottom;
            const containerTop = containerRect.top;
            
            // Calculate available space from container position
            const spaceBelow = viewportHeight - containerBottom - padding;
            const spaceAbove = containerTop - padding;
            
            // Determine vertical position - prioritize above if near bottom of screen
            let top;
            const isNearBottom = containerBottom > viewportHeight * 0.7; // If container is in bottom 30% of screen
            
            if (isNearBottom || spaceBelow < dropdownHeight) {
              // Near bottom or not enough space below - position above
              if (spaceAbove >= dropdownHeight) {
                // Enough space above
                top = containerTop - dropdownHeight - padding;
              } else if (spaceAbove > spaceBelow) {
                // More space above than below
                top = Math.max(padding, containerTop - dropdownHeight - padding);
              } else {
                // More space below, but still position above to avoid cutoff
                top = Math.max(padding, containerTop - dropdownHeight - padding);
              }
            } else {
              // Enough space below - position below
              top = containerBottom + padding;
            }
            
            // Final viewport bounds check
            if (top < padding) {
              top = padding;
            }
            if (top + dropdownHeight > viewportHeight - padding) {
              top = Math.max(padding, viewportHeight - dropdownHeight - padding);
            }
            
            // Horizontal positioning - use cursor position but keep within container bounds
            let left = cursorRect.left;
            const spaceRight = viewportWidth - cursorRect.left;
            const spaceLeft = cursorRect.left;
            
            // If not enough space on right, try left
            if (spaceRight < dropdownWidth && spaceLeft > spaceRight) {
              left = cursorRect.left - dropdownWidth;
            }
            
            // Ensure within viewport
            if (left + dropdownWidth > viewportWidth - padding) {
              left = viewportWidth - dropdownWidth - padding;
            }
            if (left < padding) {
              left = padding;
            }
            
            // Ensure within container horizontal bounds if possible
            if (left < containerRect.left) {
              left = containerRect.left;
            }
            if (left + dropdownWidth > containerRect.right && containerRect.right - containerRect.left >= dropdownWidth) {
              left = containerRect.right - dropdownWidth;
            }
            
            setMentionPosition({
              top,
              left,
            });
          } catch (e) {
            // Fallback positioning - use smart positioning relative to editor
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (containerRect) {
              const viewportWidth = window.innerWidth;
              const viewportHeight = window.innerHeight;
              const dropdownWidth = 250;
              const dropdownHeight = 200;
              const padding = 8;
              
              // Calculate available space
              const spaceBelow = viewportHeight - containerRect.bottom - padding;
              const spaceAbove = containerRect.top - padding;
              
              // Determine vertical position
              let top;
              if (spaceBelow >= dropdownHeight) {
                top = containerRect.bottom + padding;
              } else if (spaceAbove >= dropdownHeight) {
                top = containerRect.top - dropdownHeight - padding;
              } else {
                // Use whichever has more space
                if (spaceAbove > spaceBelow) {
                  top = Math.max(padding, containerRect.top - dropdownHeight - padding);
                } else {
                  top = containerRect.bottom + padding;
                }
              }
              
              // Ensure within viewport
              if (top < padding) top = padding;
              if (top + dropdownHeight > viewportHeight - padding) {
                top = Math.max(padding, viewportHeight - dropdownHeight - padding);
              }
              
              // Horizontal positioning
              let left = containerRect.left;
              const spaceRight = viewportWidth - containerRect.left;
              const spaceLeft = containerRect.left;
              
              if (spaceRight < dropdownWidth && spaceLeft > spaceRight) {
                left = containerRect.left - dropdownWidth;
              }
              if (left + dropdownWidth > viewportWidth) {
                left = viewportWidth - dropdownWidth - padding;
              }
              if (left < padding) left = padding;
              
              setMentionPosition({ top, left });
            } else {
              setMentionPosition({ top: 100, left: 100 });
            }
          }
        } else {
          // Fallback positioning - use smart positioning relative to editor
          const containerRect = containerRef.current?.getBoundingClientRect();
          if (containerRect) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const dropdownWidth = 250;
            const dropdownHeight = 200;
            const padding = 8;
            
            // Calculate available space
            const spaceBelow = viewportHeight - containerRect.bottom - padding;
            const spaceAbove = containerRect.top - padding;
            
            // Determine vertical position
            let top;
            if (spaceBelow >= dropdownHeight) {
              top = containerRect.bottom + padding;
            } else if (spaceAbove >= dropdownHeight) {
              top = containerRect.top - dropdownHeight - padding;
            } else {
              // Use whichever has more space
              if (spaceAbove > spaceBelow) {
                top = Math.max(padding, containerRect.top - dropdownHeight - padding);
              } else {
                top = containerRect.bottom + padding;
              }
            }
            
            // Ensure within viewport
            if (top < padding) top = padding;
            if (top + dropdownHeight > viewportHeight - padding) {
              top = Math.max(padding, viewportHeight - dropdownHeight - padding);
            }
            
            // Horizontal positioning
            let left = containerRect.left;
            const spaceRight = viewportWidth - containerRect.left;
            const spaceLeft = containerRect.left;
            
            if (spaceRight < dropdownWidth && spaceLeft > spaceRight) {
              left = containerRect.left - dropdownWidth;
            }
            if (left + dropdownWidth > viewportWidth) {
              left = viewportWidth - dropdownWidth - padding;
            }
            if (left < padding) left = padding;
            
            setMentionPosition({ top, left });
          } else {
            setMentionPosition({ top: 100, left: 100 });
          }
        }
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
    
    onChange(text);
    
    // Update HTML display with mention chips (debounced to avoid conflicts)
    const timeoutId = setTimeout(() => {
      if (editor) {
        const currentText = htmlToText(editor.innerHTML);
        if (currentText !== text) {
          // Save cursor position
          const selection = window.getSelection();
          let cursorOffset = 0;
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(editor);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            cursorOffset = preCaretRange.toString().length;
          }
          
          // Update HTML
          editor.innerHTML = text ? textToHtml(text) : "";
          
          // Restore cursor position
          try {
            const range = document.createRange();
            const sel = window.getSelection();
            let charCount = 0;
            const walker = document.createTreeWalker(
              editor,
              NodeFilter.SHOW_TEXT,
              null
            );
            
            let node;
            while ((node = walker.nextNode())) {
              const nodeLength = node.textContent.length;
              if (charCount + nodeLength >= cursorOffset) {
                range.setStart(node, cursorOffset - charCount);
                range.setEnd(node, cursorOffset - charCount);
                sel.removeAllRanges();
                sel.addRange(range);
                break;
              }
              charCount += nodeLength;
            }
            
            if (!sel.rangeCount) {
              range.selectNodeContents(editor);
              range.collapse(false);
              sel.removeAllRanges();
              sel.addRange(range);
            }
          } catch (e) {
            // Fallback
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(editor);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      }
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [onChange, htmlToText, textToHtml, getTextBeforeCursor]);

  // Insert mention
  const insertMention = useCallback((user) => {
    const editor = editorRef.current;
    if (!editor) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    
    if (textNode.nodeType === Node.TEXT_NODE) {
      const textBeforeCursor = textNode.textContent.substring(0, range.startOffset);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");
      
      if (lastAtIndex !== -1) {
        // Delete @ and query text
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        const startPos = range.startOffset - textAfterAt.length - 1;
        
        range.setStart(textNode, startPos);
        range.setEnd(textNode, range.startOffset);
        range.deleteContents();
        
        // Insert mention chip
        const displayName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || user.username || `User #${user.id}`;
        const isInConversation = conversationParticipantIds.includes(user.id);
        
        const chip = document.createElement("span");
        chip.className = `mention-chip inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md text-xs font-medium ${
          isInConversation 
            ? "bg-primary text-primary-foreground" 
            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        }`;
        chip.setAttribute("data-user-id", user.id);
        chip.setAttribute("contenteditable", "false");
        chip.textContent = `@${displayName}`;
        
        range.insertNode(chip);
        
        // Add space after mention
        const space = document.createTextNode(" ");
        range.setStartAfter(chip);
        range.insertNode(space);
        range.setStartAfter(space);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Update value
        const newText = htmlToText(editor.innerHTML);
        onChange(newText);
      }
    }
    
    setShowMentionDropdown(false);
    setMentionQuery("");
  }, [onChange, htmlToText, conversationParticipantIds]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (showMentionDropdown) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex((prev) => 
          Math.min(prev + 1, filteredUsers.length - 1)
        );
        return;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex((prev) => Math.max(prev - 1, 0));
        return;
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (filteredUsers[selectedMentionIndex]) {
          insertMention(filteredUsers[selectedMentionIndex]);
        }
        return;
      } else if (e.key === "Escape") {
        setShowMentionDropdown(false);
        return;
      }
    }
    
    // Handle Enter with Cmd/Ctrl to send
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      // This will be handled by parent component
    }
  }, [showMentionDropdown, filteredUsers, selectedMentionIndex, insertMention]);

  // Initialize editor content
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    
    // Only update if value changed externally (not from user input)
    const currentText = htmlToText(editor.innerHTML);
    if (currentText !== value) {
      const wasEmpty = !editor.textContent || editor.textContent.trim() === "";
      editor.innerHTML = value ? textToHtml(value) : "";
      
      // If editor was empty and we're setting a value, focus it
      if (wasEmpty && value) {
        setTimeout(() => {
          editor.focus();
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(editor);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }, 0);
      }
    }
  }, [value, htmlToText, textToHtml]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowMentionDropdown(false);
      }
    };
    
    if (showMentionDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMentionDropdown]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={cn(
          "resize-none min-h-[60px] text-sm w-full p-2 border rounded-md",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "overflow-y-auto",
          !value && "text-muted-foreground"
        )}
        style={{
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
      
      {/* Placeholder */}
      {!value && (
        <div
          className="absolute top-2 left-2 text-muted-foreground pointer-events-none"
          style={{ fontSize: "0.875rem" }}
        >
          {placeholder}
        </div>
      )}
      
      {/* Mention Dropdown */}
      {showMentionDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-[100] bg-popover border rounded-md shadow-lg max-h-[200px] overflow-y-auto"
          style={{
            top: `${mentionPosition.top}px`,
            left: `${mentionPosition.left}px`,
            minWidth: "200px",
            position: "fixed",
          }}
        >
          {filteredUsers.length > 0 ? (
            <>
              {filteredUsers.map((user, index) => {
                const displayName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || user.username || `User #${user.id}`;
                const isSelected = index === selectedMentionIndex;
                const isInConversation = conversationParticipantIds.includes(user.id);
                
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => insertMention(user)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors",
                      isSelected && "bg-accent"
                    )}
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{displayName}</div>
                      {user.email && user.email !== displayName && (
                        <div className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </div>
                      )}
                      {!isInConversation && (
                        <div className="text-xs text-yellow-600 dark:text-yellow-400">
                          Not in chat
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </>
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No users found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MentionTextarea;
