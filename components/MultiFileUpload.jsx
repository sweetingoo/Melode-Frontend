"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAttachFiles } from "@/hooks/useFiles";
import { toast } from "sonner";

// File type categories for user-friendly selection
const FILE_TYPE_CATEGORIES = {
  all: {
    label: "All File Types",
    value: "*/*",
    description: "Accept any file type",
    types: [],
  },
  images: {
    label: "Images",
    value: "image/jpeg,image/png,image/gif,image/webp,image/svg+xml",
    description: "JPEG, PNG, GIF, WebP, SVG",
    types: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  },
  documents: {
    label: "Documents",
    value: "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,application/rtf",
    description: "PDF, Word, Excel, Text, RTF",
    types: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "application/rtf",
    ],
  },
  archives: {
    label: "Archives",
    value: "application/zip,application/x-rar-compressed,application/x-tar,application/gzip",
    description: "ZIP, RAR, TAR, GZIP",
    types: [
      "application/zip",
      "application/x-rar-compressed",
      "application/x-tar",
      "application/gzip",
    ],
  },
  videos: {
    label: "Videos",
    value: "video/mp4,video/quicktime,video/x-msvideo,video/webm",
    description: "MP4, QuickTime, AVI, WebM",
    types: ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"],
  },
  audio: {
    label: "Audio",
    value: "audio/mpeg,audio/wav,audio/ogg,audio/mp4",
    description: "MP3, WAV, OGG, M4A",
    types: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"],
  },
};

const MultiFileUpload = ({
  entityType,
  entityId, // Keep for backward compatibility
  entitySlug, // New prop for slug
  onUploadComplete,
  maxFiles = 10,
  maxSizeMB = 10,
  acceptedTypes = "*/*",
  className = "",
  showFileTypeSelector = true,
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  
  // Initialize selected file type - try to match acceptedTypes to a category
  const getInitialFileType = () => {
    if (acceptedTypes === "*/*" || !acceptedTypes) {
      return "all";
    }
    
    // Try to find exact match
    const exactMatch = Object.keys(FILE_TYPE_CATEGORIES).find(
      (key) => FILE_TYPE_CATEGORIES[key].value === acceptedTypes
    );
    if (exactMatch) return exactMatch;
    
    // Try to match by checking if all types in acceptedTypes are in a category
    const acceptedTypesArray = acceptedTypes.split(",").map((t) => t.trim());
    for (const [key, category] of Object.entries(FILE_TYPE_CATEGORIES)) {
      if (key === "all") continue;
      const categoryTypes = category.types || [];
      const allMatch = acceptedTypesArray.every((type) =>
        categoryTypes.includes(type)
      );
      if (allMatch && acceptedTypesArray.length === categoryTypes.length) {
        return key;
      }
    }
    
    return "all"; // Default to all if no match
  };
  
  const [selectedFileType, setSelectedFileType] = useState(getInitialFileType());
  const fileInputRef = useRef(null);
  const attachFilesMutation = useAttachFiles();

  // Get current accepted types based on selection
  // If showFileTypeSelector is false, use the prop value directly
  const currentAcceptedTypes = showFileTypeSelector
    ? FILE_TYPE_CATEGORIES[selectedFileType]?.value || acceptedTypes
    : acceptedTypes;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validateFile = (file) => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File "${file.name}" exceeds maximum size of ${maxSizeMB}MB`,
      };
    }

    // Check file type if specified
    if (currentAcceptedTypes !== "*/*") {
      const allowedTypes = currentAcceptedTypes.split(",").map((t) => t.trim());
      const fileExtension = "." + file.name.split(".").pop().toLowerCase();
      const mimeType = file.type;

      const isAllowed = allowedTypes.some(
        (type) =>
          type === mimeType ||
          type === fileExtension ||
          (type.startsWith(".") && fileExtension === type) ||
          (type.includes("*") && mimeType.startsWith(type.replace("*", "")))
      );

      if (!isAllowed) {
        const category = FILE_TYPE_CATEGORIES[selectedFileType];
        const friendlyType = category?.label || "selected file types";
        return {
          valid: false,
          error: `File type "${file.name}" is not allowed. Please select ${friendlyType.toLowerCase()}.`,
        };
      }
    }

    return { valid: true };
  };

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    const newFiles = [];
    const errors = [];

    // Check total file count
    if (selectedFiles.length + fileArray.length > maxFiles) {
      toast.error(
        `Maximum ${maxFiles} files allowed. Please select fewer files.`
      );
      return;
    }

    fileArray.forEach((file) => {
      const validation = validateFile(file);
      if (validation.valid) {
        // Check for duplicates
        const isDuplicate = selectedFiles.some(
          (f) => f.name === file.name && f.size === file.size
        );
        if (!isDuplicate) {
          newFiles.push({
            file,
            id: `${file.name}-${file.size}-${Date.now()}`,
            status: "pending",
          });
        } else {
          errors.push(`File "${file.name}" is already selected`);
        }
      } else {
        errors.push(validation.error);
      }
    });

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
    }

    if (newFiles.length > 0) {
      setSelectedFiles([...selectedFiles, ...newFiles]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const removeFile = (fileId) => {
    setSelectedFiles(selectedFiles.filter((f) => f.id !== fileId));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    if (!entityType || !entityId) {
      toast.error("Entity information is required");
      return;
    }

    const files = selectedFiles.map((f) => f.file);

    try {
      // Initialize progress
      const progress = {};
      selectedFiles.forEach((f) => {
        progress[f.id] = 0;
      });
      setUploadProgress(progress);

      // Upload files
      await attachFilesMutation.mutateAsync({
        entityType,
        entitySlug: entitySlug || entityId, // Use slug if provided, fallback to id for backward compatibility
        files,
      });

      // Mark all as success
      setSelectedFiles((prev) =>
        prev.map((f) => ({ ...f, status: "success" }))
      );

      // Clear files after a delay
      setTimeout(() => {
        setSelectedFiles([]);
        setUploadProgress({});
        if (onUploadComplete) {
          onUploadComplete();
        }
      }, 2000);
    } catch (error) {
      // Mark all as error
      setSelectedFiles((prev) =>
        prev.map((f) => ({ ...f, status: "error" }))
      );
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "📄";
      case "doc":
      case "docx":
        return "📝";
      case "xls":
      case "xlsx":
        return "📊";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "🖼️";
      case "zip":
      case "rar":
        return "📦";
      default:
        return "📎";
    }
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6 space-y-4">
          {/* File Type Selector */}
          {showFileTypeSelector && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Accepted File Types</label>
              <Select
                value={selectedFileType}
                onValueChange={(value) => {
                  setSelectedFileType(value);
                  // Reset file input when type changes
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                  setSelectedFiles([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FILE_TYPE_CATEGORIES).map(([key, category]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span className="font-medium">{category.label}</span>
                        {category.description && (
                          <span className="text-xs text-muted-foreground">
                            {category.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {FILE_TYPE_CATEGORIES[selectedFileType]?.description && (
                <p className="text-xs text-muted-foreground">
                  {FILE_TYPE_CATEGORIES[selectedFileType].description}
                </p>
              )}
            </div>
          )}

          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={currentAcceptedTypes}
              onChange={(e) => {
                if (e.target.files) {
                  handleFileSelect(e.target.files);
                }
              }}
              className="hidden"
            />

            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 rounded-full bg-muted">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {isDragOver
                    ? "Drop files here"
                    : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {FILE_TYPE_CATEGORIES[selectedFileType]?.label || "Any file type"}
                  {maxSizeMB && ` • Max ${maxSizeMB}MB per file`}
                  {maxFiles && ` • Max ${maxFiles} files`}
                </p>
              </div>
            </div>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Selected Files ({selectedFiles.length})
                </p>
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={attachFilesMutation.isPending}
                  size="sm"
                >
                  {attachFilesMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload {selectedFiles.length} file(s)
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedFiles.map((fileItem) => {
                  const { file, id, status } = fileItem;
                  const progress = uploadProgress[id] || 0;

                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <span className="text-2xl">{getFileIcon(file.name)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                          {progress > 0 && progress < 100 && (
                            <Progress value={progress} className="mt-1 h-1" />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {status === "success" && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {status === "error" && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        {status === "pending" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiFileUpload;

