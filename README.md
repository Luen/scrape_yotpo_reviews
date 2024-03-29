# Yotpo Reviews Scraper
This project contains a Node.js script using Puppeteer to scrape reviews from websites using Yotpo for customer reviews.

The script navigates through the reviews section of a specified URL, dynamically handling modals and popups, and iterates through paginated review data. It extracts key information such as the reviewer's name, rating, review title, review description, and date of the review. Then, it returns that data as an array.

Note that this is a learning project for myself, and I'm a hobbyist programmer.

# Features
- Dynamic Modal Handling: Utilizes MutationObserver to detect and remove modals and popups that may interfere with scraping.
- Custom Wait Function: A custom wait function handles dynamic content loading.
- Request Interception: Blocks unnecessary Yotpo analytics requests for efficient scraping.
- Pagination Support: Navigates through paginated review sections and aggregates data.
- Robust Error Handling: Implements error handling to ensure stability during scraping.

# Installation
Ensure you have Node.js installed. Then clone this repository and run:

```
npm install
```

This will install Puppeteer and any other dependencies.

# Usage
The primary function, yotpoScraper, takes a URL as an argument and returns an array of review data. Example usage:

```
const { yotpoScraper } = require('./path_to_script');

yotpoScraper('https://example.com/product-reviews').then(reviews => {
  console.log(reviews);
}).catch(error => {
  console.error('Scraping failed:', error);
});
```

# Important Notes
The script runs in non-headless mode for debugging. This can be changed in the Puppeteer launch options.
Due to the dynamic nature of web pages, the script may need adjustments for different websites using Yotpo.

This script is primarily for educational and experimental purposes. Please keep in mind the ethical implications and the terms of service of Yotpo and the website(s) when using this script for paraphrasing content.

# Contributing
You should know that contributions to improve this script are welcome. Please fork the repository and submit a pull request with your changes.

# License
This project is licensed under the GNU License - please take a look at the LICENSE file for details.
