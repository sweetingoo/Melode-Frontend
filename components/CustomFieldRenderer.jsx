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
import { CalendarIcon, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useDownloadFile } from "@/hooks/useProfile";

const CustomFieldRenderer = ({ 
  field, 
  value, 
  onChange, 
  error 
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
          >
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.field_description || `Select ${field.field_label || field.name}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option, index) => (
                <SelectItem key={index} value={option.value || option}>
                  {option.label || option}
                </SelectItem>
              ))}
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
          >
            {radioOptions.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value || option} id={`${fieldId}-${index}`} />
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
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => handleChange(date ? date.toISOString().split('T')[0] : '')}
                initialFocus
              />
            </PopoverContent>
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size if specified
      const maxSize = field.field_options?.maxSize ? field.field_options.maxSize * 1024 * 1024 : null;
      if (maxSize && file.size > maxSize) {
        alert(`File size must be less than ${field.field_options.maxSize}MB`);
        return;
      }
      
      // Validate file type if specified
      const acceptTypes = field.field_options?.accept;
      if (acceptTypes && acceptTypes !== "*/*") {
        const allowedTypes = acceptTypes.split(',').map(type => type.trim());
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        const mimeType = file.type;
        
        const isAllowed = allowedTypes.some(type => 
          type === mimeType || 
          type === fileExtension ||
          (type.startsWith('.') && fileExtension === type) ||
          (type.includes('*') && mimeType.startsWith(type.replace('*', '')))
        );
        
        if (!isAllowed) {
          alert(`File type not allowed. Accepted types: ${acceptTypes}`);
          return;
        }
      }
      
      // Store the file object for upload
      onChange(file);
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
      const file = files[0];
      // Create a fake event object to reuse the existing handler
      const fakeEvent = {
        target: { files: [file] }
      };
      handleFileChange(fakeEvent);
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
          onChange={handleFileChange}
          accept={field.field_options?.accept || "*/*"}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isDragOver ? 'Drop file here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-muted-foreground">
              {field.field_options?.accept || 'Any file type'}
              {field.field_options?.maxSize && ` • Max ${field.field_options.maxSize}MB`}
            </p>
          </div>
        </div>
      </div>
      
      {/* Selected File Preview */}
      {value && typeof value === 'object' && value.name && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getFileIcon(value.name)}</span>
            <div>
              <p className="text-sm font-medium">{value.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(value.size)}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            className="text-muted-foreground hover:text-destructive"
          >
            ✕
          </Button>
        </div>
      )}
      
      {/* Existing File Info with Download */}
      {value && typeof value === 'number' && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📎</span>
            <div>
              <p className="text-sm font-medium">File ID: {value}</p>
              <p className="text-xs text-muted-foreground">
                Click download to view the file
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={downloadFileMutation.isPending}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
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

export default CustomFieldRenderer;
