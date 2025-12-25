// var fs = require('fs');
// const fs1 = require('fs').promises;
// const puppeteer = require('puppeteer');

// const _sendResponse = require('../../app/helper/global').sendResponse;
// const _errorResponse = require('../../app/helper/global').errorResponse;
// const _validationErrors = require('../../app/helper/global').validationErrors;

// // const creditRepositoryR = require('../../repositories/creditRepository');
// // const creditRepository = new creditRepositoryR();

// class locationController {
//     constructor() { }

//     async listlocation(req, res) {
//         try {
//             let listlocation = {
//                 "city": "Mumbai"
//             }
//             //var cartData1 = await cartdata(req,res)
//             _sendResponse(res, 200, "locationship List", listlocation);

//         } catch (err) {
//             if (err.errors) {
//                 _validationErrors(res, err.errors);
//             } else if (err.message == undefined) {
//                 let error = err.split('|');
//                 _sendResponse(res, error[1], error[0]);
//             } else {
//                 _errorResponse(res, 500, 'Internal Server Error :: ' + err.message);
//             }
//         }

//     }

//     async uploadHTML(req, res) {
//         try {

//             // var upload = uploadFile.single('file_new')
//             // let path =
//             //     __basedir + "/uploads/" + req.file.filename;
//             if (req.file == undefined) {
//                 _sendResponse(res, 400, "Please upload an html file!");
//                 return;
//                 //return res.status(400).send("Please upload an excel file!");
//             }
//             const htmlBuffer = req.file.buffer;
//             let path =
//                 __basedir + "/uploads/" + req.file.filename;

//             const browser = await puppeteer.launch({ headless: 'new' });
//             const page = await browser.newPage();
//             await page.goto(`file://${path}`, { waitUntil: 'networkidle2' });

//             // await page.evaluate(() => {
//             //     document.getElementById('defaultPDF').click();
//             // });
//             const client = await page.target().createCDPSession();
//             await client.send('Page.setDownloadBehavior', {
//                 behavior: 'allow',
//                 downloadPath: '/home/ubuntu/Projects/EAClub/downloads', // Specify your desired download path
//             });
//             // const browserContext = browser.defaultBrowserContext();

//             // // Set the download path for files
//             // await browserContext.setDefaultOptions({
//             //     downloadPath: '/home/ubuntu/EAClub/downloads', // Specify your desired download path
//             // });

//             // Open the temporary HTML file

//             // Generate PDF from the HTML file
//             const pdf = await page.pdf({ format: 'A4' });

//             // Close the browser
//             await browser.close();

//             // var fileUrl = await locationUtils.uploadFiles3(req, path);

//             res.setHeader('Content-Type', 'application/pdf');
//             res.setHeader('Content-Disposition', 'attachment; filename=output.pdf');
//             res.status(200).send(pdf);
//             // _sendResponse(res, 200, "Excel File Uploaded", fileUrl);

//             // Clean up: Delete the temporary HTML file
//             await fs1.unlink(path);

//             //  var cartData1 = await cartdata(req, res)

//         } catch (err) {
//             //throw err;
//             if (err.errors) {
//                 _validationErrors(res, err.errors);
//             } else if (err.message == undefined) {
//                 let error = err.split('|');
//                 _sendResponse(res, error[1], error[0]);
//             } else {
//                 _errorResponse(res, 500, 'Internal Server Error :: ' + err.message);
//             }
//         }

//     }

// }
// module.exports = locationController;

//full width of screen
var fs = require("fs");
const fs1 = require("fs").promises;
const puppeteer = require("puppeteer");
const path = require("path");

// const { _sendResponse, _errorResponse, _validationErrors } = require("../../app/helper/global");

const _sendResponse = require("../../app/helper/global").sendResponse;
const _errorResponse = require("../../app/helper/global").errorResponse;
const _validationErrors = require("../../app/helper/global").validationErrors;

class locationController {
  constructor() {}

  async listlocation(req, res) {
    try {
      let listlocation = {
        city: "Mumbai",
      };
      _sendResponse(res, 200, "locationship List", listlocation);
    } catch (err) {
      if (err.errors) {
        _validationErrors(res, err.errors);
      } else if (err.message == undefined) {
        let error = err.split("|");
        _sendResponse(res, error[1], error[0]);
      } else {
        _errorResponse(res, 500, "Internal Server Error :: " + err.message);
      }
    }
  }

async uploadHtmlSinglePage(req, res) {
    try {
      if (!req.file) {
        _sendResponse(res, 400, "Please upload an HTML file!");
        return;
      }

      const path = __basedir + "/uploads/" + req.file.filename;
      
      let htmlContent = await fs1.readFile(path, "utf8");

      htmlContent = htmlContent.replace(
        /<iframe[^>]*src="https:\/\/maps\.google\.com[^"]*"[^>]*><\/iframe>/gi,
        `<img src="https://staticmap.openstreetmap.de/staticmap.php?center=20,78&zoom=4&size=600x400&maptype=mapnik"
            alt="Map" style="display:block;margin:auto;border:1px solid #ccc;" />`
      );

      const injectCSS = `
      <style>
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          box-sizing: border-box !important;
        }

        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: auto !important;
          background: transparent !important;
          overflow: visible !important;
        }

        /* Prevent page breaks */
        * {
          page-break-before: avoid !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
        }

        /* Remove Bootstrap outer spacing */
        .container, .container-fluid {
          padding-left: 0 !important;
          padding-right: 0 !important;
          margin: 0 !important;
          max-width: none !important;
        }

        .row {
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        .col, [class*="col-"] {
          padding-left: 0 !important;
          padding-right: 0 !important;
        }

        @page {
          size: auto;
          margin: 0mm !important;
        }

        body::after {
          content: none !important;
          display: none !important;
        }
      </style>
    `;

      if (htmlContent.includes("</head>")) {
        htmlContent = htmlContent.replace("</head>", `${injectCSS}</head>`);
      } else if (htmlContent.includes("<body>")) {
        htmlContent = htmlContent.replace("<body>", `<body>${injectCSS}`);
      } else {
        htmlContent = injectCSS + htmlContent;
      }

      const modifiedPath = path.replace(".html", "_modified.html");
      await fs1.writeFile(modifiedPath, htmlContent);

      const browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--enable-webgl",
          "--ignore-gpu-blocklist",
          "--use-gl=desktop",
          "--enable-accelerated-2d-canvas",
          "--enable-gpu-rasterization",
          "--disable-dev-shm-usage",
        ],
      });
      
      const page = await browser.newPage();

      await page.setViewport({
        width: 1200,
        height: 3000, // Larger height for big content
        deviceScaleFactor: 1
      });

      await page.goto(`file://${modifiedPath}`, {
        waitUntil: "networkidle2",
        timeout: 200000,
      });

      await page.waitForTimeout(7000);

      // Get exact content dimensions (minimum bounding box)
      const dimensions = await page.evaluate(() => {
        const allElements = Array.from(document.body.querySelectorAll('*'));
        let maxBottom = 0;
        let maxRight = 0;
        let minTop = Infinity;
        let minLeft = Infinity;
        
        allElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            if (rect.top < minTop) minTop = rect.top;
            if (rect.left < minLeft) minLeft = rect.left;
            if (rect.bottom > maxBottom) maxBottom = rect.bottom;
            if (rect.right > maxRight) maxRight = rect.right;
          }
        });
        
        return {
          width: Math.ceil(maxRight - minLeft),
          height: Math.ceil(maxBottom - minTop)
        };
      });

      const pxToInch = px => px / 96;
      const pdf = await page.pdf({
        printBackground: true,
        width: `${pxToInch(dimensions.width)}in`,
        height: `${pxToInch(dimensions.height)}in`,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        preferCSSPageSize: false,
        pageRanges: '1',
      });

      await browser.close();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=uploadHTML_${Date.now()}.pdf`
      );
      res.status(200).send(pdf);

      await fs1.unlink(path);
      await fs1.unlink(modifiedPath);
    } catch (err) {
      if (err.errors) _validationErrors(res, err.errors);
      else if (!err.message) {
        let error = err.split("|");
        _sendResponse(res, error[1], error[0]);
      } else {
        _errorResponse(res, 500, "Internal Server Error :: " + err.message);
      }
    }
  }

async uploadHTML(req, res) {
  try {
    if (req.file == undefined) {
      _sendResponse(res, 400, "Please upload an html file!");
      return;
    }

    const path = __basedir + "/uploads/" + req.file.filename;

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123 });

    await page.goto(`file://${path}`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    const hasPageContainer = await page.evaluate(() => {
      return document.querySelector(".page-container") !== null;
    });

    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll("figure, .highcharts-container, canvas"))
          .some(el => el.offsetHeight > 0 && el.offsetWidth > 0) ||
        document.readyState === "complete",
      { timeout: 10000 }
    ).catch(() => {}); 

    await page.waitForTimeout(2000);

    let pdf;

    if (hasPageContainer) {
      await page.addStyleTag({
        content: `
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background: white !important;
          }
          .page-container {
            width: 794px !important;
            height: 1123px !important;
            page-break-after: always !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-container:last-child {
            page-break-after: avoid !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        `,
      });

      await page.emulateMediaType("screen");

      pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        preferCSSPageSize: true,
      });
    } else {
      pdf = await page.pdf({
        format: "A4",
        printBackground: true,
      });
    }

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=uploadHTML_${Date.now()}.pdf`
    );
    res.status(200).send(pdf);

    await fs1.unlink(path);
  } catch (err) {
    if (err.errors) {
      _validationErrors(res, err.errors);
    } else if (err.message == undefined) {
      let error = err.split("|");
      _sendResponse(res, error[1], error[0]);
    } else {
      _errorResponse(res, 500, "Internal Server Error :: " + err.message);
    }
  }
}


async uploadHTML5(req, res) {
  try {
    if (!req.file) {
      _sendResponse(res, 400, "Please upload an HTML file!");
      return;
    }

    const payload = req.body?.payload ? JSON.parse(req.body.payload) : {};
    const pageSize = payload.pageSize || "A4";
    const orientation = payload.orientation || "portrait";
    const customSize = payload.customSize || {}; // { width: 800, height: 1000 }

    const filePath = __basedir + "/uploads/" + req.file.filename;

    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-extensions",
        "--no-zygote",
        "--no-first-run",
        "--disable-background-networking",
        "--disable-default-apps",
        "--disable-translate",
        "--disable-sync",
        "--metrics-recording-only",
        "--mute-audio",
        "--no-pings",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
      ],
    });

    const page = await browser.newPage();

    const viewports = {
      A5: { portrait: { width: 420, height: 595 }, landscape: { width: 595, height: 420 } },
      A4: { portrait: { width: 794, height: 1123 }, landscape: { width: 1123, height: 794 } },
      A3: { portrait: { width: 1123, height: 1587 }, landscape: { width: 1587, height: 1123 } },
      A2: { portrait: { width: 1587, height: 2245 }, landscape: { width: 2245, height: 1587 } },
      A1: { portrait: { width: 2245, height: 3179 }, landscape: { width: 3179, height: 2245 } },
      A0: { portrait: { width: 3179, height: 4494 }, landscape: { width: 4494, height: 3179 } },
      Letter: { portrait: { width: 816, height: 1056 }, landscape: { width: 1056, height: 816 } },
      Legal: { portrait: { width: 816, height: 1344 }, landscape: { width: 1344, height: 816 } },
    };

    let vp;
    if (pageSize.toLowerCase() === "custom" && customSize.width && customSize.height) {
      vp =
        orientation === "landscape"
          ? { width: customSize.height, height: customSize.width }
          : { width: customSize.width, height: customSize.height };
    } else {
      vp = viewports[pageSize]?.[orientation] || viewports["A4"]["portrait"];
    }

    await page.setViewport(vp);

    await page.setRequestInterception(true);
    page.on("request", (reqInt) => {
      const type = reqInt.resourceType();
      if (["image"].includes(type)) {
        reqInt.abort();
      } else {
        reqInt.continue();
      }
    });

    await page.goto(`file://${filePath}`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await new Promise((r) => setTimeout(r, 1500));

    const hasPageContainer = !!(await page.$(".page-container"));
    const adjustedHeight = orientation === "landscape" ? vp.height - 2 : vp.height;
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);

        const pxToInch = px => px / 96;
    const totalHeightInInch = pxToInch(bodyHeight);

    await page.addStyleTag({
      content: `
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          width: ${vp.width}px !important;
          height: ${vp.height}px !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        ${
          hasPageContainer
            ? `
          .page-container {
            width: ${vp.width}px !important;
            height: ${adjustedHeight}px !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            overflow: hidden !important;
          }
          .page-container:last-child { page-break-after: avoid !important; }
        `
            : ""
        }
        @page { size: ${
          pageSize === "custom"
            ? `${vp.width}px ${vp.height}px`
            : `${pageSize} ${orientation}`
        }; margin: 0; }
      `,
    });

    await page.emulateMediaType("screen");

        const pdf = await page.pdf({
      format: pageSize,
      landscape: orientation === "landscape",
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      preferCSSPageSize: true,
      height: `${totalHeightInInch}in`,
    });

    // // 🧾 Generate PDF
    // const pdf = await page.pdf({
    //   format: pageSize !== "custom" ? pageSize : undefined,
    //   width: pageSize === "custom" ? `${vp.width}px` : undefined,
    //   height: `${totalHeightInInch}in`,
    //   landscape: orientation === "landscape",
    //   printBackground: true,
    //   margin: { top: 0, bottom: 0, left: 0, right: 0 },
    //   preferCSSPageSize: true,
    // });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=uploadHTML_${Date.now()}.pdf`
    );
    res.status(200).send(pdf);

    await fs1.unlink(filePath);
  } catch (err) {
    console.error("error:", err.message);
    if (err.errors) _validationErrors(res, err.errors);
    else if (!err.message) {
      let error = err.split("|");
      _sendResponse(res, error[1], error[0]);
    } else {
      _errorResponse(res, 500, "Internal Server Error :: " + err.message);
    }
  }
}

}

module.exports = locationController;

// async uploadHTML5(req, res) {
//   try {
//     if (!req.file) {
//       _sendResponse(res, 400, "Please upload an HTML file!");
//       return;
//     }

//     const payload = req.body?.payload ? JSON.parse(req.body.payload) : {};
//     const pageSize = payload.pageSize || "A4";
//     const orientation = payload.orientation || "portrait";
//     const customSize = payload.customSize || {}; // { width, height }

//     const filePath = __basedir + "/uploads/" + req.file.filename;

//     const browser = await puppeteer.launch({
//       headless: "new",
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage",
//         "--disable-gpu",
//         "--disable-extensions",
//         "--no-zygote",
//         "--no-first-run",
//         "--disable-background-networking",
//         "--disable-default-apps",
//         "--disable-translate",
//         "--disable-sync",
//         "--metrics-recording-only",
//         "--mute-audio",
//         "--no-pings",
//         "--disable-background-timer-throttling",
//         "--disable-backgrounding-occluded-windows",
//         "--disable-renderer-backgrounding",
//       ],
//     });

//     const page = await browser.newPage();

//     // 📏 Define all supported page sizes (96 DPI)
//     const viewports = {
//       A5: { portrait: { width: 420, height: 595 }, landscape: { width: 595, height: 420 } },
//       A4: { portrait: { width: 794, height: 1123 }, landscape: { width: 1123, height: 794 } },
//       A3: { portrait: { width: 1123, height: 1587 }, landscape: { width: 1587, height: 1123 } },
//       A2: { portrait: { width: 1587, height: 2245 }, landscape: { width: 2245, height: 1587 } },
//       A1: { portrait: { width: 2245, height: 3179 }, landscape: { width: 3179, height: 2245 } },
//       A0: { portrait: { width: 3179, height: 4494 }, landscape: { width: 4494, height: 3179 } },
//       Letter: { portrait: { width: 816, height: 1056 }, landscape: { width: 1056, height: 816 } },
//       Legal: { portrait: { width: 816, height: 1344 }, landscape: { width: 1344, height: 816 } },
//     };

//     // Determine viewport
//     let vp;
//     if (pageSize.toLowerCase() === "custom" && customSize.width && customSize.height) {
//       vp =
//         orientation === "landscape"
//           ? { width: customSize.height, height: customSize.width }
//           : { width: customSize.width, height: customSize.height };
//     } else {
//       vp = viewports[pageSize]?.[orientation] || viewports["A4"]["portrait"];
//     }

//     await page.setViewport(vp);

//     // ⚙️ Optional: Skip image loading for performance
//     await page.setRequestInterception(true);
//     page.on("request", (reqInt) => {
//       const type = reqInt.resourceType();
//       if (["image"].includes(type)) reqInt.abort();
//       else reqInt.continue();
//     });

//     // 🧭 Load uploaded HTML
//     await page.goto(`file://${filePath}`, {
//       waitUntil: "networkidle2",
//       timeout: 60000,
//     });

//     // Wait for JS rendering
//     await new Promise((r) => setTimeout(r, 1500));

//     const hasPageContainer = !!(await page.$(".page-container"));

//     // 🩹 FIX: Adjust height slightly to prevent overflow
//     const adjustedHeight = Math.floor(vp.height * 0.999);

//     // 🩹 FIX: Inject stronger CSS for layout
//     await page.addStyleTag({
//       content: `
//         html, body {
//           margin: 0 !important;
//           padding: 0 !important;
//           background: white !important;
//           width: ${vp.width}px !important;
//           height: ${vp.height}px !important;
//           overflow: hidden !important;
//           -webkit-print-color-adjust: exact !important;
//           print-color-adjust: exact !important;
//         }

//         ${
//           hasPageContainer
//             ? `
//           .page-container {
//             width: ${vp.width}px !important;
//             height: ${adjustedHeight}px !important;
//             page-break-after: always !important;
//             page-break-inside: avoid !important;
//             overflow: hidden !important;
//             margin: 0 !important;
//             padding: 0 !important;
//           }
//           .page-container:last-of-type {
//             page-break-after: auto !important;
//           }
//         `
//             : ""
//         }

//         @page { 
//           size: ${
//             pageSize === "custom"
//               ? `${vp.width}px ${vp.height}px`
//               : `${pageSize} ${orientation}`
//           }; 
//           margin: 0;
//         }
//       `,
//     });

//     // 🩹 FIX: DOM-level cleanup for the last page
//     await page.evaluate(() => {
//       const pages = document.querySelectorAll(".page-container");
//       if (pages.length) {
//         pages.forEach((el, i) => {
//           el.style.boxSizing = "border-box";
//           el.style.margin = "0";
//           el.style.padding = "0";
//           if (i === pages.length - 1) {
//             el.style.pageBreakAfter = "avoid";
//           }
//         });
//       }
//     });

//     // 🩹 FIX: Use print media to align pagination more precisely
//     await page.emulateMediaType("print");

//     // 🧾 Generate PDF
//     const pdf = await page.pdf({
//       format: pageSize !== "custom" ? pageSize : undefined,
//       width: pageSize === "custom" ? `${vp.width}px` : undefined,
//       height: pageSize === "custom" ? `${vp.height}px` : undefined,
//       landscape: orientation === "landscape",
//       printBackground: true,
//       margin: { top: 0, bottom: 0, left: 0, right: 0 },
//       preferCSSPageSize: true,
//     });

//     await browser.close();

//     // 📦 Send response
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=uploadHTML_${Date.now()}.pdf`
//     );
//     res.status(200).send(pdf);

//     await fs1.unlink(filePath);
//   } catch (err) {
//     console.error("error:", err.message);
//     if (err.errors) _validationErrors(res, err.errors);
//     else if (!err.message) {
//       let error = err.split("|");
//       _sendResponse(res, error[1], error[0]);
//     } else {
//       _errorResponse(res, 500, "Internal Server Error :: " + err.message);
//     }
//   }
// }


// async uploadHTML5(req, res) {
//   try {
//     if (!req.file) {
//       _sendResponse(res, 400, "Please upload an HTML file!");
//       return;
//     }

//     const payload = req.body?.payload ? JSON.parse(req.body.payload) : {};
//     const pageSize = payload.pageSize || "A4";
//     const orientation = payload.orientation || "portrait";
//     const customSize = payload.customSize || {}; // { width: 800, height: 1000 }

//     const filePath = __basedir + "/uploads/" + req.file.filename;

//     const browser = await puppeteer.launch({
//       headless: "new",
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage",
//         "--disable-gpu",
//         "--disable-extensions",
//         "--no-zygote",
//         "--no-first-run",
//         "--disable-background-networking",
//         "--disable-default-apps",
//         "--disable-translate",
//         "--disable-sync",
//         "--metrics-recording-only",
//         "--mute-audio",
//         "--no-pings",
//         "--disable-background-timer-throttling",
//         "--disable-backgrounding-occluded-windows",
//         "--disable-renderer-backgrounding",
//       ],
//     });

//     const page = await browser.newPage();

//     // Define viewport sizes in pixels (approx 96 DPI)
//     const viewports = {
//       A5: { portrait: { width: 420, height: 595 }, landscape: { width: 595, height: 420 } },
//       A4: { portrait: { width: 794, height: 1123 }, landscape: { width: 1123, height: 794 } },
//       A3: { portrait: { width: 1123, height: 1587 }, landscape: { width: 1587, height: 1123 } },
//       A2: { portrait: { width: 1587, height: 2245 }, landscape: { width: 2245, height: 1587 } },
//       A1: { portrait: { width: 2245, height: 3179 }, landscape: { width: 3179, height: 2245 } },
//       A0: { portrait: { width: 3179, height: 4494 }, landscape: { width: 4494, height: 3179 } },
//       Letter: { portrait: { width: 816, height: 1056 }, landscape: { width: 1056, height: 816 } },
//       Legal: { portrait: { width: 816, height: 1344 }, landscape: { width: 1344, height: 816 } },
//     };

//     // Determine viewport based on payload
//     let vp;
//     if (pageSize.toLowerCase() === "custom" && customSize.width && customSize.height) {
//       vp =
//         orientation === "landscape"
//           ? { width: customSize.height, height: customSize.width }
//           : { width: customSize.width, height: customSize.height };
//     } else {
//       vp = viewports[pageSize]?.[orientation] || viewports["A4"]["portrait"];
//     }

//     await page.setViewport(vp);

//     // ⚙️ Intercept requests to skip images (optional, for speed)
//     await page.setRequestInterception(true);
//     page.on("request", (reqInt) => {
//       const type = reqInt.resourceType();
//       if (["image"].includes(type)) {
//         reqInt.abort();
//       } else {
//         reqInt.continue();
//       }
//     });

//     // 🧭 Load HTML file
//     await page.goto(`file://${filePath}`, {
//       waitUntil: "networkidle2",
//       timeout: 60000,
//     });

//     // Wait for charts/tables/JS rendering
//     await new Promise((r) => setTimeout(r, 1500));

//     const hasPageContainer = !!(await page.$(".page-container"));
//     const adjustedHeight = orientation === "landscape" ? vp.height - 2 : vp.height;

//     // 🖋 Apply page layout CSS
//     await page.addStyleTag({
//       content: `
//         html, body {
//           margin: 0 !important;
//           padding: 0 !important;
//           background: white !important;
//           width: ${vp.width}px !important;
//           height: ${vp.height}px !important;
//           -webkit-print-color-adjust: exact !important;
//           print-color-adjust: exact !important;
//         }
//         ${
//           hasPageContainer
//             ? `
//           .page-container {
//             width: ${vp.width}px !important;
//             height: ${adjustedHeight}px !important;
//             page-break-after: always !important;
//             page-break-inside: avoid !important;
//             overflow: hidden !important;
//           }
//           .page-container:last-child { page-break-after: avoid !important; }
//         `
//             : ""
//         }
//         @page { size: ${
//           pageSize === "custom"
//             ? `${vp.width}px ${vp.height}px`
//             : `${pageSize} ${orientation}`
//         }; margin: 0; }
//       `,
//     });

//     await page.emulateMediaType("screen");

//     // 🧾 Generate PDF
//     const pdf = await page.pdf({
//       format: pageSize !== "custom" ? pageSize : undefined,
//       width: pageSize === "custom" ? `${vp.width}px` : undefined,
//       height: pageSize === "custom" ? `${vp.height}px` : undefined,
//       landscape: orientation === "landscape",
//       printBackground: true,
//       margin: { top: 0, bottom: 0, left: 0, right: 0 },
//       preferCSSPageSize: true,
//     });

//     await browser.close();

//     // 📦 Send PDF response
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=uploadHTML_${Date.now()}.pdf`
//     );
//     res.status(200).send(pdf);

//     // 🧹 Clean up uploaded file
//     await fs1.unlink(filePath);
//   } catch (err) {
//     console.error("error:", err.message);
//     if (err.errors) _validationErrors(res, err.errors);
//     else if (!err.message) {
//       let error = err.split("|");
//       _sendResponse(res, error[1], error[0]);
//     } else {
//       _errorResponse(res, 500, "Internal Server Error :: " + err.message);
//     }
//   }
// }
// async uploadHTML5(req, res) {
//   try {
//     if (!req.file) {
//       _sendResponse(res, 400, "Please upload an HTML file!");
//       return;
//     }

//     const payload = req.body?.payload ? JSON.parse(req.body.payload) : {};
//     const pageSize = payload.pageSize || "A4";
//     const orientation = payload.orientation || "portrait";
//     const filePath = __basedir + "/uploads/" + req.file.filename;

//     const browser = await puppeteer.launch({
//       headless: "new",
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage",
//         "--disable-gpu",
//       ],
//     });

//     const page = await browser.newPage();

//     // 🧭 Load HTML file
//     await page.goto(`file://${filePath}`, {
//       waitUntil: "networkidle2",
//       timeout: 60000,
//     });

//     // Wait for rendering
//     await page.waitForTimeout(1500);

//     // Measure the full rendered content height
//     const bodyHeight = await page.evaluate(() => document.body.scrollHeight);

//     // Convert pixels → inches (Puppeteer uses inches for page size)
//     const pxToInch = px => px / 96;
//     const totalHeightInInch = pxToInch(bodyHeight);

//     // 🖋 Apply clean print layout CSS
//     await page.addStyleTag({
//       content: `
//         * {
//           -webkit-print-color-adjust: exact !important;
//           print-color-adjust: exact !important;
//           box-sizing: border-box !important;
//         }
//         html, body {
//           margin: 0 !important;
//           padding: 0 !important;
//           background: white !important;
//           width: 100% !important;
//           height: auto !important;
//           overflow: visible !important;
//         }
//         @page {
//           size: ${pageSize} ${orientation};
//           margin: 0;
//         }
//       `,
//     });

//     await page.emulateMediaType("screen");

//     // Generate PDF with dynamic total height, keeping page breaks
//     const pdf = await page.pdf({
//       format: pageSize,
//       landscape: orientation === "landscape",
//       printBackground: true,
//       margin: { top: 0, bottom: 0, left: 0, right: 0 },
//       preferCSSPageSize: true,
//       height: `${totalHeightInInch}in`, // ✅ eliminates extra bottom gap
//     });

//     await browser.close();

//     // 📦 Send PDF response
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=uploadHTML_${Date.now()}.pdf`
//     );
//     res.status(200).send(pdf);

//     await fs1.unlink(filePath);
//   } catch (err) {
//     console.error("error:", err.message);
//     if (err.errors) _validationErrors(res, err.errors);
//     else if (!err.message) {
//       let error = err.split("|");
//       _sendResponse(res, error[1], error[0]);
//     } else {
//       _errorResponse(res, 500, "Internal Server Error :: " + err.message);
//     }
//   }
// }
