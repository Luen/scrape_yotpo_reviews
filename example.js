const {yotpoScraper} = require('./index');

(async () => {
    const url = 'https://sherrilltree.com/reecoil-full-reach-chainsaw-lanyard/';

    // Dev mode automatically enabled when headless: false
    const reviewsArr = await yotpoScraper(url, {headless: false});

    // console.log(reviewsArr);
    console.log('Got', reviewsArr.length, 'reviews');
})();
