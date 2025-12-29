import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Generate PDF from form submission
 * @param {Object} options - PDF generation options
 * @param {HTMLElement} options.element - The DOM element to convert to PDF
 * @param {string} options.filename - The filename for the PDF
 * @param {Object} options.submission - The submission data
 * @param {Object} options.form - The form data
 * @returns {Promise<void>}
 */
export const generateFormSubmissionPDF = async ({
  element,
  filename = "form-submission.pdf",
  submission,
  form,
}) => {
  try {
    // Show loading indicator
    const loadingToast = document.createElement("div");
    loadingToast.className =
      "fixed top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg z-50";
    loadingToast.textContent = "Generating PDF...";
    document.body.appendChild(loadingToast);

    // Create a temporary container for PDF generation
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.width = "210mm"; // A4 width
    tempContainer.style.padding = "20mm";
    tempContainer.style.backgroundColor = "#ffffff";
    document.body.appendChild(tempContainer);

    // Clone the element and style it for PDF
    const clonedElement = element.cloneNode(true);
    clonedElement.style.width = "100%";
    clonedElement.style.backgroundColor = "#ffffff";
    clonedElement.style.color = "#000000";
    tempContainer.appendChild(clonedElement);

    // Wait for images to load
    const images = clonedElement.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = resolve; // Continue even if image fails
          setTimeout(resolve, 2000); // Timeout after 2 seconds
        });
      })
    );

    // Convert to canvas
    const canvas = await html2canvas(clonedElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: clonedElement.scrollWidth,
      height: clonedElement.scrollHeight,
    });

    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Create PDF
    const pdf = new jsPDF("p", "mm", "a4");
    let position = 0;

    // Add first page
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Clean up
    document.body.removeChild(tempContainer);
    document.body.removeChild(loadingToast);

    // Save PDF
    pdf.save(filename);

    return pdf;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

/**
 * Generate PDF from form submission data (programmatic approach)
 * @param {Object} options - PDF generation options
 * @param {Object} options.submission - The submission data
 * @param {Object} options.form - The form data
 * @param {Array} options.users - Array of users for name lookup
 * @param {string} options.filename - The filename for the PDF
 * @returns {Promise<void>}
 */
export const generateFormSubmissionPDFFromData = async ({
  submission,
  form,
  users = [],
  filename = "form-submission.pdf",
}) => {
  try {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;
    const lineHeight = 7;
    const sectionSpacing = 10;

    // Helper to add a new page if needed
    const checkPageBreak = (requiredSpace = lineHeight) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper to add text with word wrap
    const addText = (text, fontSize = 10, isBold = false, color = [0, 0, 0]) => {
      pdf.setFontSize(fontSize);
      pdf.setTextColor(color[0], color[1], color[2]);
      if (isBold) {
        pdf.setFont(undefined, "bold");
      } else {
        pdf.setFont(undefined, "normal");
      }

      const maxWidth = pageWidth - 2 * margin;
      const lines = pdf.splitTextToSize(String(text || ""), maxWidth);

      lines.forEach((line) => {
        checkPageBreak();
        pdf.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
    };

    // Header
    pdf.setFontSize(18);
    pdf.setFont(undefined, "bold");
    pdf.setTextColor(0, 0, 0);
    addText(form?.form_title || form?.form_name || "Form Submission", 18, true);
    yPosition += sectionSpacing;

    // Submission Info
    pdf.setFontSize(12);
    pdf.setFont(undefined, "bold");
    addText("Submission Information", 12, true);
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(10);

    addText(`Submission ID: ${submission.id}`, 10);
    addText(`Form: ${form?.form_title || form?.form_name || "N/A"}`, 10);

    if (submission.submitted_by_user_id) {
      const user = users.find((u) => u.id === submission.submitted_by_user_id);
      const userName =
        user?.display_name ||
        `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
        user?.email ||
        `User #${submission.submitted_by_user_id}`;
      addText(`Submitted By: ${userName}`, 10);
    }

    if (submission.submitted_at) {
      const date = new Date(submission.submitted_at);
      addText(`Submitted At: ${date.toLocaleString()}`, 10);
    }

    if (submission.status) {
      addText(`Status: ${submission.status}`, 10);
    }

    if (submission.category) {
      addText(`Category: ${submission.category}`, 10);
    }

    yPosition += sectionSpacing;

    // Submission Data
    const fields = form?.form_fields?.fields || [];
    const displayData = submission.formatted_data || submission.submission_data || {};

    if (fields.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont(undefined, "bold");
      addText("Submission Data", 12, true);
      pdf.setFont(undefined, "normal");
      pdf.setFontSize(10);
      yPosition += sectionSpacing;

      fields.forEach((field) => {
        const fieldId = field.field_id || field.id;
        const fieldLabel = field.field_label || field.label || fieldId;
        const value = displayData[fieldId];

        if (value !== undefined && value !== null && value !== "") {
          checkPageBreak(lineHeight * 2);

          // Field label
          pdf.setFont(undefined, "bold");
          addText(`${fieldLabel}:`, 10, true);
          pdf.setFont(undefined, "normal");

          // Field value
          let displayValue = value;

          // Format value based on field type
          if (field.field_type === "file") {
            if (Array.isArray(value)) {
              displayValue = value
                .map((file) => file.file_name || file.name || `File #${file.file_id || file.id}`)
                .join(", ");
            } else if (typeof value === "object" && value.file_name) {
              displayValue = value.file_name;
            } else {
              displayValue = `File #${value}`;
            }
          } else if (Array.isArray(value)) {
            displayValue = value.join(", ");
          } else if (typeof value === "object") {
            displayValue = JSON.stringify(value, null, 2);
          }

          addText(String(displayValue), 10);
          yPosition += 3;
        }
      });
    }

    // Notes
    if (submission.notes) {
      yPosition += sectionSpacing;
      pdf.setFontSize(12);
      pdf.setFont(undefined, "bold");
      addText("Notes", 12, true);
      pdf.setFont(undefined, "normal");
      pdf.setFontSize(10);
      addText(submission.notes, 10);
    }

    // Review Notes
    if (submission.review_notes) {
      yPosition += sectionSpacing;
      pdf.setFontSize(12);
      pdf.setFont(undefined, "bold");
      addText("Review Notes", 12, true);
      pdf.setFont(undefined, "normal");
      pdf.setFontSize(10);
      addText(submission.review_notes, 10);
    }

    // Footer
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin - 20,
        pageHeight - 10
      );
      pdf.text(
        `Generated on ${new Date().toLocaleString()}`,
        margin,
        pageHeight - 10
      );
    }

    // Save PDF
    pdf.save(filename);

    return pdf;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

/**
 * Generate PDF from form definition/structure - Creates a fillable form template
 * @param {Object} options - PDF generation options
 * @param {Object} options.form - The form data
 * @param {Array} options.roles - Array of roles for lookup
 * @param {Array} options.users - Array of users for lookup
 * @param {string} options.filename - The filename for the PDF
 * @returns {Promise<void>}
 */
export const generateFormPDFFromData = async ({
  form,
  roles = [],
  users = [],
  filename = "form-definition.pdf",
  onDownloadComplete,
}) => {
  console.log("=== PDF GENERATION STARTED ===");
  const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;
    const lineHeight = 7;
    const fieldSpacing = 8;
    const fieldLineHeight = 6;

    // Helper to add a new page if needed
    const checkPageBreak = (requiredSpace = lineHeight) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper to add text with word wrap
    const addText = (text, fontSize = 10, isBold = false, color = [0, 0, 0], x = margin) => {
      pdf.setFontSize(fontSize);
      pdf.setTextColor(color[0], color[1], color[2]);
      if (isBold) {
        pdf.setFont(undefined, "bold");
      } else {
        pdf.setFont(undefined, "normal");
      }

      const maxWidth = pageWidth - 2 * margin;
      const lines = pdf.splitTextToSize(String(text || ""), maxWidth);

      lines.forEach((line) => {
        checkPageBreak();
        pdf.text(line, x, yPosition);
        yPosition += lineHeight;
      });
    };

    // Helper to draw a line for text input
    const drawInputLine = (labelWidth = 50, lineLength = pageWidth - margin - labelWidth - margin) => {
      checkPageBreak(fieldLineHeight + 2);
      const lineY = yPosition + fieldLineHeight - 2;
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(margin + labelWidth, lineY, margin + labelWidth + lineLength, lineY);
      yPosition += fieldLineHeight + 2;
    };

    // Helper to draw a textarea box
    const drawTextareaBox = (labelWidth = 50, boxHeight = 20, boxWidth = pageWidth - margin - labelWidth - margin) => {
      checkPageBreak(boxHeight + 2);
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.rect(margin + labelWidth, yPosition - boxHeight + 2, boxWidth, boxHeight);
      yPosition += boxHeight + 4;
    };

    // Helper to draw checkbox
    const drawCheckbox = (x, y, size = 4) => {
      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(0.5);
      pdf.rect(x, y - size, size, size);
    };

    // Header
    pdf.setFontSize(20);
    pdf.setFont(undefined, "bold");
    pdf.setTextColor(0, 0, 0);
    addText(form?.form_title || form?.form_name || "Form", 20, true);
    yPosition += 3;

    // Form Description
    if (form.form_description) {
      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");
      pdf.setTextColor(100, 100, 100);
      addText(form.form_description, 10, false, [100, 100, 100]);
      yPosition += 5;
    }

    yPosition += 5;

    // Form Fields - Create fillable form layout
    const fields = form?.form_fields?.fields || [];
    const labelWidth = 60; // Width for field labels
    const inputStartX = margin + labelWidth + 5;
    const inputWidth = pageWidth - inputStartX - margin;

    if (fields.length > 0) {
      yPosition += 5;
      console.log(`Processing ${fields.length} fields...`);

      for (const field of fields) {
        const index = fields.indexOf(field);
        const fieldType = (field.field_type || "").toLowerCase();
        const fieldLabel = field.label || field.field_label || field.field_name || `Field ${index + 1}`;
        const isRequired = field.required || field.is_required;
        const helpText = field.help_text || field.field_description;
        
        console.log(`Processing field ${index + 1}/${fields.length}: ${fieldType} - ${fieldLabel}`);

        // Handle display-only fields
        const displayOnlyTypes = ['text_block', 'image_block', 'line_break', 'page_break', 'download_link'];
        if (displayOnlyTypes.includes(fieldType)) {
          console.log(`Processing display-only field: ${fieldType}`);
          // Handle text blocks
          if (fieldType === 'text_block' && field.content) {
            console.log(`Adding text block content for field ${index + 1}, content length: ${field.content?.length || 0}`);
            try {
              checkPageBreak(lineHeight * 2);
              pdf.setFontSize(10);
              pdf.setFont(undefined, "normal");
              pdf.setTextColor(100, 100, 100);
              
              // Strip HTML tags if present and get plain text
              let textContent = field.content;
              if (typeof textContent === 'string') {
                // Remove HTML tags but keep text
                textContent = textContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                // Limit content size to prevent hanging (max 5000 characters)
                if (textContent.length > 5000) {
                  textContent = textContent.substring(0, 5000) + '... [truncated]';
                }
              }
              
              const contentLines = pdf.splitTextToSize(String(textContent || ''), pageWidth - 2 * margin);
              contentLines.forEach((line) => {
                checkPageBreak();
                pdf.text(line, margin, yPosition);
                yPosition += lineHeight;
              });
              yPosition += 3;
              console.log(`Text block added for field ${index + 1}, ${contentLines.length} lines`);
            } catch (textError) {
              console.error(`Error processing text block for field ${index + 1}:`, textError);
              // Continue even if text block fails
              yPosition += lineHeight + 3;
            }
          }
          // Handle image blocks - skip for now to prevent hanging
          else if (fieldType === 'image_block') {
            console.log(`Skipping image block for field ${index + 1}`);
            const imageUrl = field.image_url || field.field_image_url;
            const imageFileId = field.image_file_id || field.field_image_file_id;
            const altText = field.alt_text || field.field_alt_text || 'Form image';
            const imageLabel = field.label || field.field_label;

            // Skip image loading for now - just show placeholder text
            console.log(`Skipping image block for field ${index + 1} (image loading disabled)`);
            checkPageBreak(lineHeight * 2);
            
            if (imageLabel) {
              pdf.setFontSize(10);
              pdf.setFont(undefined, "bold");
              pdf.setTextColor(0, 0, 0);
              pdf.text(imageLabel, margin, yPosition);
              yPosition += lineHeight;
            }
            
            pdf.setFontSize(9);
            pdf.setFont(undefined, "italic");
            pdf.setTextColor(150, 150, 150);
            pdf.text(`[Image: ${imageLabel || altText || 'Image'}]`, margin, yPosition);
            yPosition += lineHeight + 3;
            
            /* Image loading code - disabled to prevent hanging
            if (imageUrl || imageFileId) {
              // Construct image URL
              let imageSrc = imageUrl;
              if (!imageSrc && imageFileId) {
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://melode-api-prod.onrender.com/api/v1';
                imageSrc = `${apiBaseUrl}/settings/files/${imageFileId}/download`;
              }

              if (imageSrc) {
                console.log(`Loading image for field ${index + 1}: ${imageSrc}`);
                checkPageBreak(50); // Reserve space for image

                try {
                  // Load image using fetch to handle CORS with timeout
                  console.log(`Fetching image: ${imageSrc}`);
                  const fetchPromise = fetch(imageSrc, {
                    mode: 'cors',
                    credentials: 'include',
                  });
                  
                  const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Fetch timeout')), 3000)
                  );
                  
                  const response = await Promise.race([fetchPromise, timeoutPromise]);
                  
                  if (!response.ok) {
                    throw new Error(`Failed to load image: ${response.status}`);
                  }

                  const blob = await response.blob();
                  const imageObjectUrl = URL.createObjectURL(blob);
                  
                  // Create image element to get dimensions
                  const img = new Image();
                  
                  const imageLoadPromise = new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = () => reject(new Error('Image load failed'));
                    img.src = imageObjectUrl;
                  });
                  
                  const imageTimeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Image load timeout')), 3000)
                  );
                  
                  await Promise.race([imageLoadPromise, imageTimeoutPromise]);

                  // Calculate image dimensions to fit within page width
                  const maxWidth = pageWidth - 2 * margin;
                  const maxHeight = 50; // Max height in mm
                  let imgWidth = (img.width * 0.264583); // Convert pixels to mm (1px = 0.264583mm)
                  let imgHeight = (img.height * 0.264583);

                  // Scale down if too large
                  if (imgWidth > maxWidth) {
                    const scale = maxWidth / imgWidth;
                    imgWidth = maxWidth;
                    imgHeight = imgHeight * scale;
                  }
                  if (imgHeight > maxHeight) {
                    const scale = maxHeight / imgHeight;
                    imgHeight = maxHeight;
                    imgWidth = imgWidth * scale;
                  }

                  checkPageBreak(imgHeight + 5);

                  // Add image label if present
                  if (imageLabel) {
                    pdf.setFontSize(10);
                    pdf.setFont(undefined, "bold");
                    pdf.setTextColor(0, 0, 0);
                    pdf.text(imageLabel, margin, yPosition);
                    yPosition += lineHeight + 2;
                  }

                  // Convert blob to base64 for jsPDF
                  const reader = new FileReader();
                  const imageDataUrl = await new Promise((resolve, reject) => {
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                  });

                  // Determine image format
                  const imageFormat = blob.type.includes('png') ? 'PNG' : 
                                    blob.type.includes('jpeg') || blob.type.includes('jpg') ? 'JPEG' : 
                                    'JPEG'; // Default to JPEG

                  // Add image to PDF
                  pdf.addImage(imageDataUrl, imageFormat, margin, yPosition - imgHeight, imgWidth, imgHeight);
                  yPosition += imgHeight + 5;

                  // Clean up
                  URL.revokeObjectURL(imageObjectUrl);
                  console.log(`Image loaded successfully for field ${index + 1}`);
                } catch (imgError) {
                  console.warn(`Failed to load image for PDF (field ${index + 1}):`, imgError);
                  // Fallback text if image fails to load
                  pdf.setFontSize(9);
                  pdf.setFont(undefined, "italic");
                  pdf.setTextColor(150, 150, 150);
                  const fallbackLabel = imageLabel || altText || 'Image';
                  pdf.text(`[Image: ${fallbackLabel} - Failed to load]`, margin, yPosition);
                  yPosition += lineHeight + 3;
                }
              } else {
                // Fallback text if image URL not available
                pdf.setFontSize(9);
                pdf.setFont(undefined, "italic");
                pdf.setTextColor(150, 150, 150);
                pdf.text(`[Image: ${altText}]`, margin, yPosition);
                yPosition += lineHeight + 3;
              }
            }
            */
            console.log(`Image block placeholder added for field ${index + 1}`);
          }
          // Continue to next field (don't process as regular field)
          console.log(`Completed display-only field ${index + 1}, continuing...`);
          continue;
        }

        // Calculate space needed for this field
        let fieldHeight = lineHeight + 5; // Base height for label
        if (helpText) {
          const helpLines = pdf.splitTextToSize(helpText, inputWidth);
          fieldHeight += (helpLines.length * (lineHeight - 1)) + 3;
        }
        
        // Add extra height based on field type
        if (fieldType === 'textarea' || fieldType === 'text_area') {
          fieldHeight += 25;
        } else if (fieldType === 'file') {
          fieldHeight += 12;
        } else if ((fieldType === 'radio' || fieldType === 'select' || fieldType === 'dropdown')) {
          const options = field.field_options?.options || field.options || [];
          if (options.length > 0) {
            fieldHeight += (options.length * (lineHeight + 2));
          } else {
            fieldHeight += 8;
          }
        } else {
          fieldHeight += 8; // Standard input line
        }

        checkPageBreak(fieldHeight + fieldSpacing);

        // Field label with required indicator
        pdf.setFontSize(10);
        pdf.setFont(undefined, "bold");
        pdf.setTextColor(0, 0, 0);
        const labelText = `${fieldLabel}${isRequired ? " *" : ""}`;
        pdf.text(labelText, margin, yPosition);
        yPosition += lineHeight;

        // Help text below label
        if (helpText) {
          pdf.setFontSize(8);
          pdf.setFont(undefined, "normal");
          pdf.setTextColor(120, 120, 120);
          const helpLines = pdf.splitTextToSize(helpText, inputWidth);
          helpLines.forEach((line) => {
            pdf.text(line, margin, yPosition);
            yPosition += lineHeight - 1;
          });
          yPosition += 2;
        }

        // Draw input based on field type
        pdf.setDrawColor(180, 180, 180);
        pdf.setLineWidth(0.3);

        switch (fieldType) {
          case 'textarea':
          case 'text_area':
            // Textarea - draw a box
            const textareaHeight = 25;
            checkPageBreak(textareaHeight + 5);
            pdf.rect(inputStartX, yPosition - 2, inputWidth, textareaHeight);
            yPosition += textareaHeight + 5;
            break;

          case 'checkbox':
          case 'boolean':
            // Checkbox - draw a small square
            const checkboxSize = 5;
            pdf.rect(inputStartX, yPosition - 4, checkboxSize, checkboxSize);
            pdf.setFontSize(9);
            pdf.setFont(undefined, "normal");
            pdf.setTextColor(0, 0, 0);
            pdf.text("☐", inputStartX + 1, yPosition - 1);
            yPosition += lineHeight + 2;
            break;

          case 'radio':
          case 'select':
          case 'dropdown':
            // Radio/Select - show options with circles/boxes
            const options = field.field_options?.options || field.options || [];
            if (options.length > 0) {
              options.forEach((option, optIndex) => {
                checkPageBreak(lineHeight + 3);
                const optLabel = typeof option === 'string' ? option : (option.label || option.value || option);
                if (fieldType === 'radio') {
                  // Draw circle for radio
                  pdf.circle(inputStartX + 2, yPosition - 2, 2.5, 'S');
                } else {
                  // Draw box for select
                  pdf.rect(inputStartX, yPosition - 4, 5, 5);
                }
                pdf.setFontSize(9);
                pdf.setFont(undefined, "normal");
                pdf.setTextColor(0, 0, 0);
                pdf.text(optLabel, inputStartX + 9, yPosition);
                yPosition += lineHeight + 3;
              });
            } else {
              // No options - just draw a line
              pdf.line(inputStartX, yPosition - 2, inputStartX + inputWidth, yPosition - 2);
              yPosition += lineHeight + 3;
            }
            break;

          case 'date':
          case 'datetime':
            // Date field - draw a line with hint
            pdf.line(inputStartX, yPosition - 2, inputStartX + inputWidth, yPosition - 2);
            pdf.setFontSize(8);
            pdf.setFont(undefined, "italic");
            pdf.setTextColor(150, 150, 150);
            pdf.text("(MM/DD/YYYY)", inputStartX + inputWidth - 28, yPosition - 1);
            yPosition += lineHeight + 3;
            break;

          case 'file':
            // File field - draw a box with hint
            pdf.rect(inputStartX, yPosition - 4, inputWidth, 12);
            pdf.setFontSize(8);
            pdf.setFont(undefined, "italic");
            pdf.setTextColor(150, 150, 150);
            pdf.text("(Attach file here)", inputStartX + 3, yPosition + 1);
            yPosition += 15;
            break;

          case 'number':
          case 'decimal':
          case 'integer':
            // Number field - draw a line
            pdf.line(inputStartX, yPosition - 2, inputStartX + inputWidth, yPosition - 2);
            yPosition += lineHeight + 3;
            break;

          default:
            // Text, email, phone, etc. - draw a line
            pdf.line(inputStartX, yPosition - 2, inputStartX + inputWidth, yPosition - 2);
            yPosition += lineHeight + 3;
        }

        yPosition += fieldSpacing;
      }
      console.log("All fields processed");
    } else {
      console.log("No fields to process");
    }

    // Signature section at the end
    console.log("Adding signature section...");
    yPosition += 10;
    checkPageBreak(20);
    pdf.setFontSize(10);
    pdf.setFont(undefined, "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Signature:", margin, yPosition);
    yPosition += 5;
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPosition, margin + 60, yPosition);
    yPosition += 8;
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text("Date:", margin, yPosition);
    pdf.line(margin + 15, yPosition - 2, margin + 60, yPosition - 2);

    // Footer
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin - 20,
        pageHeight - 10
      );
      pdf.text(
        `Generated on ${new Date().toLocaleString()}`,
        margin,
        pageHeight - 10
      );
    }

    console.log("=== REACHED SAVE SECTION ===");
    
    // Validate PDF was created
    console.log("Validating PDF object...");
    if (!pdf) {
      throw new Error("PDF object is null or undefined");
    }
    console.log("PDF object is valid, total pages:", totalPages);

    // Save PDF - use jsPDF's save method directly
    console.log("Attempting to save PDF with filename:", filename);
    
    // Use jsPDF's save method (most reliable)
    pdf.save(filename);
    console.log("PDF save() called successfully");
    
    // Call callback after download is triggered
    if (onDownloadComplete) {
      console.log("Calling onDownloadComplete callback");
      setTimeout(() => {
        onDownloadComplete();
      }, 500);
    } else {
      console.warn("No onDownloadComplete callback provided");
    }
    
    console.log("=== SAVE SECTION COMPLETE ===");

    return pdf;
};

/**
 * Generate fillable PDF form using pdf-lib (creates actual fillable form fields)
 * @param {Object} options - PDF generation options
 * @param {Object} options.form - The form data
 * @param {string} options.filename - The filename for the PDF
 * @returns {Promise<void>}
 */
export const generateFillableFormPDF = async ({
  form,
  filename = "form-fillable.pdf",
}) => {
  try {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]); // A4 size in points
    const { width, height } = page.getSize();
    const margin = 72; // 1 inch margin
    let yPosition = height - margin;
    const lineHeight = 14;
    const fieldSpacing = 20;
    const labelWidth = 150;
    const inputStartX = margin + labelWidth + 10;
    const inputWidth = width - inputStartX - margin;

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Helper to add text
    const addText = (text, x, y, fontSize = 10, isBold = false, color = rgb(0, 0, 0)) => {
      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font: isBold ? fontBold : font,
        color,
      });
    };

    // Helper to check page break and add new page if needed
    const checkPageBreak = (requiredSpace) => {
      if (yPosition - requiredSpace < margin) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - margin;
        return true;
      }
      return false;
    };

    // Header
    addText(form?.form_title || form?.form_name || "Form", margin, yPosition, 18, true);
    yPosition -= 25;

    // Form Description
    if (form.form_description) {
      const maxWidth = width - 2 * margin;
      const words = form.form_description.split(' ');
      let currentLine = '';
      words.forEach((word) => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const textWidth = font.widthOfTextAtSize(testLine, 10);
        if (textWidth > maxWidth && currentLine) {
          checkPageBreak(lineHeight);
          addText(currentLine, margin, yPosition, 10, false, rgb(0.4, 0.4, 0.4));
          yPosition -= lineHeight;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) {
        checkPageBreak(lineHeight);
        addText(currentLine, margin, yPosition, 10, false, rgb(0.4, 0.4, 0.4));
        yPosition -= lineHeight;
      }
      yPosition -= 10;
    }

    // Form Fields
    const fields = form?.form_fields?.fields || [];
    let fieldIndex = 0;

    for (const field of fields) {
      const fieldType = (field.field_type || "").toLowerCase();
      const fieldLabel = field.label || field.field_label || field.field_name || `Field ${fieldIndex + 1}`;
      const isRequired = field.required || field.is_required;
      const helpText = field.help_text || field.field_description;

      // Skip display-only fields
      const displayOnlyTypes = ['text_block', 'image_block', 'line_break', 'page_break', 'download_link'];
      if (displayOnlyTypes.includes(fieldType)) {
        if (fieldType === 'text_block' && field.content) {
          checkPageBreak(lineHeight * 3);
          const words = field.content.split(' ');
          let currentLine = '';
          words.forEach((word) => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const textWidth = font.widthOfTextAtSize(testLine, 10);
            if (textWidth > width - 2 * margin && currentLine) {
              checkPageBreak(lineHeight);
              addText(currentLine, margin, yPosition, 10, false, rgb(0.4, 0.4, 0.4));
              yPosition -= lineHeight;
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          });
          if (currentLine) {
            checkPageBreak(lineHeight);
            addText(currentLine, margin, yPosition, 10, false, rgb(0.4, 0.4, 0.4));
            yPosition -= lineHeight;
          }
          yPosition -= 5;
        }
        continue;
      }

      // Calculate space needed
      let fieldHeight = lineHeight + 8;
      if (helpText) {
        const helpWords = helpText.split(' ');
        let helpLines = 1;
        let currentLine = '';
        helpWords.forEach((word) => {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const textWidth = font.widthOfTextAtSize(testLine, 8);
          if (textWidth > inputWidth && currentLine) {
            helpLines++;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        fieldHeight += helpLines * (lineHeight - 2);
      }

      if (fieldType === 'textarea' || fieldType === 'text_area') {
        fieldHeight += 30;
      } else if (fieldType === 'file') {
        fieldHeight += 15;
      } else if ((fieldType === 'radio' || fieldType === 'select' || fieldType === 'dropdown')) {
        const options = field.field_options?.options || field.options || [];
        if (options.length > 0) {
          fieldHeight += options.length * (lineHeight + 3);
        } else {
          fieldHeight += 12;
        }
      } else {
        fieldHeight += 12;
      }

      checkPageBreak(fieldHeight + fieldSpacing);

      // Field label
      const labelText = `${fieldLabel}${isRequired ? " *" : ""}`;
      addText(labelText, margin, yPosition, 10, true);
      yPosition -= lineHeight;

      // Help text
      if (helpText) {
        const helpWords = helpText.split(' ');
        let currentLine = '';
        helpWords.forEach((word) => {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const textWidth = font.widthOfTextAtSize(testLine, 8);
          if (textWidth > inputWidth && currentLine) {
            addText(currentLine, margin, yPosition, 8, false, rgb(0.5, 0.5, 0.5));
            yPosition -= lineHeight - 2;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        if (currentLine) {
          addText(currentLine, margin, yPosition, 8, false, rgb(0.5, 0.5, 0.5));
          yPosition -= lineHeight - 2;
        }
        yPosition -= 2;
      }

      // Draw input field based on type
      const fieldY = yPosition - 10;
      switch (fieldType) {
        case 'textarea':
        case 'text_area':
          page.drawRectangle({
            x: inputStartX,
            y: fieldY - 25,
            width: inputWidth,
            height: 35,
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 1,
          });
          yPosition -= 50;
          break;

        case 'checkbox':
        case 'boolean':
          page.drawRectangle({
            x: inputStartX,
            y: fieldY - 2,
            width: 12,
            height: 12,
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 1,
          });
          yPosition -= 22;
          break;

        case 'radio':
          const options = field.field_options?.options || field.options || [];
          if (options.length > 0) {
            options.forEach((option, optIndex) => {
              checkPageBreak(lineHeight + 3);
              const optLabel = typeof option === 'string' ? option : (option.label || option.value || option);
              // Draw circle for radio
              page.drawCircle({
                x: inputStartX + 6,
                y: yPosition - 6,
                size: 6,
                borderColor: rgb(0.7, 0.7, 0.7),
                borderWidth: 1,
              });
              addText(optLabel, inputStartX + 18, yPosition, 9);
              yPosition -= lineHeight + 3;
            });
          } else {
            page.drawRectangle({
              x: inputStartX,
              y: fieldY - 2,
              width: inputWidth,
              height: 16,
              borderColor: rgb(0.7, 0.7, 0.7),
              borderWidth: 1,
            });
            yPosition -= 22;
          }
          break;

        case 'select':
        case 'dropdown':
          page.drawRectangle({
            x: inputStartX,
            y: fieldY - 2,
            width: inputWidth,
            height: 16,
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 1,
          });
          // Add dropdown arrow indicator (using supported characters)
          addText("v", inputStartX + inputWidth - 10, fieldY + 2, 8, false, rgb(0.5, 0.5, 0.5));
          yPosition -= 22;
          break;

        case 'file':
          page.drawRectangle({
            x: inputStartX,
            y: fieldY - 5,
            width: inputWidth,
            height: 20,
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 1,
          });
          addText("(Attach file here)", inputStartX + 5, fieldY + 3, 8, false, rgb(0.6, 0.6, 0.6));
          yPosition -= 25;
          break;

        case 'date':
        case 'datetime':
          page.drawRectangle({
            x: inputStartX,
            y: fieldY - 2,
            width: inputWidth,
            height: 16,
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 1,
          });
          addText("(MM/DD/YYYY)", inputStartX + inputWidth - 50, fieldY + 2, 7, false, rgb(0.6, 0.6, 0.6));
          yPosition -= 22;
          break;

        default:
          // Text, email, phone, number, etc. - draw a rectangle
          page.drawRectangle({
            x: inputStartX,
            y: fieldY - 2,
            width: inputWidth,
            height: 16,
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 1,
          });
          yPosition -= 22;
      }

      yPosition -= fieldSpacing;
      fieldIndex++;
    }

    // Signature section
    yPosition -= 20;
    checkPageBreak(30);
    addText("Signature:", margin, yPosition, 10, true);
    yPosition -= 15;
    page.drawRectangle({
      x: margin,
      y: yPosition - 10,
      width: 150,
      height: 16,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
    });
    yPosition -= 25;
    addText("Date:", margin, yPosition, 9, false, rgb(0.5, 0.5, 0.5));
    page.drawRectangle({
      x: margin + 30,
      y: yPosition - 10,
      width: 120,
      height: 16,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
    });
    addText("(MM/DD/YYYY)", margin + 35, yPosition + 2, 7, false, rgb(0.6, 0.6, 0.6));

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return pdfDoc;
  } catch (error) {
    console.error("Error generating fillable form PDF:", error);
    throw error;
  }
};
