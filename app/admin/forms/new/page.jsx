"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Plus, Trash2, Info } from "lucide-react";
import { useCreateForm } from "@/hooks/useForms";
import { useRoles } from "@/hooks/useRoles";
import { toast } from "sonner";

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio" },
];

const formTypes = [
  { value: "handover", label: "Handover" },
  { value: "assessment", label: "Assessment" },
  { value: "incident", label: "Incident" },
  { value: "maintenance", label: "Maintenance" },
  { value: "general", label: "General" },
];

const NewFormPage = () => {
  const router = useRouter();
  const createFormMutation = useCreateForm();
  const { data: rolesData } = useRoles();
  const roles = rolesData || [];

  const [formData, setFormData] = useState({
    form_name: "",
    form_title: "",
    form_description: "",
    form_type: "general",
    is_active: true,
    is_template: false,
    form_fields: {
      fields: [],
      sections: [],
    },
    form_config: {
      layout: "single_column",
      submit_button_text: "Submit",
      success_message: "Form submitted successfully",
      allow_draft: false,
      auto_save: false,
      mandatory_completion: false,
      automation: {
        auto_create_tasks: false,
        create_individual_tasks: false,
        task_assignee_role: "",
        due_time_minutes: 30,
        escalation_enabled: false,
      },
    },
    access_config: {
      public_access: false,
      requires_authentication: true,
      allowed_roles: [],
      allowed_users: [],
    },
  });

  const [newField, setNewField] = useState({
    field_id: "",
    field_name: "",
    field_type: "text",
    label: "",
    required: false,
    options: [],
  });
  const [newOption, setNewOption] = useState("");

  const handleAddOption = () => {
    if (!newOption.trim()) {
      toast.error("Option value is required");
      return;
    }
    setNewField({
      ...newField,
      options: [...newField.options, newOption.trim()],
    });
    setNewOption("");
  };

  const handleRemoveOption = (index) => {
    const newOptions = [...newField.options];
    newOptions.splice(index, 1);
    setNewField({
      ...newField,
      options: newOptions,
    });
  };

  const handleAddField = () => {
    if (!newField.field_id || !newField.label) {
      toast.error("Field ID and Label are required");
      return;
    }

    // For select and radio, require at least one option
    if ((newField.field_type === "select" || newField.field_type === "radio") && newField.options.length === 0) {
      toast.error(`${newField.field_type === "select" ? "Select" : "Radio"} fields require at least one option`);
      return;
    }

    const field = {
      field_id: newField.field_id,
      field_name: newField.field_name || newField.field_id,
      field_type: newField.field_type,
      label: newField.label,
      required: newField.required,
    };

    // Add options for select and radio fields
    if ((newField.field_type === "select" || newField.field_type === "radio") && newField.options.length > 0) {
      field.field_options = {
        options: newField.options.map(opt => ({
          value: opt,
          label: opt,
        })),
      };
    }

    setFormData({
      ...formData,
      form_fields: {
        ...formData.form_fields,
        fields: [...formData.form_fields.fields, field],
      },
    });

    setNewField({
      field_id: "",
      field_name: "",
      field_type: "text",
      label: "",
      required: false,
      options: [],
    });
    setNewOption("");
  };

  const handleRemoveField = (index) => {
    const newFields = [...formData.form_fields.fields];
    newFields.splice(index, 1);
    setFormData({
      ...formData,
      form_fields: {
        ...formData.form_fields,
        fields: newFields,
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.form_name || !formData.form_title) {
      toast.error("Form name and title are required");
      return;
    }

    try {
      const result = await createFormMutation.mutateAsync(formData);
      toast.success("Form created successfully");
      router.push(`/admin/forms/${result.id}`);
    } catch (error) {
      console.error("Failed to create form:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/forms">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Form</h1>
          <p className="text-muted-foreground">
            Build a custom form with fields and configuration
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Form Builder */}
          <div className="md:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="form_name">Form Name (Internal) *</Label>
                  <Input
                    id="form_name"
                    value={formData.form_name}
                    onChange={(e) =>
                      setFormData({ ...formData, form_name: e.target.value })
                    }
                    placeholder="e.g., daily_check_form"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Internal identifier (lowercase, no spaces)
                  </p>
                </div>
                <div>
                  <Label htmlFor="form_title">Form Title (Display) *</Label>
                  <Input
                    id="form_title"
                    value={formData.form_title}
                    onChange={(e) =>
                      setFormData({ ...formData, form_title: e.target.value })
                    }
                    placeholder="e.g., Daily Equipment Check"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="form_description">Description</Label>
                  <Textarea
                    id="form_description"
                    value={formData.form_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        form_description: e.target.value,
                      })
                    }
                    placeholder="Describe the purpose of this form"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="form_type">Form Type</Label>
                    <Select
                      value={formData.form_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, form_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_template"
                      checked={formData.is_template}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_template: checked })
                      }
                    />
                    <Label htmlFor="is_template">Save as Template</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Fields Builder */}
            <Card>
              <CardHeader>
                <CardTitle>Form Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Field */}
                <div className="p-4 border rounded-md space-y-4">
                  <h3 className="font-medium">Add New Field</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="field_id">Field ID *</Label>
                      <Input
                        id="field_id"
                        value={newField.field_id}
                        onChange={(e) =>
                          setNewField({ ...newField, field_id: e.target.value })
                        }
                        placeholder="e.g., equipment_name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="field_type">Field Type</Label>
                      <Select
                        value={newField.field_type}
                        onValueChange={(value) =>
                          setNewField({ ...newField, field_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="field_label">Label *</Label>
                    <Input
                      id="field_label"
                      value={newField.label}
                      onChange={(e) =>
                        setNewField({ ...newField, label: e.target.value })
                      }
                      placeholder="e.g., Equipment Name"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="field_required"
                      checked={newField.required}
                      onCheckedChange={(checked) =>
                        setNewField({ ...newField, required: checked })
                      }
                    />
                    <Label htmlFor="field_required">Required</Label>
                  </div>
                  
                  {/* Options for select and radio fields */}
                  {(newField.field_type === "select" || newField.field_type === "radio") && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label>Options</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                          placeholder="Enter option value"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddOption();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={handleAddOption}
                          variant="outline"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {newField.options.length > 0 && (
                        <div className="space-y-1">
                          {newField.options.map((option, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-muted rounded-md"
                            >
                              <span className="text-sm">{option}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveOption(index)}
                                className="h-6 w-6"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Button
                    type="button"
                    onClick={handleAddField}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Field
                  </Button>
                </div>

                {/* Existing Fields */}
                {formData.form_fields.fields.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="font-medium">Fields ({formData.form_fields.fields.length})</h3>
                    {formData.form_fields.fields.map((field, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{field.label}</span>
                          <Badge variant="outline">{field.field_type}</Badge>
                          {field.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveField(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No fields added yet. Add your first field above.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Configuration */}
          <div className="space-y-6">
            {/* Form Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Form Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="submit_button_text">Submit Button Text</Label>
                  <Input
                    id="submit_button_text"
                    value={formData.form_config.submit_button_text}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        form_config: {
                          ...formData.form_config,
                          submit_button_text: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="success_message">Success Message</Label>
                  <Textarea
                    id="success_message"
                    value={formData.form_config.success_message}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        form_config: {
                          ...formData.form_config,
                          success_message: e.target.value,
                        },
                      })
                    }
                    rows={2}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allow_draft"
                    checked={formData.form_config.allow_draft}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        form_config: {
                          ...formData.form_config,
                          allow_draft: checked,
                        },
                      })
                    }
                  />
                  <Label htmlFor="allow_draft">Allow Draft</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto_save"
                    checked={formData.form_config.auto_save}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        form_config: {
                          ...formData.form_config,
                          auto_save: checked,
                        },
                      })
                    }
                  />
                  <Label htmlFor="auto_save">Auto-save</Label>
                </div>
              </CardContent>
            </Card>

            {/* Automation Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Automation Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto_create_tasks"
                    checked={formData.form_config.automation?.auto_create_tasks || false}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        form_config: {
                          ...formData.form_config,
                          automation: {
                            ...formData.form_config.automation,
                            auto_create_tasks: checked,
                            // Reset create_individual_tasks if auto_create_tasks is disabled
                            create_individual_tasks: checked
                              ? formData.form_config.automation?.create_individual_tasks || false
                              : false,
                          },
                        },
                      })
                    }
                  />
                  <Label htmlFor="auto_create_tasks">Auto-create tasks</Label>
                </div>

                {formData.form_config.automation?.auto_create_tasks && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="create_individual_tasks"
                        checked={formData.form_config.automation?.create_individual_tasks || false}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            form_config: {
                              ...formData.form_config,
                              automation: {
                                ...formData.form_config.automation,
                                create_individual_tasks: checked,
                              },
                            },
                          })
                        }
                      />
                      <div className="flex-1">
                        <Label htmlFor="create_individual_tasks" className="cursor-pointer">
                          Create individual tasks
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Each user in the role gets their own task
                        </p>
                      </div>
                    </div>

                    {formData.form_config.automation?.create_individual_tasks ? (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Individual Tasks Mode
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                              Each user in the assigned role will receive their own separate task
                              to complete individually.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800 rounded-md">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-gray-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Collaborative Task Mode
                            </p>
                            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                              One task will be created and assigned to the role for collaborative
                              completion.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="task_assignee_role">Task Assignee Role</Label>
                      <Select
                        value={formData.form_config.automation?.task_assignee_role || ""}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            form_config: {
                              ...formData.form_config,
                              automation: {
                                ...formData.form_config.automation,
                                task_assignee_role: value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger id="task_assignee_role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.name || role.slug}>
                              {role.display_name || role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="due_time_minutes">Due Time (minutes)</Label>
                      <Input
                        id="due_time_minutes"
                        type="number"
                        min="0"
                        value={formData.form_config.automation?.due_time_minutes || 30}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            form_config: {
                              ...formData.form_config,
                              automation: {
                                ...formData.form_config.automation,
                                due_time_minutes: parseInt(e.target.value) || 30,
                              },
                            },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="escalation_enabled"
                        checked={formData.form_config.automation?.escalation_enabled || false}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            form_config: {
                              ...formData.form_config,
                              automation: {
                                ...formData.form_config.automation,
                                escalation_enabled: checked,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="escalation_enabled">Escalation enabled</Label>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Link href="/admin/forms">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={createFormMutation.isPending}
          >
            {createFormMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Form
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewFormPage;

