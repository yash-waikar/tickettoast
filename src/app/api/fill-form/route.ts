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
  formUrl?: string;
}

const FIELD_MAPPINGS = {
  citation_number: [
    "Citation Number",
    "Ticket Number",
    "Citation ID",
    "citation_number",
    "ticket_number",
  ],
  license_plate: [
    "License Plate",
    "Plate Number",
    "Vehicle License",
    "license_plate",
    "plate",
  ],
  violation_date: [
    "Violation Date",
    "Date of Violation",
    "Issued Date",
    "violation_date",
    "date",
  ],
  violation_time: [
    "Violation Time",
    "Time of Violation",
    "Issued Time",
    "violation_time",
    "time",
  ],
  violation_location: [
    "Violation Location",
    "Location",
    "Address",
    "violation_location",
    "location",
  ],
  vehicle_make: ["Vehicle Make", "Make", "vehicle_make"],
  vehicle_model: ["Vehicle Model", "Model", "vehicle_model"],
  vehicle_color: ["Vehicle Color", "Color", "vehicle_color"],
  fine_amount: ["Fine Amount", "Amount", "Total", "fine_amount", "amount"],
  officer_badge: ["Officer Badge", "Badge Number", "officer_badge", "badge"],
  violation_code: ["Violation Code", "Code", "violation_code"],
};

function findFieldValue(
  extractedFields: ExtractedField[],
  possibleLabels: string[]
): string {
  for (const field of extractedFields) {
    for (const label of possibleLabels) {
      if (
        field.label.toLowerCase().includes(label.toLowerCase()) ||
        label.toLowerCase().includes(field.label.toLowerCase())
      ) {
        return field.value;
      }
    }
  }
  return "";
}

export async function POST(request: NextRequest) {
  try {
    const {
      extractedFields,
      previewMode = true,
      formUrl,
    }: FormFillRequest = await request.json();

    if (!extractedFields || extractedFields.length === 0) {
      return NextResponse.json(
        { error: "No extracted fields provided" },
        { status: 400 }
      );
    }

    const targetFormUrl =
      formUrl ||
      "https://portal.laserfiche.com/h4073/forms/ParkingTicketAppeal";

    try {
      new URL(targetFormUrl);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid form URL provided" },
        { status: 400 }
      );
    }

    let browser;
    try {
      browser = await chromium.launch({
        headless: !previewMode,
        slowMo: previewMode ? 1000 : 0,
      });
    } catch (error: unknown) {
      console.error("Failed to launch browser:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("Executable doesn't exist")) {
        return NextResponse.json(
          {
            error: "Browser setup required",
            details:
              "Playwright browsers need to be installed. Please run: npx playwright install chromium",
            isSetupError: true,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to launch browser",
          details: errorMessage,
        },
        { status: 500 }
      );
    }

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });

    const page = await context.newPage();

    try {
      await page.goto(targetFormUrl, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const screenshotBefore = await page.screenshot({ fullPage: true });

      const formFields = await page.evaluate(() => {
        const fields: Array<{
          selector: string;
          type: string;
          name: string;
          id: string;
          placeholder: string;
          label: string;
        }> = [];

        const inputs = document.querySelectorAll("input, select, textarea");

        inputs.forEach((input, index) => {
          const element = input as HTMLInputElement;
          let label = "";

          if (element.id) {
            const labelElement = document.querySelector(
              `label[for="${element.id}"]`
            );
            if (labelElement) {
              label = labelElement.textContent?.trim() || "";
            }
          }

          if (!label) {
            const parent = element.parentElement;
            if (parent) {
              const labelText = parent.textContent?.trim() || "";
              label = labelText.substring(0, 100); // Limit length
            }
          }

          fields.push({
            selector: `input:nth-of-type(${index + 1})`,
            type: element.type || "text",
            name: element.name || "",
            id: element.id || "",
            placeholder: element.placeholder || "",
            label: label,
          });
        });

        return fields;
      });

      const fieldMapping: Record<string, string> = {};

      for (const [formFieldKey, possibleLabels] of Object.entries(
        FIELD_MAPPINGS
      )) {
        const value = findFieldValue(extractedFields, possibleLabels);
        if (value) {
          fieldMapping[formFieldKey] = value;
        }
      }

      const filledFields: Array<{
        field: string;
        value: string;
        success: boolean;
        selector?: string;
      }> = [];

      for (const formField of formFields) {
        let bestMatch = "";
        let bestMatchKey = "";

        for (const [key, value] of Object.entries(fieldMapping)) {
          if (
            formField.label.toLowerCase().includes(key.toLowerCase()) ||
            formField.name.toLowerCase().includes(key.toLowerCase()) ||
            formField.placeholder.toLowerCase().includes(key.toLowerCase())
          ) {
            bestMatch = value;
            bestMatchKey = key;
            break;
          }
        }

        if (
          bestMatch &&
          formField.type !== "submit" &&
          formField.type !== "button"
        ) {
          try {
            const selector = formField.id
              ? `#${formField.id}`
              : formField.name
              ? `[name="${formField.name}"]`
              : formField.selector;

            await page.fill(selector, bestMatch);
            await page.waitForTimeout(500); // Small delay between fields

            filledFields.push({
              field: formField.label || formField.name || formField.id,
              value: bestMatch,
              success: true,
              selector: selector,
            });
          } catch (error) {
            filledFields.push({
              field: formField.label || formField.name || formField.id,
              value: bestMatch,
              success: false,
              selector: formField.selector,
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
        formUrl: targetFormUrl,
        filledFields,
        formFields,
        fieldMapping,
        screenshots: {
          before: screenshotBefore.toString("base64"),
          after: screenshotAfter.toString("base64"),
        },
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
    console.error("Form filling error:", error);
    return NextResponse.json(
      {
        error: "Failed to fill form",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
