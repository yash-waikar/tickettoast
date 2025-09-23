import { test, expect } from "@playwright/test";

test.describe("Parking Ticket Appeal Form Automation", () => {
  test("should analyze form structure", async ({ page }) => {
    await page.goto(
      "https://portal.laserfiche.com/h4073/forms/ParkingTicketAppeal"
    );
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "tests/screenshots/form-structure.png",
      fullPage: true,
    });

    const formFields = await page.$$eval(
      "input, select, textarea",
      (elements) => {
        return elements.map((el, index) => {
          const input = el as HTMLInputElement;
          let label = "";

          if (input.id) {
            const labelElement = document.querySelector(
              `label[for="${input.id}"]`
            );
            if (labelElement) {
              label = labelElement.textContent?.trim() || "";
            }
          }

          if (!label) {
            const parent = input.parentElement;
            if (parent) {
              const labelText = parent.textContent?.trim() || "";
              label = labelText.substring(0, 100);
            }
          }
         

          return {
            type: input.type || "text",
            name: input.name || "",
            id: input.id || "",
            placeholder: input.placeholder || "",
            label: label,
            value: input.value || "",
            required: input.required || false,
          };
        });
      }
    );

    expect(formFields.length).toBeGreaterThan(0);
  });

  test("should fill form with sample data", async ({ page }) => {
    const sampleData = {
      citation_number: "ABC123456",
      license_plate: "TEST123",
      violation_date: "2025-01-15",
      violation_time: "14:30",
      violation_location: "123 Main St, City, State",
      vehicle_make: "Toyota",
      vehicle_model: "Camry",
      vehicle_color: "Blue",
      fine_amount: "$75.00",
    };

    await page.goto(
      "https://portal.laserfiche.com/h4073/forms/ParkingTicketAppeal"
    );
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "tests/screenshots/before-fill.png",
      fullPage: true,
    });

    const fieldMappings = [
      {
        selectors: [
          'input[name*="citation"]',
          'input[id*="citation"]',
          'input[placeholder*="citation"]',
        ],
        value: sampleData.citation_number,
      },
      {
        selectors: [
          'input[name*="license"]',
          'input[id*="license"]',
          'input[placeholder*="license"]',
        ],
        value: sampleData.license_plate,
      },
      {
        selectors: [
          'input[name*="date"]',
          'input[id*="date"]',
          'input[type="date"]',
        ],
        value: sampleData.violation_date,
      },
      {
        selectors: [
          'input[name*="time"]',
          'input[id*="time"]',
          'input[type="time"]',
        ],
        value: sampleData.violation_time,
      },
      {
        selectors: [
          'input[name*="location"]',
          'input[id*="location"]',
          'textarea[name*="location"]',
        ],
        value: sampleData.violation_location,
      },
      {
        selectors: ['input[name*="make"]', 'input[id*="make"]'],
        value: sampleData.vehicle_make,
      },
      {
        selectors: ['input[name*="model"]', 'input[id*="model"]'],
        value: sampleData.vehicle_model,
      },
      {
        selectors: ['input[name*="color"]', 'input[id*="color"]'],
        value: sampleData.vehicle_color,
      },
      {
        selectors: [
          'input[name*="amount"]',
          'input[id*="amount"]',
          'input[name*="fine"]',
        ],
        value: sampleData.fine_amount,
      },
    ];

    for (const mapping of fieldMappings) {
      for (const selector of mapping.selectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            await element.fill(mapping.value);
            console.log(`Filled ${selector} with ${mapping.value}`);
            await page.waitForTimeout(500);
            break;
          }
        } catch (error) {
          console.log(`Could not fill ${selector}: ${error}`);
        }
      }
    }

    await page.screenshot({
      path: "tests/screenshots/after-fill.png",
      fullPage: true,
    });
    await page.waitForTimeout(2000);
  });
});
