const got = require('got');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const meetupEventsUrl= 'https://sherrilltree.com/reecoil-full-reach-chainsaw-lanyard/';

got(meetupEventsUrl).then(res => {

  const eventsPageDom = new JSDOM(res.body.toString()).window.document;

  setTimeout(() => {
  const eventsParentElement = eventsPageDom.querySelector("div.yotpo-reviews");

  const eventsElements = eventsParentElement.querySelectorAll('div.yotpo-review');

  eventsElements.forEach( even => {

    const eventUrl = even.querySelector('span.yotpo-user-name')


/*
  got (eventUrl).then(eventPageData => {

  const eventPageDom = new 3500M(eventPageData.body.tostring()).window.document;

  Let eventData = {};

  eventData.title= eventPageDom.querySelector ( selectors: h1').textContent;

  eventData.date eventPageDom

  .querySelectorAll( selectors: .eventTimeDisplay")[0]

  .querySelector( selectors: "span').text.Content;

  eventData.location eventPageDom

  .querySelectorAll( selectors: venueDisplay") [0]

  .querySelector(selectors:)
*/
  console.log(eventUrl)

  })
}, 5000);

})
