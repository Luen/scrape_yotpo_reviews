const { JSDOM } = require("jsdom")
const axios = require('axios')

const upvoteFirstPost = async () => {
  try {
    const { data } = await axios.get("https://www.treestuff.com/reecoil-big-boss-lanyard/");
    const dom = new JSDOM(data, {
      runScripts: "dangerously",
      resources: "usable"
    });
    const { document } = dom.window;

    const msg = document.querySelector("div.yotpo-reviews span.yotpo-user-name").textContent;
    /*
    firstPost.click();
    const isUpvoted = firstPost.classList.contains("upmod");
    const msg = isUpvoted
      ? "Post has been upvoted successfully!"
      : "The post has not been upvoted!";
    */
    return msg;
  } catch (error) {
    throw error;
  }
};

upvoteFirstPost().then(msg => console.log(msg));
