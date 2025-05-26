
var fs = require('fs');
const fs1 = require('fs').promises;
const puppeteer = require('puppeteer');

const _sendResponse = require('../../app/helper/global').sendResponse;
const _errorResponse = require('../../app/helper/global').errorResponse;
const _validationErrors = require('../../app/helper/global').validationErrors;

// const creditRepositoryR = require('../../repositories/creditRepository');
// const creditRepository = new creditRepositoryR();

class locationController {
    constructor() { }


    async listlocation(req, res) {
        try {
            let listlocation = {
                "city": "Mumbai"
            }
            //var cartData1 = await cartdata(req,res)
            _sendResponse(res, 200, "locationship List", listlocation);

        } catch (err) {
            if (err.errors) {
                _validationErrors(res, err.errors);
            } else if (err.message == undefined) {
                let error = err.split('|');
                _sendResponse(res, error[1], error[0]);
            } else {
                _errorResponse(res, 500, 'Internal Server Error :: ' + err.message);
            }
        }

    }

    async uploadHTML(req, res) {
        try {

            // var upload = uploadFile.single('file_new')
            // let path =
            //     __basedir + "/uploads/" + req.file.filename;
            if (req.file == undefined) {
                _sendResponse(res, 400, "Please upload an html file!");
                return;
                //return res.status(400).send("Please upload an excel file!");
            }
            const htmlBuffer = req.file.buffer;
            let path =
                __basedir + "/uploads/" + req.file.filename;

            const browser = await puppeteer.launch({ headless: 'new' });
            const page = await browser.newPage();
            await page.goto(`file://${path}`, { waitUntil: 'networkidle2' });

            // await page.evaluate(() => {
            //     document.getElementById('defaultPDF').click();
            // });
            const client = await page.target().createCDPSession();
            await client.send('Page.setDownloadBehavior', {
                behavior: 'allow',
                downloadPath: 'E:\Interactive Designer\current working', // Specify your desired download path
            });
            // const browserContext = browser.defaultBrowserContext();

            // // Set the download path for files
            // await browserContext.setDefaultOptions({
            //     downloadPath: '/home/ubuntu/EAClub/downloads', // Specify your desired download path
            // });




            // Open the temporary HTML file


            // Generate PDF from the HTML file
            const pdf = await page.pdf({ format: 'A4' });

            // Close the browser
            await browser.close();

            // var fileUrl = await locationUtils.uploadFiles3(req, path);


            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=output.pdf');
            res.status(200).send(pdf);
            // _sendResponse(res, 200, "Excel File Uploaded", fileUrl);

            // Clean up: Delete the temporary HTML file
            await fs1.unlink(path);

            //  var cartData1 = await cartdata(req, res)


        } catch (err) {
            //throw err;
            if (err.errors) {
                _validationErrors(res, err.errors);
            } else if (err.message == undefined) {
                let error = err.split('|');
                _sendResponse(res, error[1], error[0]);
            } else {
                _errorResponse(res, 500, 'Internal Server Error :: ' + err.message);
            }
        }

    }



}
module.exports = locationController;