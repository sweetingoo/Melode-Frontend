/**
 * Custom Fields Component for dynamic form rendering
 */

class CustomFieldsComponent {
    constructor() {
        this.userId = null;
        this.hierarchy = null;
        this.userValues = null;
        this.isLoading = false;
        this.hasChanges = false;
    }

    /**
     * Initialize the custom fields component
     */
    async init(userId) {
        console.log('CustomFieldsComponent.init called with userId:', userId);

        // Prevent multiple initializations
        if (this.userId === userId && this.hierarchy !== null) {
            console.log('Custom fields already initialized for user:', userId);
            return;
        }

        this.userId = userId;
        this.isLoading = true;
        this.render(); // Show loading state immediately

        try {
            console.log('Loading custom fields for user:', userId);
            console.log('API Base URL:', window.apiClient.baseURL);

            // Add timeout to prevent infinite loading
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), 10000)
            );

            // Load hierarchy, user values, and management data in parallel with timeout
            const [hierarchy, userValues, managementData] = await Promise.race([
                Promise.all([
                    window.apiClient.getCustomFieldsHierarchy('user', userId),
                    window.apiClient.getUserCustomFields('user', userId),
                    window.apiClient.request('/settings/custom-fields/?entity_type=user')
                ]),
                timeoutPromise
            ]);

            console.log('Custom fields hierarchy:', hierarchy);
            console.log('Custom fields user values:', userValues);
            console.log('Management data:', managementData);
            console.log('First section structure:', hierarchy.sections[0]);
            if (hierarchy.sections[0] && hierarchy.sections[0].subsections) {
                console.log('First subsection structure:', hierarchy.sections[0].subsections[0]);
            }

            // Debug: Check for orphaned fields
            console.log('Total sections in hierarchy:', hierarchy.sections.length);
            console.log('Total sections in userValues:', userValues.sections.length);

            // Check if there are any fields at the root level
            if (hierarchy.fields) {
                console.log('Root level fields found:', hierarchy.fields);
            }
            if (userValues.fields) {
                console.log('Root level fields in userValues:', userValues.fields);
            }

            this.hierarchy = hierarchy;
            this.userValues = userValues;
            this.managementData = managementData;
            this.isLoading = false;
            this.render();
        } catch (error) {
            console.error('Failed to load custom fields:', error);
            console.error('Error details:', error.message, error.status);
            this.isLoading = false;
            // Show a more user-friendly message
            this.renderNoFields();
        }
    }

    /**
     * Render the custom fields form
     */
    render() {
        const container = document.getElementById('custom-fields-container');
        if (!container) {
            console.error('Custom fields container not found!');
            return;
        }

        console.log('Rendering custom fields - isLoading:', this.isLoading, 'hierarchy:', this.hierarchy);

        if (this.isLoading) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p class="mt-2 text-sm text-gray-500">Loading custom fields...</p>
                </div>
            `;
            return;
        }

        // Check if we have any data at all
        const hasSections = this.hierarchy && this.hierarchy.sections && this.hierarchy.sections.length > 0;
        const orphanedFields = this.getOrphanedFields();
        const hasOrphanedFields = orphanedFields && orphanedFields.length > 0;

        console.log('Has sections:', hasSections, 'Has orphaned fields:', hasOrphanedFields);
        console.log('Orphaned fields:', orphanedFields);

        if (!hasSections && !hasOrphanedFields) {
            console.log('No sections or orphaned fields found, showing no fields message');
            this.renderNoFields();
            return;
        }

        console.log('Rendering sections:', this.hierarchy.sections.length);

        // Add debug information
        let debugInfo = '';
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            debugInfo = `
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h4 class="text-sm font-medium text-yellow-800 mb-2">Debug Information</h4>
                    <div class="text-xs text-yellow-700 space-y-1">
                        <div>Hierarchy sections: ${this.hierarchy.sections.length}</div>
                        <div>Orphaned fields: ${orphanedFields.length}</div>
                        <div>User values sections: ${this.userValues.sections.length}</div>
                        <div>Total fields in sections: ${this.hierarchy.sections.reduce((total, section) => total + (section.fields ? section.fields.length : 0), 0)}</div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = debugInfo + this.renderSections();
        this.attachEventListeners();
    }

    /**
     * Render all sections
     */
    renderSections() {
        let html = '';

        // Render sections
        html += this.hierarchy.sections.map(section => this.renderSection(section)).join('');

        // Render orphaned fields (fields without sections)
        const orphanedFields = this.getOrphanedFields();
        if (orphanedFields.length > 0) {
            html += this.renderOrphanedFields(orphanedFields);
        }

        return html;
    }

    /**
     * Get fields that don't belong to any section
     */
    getOrphanedFields() {
        console.log('Getting orphaned fields...');
        console.log('Hierarchy structure:', this.hierarchy);
        console.log('User values structure:', this.userValues);
        console.log('Management data:', this.managementData);

        // First check if there are root-level fields in the hierarchy
        if (this.hierarchy && this.hierarchy.fields && this.hierarchy.fields.length > 0) {
            console.log('Found root-level fields in hierarchy:', this.hierarchy.fields);
            return this.hierarchy.fields;
        }

        // Check if there are root-level fields in userValues
        if (this.userValues && this.userValues.fields && this.userValues.fields.length > 0) {
            console.log('Found root-level fields in userValues:', this.userValues.fields);
            return this.userValues.fields;
        }

        // Use management data to find orphaned fields
        if (this.managementData && this.managementData.fields) {
            const orphanedFields = this.managementData.fields.filter(field => !field.section_id);
            console.log('Found orphaned fields from management data:', orphanedFields);
            return orphanedFields;
        }

        // Fallback: check for fields not in any section
        if (!this.hierarchy || !this.hierarchy.sections) {
            console.log('No hierarchy or sections found');
            return [];
        }

        // Get all field IDs that are in sections
        const sectionFieldIds = new Set();
        this.hierarchy.sections.forEach(section => {
            if (section.fields) {
                section.fields.forEach(field => sectionFieldIds.add(field.id));
            }
            if (section.subsections) {
                section.subsections.forEach(subsection => {
                    if (subsection.fields) {
                        subsection.fields.forEach(field => sectionFieldIds.add(field.id));
                    }
                });
            }
        });

        console.log('Fields in sections:', Array.from(sectionFieldIds));

        // Get all fields from userValues that are not in sections
        if (!this.userValues || !this.userValues.sections) {
            console.log('No userValues or sections found');
            return [];
        }

        const orphanedFields = [];
        this.userValues.sections.forEach(section => {
            if (section.fields) {
                section.fields.forEach(field => {
                    if (!sectionFieldIds.has(field.id)) {
                        orphanedFields.push(field);
                    }
                });
            }
        });

        console.log('Found orphaned fields:', orphanedFields);
        return orphanedFields;
    }

    /**
     * Load orphaned fields from management API
     */
    async loadOrphanedFieldsFromAPI() {
        try {
            console.log('Loading orphaned fields from management API...');
            const response = await window.apiClient.request('/settings/custom-fields/?entity_type=user');
            console.log('Management API response:', response);

            if (response.fields) {
                const orphanedFields = response.fields.filter(field => !field.section_id);
                console.log('Orphaned fields from management API:', orphanedFields);

                if (orphanedFields.length > 0) {
                    // Re-render with orphaned fields
                    this.render();
                }
            }
        } catch (error) {
            console.error('Failed to load orphaned fields from API:', error);
        }
    }

    /**
     * Render orphaned fields (fields without sections)
     */
    renderOrphanedFields(fields) {
        if (fields.length === 0) return '';

        return `
            <div class="bg-white shadow rounded-lg mb-6">
                <div class="px-4 py-5 sm:p-6">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-medium text-gray-900 flex items-center">
                            <i class="fas fa-info-circle mr-2 text-blue-500"></i>
                            General Information
                        </h3>
                    </div>
                    <p class="mt-1 text-sm text-gray-600">General information fields that are not organized into specific sections</p>
                    
                    <div class="mt-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${fields.map(field => this.renderField(field)).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render a single section
     */
    renderSection(section) {
        const subsections = section.subsections || [];
        const directFields = section.fields || [];
        const sectionId = `section-${section.id}`;
        const isExpanded = !section.is_collapsed_by_default;

        return `
            <div class="bg-white shadow rounded-lg mb-6">
                <div class="px-4 py-5 sm:p-6">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-medium text-gray-900 flex items-center">
                            ${section.icon ? `<i class="${section.icon} mr-2"></i>` : ''}
                            ${section.section_name || section.section_label || 'Untitled Section'}
                        </h3>
                        ${section.is_collapsible !== false ? `
                            <button onclick="customFieldsComponent.toggleSection('${sectionId}')" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-chevron-down transition-transform duration-200" id="chevron-${sectionId}"></i>
                            </button>
                        ` : ''}
                    </div>
                    ${section.section_description ? `<p class="mt-1 text-sm text-gray-600">${section.section_description}</p>` : ''}
                    
                    <div id="${sectionId}" class="mt-6" style="display: ${isExpanded ? 'block' : 'none'};">
                        ${subsections.map(subsection => this.renderSubsection(subsection)).join('')}
                        ${directFields.map(field => this.renderField(field)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render a subsection
     */
    renderSubsection(subsection) {
        const fields = subsection.fields || [];

        return `
            <div class="mb-6 p-4 border border-gray-200 rounded-lg bg-white">
                <h4 class="text-md font-medium text-gray-800 flex items-center mb-4 border-b border-gray-100 pb-2">
                    ${subsection.icon ? `<i class="${subsection.icon} mr-2"></i>` : ''}
                    ${subsection.section_name || subsection.subsection_label || 'Untitled Subsection'}
                </h4>
                ${subsection.section_description || subsection.subsection_description ? `<p class="text-sm text-gray-600 mb-4">${subsection.section_description || subsection.subsection_description}</p>` : ''}
                
                ${subsection.is_repeatable ? this.renderRepeatableGroup(subsection) : this.renderFields(fields)}
            </div>
        `;
    }

    /**
     * Render repeatable group (like DBS checks, addresses)
     */
    renderRepeatableGroup(subsection) {
        const userData = this.getUserDataForSubsection(subsection.id);
        const entries = userData?.entries || [];

        return `
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">${subsection.subsection_label} (${entries.length} entries)</span>
                    <button 
                        onclick="customFieldsComponent.addGroupEntry(${subsection.id})"
                        class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        <i class="fas fa-plus mr-1"></i>
                        Add ${subsection.subsection_label}
                    </button>
                </div>
                
                <div class="space-y-4" id="group-entries-${subsection.id}">
                    ${entries.map((entry, index) => this.renderGroupEntry(subsection, entry, index)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render a single group entry
     */
    renderGroupEntry(subsection, entry, index) {
        const fields = subsection.fields || [];

        return `
            <div class="border border-gray-200 rounded-lg p-4 bg-gray-50" data-entry-id="${entry.entry_id || index}">
                <div class="flex justify-between items-center mb-4">
                    <h5 class="text-sm font-medium text-gray-700">Entry ${index + 1}</h5>
                    <button 
                        onclick="customFieldsComponent.removeGroupEntry(${entry.entry_id || index})"
                        class="text-red-600 hover:text-red-800 text-sm"
                    >
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${fields.map(field => this.renderField(field, entry.entry_id)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render fields (non-repeatable)
     */
    renderFields(fields) {
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${fields.map(field => this.renderField(field)).join('')}
            </div>
        `;
    }

    /**
     * Render a single field
     */
    renderField(field, groupEntryId = null) {
        const value = this.getFieldValue(field.id, groupEntryId);
        const fieldId = groupEntryId ? `${field.id}-${groupEntryId}` : field.id;

        return `
            <div class="space-y-1 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <label for="${fieldId}" class="block text-sm font-medium text-gray-700">
                    ${field.field_label}
                    ${field.is_required ? '<span class="text-red-500">*</span>' : ''}
                </label>
                ${this.renderFieldInput(field, fieldId, value, groupEntryId)}
                ${field.field_description ? `<p class="text-xs text-gray-500 mt-1">${field.field_description}</p>` : ''}
                <div class="mt-2 flex justify-end">
                    <button type="button" 
                            onclick="customFieldsComponent.saveFieldValue(${field.id}, '${groupEntryId || ''}', '${field.field_type}', '${field.field_label.replace(/'/g, "\\'")}')"
                            class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200">
                        <i class="fas fa-save mr-1"></i>
                        Save
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render field input based on field type
     */
    renderFieldInput(field, fieldId, value, groupEntryId = null) {
        const commonAttrs = `id="${fieldId}" name="${field.field_name}" data-field-id="${field.id}" data-group-entry-id="${groupEntryId || ''}"`;
        // Removed automatic onchange handler - using manual save buttons instead

        switch (field.field_type) {
            case 'text':
            case 'email':
            case 'phone':
                return `<input type="${field.field_type}" ${commonAttrs} value="${value || ''}" class="mt-1 block w-full border-2 border-gray-400 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 bg-white" ${field.is_required ? 'required' : ''} ${field.max_length ? `maxlength="${field.max_length}"` : ''}>`;

            case 'number':
                return `<input type="number" ${commonAttrs} value="${value || ''}" class="mt-1 block w-full border-2 border-gray-400 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 bg-white" ${field.is_required ? 'required' : ''} ${field.min_value ? `min="${field.min_value}"` : ''} ${field.max_value ? `max="${field.max_value}"` : ''}>`;

            case 'textarea':
                return `<textarea ${commonAttrs} rows="3" class="mt-1 block w-full border-2 border-gray-400 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 bg-white" ${field.is_required ? 'required' : ''} ${field.max_length ? `maxlength="${field.max_length}"` : ''}>${value || ''}</textarea>`;

            case 'date':
            case 'datetime':
                return `<input type="${field.field_type === 'datetime' ? 'datetime-local' : 'date'}" ${commonAttrs} value="${value || ''}" class="mt-1 block w-full border-2 border-gray-400 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 bg-white" ${field.is_required ? 'required' : ''}>`;

            case 'boolean':
                return `
                    <div class="mt-1">
                        <label class="inline-flex items-center">
                            <input type="checkbox" ${commonAttrs} ${value ? 'checked' : ''} class="rounded border-2 border-gray-400 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
                            <span class="ml-2 text-sm text-gray-700">Yes</span>
                        </label>
                    </div>
                `;

            case 'select':
                const options = field.field_options?.options || [];
                return `
                    <select ${commonAttrs} class="mt-1 block w-full border-2 border-gray-400 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 bg-white" ${field.is_required ? 'required' : ''}>
                        <option value="">Select an option</option>
                        ${options.map(option => `<option value="${option.value}" ${value === option.value ? 'selected' : ''}>${option.label}</option>`).join('')}
                        ${options.length === 0 ? '<option disabled>No options available</option>' : ''}
                    </select>
                `;

            case 'multiselect':
                const multiOptions = field.field_options?.options || [];
                const selectedValues = Array.isArray(value) ? value : [];
                return `
                    <div class="mt-1 space-y-2">
                        ${multiOptions.map(option => `
                            <label class="inline-flex items-center">
                                <input type="checkbox" ${commonAttrs} value="${option.value}" ${selectedValues.includes(option.value) ? 'checked' : ''} class="rounded border-2 border-gray-400 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
                                <span class="ml-2 text-sm text-gray-700">${option.label}</span>
                            </label>
                        `).join('')}
                        ${multiOptions.length === 0 ? '<p class="text-sm text-gray-500 italic">No options available</p>' : ''}
                    </div>
                `;

            case 'file':
                return `
                    <div class="mt-1">
                        <input type="file" ${commonAttrs} onchange="this.dataset.fileChanged = 'true'; this.style.borderColor = '#10b981'; this.style.borderWidth = '2px';" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100">
                        ${value ? `
                            <div class="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                <div class="flex items-center">
                                    <i class="fas fa-file text-green-600 mr-2"></i>
                                    <div class="flex-1">
                                        <p class="text-sm font-medium text-green-800">File uploaded successfully</p>
                                        <p class="text-xs text-green-600">Ready to download</p>
                                    </div>
                                    <button type="button" onclick="customFieldsComponent.downloadFile(${value})" class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                        <i class="fas fa-download mr-1"></i>
                                        Download
                                    </button>
                                </div>
                            </div>
                        ` : `
                            <div class="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                <p class="text-sm text-gray-600">No file uploaded yet</p>
                            </div>
                        `}
                        <p class="mt-1 text-xs text-gray-500">Select a new file to replace the current one</p>
                    </div>
                `;

            default:
                console.warn('Unknown field type:', field.field_type, 'falling back to text input');
                return `<input type="text" ${commonAttrs} value="${value || ''}" class="mt-1 block w-full border-2 border-gray-400 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 bg-white">`;
        }
    }

    /**
     * Get field value from user data
     */
    getFieldValue(fieldId, groupEntryId = null) {
        if (!this.userValues) {
            console.log('No userValues available for field:', fieldId);
            return null;
        }

        console.log('Getting value for field:', fieldId, 'from userValues:', this.userValues);

        // Handle repeatable groups
        if (groupEntryId) {
            const subsectionData = this.userValues.sections
                ?.flatMap(s => s.subsections || [])
                ?.find(s => s.subsection_id === this.getSubsectionIdForField(fieldId));

            const entry = subsectionData?.entries?.find(e => e.entry_id === groupEntryId);
            const field = entry?.fields?.find(f => f.field_id === fieldId);
            // Handle both old format (field.value) and new format (field.value_data.value or field.value_data.file_id)
            return field?.value || field?.value_data?.value || field?.value_data?.file_id || null;
        }

        // Handle direct fields - search through all sections and their fields
        for (const section of this.userValues.sections || []) {
            // Check direct fields in section
            for (const field of section.fields || []) {
                if (field.id === fieldId) {
                    // Handle both old format (field.value) and new format (field.value_data.value or field.value_data.file_id)
                    const value = field.value || field.value_data?.value || field.value_data?.file_id || null;
                    console.log('Found field value:', { fieldId, field, value });
                    return value;
                }
            }

            // Check fields in subsections
            for (const subsection of section.subsections || []) {
                for (const field of subsection.fields || []) {
                    if (field.id === fieldId) {
                        // Handle both old format (field.value) and new format (field.value_data.value or field.value_data.file_id)
                        const value = field.value || field.value_data?.value || field.value_data?.file_id || null;
                        console.log('Found field value in subsection:', { fieldId, field, value });
                        return value;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Get subsection ID for a field (helper method)
     */
    getSubsectionIdForField(fieldId) {
        if (!this.hierarchy) return null;

        for (const section of this.hierarchy.sections) {
            for (const subsection of section.subsections || []) {
                if (subsection.fields?.some(f => f.id === fieldId)) {
                    return subsection.id;
                }
            }
        }
        return null;
    }

    /**
     * Get user data for a subsection
     */
    getUserDataForSubsection(subsectionId) {
        if (!this.userValues) return null;

        return this.userValues.sections
            ?.flatMap(s => s.subsections || [])
            ?.find(s => s.subsection_id === subsectionId);
    }

    /**
     * Save field value (manual save button)
     */
    async saveFieldValue(fieldId, groupEntryId = null, fieldType = null, fieldLabel = null) {
        const fieldElement = document.querySelector(`[data-field-id="${fieldId}"][data-group-entry-id="${groupEntryId || ''}"]`);
        if (!fieldElement) {
            console.error('Field element not found for ID:', fieldId);
            return;
        }

        let value;

        // Handle different field types based on the field type parameter
        if (fieldType === 'multiselect') {
            // Handle multiselect field - collect all checked values
            const allCheckboxes = document.querySelectorAll(`[data-field-id="${fieldId}"][data-group-entry-id="${groupEntryId || ''}"]`);
            value = Array.from(allCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
            console.log('Multiselect field - selected values:', value);
        } else if (fieldType === 'boolean') {
            // Handle boolean field (single checkbox)
            value = fieldElement.checked;
        } else if (fieldType === 'file') {
            if (fieldElement.files.length > 0) {
                // Check if a new file has been selected
                const newFile = fieldElement.files[0];
                const currentValue = this.getFieldValue(fieldId, groupEntryId);

                // If there's already a file and no new file selected, don't re-upload
                if (currentValue && fieldElement.dataset.fileChanged !== 'true') {
                    console.log('No new file selected, skipping upload');
                    this.showSuccessToast('File already saved');
                    return;
                }

                console.log('New file selected, uploading:', newFile.name);
                // Mark that we're processing this file
                fieldElement.dataset.fileChanged = 'false';
                await this.handleFileUpload(fieldId, newFile, groupEntryId);
                return;
            } else {
                // No file selected - check if we should clear the existing file
                const currentValue = this.getFieldValue(fieldId, groupEntryId);
                if (currentValue) {
                    console.log('Clearing existing file');
                    const valueData = { file_id: null };
                    await window.apiClient.setCustomFieldValue('user', this.userId, fieldId, valueData, groupEntryId || null);
                    this.hasChanges = true;
                    this.showSuccessToast('File removed successfully');
                } else {
                    this.showErrorToast('Please select a file to upload');
                }
                return;
            }
        } else if (fieldType === 'number') {
            value = fieldElement.value ? parseFloat(fieldElement.value) : null;
        } else if (fieldType === 'date' || fieldType === 'datetime') {
            value = fieldElement.value;
        } else {
            // Handle text, email, phone, textarea, select fields
            value = fieldElement.value;
        }

        try {
            console.log('Saving field value:', { fieldId, fieldType, value, groupEntryId });
            // The API expects value_data to be a dictionary, so we wrap the value
            const valueData = { value: value };
            await window.apiClient.setCustomFieldValue('user', this.userId, fieldId, valueData, groupEntryId || null);
            this.hasChanges = true;
            this.showSuccessToast(`"${fieldLabel || 'Field'}" saved successfully!`);
        } catch (error) {
            console.error('Failed to save field:', error);
            this.showErrorToast(`Failed to save "${fieldLabel || 'field'}"`);
        }
    }

    /**
     * Handle field value changes (automatic on change)
     */
    async handleFieldChange(fieldId, groupEntryId = null) {
        const fieldElement = document.querySelector(`[data-field-id="${fieldId}"][data-group-entry-id="${groupEntryId || ''}"]`);
        if (!fieldElement) return;

        let value = fieldElement.value;

        // Handle different field types
        if (fieldElement.type === 'checkbox') {
            value = fieldElement.checked;
        } else if (fieldElement.type === 'file') {
            if (fieldElement.files.length > 0) {
                await this.handleFileUpload(fieldId, fieldElement.files[0], groupEntryId);
                return;
            } else {
                return; // No file selected
            }
        }

        try {
            // The API expects value_data to be a dictionary, so we wrap the value
            const valueData = { value: value };
            await window.apiClient.setCustomFieldValue('user', this.userId, fieldId, valueData, groupEntryId || null);
            this.hasChanges = true;
            this.showSuccessToast('Field updated successfully');
        } catch (error) {
            console.error('Failed to update field:', error);
            this.showErrorToast('Failed to update field value');
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showSuccessToast(message);
    }

    /**
     * Show error message
     */
    showError(message) {
        // Create a temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        // Remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    /**
     * Handle file upload
     */
    async handleFileUpload(fieldId, file, groupEntryId = null) {
        try {
            console.log('Uploading file:', file.name, 'for field:', fieldId);
            const fileResponse = await window.apiClient.uploadCustomFieldFile(file);
            console.log('File upload response:', fileResponse);

            // Extract file ID from response - the backend returns an object with 'id' field
            const fileId = fileResponse.id;
            if (!fileId) {
                console.error('No file ID found in upload response:', fileResponse);
                this.showErrorToast('File upload failed - no file ID returned');
                return;
            }

            // For file uploads, we send the file_id in the value_data
            const valueData = { file_id: fileId };
            console.log('Setting custom field value with:', valueData);

            await window.apiClient.setCustomFieldValue('user', this.userId, fieldId, valueData, groupEntryId || null);
            this.hasChanges = true;
            this.showSuccessToast('File uploaded successfully');
        } catch (error) {
            console.error('Failed to upload file:', error);
            this.showErrorToast('Failed to upload file: ' + error.message);
        }
    }

    /**
     * Add new group entry
     */
    async addGroupEntry(subsectionId) {
        try {
            const entryData = {
                subsection_id: subsectionId,
                entity_type: 'user',
                entity_id: this.userId,
                entry_label: `New Entry`
            };

            const response = await window.apiClient.createGroupEntry(this.userId, entryData);
            this.showSuccessToast('Entry added successfully');

            // Reload the data to get the new entry
            await this.init(this.userId);
        } catch (error) {
            console.error('Failed to add group entry:', error);
            this.showErrorToast('Failed to add entry');
        }
    }

    /**
     * Remove group entry
     */
    async removeGroupEntry(entryId) {
        if (!confirm('Are you sure you want to remove this entry?')) return;

        try {
            await window.apiClient.deleteGroupEntry(entryId);
            this.showSuccessToast('Entry removed successfully');

            // Reload the data
            await this.init(this.userId);
        } catch (error) {
            console.error('Failed to remove group entry:', error);
            this.showErrorToast('Failed to remove entry');
        }
    }

    /**
     * Download file
     */
    async downloadFile(fileId) {
        try {
            const response = await window.apiClient.downloadCustomFieldFile(fileId);

            // Handle file download
            const downloadUrl = response.download_url || response.url;
            const filename = response.filename || 'download';

            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            link.target = '_blank'; // Open in new tab as fallback
            link.click();

            this.showSuccessToast('File download started');
        } catch (error) {
            console.error('Failed to download file:', error);
            this.showErrorToast('Failed to download file');
        }
    }

    /**
     * Toggle section visibility
     */
    toggleSection(sectionId) {
        const section = document.getElementById(sectionId);
        const chevron = document.getElementById(`chevron-${sectionId}`);

        if (section && chevron) {
            const isVisible = section.style.display !== 'none';
            section.style.display = isVisible ? 'none' : 'block';
            chevron.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Event listeners are attached via inline handlers for simplicity
        // In a production app, you might want to use event delegation
    }

    /**
     * Show success toast notification
     */
    showSuccessToast(message) {
        this.createToast(message, 'success');
    }

    /**
     * Show error toast notification
     */
    showErrorToast(message) {
        this.createToast(message, 'error');
    }

    /**
     * Create and display toast notification
     */
    createToast(message, type = 'success') {
        // Remove any existing toasts
        const existingToasts = document.querySelectorAll('.custom-toast');
        existingToasts.forEach(toast => toast.remove());

        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'custom-toast fixed top-4 right-4 z-50 max-w-sm w-full bg-white shadow-lg rounded-lg border-l-4 p-4 transform transition-all duration-300 ease-in-out';
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';

        if (type === 'success') {
            toast.classList.add('border-green-500');
            toast.innerHTML = `
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <i class="fas fa-check-circle text-green-500 text-xl"></i>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-gray-900">${message}</p>
                    </div>
                    <div class="ml-auto pl-3">
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        } else {
            toast.classList.add('border-red-500');
            toast.innerHTML = `
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-circle text-red-500 text-xl"></i>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-gray-900">${message}</p>
                    </div>
                    <div class="ml-auto pl-3">
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        // Add to page
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 10);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.transform = 'translateX(100%)';
                toast.style.opacity = '0';
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, 300);
            }
        }, 4000);
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showSuccessToast(message);
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showErrorToast(message);
    }

    /**
     * Render no fields message
     */
    renderNoFields() {
        const container = document.getElementById('custom-fields-container');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-8">
                <div class="text-gray-400 mb-4">
                    <i class="fas fa-clipboard-list text-4xl"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Custom Fields Configured</h3>
                <p class="text-gray-500 mb-4">Your organization hasn't set up any custom fields yet.</p>
                <p class="text-sm text-gray-400">Contact your administrator to configure custom fields for your organization.</p>
                <div class="mt-4">
                    <a href="custom-fields-admin.html" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        <i class="fas fa-cog mr-2"></i>
                        Setup Custom Fields
                    </a>
                </div>
            </div>
        `;
    }
}

// Global instance
window.customFieldsComponent = new CustomFieldsComponent();

// Debug: Check if container exists on page load
document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('custom-fields-container');
    console.log('Custom fields container found:', !!container);
    if (container) {
        console.log('Container element:', container);
    }
});
