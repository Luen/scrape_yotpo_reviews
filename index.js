const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const url = 'https://sherrilltree.com/reecoil-full-reach-chainsaw-lanyard/';
//https://www.treestuff.com/reecoil-big-boss-lanyard/
//https://www.treestuff.com/reecoil-full-reach-chainsaw-lanyard/
//https://www.treestuff.com/reecoil-se-full-reach-chainsaw-lanyard-pink/
//https://sherrilltree.com/reecoil-full-reach-chainsaw-lanyard/
const selectors = {
  reviews:"div.yotpo-reviews",
  name:"span.yotpo-user-name",
  rating:"div.yotpo-review-stars span.sr-only",
  title:"div.yotpo-main div.content-title",
  desc:"div.content-review",
  date:"span.yotpo-review-date"
}

(async () => {
  const browser = await puppeteer.launch({headless:true,args: ["--no-sandbox"]});
  const page = await browser.newPage();
  await page.setViewport({
    width: 1280,
    height: 1024
  })
  await page.goto(url, {
    waitUntil: 'networkidle2'
  });

  await page.waitForSelector(selectors.reviews)

  //await page.waitFor(10000)

  const html = await page.evaluate(() => {
     return document.querySelector(selectors.reviews).innerHTML
  });

  var $ = cheerio.load(html);

  let reviewsObj = {}

  //console.log(reviews)
  $("div.yotpo-pager a.goTo").each(async (index, elem) => {
    console.log($(this).text().trim());
    var $ = cheerio.load(html);
    $('div.yotpo-review').each(function(i, el) {
      //span.yotpo-user-name
      reviewNumber = i*index;
      reviewsObj[reviewNumber] = {
        name : $(this).find(selectors.name).text().trim(),
        rating : $(this).find(selectors.rating).text().trim(),
        title : $(this).find(selectors.title).text().trim(),
        desc : $(this).find(selectors.desc).text().trim(),
        date : $(this).find(selectors.date).text().trim()
      }
    });
    console.log(reviewsObj);
    //$("div.yotpo-pager").find("a.yotpo-active").attr("data-page")
    //$("div.yotpo-pager").find("a.yotpo-active").href()
    $("div.yotpo-pager a[rel='next']").click();
    await page.waitForSelector(selectors.name);
  });


  /*const reviews = await page.evaluate(() => {
     return document.querySelector('div.yotpo-review').innerHTML;
  });*/

  //for each yotpo-review
  //for (let i = 0; i < reviews.length; i++) {
  //  const review = await (await reviews[i]);
  //  console.log(review);
  //}


  //console.log(textContent);


  await browser.close();

})();
