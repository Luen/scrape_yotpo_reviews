# Yotpo Reviews Scraper
This project contains a Node.js script using Puppeteer to scrape reviews from websites using Yotpo for customer reviews.

Note that this is a learning project for myself and I'm a hobbyist programmer.

# Description
The script navigates through the reviews section of a specified URL, dynamically handling modals and popups, and iterates through paginated review data. It extracts key information such as the reviewer's name, rating, review title, review description, and date of the review.

# Features
- Dynamic Modal Handling: Utilizes MutationObserver to detect and remove modals and popups that may interfere with scraping.
- Custom Wait Function: A custom wait function to handle dynamic content loading.
- Request Interception: Blocks unnecessary Yotpo analytics requests for efficient scraping.
- Pagination Support: Navigates through paginated review sections and aggregates data.
- Robust Error Handling: Implements error handling to ensure stability during the scraping process.

# Installation
Ensure you have Node.js installed. Then clone this repository and run:

```
npm install
```

This will install Puppeteer and any other dependencies.

# Usage
The main function yotpoScraper takes a URL as an argument and returns an array of review data. Example usage:

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

# Contributing
Contributions to improve this script are welcome. Please fork the repository and submit a pull request with your changes.

# License
This project is licensed under the MIT License - see the LICENSE file for details.