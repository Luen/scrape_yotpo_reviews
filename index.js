const puppeteer = require('puppeteer');

(async () => {
  const url = 'https://sherrilltree.com/samson-stable-braid-rigging-rope-1-2in/';

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

  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1280,
    height: 1024,
  });
  await page.goto(url, { waitUntil: 'networkidle0' });

  await page.waitForSelector(selectors.reviews);

  // const html = await page.evaluate(selector => document.querySelector(selector.reviews).innerHTML, selectors);

  const reviewsTotal = await page.evaluate(selector => document.querySelector(selector.pager).getAttribute('data-total'), selectors);
  const reviewsPerPage = await page.evaluate(selector => document.querySelector(selector.pager).getAttribute('data-per-page'), selectors);
  const reviewsPages = Math.ceil(reviewsTotal / reviewsPerPage);
  console.log('Total reviews:', reviewsTotal);
  console.log('Reviews per page:', reviewsPerPage);
  console.log('Pages:', reviewsPages);

  var reviewsArr = [];
  // while() { 'div.yotpo-pager a:not[.yotpo-disabled]'  }
  for (let p = 1; p < reviewsPages + 1; p += 1) {
    console.log('Getting page:', p);
    const d = await page.evaluate((selector, p) => {
      const reviews = document.querySelectorAll(selector.review);
      let data = [];
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
    }, selectors, p);

    reviewsArr = [...reviewsArr, ...d];

    // if not last page in pagination
    if (!reviewsPages.length + 1 === p) {
      // await page.waitFor(2000);

      await page.click(selectors.next);
      await page.waitForSelector(selectors.name);
    }
  }

  console.log('Got', reviewsArr.length, 'reviews');

  await browser.close();
})();
