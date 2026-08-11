/**
 * Utility to print a specific DOM element cleanly by creating a temporary iframe.
 * This is perfect for sandboxed iframe environments and prints only the targeted element (e.g. receipt).
 */
export function printElement(elementId: string, maxWidth: string = '360px', landscape: boolean = false) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found for printing.`);
    window.print();
    return;
  }

  // Create temporary hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const iframeWin = iframe.contentWindow;
  const iframeDoc = iframeWin?.document;

  if (!iframeDoc || !iframeWin) {
    console.warn('Could not access iframe window. Falling back to window.print().');
    window.print();
    return;
  }

  // Extract all stylesheets and style blocks from parent document
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(style => style.outerHTML)
    .join('\n');

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Imprimir Documento</title>
        ${styles}
        <style>
          @media print {
            @page {
              size: ${landscape ? 'landscape' : 'auto'};
            }
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            .no-print {
              display: none !important;
            }
          }
          body {
            background: white;
            color: #000;
            padding: 16px;
            font-family: system-ui, -apple-system, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Custom styles to optimize receipt or full-page formatting */
          #printed-receipt-view, #printed-invoice-a4, #printed-delivery-guide, #printed-z-report, #printed-financial-report, #printed-inventory-list, #printed-customer-list, [id^="printed-"] {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        </style>
      </head>
      <body>
        <div style="max-width: ${maxWidth}; margin: 0 auto;">
          ${element.outerHTML}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  // Trigger print after iframe resources have rendered
  setTimeout(() => {
    try {
      iframeWin.focus();
      iframeWin.print();
    } catch (err) {
      console.warn('Iframe print failed, falling back to window.print():', err);
      window.print();
    } finally {
      setTimeout(() => {
        try {
          iframe.remove();
        } catch {
          // ignore
        }
      }, 1000);
    }
  }, 250);
}

