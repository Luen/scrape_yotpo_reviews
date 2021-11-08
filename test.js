const got = require('got');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const meetupEventsUrl= 'https://www.meetup.com/find/events/?allMeetups=true&radius=Infinity';

got (meetupEventsUrl). then (res => {

  const eventsPageDom = new JSDOM(res.body.toString()).window.document;

  const eventsParentElement = eventsPageDom.querySelector("div.max-w-narrow");

  const eventsElements = eventsParentElement.querySelectorAll('div.bg-cover');

  eventsElements.forEach( even => {

    const eventUrl = even.querySelector('a').getAttribute('href')


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

})
