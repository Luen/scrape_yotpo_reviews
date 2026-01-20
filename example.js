const {yotpoScraper} = require('./index');

(async () => {
    const url = 'https://sherrilltree.com/reecoil-full-reach-chainsaw-lanyard/';

    // Enable dev mode for detailed logging and HTML snapshots
    const reviewsArr = await yotpoScraper(url, {dev: true});

    // console.log(reviewsArr);
    console.log('Got', reviewsArr.length, 'reviews');
})();
