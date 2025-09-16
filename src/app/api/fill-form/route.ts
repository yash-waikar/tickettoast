import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";

interface ExtractedField {
  label: string;
  value: string;
  confidence: number;
}

interface FormFillRequest {
  extractedFields: ExtractedField[];
  previewMode?: boolean;
}

// Field mapping for the Laserfiche parking ticket appeal form
const FIELD_MAPPINGS = {
  // Common field mappings based on typical parking citation fields
  'citation_number': ['Citation Number', 'Ticket Number', 'Citation ID', 'citation_number', 'ticket_number'],
  'license_plate': ['License Plate', 'Plate Number', 'Vehicle License', 'license_plate', 'plate'],
  'violation_date': ['Violation Date', 'Date of Violation', 'Issued Date', 'violation_date', 'date'],
  'violation_time': ['Violation Time', 'Time of Violation', 'Issued Time', 'violation_time', 'time'],
  'violation_location': ['Violation Location', 'Location', 'Address', 'violation_location', 'location'],
  'vehicle_make': ['Vehicle Make', 'Make', 'vehicle_make'],
  'vehicle_model': ['Vehicle Model', 'Model', 'vehicle_model'],
  'vehicle_color': ['Vehicle Color', 'Color', 'vehicle_color'],
  'fine_amount': ['Fine Amount', 'Amount', 'Total', 'fine_amount', 'amount'],
  'officer_badge': ['Officer Badge', 'Badge Number', 'officer_badge', 'badge'],
  'violation_code': ['Violation Code', 'Code', 'violation_code']
};

function findFieldValue(extractedFields: ExtractedField[], possibleLabels: string[]): string {
  for (const field of extractedFields) {
    for (const label of possibleLabels) {
      if (field.label.toLowerCase().includes(label.toLowerCase()) || 
          label.toLowerCase().includes(field.label.toLowerCase())) {
        return field.value;
      }
    }
  }
  return '';
}

export async function POST(request: NextRequest) {
  try {
    const { extractedFields, previewMode = true }: FormFillRequest = await request.json();

    if (!extractedFields || extractedFields.length === 0) {
      return NextResponse.json(
        { error: "No extracted fields provided" },
        { status: 400 }
      );
    }

    // Launch browser in preview mode (headful) or headless
    const browser = await chromium.launch({ 
      headless: !previewMode,
      slowMo: previewMode ? 1000 : 0 // Slow down actions in preview mode
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();

    try {
      // Navigate to the form
      await page.goto('https://portal.laserfiche.com/h4073/forms/ParkingTicketAppeal', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for form to load
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Take screenshot for debugging
      const screenshotBefore = await page.screenshot({ fullPage: true });

      // Extract form fields and their selectors
      const formFields = await page.evaluate(() => {
        const fields: Array<{
          selector: string;
          type: string;
          name: string;
          id: string;
          placeholder: string;
          label: string;
        }> = [];

        // Get all input, select, and textarea elements
        const inputs = document.querySelectorAll('input, select, textarea');
        
        inputs.forEach((input, index) => {
          const element = input as HTMLInputElement;
          let label = '';
          
          // Try to find associated label
          if (element.id) {
            const labelElement = document.querySelector(`label[for="${element.id}"]`);
            if (labelElement) {
              label = labelElement.textContent?.trim() || '';
            }
          }
          
          // If no label found, look for nearby text
          if (!label) {
            const parent = element.parentElement;
            if (parent) {
              const labelText = parent.textContent?.trim() || '';
              label = labelText.substring(0, 100); // Limit length
            }
          }

          fields.push({
            selector: `input:nth-of-type(${index + 1})`,
            type: element.type || 'text',
            name: element.name || '',
            id: element.id || '',
            placeholder: element.placeholder || '',
            label: label
          });
        });

        return fields;
      });

      // Map extracted fields to form fields
      const fieldMapping: Record<string, string> = {};
      
      for (const [formFieldKey, possibleLabels] of Object.entries(FIELD_MAPPINGS)) {
        const value = findFieldValue(extractedFields, possibleLabels);
        if (value) {
          fieldMapping[formFieldKey] = value;
        }
      }

      // Fill the form fields
      const filledFields: Array<{
        field: string;
        value: string;
        success: boolean;
        selector?: string;
      }> = [];

      for (const formField of formFields) {
        let bestMatch = '';
        let bestMatchKey = '';
        
        // Try to match form field with our extracted data
        for (const [key, value] of Object.entries(fieldMapping)) {
          if (formField.label.toLowerCase().includes(key.toLowerCase()) ||
              formField.name.toLowerCase().includes(key.toLowerCase()) ||
              formField.placeholder.toLowerCase().includes(key.toLowerCase())) {
            bestMatch = value;
            bestMatchKey = key;
            break;
          }
        }

        if (bestMatch && formField.type !== 'submit' && formField.type !== 'button') {
          try {
            const selector = formField.id ? `#${formField.id}` : 
                           formField.name ? `[name="${formField.name}"]` :
                           formField.selector;

            await page.fill(selector, bestMatch);
            await page.waitForTimeout(500); // Small delay between fields

            filledFields.push({
              field: formField.label || formField.name || formField.id,
              value: bestMatch,
              success: true,
              selector: selector
            });
          } catch (error) {
            filledFields.push({
              field: formField.label || formField.name || formField.id,
              value: bestMatch,
              success: false,
              selector: formField.selector
            });
          }
        }
      }

      // Take screenshot after filling
      const screenshotAfter = await page.screenshot({ fullPage: true });

      // In preview mode, keep the browser open for a while
      if (previewMode) {
        await page.waitForTimeout(10000); // Keep open for 10 seconds
      }

      return NextResponse.json({
        success: true,
        message: "Form filling completed",
        filledFields,
        formFields,
        fieldMapping,
        screenshots: {
          before: screenshotBefore.toString('base64'),
          after: screenshotAfter.toString('base64')
        }
      });

    } finally {
      if (!previewMode) {
        await browser.close();
      } else {
        // In preview mode, close after a delay
        setTimeout(async () => {
          await browser.close();
        }, 15000);
      }
    }

  } catch (error) {
    console.error('Form filling error:', error);
    return NextResponse.json(
      { 
        error: "Failed to fill form", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
