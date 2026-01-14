"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Download, FileText, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useDownloadFile } from "@/hooks/useProfile";
import { useFileReferences } from "@/hooks/useFileReferences";

const CustomFieldRenderer = ({ 
  field, 
  value, 
  onChange, 
  error,
  readOnly = false
}) => {
  const fieldId = `custom-field-${field.id}`;
  const isRequired = field.is_required || field.required;
  const fieldType = field.field_type || field.type;

  const handleChange = (newValue) => {
    onChange(field.id, newValue);
  };

  const renderField = () => {
    switch (fieldType?.toLowerCase()) {
      case 'text':
      case 'string':
        return (
          <Input
            id={fieldId}
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.field_description || `Enter ${field.field_label || field.name}`}
            maxLength={field.max_length}
            className={error ? 'border-red-500' : ''}
            disabled={readOnly}
            readOnly={readOnly}
          />
        );

      case 'email':
        return (
          <Input
            id={fieldId}
            type="email"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.field_description || `Enter ${field.field_label || field.name}`}
            className={error ? 'border-red-500' : ''}
            disabled={readOnly}
            readOnly={readOnly}
          />
        );

      case 'number':
      case 'integer':
        return (
          <Input
            id={fieldId}
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.field_description || `Enter ${field.field_label || field.name}`}
            min={field.min_value}
            max={field.max_value}
            className={error ? 'border-red-500' : ''}
            disabled={readOnly}
            readOnly={readOnly}
          />
        );

      case 'decimal':
      case 'float':
        return (
          <Input
            id={fieldId}
            type="number"
            step="0.01"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.field_description || `Enter ${field.field_label || field.name}`}
            min={field.min_value}
            max={field.max_value}
            className={error ? 'border-red-500' : ''}
            disabled={readOnly}
            readOnly={readOnly}
          />
        );

      case 'textarea':
      case 'text_area':
        return (
          <Textarea
            id={fieldId}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.field_description || `Enter ${field.field_label || field.name}`}
            maxLength={field.max_length}
            rows={4}
            className={error ? 'border-red-500' : ''}
            disabled={readOnly}
            readOnly={readOnly}
          />
        );

      case 'boolean':
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              checked={value === true || value === 'true'}
              onCheckedChange={(checked) => handleChange(checked)}
              disabled={readOnly}
            />
            <Label htmlFor={fieldId} className="text-sm font-normal">
              {field.field_description || field.field_label || field.name}
            </Label>
          </div>
        );

      case 'select':
      case 'dropdown':
        const options = field.field_options?.options || field.options || [];
        return (
          <Select
            value={value || ''}
            onValueChange={handleChange}
            disabled={readOnly}
          >
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.field_description || `Select ${field.field_label || field.name}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option, index) => {
                // Ensure value is never an empty string
                const optionValue = option.value || option || `option-${index}`;
                const safeValue = optionValue === "" ? `option-${index}` : String(optionValue);
                return (
                  <SelectItem key={index} value={safeValue}>
                    {option.label || option}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );

      case 'radio':
      case 'radio_group':
        const radioOptions = field.field_options?.options || field.options || [];
        return (
          <RadioGroup
            value={value || ''}
            onValueChange={handleChange}
            className={error ? 'border-red-500' : ''}
            disabled={readOnly}
          >
            {radioOptions.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value || option} id={`${fieldId}-${index}`} disabled={readOnly} />
                <Label htmlFor={`${fieldId}-${index}`} className="text-sm font-normal">
                  {option.label || option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground",
                  error && "border-red-500"
                )}
                disabled={readOnly}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            {!readOnly && (
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={value ? new Date(value) : undefined}
                  onSelect={(date) => handleChange(date ? date.toISOString().split('T')[0] : '')}
                  initialFocus
                />
              </PopoverContent>
            )}
          </Popover>
        );

      case 'datetime':
      case 'date_time':
        return (
          <div className="space-y-2">
            <Input
              id={fieldId}
              type="datetime-local"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              className={error ? 'border-red-500' : ''}
              disabled={readOnly}
              readOnly={readOnly}
            />
          </div>
        );

      case 'time':
        return (
          <Input
            id={fieldId}
            type="time"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? 'border-red-500' : ''}
            disabled={readOnly}
            readOnly={readOnly}
          />
        );

      case 'url':
        return (
          <Input
            id={fieldId}
            type="url"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.field_description || `Enter ${field.field_label || field.name}`}
            className={error ? 'border-red-500' : ''}
            disabled={readOnly}
            readOnly={readOnly}
          />
        );

      case 'phone':
        return (
          <Input
            id={fieldId}
            type="tel"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.field_description || `Enter ${field.field_label || field.name}`}
            className={error ? 'border-red-500' : ''}
            disabled={readOnly}
            readOnly={readOnly}
          />
        );

      case 'multiselect':
        const multiOptions = field.field_options?.options || field.options || [];
        const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);
        
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {multiOptions.map((option, index) => {
                const optionValue = option.value || option;
                const isSelected = selectedValues.includes(optionValue);
                
                return (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${fieldId}-${index}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleChange([...selectedValues, optionValue]);
                        } else {
                          handleChange(selectedValues.filter(v => v !== optionValue));
                        }
                      }}
                    />
                    <Label htmlFor={`${fieldId}-${index}`} className="text-sm font-normal">
                      {option.label || option}
                    </Label>
                  </div>
                );
              })}
            </div>
            {selectedValues.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Selected: {selectedValues.join(', ')}
              </div>
            )}
          </div>
        );

      case 'file':
        return <FileFieldRenderer 
          field={field} 
          value={value} 
          onChange={handleChange} 
          error={error} 
          fieldId={fieldId} 
        />;

      case 'json':
        return (
          <div className="space-y-2">
            <Textarea
              id={fieldId}
              value={typeof value === 'string' ? value : JSON.stringify(value || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleChange(parsed);
                } catch {
                  // If not valid JSON, store as string for now
                  handleChange(e.target.value);
                }
              }}
              placeholder={field.field_description || `Enter JSON data for ${field.field_label || field.name}`}
              rows={6}
              className={`font-mono text-sm ${error ? 'border-red-500' : ''}`}
            />
            <div className="text-xs text-muted-foreground">
              Enter valid JSON format. Use proper syntax with quotes around keys and string values.
            </div>
          </div>
        );

      // Display-only field types
      case 'text_block':
        const textContent = field.content || field.field_content || '';
        const textLabel = field.label || field.field_label || field.name;
        
        // Use useFileReferences hook to handle file references in content
        const TextBlockContent = () => {
          const { processedHtml, containerRef } = useFileReferences(textContent);
          
          return (
            <div 
              ref={containerRef}
              className="text-sm text-foreground prose prose-sm max-w-none w-full break-words mb-4"
              style={{ 
                position: 'relative', 
                display: 'block',
                clear: 'both',
                overflow: 'auto',
                marginBottom: '1rem',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}
              dangerouslySetInnerHTML={{ __html: processedHtml }}
            />
          );
        };
        
        return (
          <div 
            className="space-y-2 w-full my-4 mb-6"
            style={{
              position: 'relative',
              display: 'block',
              width: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}
          >
            {textLabel && (
              <h4 className="text-sm font-semibold">{textLabel}</h4>
            )}
            <TextBlockContent />
          </div>
        );

      case 'image_block':
        // Check multiple possible field name variations
        const imageUrl = field.image_url || field.field_image_url || field.imageUrl;
        const imageFileId = field.image_file_id || field.field_image_file_id || field.imageFileId;
        const altText = field.alt_text || field.field_alt_text || field.altText;
        const imageLabel = field.label || field.field_label || field.name;
        
        // Debug logging in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Image block field data:', {
            fieldType: field.field_type,
            imageUrl,
            imageFileId,
            altText,
            imageLabel,
            fullField: field
          });
        }
        
        // Construct image source URL - prefer image_url (download_url) over image_file_id
        let imageSrc = null;
        if (imageUrl) {
          // Use the download_url directly (stored in image_url)
          imageSrc = imageUrl;
        } else if (imageFileId) {
          // Fallback: construct URL from file ID if image_url is not available
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://melode-api-prod.onrender.com/api/v1';
          imageSrc = `${apiBaseUrl}/settings/files/${imageFileId}/download`;
        }
        
        return (
          <div 
            className="space-y-2 w-full my-4"
            style={{ 
              position: 'relative', 
              display: 'block',
              clear: 'both',
              overflow: 'visible'
            }}
          >
            {imageLabel && (
              <h4 className="text-sm font-semibold">{imageLabel}</h4>
            )}
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={altText || imageLabel || 'Form image'}
                className="max-w-full h-auto rounded-md border"
                style={{ 
                  position: 'relative', 
                  display: 'block',
                  clear: 'both'
                }}
                onError={(e) => {
                  console.error('Image failed to load:', imageSrc);
                  // Fallback if image fails to load
                  const errorDiv = e.target.parentNode.querySelector('.image-error');
                  if (!errorDiv) {
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'image-error p-4 border border-dashed rounded-md text-center text-sm text-muted-foreground mt-2';
                    errorMsg.textContent = `Failed to load image: ${imageSrc}`;
                    e.target.parentNode.appendChild(errorMsg);
                  }
                }}
                onLoad={() => {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('Image loaded successfully:', imageSrc);
                  }
                }}
              />
            ) : (
              <div className="p-4 border border-dashed rounded-md text-center text-sm text-muted-foreground">
                <p>No image provided</p>
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-xs mt-2">Debug: imageUrl={imageUrl ? 'exists' : 'missing'}, imageFileId={imageFileId ? 'exists' : 'missing'}</p>
                )}
              </div>
            )}
          </div>
        );

      case 'line_break':
        return (
          <hr 
            className="my-4 border-t border-border w-full" 
            style={{ 
              position: 'relative', 
              display: 'block',
              clear: 'both'
            }} 
          />
        );

      case 'page_break':
        return (
          <div 
            className="my-8 border-t-2 border-dashed border-border w-full"
            style={{ 
              position: 'relative', 
              display: 'block',
              clear: 'both',
              overflow: 'visible'
            }}
          >
            <div className="mt-4 text-center text-xs text-muted-foreground">
              Page Break
            </div>
          </div>
        );

      case 'download_link':
        const downloadUrl = field.download_url || field.field_download_url;
        const downloadLabel = field.label || field.field_label || field.name || 'Download';
        const downloadDescription = field.field_description || field.help_text;
        
        return (
          <div 
            className="space-y-2 w-full my-4"
            style={{ 
              position: 'relative', 
              display: 'block',
              clear: 'both',
              overflow: 'visible'
            }}
          >
            {downloadDescription && (
              <p className="text-sm text-muted-foreground">{downloadDescription}</p>
            )}
            {downloadUrl ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(downloadUrl, '_blank')}
                className="w-full"
                style={{ position: 'relative', display: 'block' }}
              >
                <Download className="mr-2 h-4 w-4" />
                {downloadLabel}
              </Button>
            ) : (
              <div className="p-4 border border-dashed rounded-md text-center text-sm text-muted-foreground">
                No download URL provided
              </div>
            )}
          </div>
        );

      case 'youtube_video_embed': {
        // Check multiple possible field name variations
        const videoUrl = field.video_url || field.field_video_url || field.videoUrl;
        const videoAltText = field.alt_text || field.field_alt_text || field.altText;
        const videoLabel = field.label || field.field_label || field.name;
        
        // Helper function to convert YouTube URL to embed format
        const getYouTubeEmbedUrl = (url) => {
          if (!url) return null;
          
          // Handle various YouTube URL formats
          // https://www.youtube.com/watch?v=VIDEO_ID
          // https://youtube.com/watch?v=VIDEO_ID
          // https://youtu.be/VIDEO_ID
          // https://www.youtube.com/embed/VIDEO_ID
          // https://youtube.com/embed/VIDEO_ID
          
          let videoId = null;
          
          // Check if already an embed URL
          const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
          if (embedMatch) {
            videoId = embedMatch[1];
          } else {
            // Extract video ID from watch URL
            const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
            if (watchMatch) {
              videoId = watchMatch[1];
            } else {
              // Extract from youtu.be short URL
              const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
              if (shortMatch) {
                videoId = shortMatch[1];
              }
            }
          }
          
          if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
          }
          
          return null;
        };
        
        const embedUrl = getYouTubeEmbedUrl(videoUrl);
        
        return (
          <div 
            className="space-y-2 w-full my-4"
            style={{ 
              position: 'relative', 
              display: 'block',
              clear: 'both',
              overflow: 'visible'
            }}
          >
            {videoLabel && (
              <h4 className="text-sm font-semibold">{videoLabel}</h4>
            )}
            {embedUrl ? (
              <div className="relative w-full" style={{ paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                <iframe
                  src={embedUrl}
                  title={videoAltText || videoLabel || 'YouTube video'}
                  className="absolute top-0 left-0 w-full h-full border rounded-md"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                />
              </div>
            ) : videoUrl ? (
              <div className="p-4 border border-dashed rounded-md text-center text-sm text-muted-foreground">
                <p>Invalid YouTube URL format</p>
                <p className="text-xs mt-2">Please provide a valid YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)</p>
              </div>
            ) : (
              <div className="p-4 border border-dashed rounded-md text-center text-sm text-muted-foreground">
                <p>No video URL provided</p>
              </div>
            )}
          </div>
        );
      }

      case 'signature':
        return <SignatureFieldRenderer 
          field={field} 
          value={value} 
          onChange={handleChange} 
          error={error} 
          fieldId={fieldId} 
        />;

      default:
        return (
          <Input
            id={fieldId}
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.field_description || `Enter ${field.field_label || field.name}`}
            className={error ? 'border-red-500' : ''}
          />
        );
    }
  };

  // Check if this is a display-only field
  const isDisplayOnly = ['text_block', 'image_block', 'line_break', 'page_break', 'download_link', 'youtube_video_embed'].includes(fieldType?.toLowerCase());

  // For display-only fields, render without the standard label/description wrapper
  if (isDisplayOnly) {
    return renderField();
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId} className="text-sm font-medium">
        {field.field_label || field.name}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {field.field_description && (
        <p className="text-sm text-muted-foreground">
          {field.field_description}
        </p>
      )}
      {renderField()}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

// File Field Renderer Component
const FileFieldRenderer = ({ field, value, onChange, error, fieldId }) => {
  const downloadFileMutation = useDownloadFile();
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef(null);
  
  // Check if multiple files are allowed
  const allowMultiple = field.field_options?.allowMultiple || false;
  const requireExpiryDate = field.field_options?.requireExpiryDate || false;
  
  // Normalize value to array for easier handling
  // Value can be: File object, {file: File, expiryDate: string}, array of either, or file IDs
  const currentFiles = React.useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  }, [value]);

  // Handle file with expiry date structure
  const getFileFromValue = (val) => {
    if (val instanceof File) return { file: val, expiryDate: null };
    if (val && typeof val === 'object' && val.file) return val;
    return null;
  };

  const getExpiryDateFromValue = (val) => {
    if (val && typeof val === 'object' && val.expiryDate) return val.expiryDate;
    return null;
  };

  const updateFileExpiryDate = (index, expiryDate) => {
    const files = [...currentFiles];
    const fileValue = files[index];
    
    if (fileValue instanceof File) {
      files[index] = { file: fileValue, expiryDate };
    } else if (fileValue && typeof fileValue === 'object' && fileValue.file) {
      files[index] = { ...fileValue, expiryDate };
    } else {
      // For file IDs, we can't update expiry date (already uploaded)
      return;
    }
    
    onChange(allowMultiple ? files : files[0]);
  };

  const validateFile = (file) => {
    // Get max size from field_options or validation
    const maxSizeMB = field.field_options?.maxSize || field.validation?.max_size_mb;
    const maxSize = maxSizeMB ? maxSizeMB * 1024 * 1024 : null;
    
    if (maxSize && file.size > maxSize) {
      return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
    }
    
    // Get allowed types from field_options or validation
    const acceptTypes = field.field_options?.accept || field.validation?.allowed_types;
    if (acceptTypes && acceptTypes !== "*/*") {
      // Handle both array and comma-separated string formats
      const allowedTypes = Array.isArray(acceptTypes)
        ? acceptTypes
        : acceptTypes.split(',').map(type => type.trim());
      
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      const mimeType = file.type;
      
      const isAllowed = allowedTypes.some(type => 
        type === mimeType || 
        type === fileExtension ||
        (type.startsWith('.') && fileExtension === type) ||
        (type.includes('*') && mimeType.startsWith(type.replace('*', '')))
      );
      
      if (!isAllowed) {
        const typesDisplay = Array.isArray(acceptTypes) 
          ? acceptTypes.join(', ') 
          : acceptTypes;
        return { valid: false, error: `File type not allowed. Accepted types: ${typesDisplay}` };
      }
    }
    
    return { valid: true };
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const validatedFiles = [];
    const errors = [];
    
    files.forEach((file) => {
      // Check for duplicates in existing files
      const isDuplicate = currentFiles.some(
        (existingFile) => 
          existingFile instanceof File && 
          existingFile.name === file.name && 
          existingFile.size === file.size &&
          existingFile.lastModified === file.lastModified
      );
      
      if (isDuplicate) {
        errors.push(`File "${file.name}" is already selected`);
        return;
      }
      
      const validation = validateFile(file);
      if (validation.valid) {
        validatedFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });
    
    if (errors.length > 0) {
      // Use alert for now since toast might not be available in all contexts
      errors.forEach(error => alert(error));
    }
    
    if (validatedFiles.length > 0) {
      if (allowMultiple) {
        // Add to existing files array (avoid duplicates)
        // Wrap files in objects if expiry date is required
        const newFiles = validatedFiles.map(file => 
          requireExpiryDate ? { file, expiryDate: null } : file
        );
        onChange([...currentFiles, ...newFiles]);
      } else {
        // Single file mode - replace with first file
        // Wrap file in object if expiry date is required
        onChange(requireExpiryDate ? { file: validatedFiles[0], expiryDate: null } : validatedFiles[0]);
      }
    }
    
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Create a fake event object to reuse the existing handler
      const fakeEvent = {
        target: { files }
      };
      handleFileChange(fakeEvent);
    }
  };
  
  const removeFile = (indexToRemove) => {
    if (allowMultiple) {
      const newFiles = currentFiles.filter((_, index) => index !== indexToRemove);
      onChange(newFiles.length === 0 ? null : newFiles);
    } else {
      onChange(null);
    }
  };

  const handleDownload = () => {
    if (value && typeof value === 'number') {
      downloadFileMutation.mutate(value);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'zip':
      case 'rar':
        return '📦';
      default:
        return '📎';
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }
          ${error ? 'border-red-500' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          id={fieldId}
          type="file"
          multiple={allowMultiple}
          onChange={handleFileChange}
          accept={(() => {
            const acceptTypes = field.field_options?.accept || field.validation?.allowed_types;
            if (!acceptTypes || acceptTypes === "*/*") return "*/*";
            // Convert array to comma-separated string if needed
            return Array.isArray(acceptTypes) ? acceptTypes.join(',') : acceptTypes;
          })()}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isDragOver 
                ? `Drop ${allowMultiple ? 'files' : 'file'} here` 
                : `Click to upload or drag and drop ${allowMultiple ? 'files' : 'file'}`
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {(() => {
                const acceptTypes = field.field_options?.accept || field.validation?.allowed_types;
                const maxSize = field.field_options?.maxSize || field.validation?.max_size_mb;
                
                let message = '';
                if (acceptTypes) {
                  const types = Array.isArray(acceptTypes) 
                    ? acceptTypes.join(', ') 
                    : acceptTypes;
                  message = `Allowed: ${types}`;
                } else {
                  message = 'Any file type';
                }
                
                if (maxSize) {
                  message += ` • Max ${maxSize}MB`;
                }
                
                if (allowMultiple && currentFiles.length > 0) {
                  message += ` • ${currentFiles.length} file${currentFiles.length !== 1 ? 's' : ''} selected`;
                }
                
                return message;
              })()}
            </p>
          </div>
        </div>
      </div>
      
      {/* Selected Files Preview */}
      {currentFiles.length > 0 && (
        <div className="space-y-2">
          {currentFiles.map((file, index) => {
            // Handle File objects
            if (file && typeof file === 'object' && file.name) {
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(file.name)}</span>
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ✕
                  </Button>
                </div>
              );
            }
            // Handle file IDs (numbers)
            if (typeof file === 'number') {
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📎</span>
                    <div>
                      <p className="text-sm font-medium">File ID: {file}</p>
                      <p className="text-xs text-muted-foreground">
                        Click download to view the file
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFileMutation.mutate(file)}
                      disabled={downloadFileMutation.isPending}
                      className="flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </Button>
                    {allowMultiple && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
      
      {/* File Info from API Response */}
      {value && typeof value === 'object' && value.file_name && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getFileIcon(value.file_name)}</span>
            <div>
              <p className="text-sm font-medium">{value.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {value.file_size_bytes && formatFileSize(value.file_size_bytes)}
                {value.content_type && ` • ${value.content_type}`}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadFileMutation.mutate(value.id)}
            disabled={downloadFileMutation.isPending}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
        </div>
      )}
    </div>
  );
};

// Signature Field Renderer Component
const SignatureFieldRenderer = ({ field, value, onChange, error, fieldId }) => {
  const canvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasSignature, setHasSignature] = React.useState(!!value);

  React.useEffect(() => {
    if (value && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = value;
    }
  }, [value]);

  // Get coordinates from event (mouse or touch)
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      // Touch end event
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (e) e.preventDefault();
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const signatureData = canvas.toDataURL('image/png');
      onChange(signatureData);
      setHasSignature(true);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onChange(null);
      setHasSignature(false);
    }
  };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Set canvas size based on container
      const resizeCanvas = () => {
        const container = canvas.parentElement;
        if (container) {
          const containerWidth = container.clientWidth || 600;
          // Maintain aspect ratio (3:1)
          canvas.width = containerWidth;
          canvas.height = Math.max(150, containerWidth / 3);
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          
          // Re-apply drawing settings after resize
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          // Redraw existing signature if any
          if (value) {
            const img = new Image();
            img.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = value;
          }
        }
      };
      
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      
      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }
  }, [value]);

  return (
    <div className="space-y-2 w-full">
      <div className="w-full overflow-hidden" style={{ touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          className="border-2 border-border rounded-md cursor-crosshair bg-white w-full"
          style={{ 
            touchAction: 'none',
            display: 'block',
            maxWidth: '100%',
            height: 'auto'
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />
      </div>
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          {hasSignature ? 'Signature captured' : 'Sign above'}
        </p>
        {hasSignature && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default CustomFieldRenderer;
