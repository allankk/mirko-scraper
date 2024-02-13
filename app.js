const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const {JSDOM} = require("jsdom");
const Epub = require("epub-gen");

(async () => {
    try {
        var bookId = "1eef5630-2eb6-ee11-bea0-000d3a2b6a8c";
        var hostCsrfToken = "6a8b46b2d53ff8b49ebc07670287c15181bb9d21b03349334e067e5a3b1f706d%7C6fec7f7e875bba3638524a28b039f081817324d3f17b4bd0a6324e599b57ee3b";
        var secureSessionToken = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..PYZq4wl1tMi5Meqz.2grmNcCj6jGdR3ojdxqLDCG_bySfTFwPa8TurIe1Qj-qzVTKtqmLShScCb1mwpF1bQK721qgN--PSrEFwflvYVyV2OWvRgksz5NcAkoBHPelNaHyQeviKoKLXqLSlCcAi1BLqsrM3O21U-AMzWZPmbqctjoIp9YFqEtwwDgLr_8oi1iLi1txr-JH4PtLjLRYF7j7Qu5vc5pTj7DN1J6oY86Ma_YAXeXM-kmRWXaqW7vluawwXS_3TBhCAN9mAtehO2s-AWQFgyMipSHtpfjAV4ILny5Tz1eUkCW6Ils5Wke-QKpK0-suk-CWzESWoP_rgfaeXUc0ixgeyiva-yWGpI4VopDGq2C8-oZ7TLNlPnP9oKNqINpShJBJwsZrBH6Z3ic6NYVdtFIJi6Gog5-TZW_BfB2beEaaj5vKiqxicPM4HWJQKPOMuBjSvWAnGOA3MKC90GdIaVrhjOz_C8poLJ42x72v5nQmkHaFZIFAY9Tj3Ukm0MmvsfN4qAArcWMqnwQ62L3aXEt7Daih_n7G-XHErlQPHJ1YeIz5bIoWPd48dRqCbKICQA3roLzMDM8vjZs0su5JJ4_fbqfUJeQJVE7k_NGmhRoNyspsMp6S90pdc6MrTyw6sPyaiEUZjLWqME4FLubTJI3AwdhLzr25VWCSO7BuPrRBs5gqM1KNUER3nASBxEn3f13cAkJyoQ3lApGtJJti8Y6BDOciTqm8MBUlGze8mLLaudI6EAQNb2YrKUv5J1jvLWAQyq8HmeWdf2u2rPK_QWB446nLQAX4WASAQ8aQdPUn09Jg4hgOPSKAD7tME4pLXkTta-jvHEo9owWe2V8G1Lvxbi6VZUCyqV5RZmLUoD4aBARYC5LN6yuf0yubRZrwbiD80IbxZh6SyX_cbOvYute3188xTOlD_0AZDEVV_N--AA1dQR_IFNExWzdeQeWIebyUJaPKYHWGFFH1T8GhgMti8e413LBwAOSxTmoOpMu4PIiQrqNYrYvr35frEI-JsbqchPhKpeCxZ5xo0mPfGfeCP0QkNhr75u_6JL8W4K65Iv8DI-e94VcLdAiNgcOXUDP18SzI1IXZJ-ggq1pOMsOF45RttQbqt-HAwQhc_kEr2f4pxcXHhDlDSYo-lsCM77YRGHnQ9f0ecyxX0-8j8H7qNLGbuu7JhVny7w.1-raYyHO8nz58uWY2vq7_A";

        const chapterButtonSelector = '.reader-page-container>div>div>div>div>div button';
        const pageNumberSelector = '.reader-page-footer>div>div>span';
        const backButtonSelector = '.reader-page-container>div>div>button';

        var book = {
            author: "",
            title: "",
            cover: "",
            stylesheets: [],
            images: [],
            content: []
        };

        var cookies = [
            {
                "name": "__Host-next-auth.csrf-token",
                "value": hostCsrfToken, "domain": "elaenutus.mirko.ee",
                "secure": true
            },
            {
                "name": "__Secure-next-auth.session-token",
                "value": secureSessionToken,
                "domain": "elaenutus.mirko.ee",
                "secure": true
            },
            {
                "name": "__Secure-next-auth.callback-url",
                "value": "https%3A%2F%2Felaenutus.mirko.ee%2Fet",
                "domain": "elaenutus.mirko.ee",
                "secure": true
            },
            {
                "name": "CookieConsent",
                "value": "{necessary:true%252Cstatistics:true%252Cutc:1697526633027%252Cregion:%2527us%2527}",
                "domain": ".mirko.ee"
            }
        ];

        const setup = () => {
            // create temp dir if it doesn't exist; 
            const tempDir = path.join(__dirname, 'temp');
            const bookDir = path.join(__dirname, 'books');
            if (!fs.existsSync(tempDir)) {
              fs.mkdirSync(tempDir);
            }
            if (!fs.existsSync(bookDir)) {
              fs.mkdirSync(bookDir);
            }
        }
    
        const extractIframeContent = async() => {
            let iframeContent = await page.evaluate(() => {
                let iframe = document.querySelector('iframe');

                if (iframe) {
                    return iframe.srcdoc;
                } else {
                    return null;
                }
            })

            return iframeContent;
        }

        const fetchMetadata = async() => {
            const pageNew = await browser.newPage();
            await pageNew.setCookie(...cookies);
            await pageNew.goto(`https://elaenutus.mirko.ee/et/publication/${bookId}`, { waitUntil: 'networkidle0'});

            let metaContent = await pageNew.evaluate(() => {
                let identifiers = {
                    author: "head > meta[name='author']",
                    ISBN: "head > meta[name='DC.identifier']",
                    title: "head > meta[name='DC.title']",
                    publisher: "head > meta[name='DC.publisher']",
                    cover: "head > meta[property='og:image']"
                }

                let metadata = {};

                for (const [key, value] of Object.entries(identifiers)) {
                    let metael = document.querySelector(`${value}`);
                    if (metael) {
                        metadata[key] = metael.content;
                    }
                }

                if (metadata.author) {
                    metadata.author = metadata.author.replace(", pseudonüüm", "");
                    metadata.author = metadata.author.replace(", autor", "");
                }

                return metadata;
            });

            for (const [key, value] of Object.entries(metaContent))  {
                book[key] = value;
            };

            if (book.cover) {
                const pageImg = await browser.newPage();
                const response = await pageImg.goto(book.cover, {timeout: 0, waitUntil: 'networkidle0'});
                const blobBuffer = await response.buffer();

                await fs.promises.writeFile(`temp/book-cover.png`, blobBuffer);
                book.cover = path.join(__dirname, 'temp/book-cover.png');
                await pageImg.close();
            }

            console.log('Metadata:');
            console.log(book);

            await pageNew.close();
        }

        const downloadBlobs = async() => {
            console.log('Downloading blobs');
            const blobUrls = await page.evaluate(() => {
                const iframe = document.querySelector('iframe');
                if (iframe) {
                    const blobs = iframe.contentDocument.querySelectorAll('[src*="blob"], [href*="blob"]');

                    return Array.from(blobs).map(blob => {
                        if (blob.hasAttribute('src')) {
                            return blob.src;
                        } else if (blob.hasAttribute('href')) {
                            if (blob.hasAttribute('rel') && blob.type == 'text/css') {
                                return blob.href + '-stylesheet';
                            }                             
                            return blob.href;
                        }
                    })
                  } else {
                    return null;
                  }
            });

            for (let i = 0; i < blobUrls.length; i++) {
                let blobName = blobUrls[i].split('/').pop();

                if (blobName.endsWith('-stylesheet')) {
                    blobName = blobName.replace('-stylesheet', '.css');
                    blobUrls[i] = blobUrls[i].replace('-stylesheet', '');
                    if (!book.stylesheets.includes(blobName)) {
                        book.stylesheets.push(blobName);
                    } else {
                        continue;
                    }
                } else if (blobName.endsWith('-image')) {
                    blobName = blobName.replace('-image', '');
                    blobUrls[i] = blobUrls[i].replace('-image', '');
                    if (!book.images.includes(blobName)) {
                        book.images.push(blobName);
                    } else {
                        continue;
                    }
                }

                if (fs.existsSync(`./temp/${blobName}`)) { continue }

                const pageNew = await browser.newPage();
                const response = await pageNew.goto(blobUrls[i], {timeout: 0, waitUntil: 'networkidle0'});
                const blobBuffer = await response.buffer();

                await fs.promises.writeFile(`temp/${blobName}`, blobBuffer);
                await pageNew.close();
            }
        }

        const processStylesheets = async(stylesheets) => {
            console.log("Processing stylesheets");
            let css = "";

            stylesheets.forEach(item => {
                stylesheetContent = fs.readFileSync(`./temp/${item}`, { encoding: 'utf8', flag: 'r' });
                css = css.concat("\n", stylesheetContent);
            })

            return css;
        }

        const processContent = async(chapter) => {
            chapter.content = chapter.content.replaceAll("blob:https://elaenutus.mirko.ee", `${path.resolve('temp')}`);

            const dom = new JSDOM(chapter.content).window.document;
            let baseHref = dom.querySelector('base');
            if (baseHref && baseHref.href) {
                chapter.href = baseHref.href;
            }

            //let allImages = dom.querySelectorAll('img');
            //allImages.forEach(img => {
            //    img.src = img.src + ".png";
            //})
            //chapter.content = dom.documentElement.outerHTML;

            return chapter;
        }

        const getCurrentPage = async() => {
            let pageText = await page.$eval(pageNumberSelector, el => el.textContent);
            let pageNumber = pageText.split('/').shift();

            return pageNumber;
        }

        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

        setup();

        const browser = await puppeteer.launch();

        // Fetch metadata
        console.log('Fetching metadata');
        await fetchMetadata();

        const page = await browser.newPage();
        console.log('Connecting to reader...')
        await page.setCookie(...cookies);
        await page.goto(`https://elaenutus.mirko.ee/et/reading/${bookId}`, { waitUntil: 'networkidle0' });

        const chapterButtons = (await page.$$(chapterButtonSelector, chapterButtonSelector));
        (!chapterButtons.length) && console.log('Failed to get chapters, try updating the session token');


        await page.$$eval(chapterButtonSelector, (el) => el[0].click());

        // Fetch frontmatter 
        console.log('Waiting for page number');
        await page.waitForSelector(pageNumberSelector);

        console.log('Fetching Frontmatter');
        var currentPage = await getCurrentPage();
        while (currentPage != 1) {
            await page.$$eval(backButtonSelector, (el) => el[1].click());
            await sleep(100);
            currentPage = await getCurrentPage();

            let chapter = {
                title: currentPage,
                excludeFromToc: true,
                beforeToc: true
            }

            chapter.content = await extractIframeContent();
            await downloadBlobs();
            chapter = await processContent(chapter);

            if (!chapter.href) { continue; }
            const chapterExists = book.content.some(el => el.href === chapter.href);
            if (chapterExists) { continue; }

            book.content.unshift(chapter);
        }

        // Fetch chapters
        // divide by two because chapter is counted twice for some reason
        for (let split = 0; split < chapterButtons.length/2-1; split++) {
            console.log(`Fetching Chapter ${split + 1}/${chapterButtons.length/2}`);
            await page.$$eval(chapterButtonSelector, (el, split) => el[split].click(), split);
            await sleep(200);

            let chapter = {};

            chapter.content = await extractIframeContent();
            await downloadBlobs();
            chapter = await processContent(chapter);

            if (!chapter.href) { continue; }

            const chapterExists = book.content.some(el => el.href === chapter.href);
            if (chapterExists) { continue; }

            let title = (await (await chapterButtons[split].getProperty('textContent')).jsonValue()).trim();
            chapter.title = title.trim();

            book.content.push(chapter);
        }

        const epubOption = {
            title: book.title, // *Required, title of the book.
            author: book.author, // *Required, name of the author.
            publisher: book.publisher, // optional
            lang: 'et',
            appendChapterTitles: false,
            cover: book.cover, // Url or File path, both ok.
            content: []
        }

        console.log('book images');
        console.log(book.images);

        if (book.stylesheets.length) {
            epubOption.css = await processStylesheets(book.stylesheets);
        }

        book.content.forEach((item) => {
            epubOption.content.push({
                excludeFromToc: false,
                beforeToc: false,
                title: item.title ?? 'frontmatter',
                data: item.content
            })
        });

        console.log('Building epub');
        let titlePath = epubOption.title.replace(/[^A-ZÕÄÖÜõäöü0-9]+/ig, "_");
        await new Epub(epubOption, `./books/${titlePath}.epub`);

        // clear temp folder
        await sleep(3000);
        console.log('Clearing temporary folder');
        //fs.readdirSync('./temp').forEach(f => fs.rmSync(`./temp/${f}`));
        
        await browser.close();
    } catch (err) {
        console.error(err)
    }
})();
