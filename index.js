const puppeteer = require('puppeteer');

async function handleModalsDynamically(page) {
  // Remove existing modals based on common patterns
  await page.evaluate(() => {
    const modals = document.querySelectorAll('[role="dialog"], [aria-modal="true"], div[class*="modal"], div[class*="popup"], div[class*="overlay"]');
    modals.forEach(modal => modal.remove());
  });

  // Use MutationObserver to watch for new modals
  await page.evaluate(() => {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach(node => {
            if (node.matches && (node.matches('[role="dialog"], [aria-modal="true"], div[class*="modal"], div[class*="popup"], div[class*="overlay"]'))) {
              node.remove();
            }
          });
        }
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  });

  // Fallback method: Pressing the Escape key
  await page.keyboard.press('Escape').catch(e => console.log('Error pressing Escape:', e.message));

  // Fallback method: Clicking outside the modal
  await page.mouse.click(0, 0).catch(e => console.log('Error clicking outside modal:', e.message));
}

async function yotpoScraper(url) {
  let browser;
  try {
    const selectors = {
      yotpo: 'div.yotpo.yotpo-main-widget',
      reviews: 'div.yotpo-reviews',
      review: 'div.yotpo-review',
      name: 'span.yotpo-user-name',
      rating: 'div.yotpo-review-stars span.sr-only',
      title: 'div.yotpo-main div.content-title',
      desc: 'div.content-review',
      date: 'span.yotpo-review-date',
      pager: 'div.yotpo-pager[data-total]',
      next: 'div.yotpo-pager a[rel^=next]',
    };

    browser = await puppeteer.launch({
      // headless: 'new',
      headless: false,
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: 1280,
      height: 1024,
    });

    await page.goto(url, { waitUntil: 'networkidle0' });

    await page.waitForSelector(selectors.reviews);

    await handleModalsDynamically(page);

    // const html = await page.evaluate(selector => document.querySelector(selector.reviews).innerHTML, selectors);

    const reviewsTotal = await page.evaluate(selector => document.querySelector(selector.pager).getAttribute('data-total'), selectors);
    const reviewsPerPage = await page.evaluate(selector => document.querySelector(selector.pager).getAttribute('data-per-page'), selectors);
    const reviewsPages = Math.ceil(reviewsTotal / reviewsPerPage);
    console.log('Total reviews:', reviewsTotal);
    console.log('Reviews per page:', reviewsPerPage);
    console.log('Pages:', reviewsPages);

    let reviewsArr = [];
    // while() { 'div.yotpo-pager a:not[.yotpo-disabled]'  }
    for (let p = 1; p < reviewsPages + 1; p += 1) {
      console.log('Getting page:', p);
      const d = await page.evaluate((selector) => {
        const reviews = document.querySelectorAll(selector.review);
        const data = [];
        for (let r = 0; r < reviews.length; r += 1) {
          // const reviewNumber = data.length + 1;
          data.push({
            name: document.querySelectorAll(selector.name)[r].textContent.trim(),
            rating: document.querySelectorAll(selector.rating)[r].textContent.trim(),
            title: document.querySelectorAll(selector.title)[r].textContent.trim(),
            desc: document.querySelectorAll(selector.desc)[r].textContent.trim(),
            date: document.querySelectorAll(selector.date)[r].textContent.trim(),
          });
        }
        return data;
      }, selectors);

      console.log('Got', d.length, 'reviews from page', p);

      // add reviews to array
      reviewsArr = [...reviewsArr, ...d];

      // if not last page in pagination, click to next page
      if (reviewsPages !== p) {
        await page.click(selectors.next);

        await page.waitForSelector(selectors.name);

        // TO DO: Update the wait for selector
        // The script isn't waiting for the page to load, so we'll wait a second
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    return reviewsArr;
  } catch (error) {
    console.log(`Error: ${error}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

exports.yotpoScraper = yotpoScraper;