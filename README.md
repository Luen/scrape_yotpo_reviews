# Yotpo Reviews Scraper

A Node.js package for scraping reviews from websites using Yotpo for customer reviews. Built with Puppeteer, this package navigates through the reviews section of a specified URL, dynamically handling modals and popups, and iterates through paginated review data. It extracts key information such as the reviewer's name, rating, review title, review description, and date of the review.

## Features
- **Dynamic Modal Handling**: Utilizes MutationObserver to detect and remove modals and popups that may interfere with scraping.
- **Custom Wait Function**: A custom wait function handles dynamic content loading.
- **Request Interception**: Blocks unnecessary Yotpo analytics requests for efficient scraping.
- **Pagination Support**: Navigates through paginated review sections and aggregates data.
- **Robust Error Handling**: Implements error handling to ensure stability during scraping.

## Installation

Install via npm:

```bash
npm install yotpo-reviews-scraper
```

Or via yarn:

```bash
yarn add yotpo-reviews-scraper
```

This will install Puppeteer and any other dependencies.

## Usage

The primary function, `yotpoScraper`, takes a URL as an argument and returns an array of review data. Example usage:

```javascript
const { yotpoScraper } = require('yotpo-reviews-scraper');

// Using async/await
(async () => {
  const reviews = await yotpoScraper('https://example.com/product-reviews');
  console.log(reviews);
})();

// Using promises
yotpoScraper('https://example.com/product-reviews')
  .then(reviews => {
    console.log(reviews);
  })
  .catch(error => {
    console.error('Scraping failed:', error);
  });
```

## Example Output

```javascript
[
  {
    name: "John Doe",
    rating: "5 out of 5 stars",
    title: "Great product!",
    desc: "This product exceeded my expectations...",
    date: "January 15, 2024"
  },
  // ... more reviews
]
```

## Important Notes

- The script runs in non-headless mode for debugging. This can be changed in the Puppeteer launch options in `index.js`.
- Due to the dynamic nature of web pages, the script may need adjustments for different websites using Yotpo.
- This script is primarily for educational and experimental purposes. Please keep in mind the ethical implications and the terms of service of Yotpo and the website(s) when using this script.

## Contributing

Contributions to improve this script are welcome! Please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0) - see the LICENSE file for details.
