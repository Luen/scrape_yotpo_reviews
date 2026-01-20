const fs = require('fs');
const path = require('path');

const puppeteer = require('puppeteer');

async function handleModalsDynamically(page) {
    // Remove existing modals based on common patterns
    await page.evaluate(() => {
        const modals = document.querySelectorAll('[role="dialog"], [aria-modal="true"], div[class*="modal"], div[class*="popup"], div[class*="overlay"]');
        modals.forEach((modal) => modal.remove());
    });

    // Use MutationObserver to watch for new modals
    await page.evaluate(() => {
        // eslint-disable-next-line no-undef
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.matches && (node.matches('[role="dialog"], [aria-modal="true"], div[class*="modal"], div[class*="popup"], div[class*="overlay"]'))) {
                            node.remove();
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {childList: true, subtree: true});
    });

    // Fallback method: Pressing the Escape key
    await page.keyboard.press('Escape').catch((e) => console.log('Error pressing Escape:', e.message));

    // Fallback method: Clicking outside the modal
    await page.mouse.click(0, 0).catch((e) => console.log('Error clicking outside modal:', e.message));
}

async function waitForContentChange(page, selector, previousContent) {
    await page.waitForFunction(
        (sel, prevContent) => {
            const currentContent = document.querySelector(sel).textContent.trim();
            return currentContent !== prevContent;
        },
        {},
        selector,
        previousContent
    );
}

// Helper function for delays (since page.waitForTimeout is deprecated)
function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function yotpoScraper(url, options = {}) {
    let browser;
    // Automatically enable dev mode if headless is false
    // Default to headless: true (production mode) if not specified
    const isHeadless = options.headless !== false;
    // Dev mode is enabled if: explicitly set, OR headless is false, OR NODE_ENV is development
    const devMode = options.dev !== undefined ? options.dev : (!isHeadless || process.env.NODE_ENV === 'development');
    const devOutputDir = path.join(process.cwd(), 'dev-output');

    // Helper function for dev logging
    const devLog = (...args) => {
        if (devMode) {
            console.log('[DEV]', ...args);
        }
    };

    // Helper function to save HTML
    const saveHTML = async (page, filename, description) => {
        if (!devMode) return;

        try {
            if (!fs.existsSync(devOutputDir)) {
                fs.mkdirSync(devOutputDir, {recursive: true});
            }

            const html = await page.content();
            const filePath = path.join(devOutputDir, filename);
            fs.writeFileSync(filePath, html, 'utf8');
            devLog(`Saved HTML: ${filename} - ${description}`);
        } catch (error) {
            devLog(`Failed to save HTML ${filename}:`, error.message);
        }
    };

    try {
        // Base selectors - will be updated dynamically based on what's found
        const selectors = {
            yotpo: 'div.yotpo.yotpo-main-widget',
            reviews: 'div.yotpo-reviews',
            review: 'div.yotpo-review',
            name: 'span.yotpo-reviewer-name, span.yotpo-user-name',
            rating: 'div.yotpo-review-rating-title span.sr-only, div.yotpo-review-stars span.sr-only, [aria-label*="star"]',
            title: 'p.yotpo-review-title, div.yotpo-review-rating-title',
            desc: 'div.yotpo-review-content, div.content-review',
            date: 'div.yotpo-date-format, span.yotpo-review-date, div.yotpo-review-date',
            pager: 'div.yotpo-pager[data-total]',
            next: 'nav.yotpo-reviews-pagination-container a[aria-label*="next" i], nav.yotpo-reviews-pagination-container a[aria-label="Navigate to next page"], div.yotpo-pager a[rel^=next]',
            previous: 'nav.yotpo-reviews-pagination-container a[aria-label*="previous" i], nav.yotpo-reviews-pagination-container a[aria-label="Navigate to previous page"]',
            expandButton: 'button.yotpo-sr-bottom-line-summary',
        };

        // Alternative selector patterns to try
        const selectorVariants = {
            yotpo: [
                'div.yotpo.yotpo-main-widget',
                'div#yotpo-reviews-main-widget',
                'div.yotpo-reviews-main-widget',
            ],
            reviews: [
                'div.yotpo-reviews',
                'div#yotpo-reviews-main-widget',
                'div.yotpo-reviews-main-widget',
                'div.yotpo-main-layout',
            ],
            review: [
                'div.yotpo-review',
                '[class*="yotpo-review"]',
            ],
        };

        devLog('=== Starting Yotpo Scraper ===');
        devLog('URL:', url);
        devLog('Dev mode:', devMode);
        devLog('Selectors:', JSON.stringify(selectors, null, 2));

        browser = await puppeteer.launch({
            headless: isHeadless,
        });

        devLog('Browser launched');

        const page = await browser.newPage();

        await page.setViewport({
            width: 1280,
            height: 1024,
        });

        devLog('Viewport set to 1280x1024');

        // Block Yotpo analytics requests
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (request.url().includes('https://p.yotpo.com/i?e=se&se_ca=reviews&se_ac=shown&se_psk')) {
                request.abort();
                devLog(`Blocked analytics request: ${request.url()}`);
            } else {
                request.continue();
            }
        });

        // Log messages from the browser's console in dev mode
        if (devMode) {
            page.on('console', (message) => {
                const text = message.text();
                // Filter out common noise messages that don't affect functionality
                const noisePatterns = [
                    /Content Security Policy/i,
                    /Refused to evaluate.*unsafe-eval/i,
                    /script-src 'none'/i,
                    /net::ERR_FAILED/i,
                    /CORS policy/i,
                    /Access to XMLHttpRequest/i,
                ];

                const isNoise = noisePatterns.some((pattern) => pattern.test(text));

                if (!isNoise) {
                    devLog(`[Browser Console ${message.type()}]:`, text);
                }
            });

            page.on('pageerror', (error) => {
                devLog(`[Page Error]:`, error.message);
            });
        }

        devLog('Navigating to:', url);
        await page.goto(url, {waitUntil: 'networkidle2', timeout: 30000});
        devLog('Page loaded');

        const pageTitle = await page.title();
        const pageURL = page.url();
        devLog('Page title:', pageTitle);
        devLog('Final URL:', pageURL);

        await saveHTML(page, '01-initial-load.html', 'After initial page load');

        // Check if selectors exist before waiting
        devLog('Checking for selectors...');
        const yotpoExists = await page.$(selectors.yotpo);
        const reviewsExists = await page.$(selectors.reviews);

        devLog(`Selector '${selectors.yotpo}' exists:`, !!yotpoExists);
        devLog(`Selector '${selectors.reviews}' exists:`, !!reviewsExists);

        if (!yotpoExists) {
            devLog(`WARNING: Main Yotpo widget not found with selector: ${selectors.yotpo}`);
            // Try to find any Yotpo-related elements
            const yotpoElements = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('[class*="yotpo"], [id*="yotpo"]'));
                return elements.slice(0, 10).map((el) => ({
                    tag: el.tagName,
                    id: el.id,
                    classes: el.className,
                    text: el.textContent.substring(0, 100),
                }));
            });
            devLog('Found Yotpo-related elements:', JSON.stringify(yotpoElements, null, 2));
        }

        // Try to find the reviews widget using multiple strategies
        let reviewsWidget = null;
        const reviewsVariants = selectorVariants.reviews;

        for (const variant of reviewsVariants) {
            const element = await page.$(variant);
            if (element) {
                devLog(`Found reviews widget with selector: ${variant}`);
                reviewsWidget = variant;
                selectors.reviews = variant;
                if (variant.includes('yotpo-reviews-main-widget')) {
                    selectors.yotpo = variant;
                }
                break;
            }
        }

        if (!reviewsWidget) {
            devLog(`WARNING: Reviews container not found with any selector variant`);
            devLog('Waiting 3 seconds for dynamic content to load...');
            await delay(3000);

            await saveHTML(page, '02-after-wait.html', 'After waiting 3 seconds for dynamic content');

            // Check again after wait
            for (const variant of reviewsVariants) {
                const element = await page.$(variant);
                if (element) {
                    devLog(`Found reviews widget after wait with selector: ${variant}`);
                    reviewsWidget = variant;
                    selectors.reviews = variant;
                    if (variant.includes('yotpo-reviews-main-widget')) {
                        selectors.yotpo = variant;
                    }
                    break;
                }
            }

            if (!reviewsWidget) {
                // Check if there's an expand button that needs to be clicked
                const expandButton = await page.$(selectors.expandButton);
                if (expandButton) {
                    devLog('Found expand button, clicking to load reviews...');
                    try {
                        await expandButton.click();
                        await delay(2000);
                        await saveHTML(page, '02b-after-expand-click.html', 'After clicking expand button');

                        // Check again after clicking
                        for (const variant of reviewsVariants) {
                            const element = await page.$(variant);
                            if (element) {
                                devLog(`Found reviews widget after expand with selector: ${variant}`);
                                reviewsWidget = variant;
                                selectors.reviews = variant;
                                if (variant.includes('yotpo-reviews-main-widget')) {
                                    selectors.yotpo = variant;
                                }
                                break;
                            }
                        }
                    } catch (error) {
                        devLog('Error clicking expand button:', error.message);
                    }
                }

                if (!reviewsWidget) {
                    // Get all divs with classes containing 'review' or 'yotpo'
                    const reviewLikeElements = await page.evaluate(() => {
                        const elements = Array.from(document.querySelectorAll('div[class*="review"], div[class*="yotpo"]'));
                        return elements.slice(0, 20).map((el) => ({
                            tag: el.tagName,
                            id: el.id,
                            classes: el.className,
                            visible: el.offsetParent !== null,
                        }));
                    });
                    devLog('Found review-like elements:', JSON.stringify(reviewLikeElements, null, 2));
                }
            }
        }

        devLog(`Waiting for selector: ${selectors.reviews}`);
        try {
            await page.waitForSelector(selectors.reviews, {timeout: 15000});
            devLog('Reviews selector found!');

            // Wait a bit more for reviews to actually render inside the widget
            devLog('Waiting for reviews to render...');
            await delay(2000);

            // Check if there are actual review elements
            const reviewCount = await page.evaluate((selector) => {
                const reviews = document.querySelectorAll(selector);
                return reviews.length;
            }, selectors.review);
            devLog(`Found ${reviewCount} review elements in the widget`);
        } catch (error) {
            devLog('ERROR: Failed to find reviews selector:', error.message);
            await saveHTML(page, '03-selector-not-found.html', 'Full page HTML when selector not found');

            // Try to get page content analysis
            const pageAnalysis = await page.evaluate(() => ({
                bodyHTML: document.body.innerHTML.substring(0, 5000),
                scripts: Array.from(document.querySelectorAll('script[src*="yotpo"]')).map((s) => s.src),
                divsWithYotpo: Array.from(document.querySelectorAll('div[class*="yotpo"]')).map((d) => d.className).slice(0, 10),
            }));
            devLog('Page analysis:', JSON.stringify(pageAnalysis, null, 2));

            throw error;
        }

        await saveHTML(page, '04-reviews-found.html', 'After reviews selector found');

        devLog('Handling modals...');
        await handleModalsDynamically(page);
        devLog('Modals handled');

        // Check for pager element
        const pagerExists = await page.$(selectors.pager);
        devLog(`Pager selector '${selectors.pager}' exists:`, !!pagerExists);

        if (!pagerExists) {
            devLog('WARNING: Pager element not found, trying to find alternative...');
            const pagerAlternatives = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('[class*="pager"], [class*="pagination"], [data-total]'));
                return elements.slice(0, 5).map((el) => ({
                    tag: el.tagName,
                    classes: el.className,
                    dataAttributes: Array.from(el.attributes).filter((attr) => attr.name.startsWith('data-')).map((attr) => `${attr.name}="${attr.value}"`),
                    text: el.textContent.substring(0, 100),
                }));
            });
            devLog('Found pager-like elements:', JSON.stringify(pagerAlternatives, null, 2));
        }

        devLog('Extracting pagination info...');
        let reviewsTotal = await page.evaluate((selector) => {
            const pager = document.querySelector(selector.pager);
            return pager ? pager.getAttribute('data-total') : null;
        }, selectors);

        let reviewsPerPage = await page.evaluate((selector) => {
            const pager = document.querySelector(selector.pager);
            return pager ? pager.getAttribute('data-per-page') : null;
        }, selectors);

        // Try alternative methods to get pagination info
        if (!reviewsTotal || !reviewsPerPage) {
            devLog('Trying alternative methods to detect pagination...');
            const paginationInfo = await page.evaluate((selector) => {
                // Try to find pagination container
                const paginationContainer = document.querySelector('nav.yotpo-reviews-pagination-container, nav[class*="pagination"]');
                if (paginationContainer) {
                    // Try to extract page numbers from pagination
                    const pageLinks = Array.from(paginationContainer.querySelectorAll('a, button'));
                    const pageNumbers = pageLinks
                        .map((link) => {
                            const text = link.textContent.trim();
                            const num = parseInt(text, 10);
                            return Number.isNaN(num) ? null : num;
                        })
                        .filter((num) => num !== null);

                    // Try to find total from star ratings widget
                    const starWidget = document.querySelector('#yotpo-reviews-star-ratings-widget');
                    let totalFromWidget = null;
                    if (starWidget) {
                        const widgetText = starWidget.textContent || '';
                        const match = widgetText.match(/(\d+)\s*(?:reviews?|total)/i);
                        if (match) {
                            totalFromWidget = parseInt(match[1], 10);
                        }
                    }

                    // Count visible reviews
                    const visibleReviews = document.querySelectorAll(selector.review).length;

                    // Get max page number from pagination
                    const maxPage = pageNumbers.length > 0 ? Math.max(...pageNumbers) : null;

                    return {
                        pageNumbers,
                        maxPage,
                        totalFromWidget,
                        visibleReviews,
                        paginationExists: !!paginationContainer,
                    };
                }
                return null;
            }, selectors);

            devLog('Alternative pagination info:', JSON.stringify(paginationInfo, null, 2));

            // Use alternative methods if available
            if (paginationInfo) {
                if (!reviewsTotal && paginationInfo.totalFromWidget) {
                    reviewsTotal = paginationInfo.totalFromWidget.toString();
                    devLog('Got total reviews from widget text:', reviewsTotal);
                }
                if (!reviewsPerPage && paginationInfo.visibleReviews) {
                    reviewsPerPage = paginationInfo.visibleReviews.toString();
                    devLog('Got reviews per page from visible count:', reviewsPerPage);
                }
                // If we have max page number, calculate from that
                if (!reviewsTotal && paginationInfo.maxPage && paginationInfo.visibleReviews) {
                    reviewsTotal = (paginationInfo.maxPage * paginationInfo.visibleReviews).toString();
                    devLog('Estimated total reviews from max page:', reviewsTotal);
                }
            }

            if (!reviewsTotal || !reviewsPerPage) {
                devLog('ERROR: Could not get pagination info. Saving HTML for analysis...');
                await saveHTML(page, '05-pagination-error.html', 'Pagination info missing');

                // Try to count reviews directly
                const directReviewCount = await page.evaluate(
                    (selector) => document.querySelectorAll(selector.review).length,
                    selectors
                );
                devLog('Direct review count from DOM:', directReviewCount);
            }
        }

        // Calculate pages - if we don't have total, try to detect from pagination
        let reviewsPages = 1;
        if (reviewsTotal && reviewsPerPage) {
            reviewsPages = Math.ceil(parseInt(reviewsTotal, 10) / parseInt(reviewsPerPage, 10));
        } else {
            // Try to detect number of pages from pagination elements
            const pageCount = await page.evaluate(() => {
                const paginationLinks = Array.from(
                    document.querySelectorAll('nav[class*="pagination"] a, nav[class*="pagination"] button')
                );
                const pageNumbers = paginationLinks
                    .map((link) => {
                        const text = link.textContent.trim();
                        const num = parseInt(text, 10);
                        return Number.isNaN(num) ? null : num;
                    })
                    .filter((num) => num !== null && num > 0);
                return pageNumbers.length > 0 ? Math.max(...pageNumbers) : 1;
            });
            reviewsPages = pageCount || 1;
            devLog('Detected number of pages from pagination:', reviewsPages);
        }

        devLog('Final pagination info:');
        devLog('  - Total reviews:', reviewsTotal || 'unknown');
        devLog('  - Reviews per page:', reviewsPerPage || 'unknown');
        devLog('  - Total pages:', reviewsPages);

        devLog('Final pagination info:');
        devLog('  - Total reviews:', reviewsTotal || 'unknown');
        devLog('  - Reviews per page:', reviewsPerPage || 'unknown');
        devLog('  - Total pages:', reviewsPages);
        console.log('Total reviews:', reviewsTotal || 'unknown');
        console.log('Reviews per page:', reviewsPerPage || 'unknown');
        console.log('Pages:', reviewsPages);

        let reviewsArr = [];
        devLog('Starting to scrape reviews...');

        for (let p = 1; p < reviewsPages + 1; p += 1) {
            devLog(`--- Processing page ${p} of ${reviewsPages} ---`);
            console.log('Getting page:', p);

            // Check how many reviews are visible before scraping
            const visibleReviews = await page.evaluate(
                (selector) => document.querySelectorAll(selector.review).length,
                selectors
            );
            devLog(`Visible reviews on page ${p}:`, visibleReviews);

            // In dev mode, inspect the structure of the first review
            if (devMode && visibleReviews > 0) {
                const firstReviewStructure = await page.evaluate((selector) => {
                    const firstReview = document.querySelector(selector.review);
                    if (!firstReview) return null;

                    return {
                        tag: firstReview.tagName,
                        id: firstReview.id,
                        classes: firstReview.className,
                        html: firstReview.innerHTML.substring(0, 1000),
                        allSelectors: {
                            name: Array.from(firstReview.querySelectorAll('[class*="user"], [class*="name"]')).map((el) => {
                                const className = String(el.className || '');
                                return {
                                    selector: el.tagName + (className ? `.${className.split(' ').join('.')}` : ''),
                                    text: el.textContent.trim().substring(0, 50),
                                };
                            }),
                            rating: Array.from(firstReview.querySelectorAll('[class*="star"], [class*="rating"]')).map((el) => {
                                const className = String(el.className || '');
                                return {
                                    selector: el.tagName + (className ? `.${className.split(' ').join('.')}` : ''),
                                    text: el.textContent.trim().substring(0, 50),
                                    srOnly: Array.from(el.querySelectorAll('[class*="sr-only"], [aria-label]')).map((sr) => sr.textContent || sr.getAttribute('aria-label')),
                                };
                            }),
                            title: Array.from(firstReview.querySelectorAll('[class*="title"], [class*="head"]')).map((el) => {
                                const className = String(el.className || '');
                                return {
                                    selector: el.tagName + (className ? `.${className.split(' ').join('.')}` : ''),
                                    text: el.textContent.trim().substring(0, 50),
                                };
                            }),
                            desc: Array.from(firstReview.querySelectorAll('[class*="content"], [class*="review"], [class*="desc"]')).map((el) => {
                                const className = String(el.className || '');
                                return {
                                    selector: el.tagName + (className ? `.${className.split(' ').join('.')}` : ''),
                                    text: el.textContent.trim().substring(0, 100),
                                };
                            }),
                            date: Array.from(firstReview.querySelectorAll('[class*="date"], [class*="time"]')).map((el) => {
                                const className = String(el.className || '');
                                return {
                                    selector: el.tagName + (className ? `.${className.split(' ').join('.')}` : ''),
                                    text: el.textContent.trim().substring(0, 50),
                                };
                            }),
                        },
                    };
                }, selectors);
                devLog('First review structure:', JSON.stringify(firstReviewStructure, null, 2));
            }

            const d = await page.evaluate((selector) => {
                const reviews = document.querySelectorAll(selector.review);
                const data = [];
                for (let r = 0; r < reviews.length; r += 1) {
                    try {
                        const reviewEl = reviews[r];

                        // Try to find elements within each review element
                        // Try multiple selector patterns for each field
                        const nameEl = reviewEl.querySelector('span.yotpo-reviewer-name')
                          || reviewEl.querySelector('span.yotpo-user-name')
                          || reviewEl.querySelector('[class*="reviewer-name"]')
                          || reviewEl.querySelector('[class*="user-name"]');

                        // For rating, check for sr-only text or aria-label
                        let ratingText = 'N/A';
                        const ratingContainer = reviewEl.querySelector('div.yotpo-review-rating-title');
                        if (ratingContainer) {
                            const srOnly = ratingContainer.querySelector('span.sr-only');
                            if (srOnly) {
                                ratingText = srOnly.textContent.trim();
                            }
                        }
                        if (ratingText === 'N/A') {
                            const ariaRating = reviewEl.querySelector('[aria-label*="star"], [aria-label*="rating"]');
                            if (ariaRating) {
                                ratingText = ariaRating.getAttribute('aria-label');
                            }
                        }

                        // Title - prefer p.yotpo-review-title over div.yotpo-review-rating-title
                        const titleEl = reviewEl.querySelector('p.yotpo-review-title')
                           || reviewEl.querySelector('div.yotpo-review-rating-title')
                           || reviewEl.querySelector('[class*="review-title"]');

                        const descEl = reviewEl.querySelector('div.yotpo-review-content')
                          || reviewEl.querySelector('div.content-review')
                          || reviewEl.querySelector('[class*="review-content"]');

                        // Date - try to get just the date part, not the label
                        const dateFormatEl = reviewEl.querySelector('div.yotpo-date-format');
                        let dateText = 'N/A';
                        if (dateFormatEl) {
                            dateText = dateFormatEl.textContent.trim();
                        } else {
                            const dateEl = reviewEl.querySelector('div.yotpo-review-date')
                            || reviewEl.querySelector('span.yotpo-review-date');
                            if (dateEl) {
                                // Try to extract just the date part (remove "Published date" prefix)
                                const fullText = dateEl.textContent.trim();
                                const dateMatch = fullText.match(/(\d{2}\/\d{2}\/\d{2})/);
                                dateText = dateMatch ? dateMatch[1] : fullText;
                            }
                        }

                        data.push({
                            name: nameEl ? nameEl.textContent.trim() : 'N/A',
                            rating: ratingText,
                            title: titleEl ? titleEl.textContent.trim() : 'N/A',
                            desc: descEl ? descEl.textContent.trim() : 'N/A',
                            date: dateText,
                        });
                    } catch (error) {
                        console.error(`Error extracting review ${r}:`, error);
                    }
                }
                return data;
            }, selectors);

            devLog(`Extracted ${d.length} reviews from page ${p}`);
            if (devMode && d.length > 0) {
                devLog('Sample review:', JSON.stringify(d[0], null, 2));
            }
            console.log('Got', d.length, 'reviews from page', p);

            // add reviews to array
            reviewsArr = [...reviewsArr, ...d];

            // if not last page in pagination, navigate to next page
            if (reviewsPages !== p) {
                devLog(`Navigating to page ${p + 1}...`);
                let navigated = false;

                // Strategy 1: Try next button (check if it's enabled)
                const nextButton = await page.$(selectors.next);
                let isNextButtonEnabled = false;

                if (nextButton) {
                    isNextButtonEnabled = await page.evaluate((sel) => {
                        const btn = document.querySelector(sel);
                        if (!btn) return false;
                        // Check multiple ways button could be disabled
                        const ariaDisabled = btn.getAttribute('aria-disabled');
                        const hasDisabledClass = btn.classList.contains('disabled');
                        const isDisabledAttr = btn.disabled;

                        return ariaDisabled !== 'true' && !hasDisabledClass && !isDisabledAttr;
                    }, selectors.next);
                }

                devLog(`Next button exists:`, !!nextButton);
                devLog(`Next button enabled:`, isNextButtonEnabled);

                if (nextButton && isNextButtonEnabled) {
                    try {
                        const previousContent = await page.$eval(selectors.review, (el) => el.textContent.trim()).catch(() => '');
                        devLog('Clicking next button...');
                        await page.click(selectors.next);

                        devLog('Waiting for response...');
                        try {
                            await page.waitForResponse((response) => {
                                try {
                                    const u = new URL(response.url());
                                    return (
                                        u.protocol === 'https:'
                                        && u.hostname === 'staticw2.yotpo.com'
                                        && u.pathname.startsWith('/batch/app_key')
                                        && response.status() === 200
                                    );
                                } catch (e) {
                                    return false;
                                }
                            }, {timeout: 10000});
                            devLog('Response received');
                        } catch (error) {
                            devLog('WARNING: Did not receive expected response:', error.message);
                        }

                        devLog('Waiting for content change...');
                        await waitForContentChange(page, selectors.review, previousContent);
                        devLog('Content changed, ready for next page');
                        navigated = true;
                    } catch (error) {
                        devLog('Error clicking next button:', error.message);
                    }
                }

                // Strategy 2: Try clicking specific page number
                if (!navigated) {
                    devLog('Trying to click page number directly...');
                    try {
                        const pageClicked = await page.evaluate((targetPage) => {
                            const paginationLinks = Array.from(
                                document.querySelectorAll('nav[class*="pagination"] a, nav[class*="pagination"] button')
                            );
                            for (const link of paginationLinks) {
                                const text = link.textContent.trim();
                                const num = parseInt(text, 10);
                                if (num === targetPage && !link.disabled && !link.classList.contains('disabled')) {
                                    link.click();
                                    return true;
                                }
                            }
                            return false;
                        }, p + 1);

                        if (pageClicked) {
                            devLog(`Clicked page ${p + 1} number`);
                            await delay(2000);
                            const previousContent = await page.$eval(selectors.review, (el) => el.textContent.trim()).catch(() => '');
                            await waitForContentChange(page, selectors.review, previousContent);
                            navigated = true;
                        }
                    } catch (error) {
                        devLog('Error clicking page number:', error.message);
                    }
                }

                // Strategy 3: Try finding and clicking any non-disabled next/arrow button
                if (!navigated) {
                    devLog('Trying to find alternative next/arrow button...');
                    try {
                        const alternativeNext = await page.evaluate(() => {
                            const buttons = Array.from(
                                document.querySelectorAll(
                                    'a[aria-label*="next" i], button[aria-label*="next" i], '
                                        + 'a[class*="next"], button[class*="next"], '
                                        + 'a[rel*="next"], [data-direction="next"]'
                                )
                            );
                            for (const btn of buttons) {
                                if (!btn.disabled && !btn.classList.contains('disabled')) {
                                    btn.click();
                                    return true;
                                }
                            }
                            return false;
                        });

                        if (alternativeNext) {
                            devLog('Clicked alternative next button');
                            await delay(2000);
                            navigated = true;
                        }
                    } catch (error) {
                        devLog('Error with alternative next button:', error.message);
                    }
                }

                if (!navigated) {
                    devLog('ERROR: Could not navigate to next page!');
                    await saveHTML(page, `06-page-${p}-navigation-failed.html`, `Page ${p} - Navigation failed`);
                    // Try to continue anyway - maybe we're already on the last page
                    const currentReviews = await page.evaluate(
                        (selector) => document.querySelectorAll(selector.review).length,
                        selectors
                    );
                    if (currentReviews === 0) {
                        devLog('No reviews found, stopping pagination');
                        break;
                    }
                } else {
                    await saveHTML(page, `07-page-${p + 1}-loaded.html`, `Page ${p + 1} loaded`);
                }
            }
        }

        devLog(`=== Scraping complete: ${reviewsArr.length} total reviews ===`);

        return reviewsArr;
    } catch (error) {
        console.log(`Error: ${error}`);
        devLog('Full error details:', error);
        devLog('Error stack:', error.stack);

        // Save HTML on error if in dev mode
        if (devMode && browser) {
            try {
                const pages = await browser.pages();
                if (pages.length > 0) {
                    await saveHTML(pages[0], 'error-state.html', 'Page state when error occurred');
                }
            } catch (saveError) {
                devLog('Could not save error HTML:', saveError.message);
            }
        }

        return [];
    } finally {
        if (browser) {
            devLog('Closing browser...');
            await browser.close();
            devLog('Browser closed');
        }
    }
}

exports.yotpoScraper = yotpoScraper;
