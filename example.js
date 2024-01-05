const { yotpoScraper } = require('./index');

(async () => {
    const url = 'https://sherrilltree.com/reecoil-full-reach-chainsaw-lanyard/';
    const reviewsArr = await yotpoScraper(url);

    //console.log(reviewsArr);
    console.log('Got', reviewsArr.length, 'reviews');
})();
