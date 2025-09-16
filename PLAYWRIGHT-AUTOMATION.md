# Playwright Form Automation

This integration allows you to automatically fill the Laserfiche Parking Ticket Appeal form using data extracted from parking citations.

## Features

- **Preview Mode**: Watch Playwright fill the form in real-time with a visible browser window
- **Silent Mode**: Fill the form in the background without opening a browser window
- **Screenshot Capture**: Before and after screenshots of the form filling process
- **Field Mapping**: Intelligent mapping between extracted citation data and form fields
- **Error Handling**: Detailed feedback on which fields were successfully filled

## How It Works

1. **Document Processing**: Upload and process a parking citation document
2. **Field Extraction**: Extract relevant information (citation number, license plate, etc.)
3. **Form Automation**: Use Playwright to automatically fill the appeal form
4. **Preview Results**: View screenshots and detailed reports of the form filling process

## Form Field Mappings

The system automatically maps extracted data to form fields based on common patterns:

- **Citation Number**: Maps to fields containing "citation", "ticket", or "number"
- **License Plate**: Maps to fields containing "license", "plate"
- **Violation Date**: Maps to date fields or fields containing "date"
- **Violation Time**: Maps to time fields or fields containing "time"
- **Location**: Maps to fields containing "location", "address"
- **Vehicle Info**: Maps to fields for make, model, color
- **Fine Amount**: Maps to fields containing "amount", "fine"

## Usage

1. **Upload Document**: Use the file upload to process a parking citation
2. **Review Extracted Data**: Check the extracted fields for accuracy
3. **Choose Fill Mode**:
   - **Preview Mode**: Click "Preview Form Fill" to watch the automation in action
   - **Silent Mode**: Click "Fill Form (Silent)" for background processing
4. **Review Results**: Check the screenshots and field mapping results

## Safety Features

- **No Submission**: The automation fills the form but does NOT submit it
- **Preview Mode**: You can see exactly what's happening in real-time
- **Testing Environment**: Safe for testing without affecting real appeals
- **Manual Review**: You can review and modify the filled form before submitting

## Technical Details

- **Browser**: Uses Chromium (Chrome) browser engine
- **Timeouts**: Reasonable delays between field fills for stability
- **Error Recovery**: Continues filling other fields if one fails
- **Screenshots**: Full-page screenshots for debugging and verification

## Testing

You can test the form automation with sample data:

```bash
npm run test:headed  # Run tests with visible browser
npm run test        # Run tests in headless mode
npm run test:ui     # Open Playwright UI for interactive testing
```

## Important Notes

⚠️ **This is for testing purposes only**

- The form is filled but NOT submitted automatically
- Always review the filled information before submitting
- Ensure data accuracy before using for real appeals
- Test thoroughly with sample data first

## Troubleshooting

If form filling fails:

1. Check the extracted field names and values
2. Verify the form structure hasn't changed
3. Review the error messages in the results
4. Use preview mode to see where the automation fails
5. Check the screenshots for visual debugging

## Form URL

The automation targets this form:
https://portal.laserfiche.com/h4073/forms/ParkingTicketAppeal
