const Crawler = require("simplecrawler");
const cheerio = require("cheerio");

module.exports = {
    crawler : (req, res) => {
        const { url } = req.body
        let crawler = new Crawler(url)
        crawler.interval = 5000; // Ten seconds
        crawler.maxConcurrency = 3;
        crawler.maxDepth = 1;
        // crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {
        //     console.log("I just received %s (%d bytes)", queueItem.url, responseBuffer.length);
        //     console.log("Response \n", response);
        //     console.log("QueueItem", queueItem);
        // });
        crawler.on("fetchcomplete",function(queueItem, responseBuffer){
            let html = responseBuffer.toString()
            //console.log(html)

            // console.log($(this).getAttribute('span').toString())
            // let elements = $(this).getElementsByClassName('div');
            // for (let i = 0; i < elements.length; i++) {
            //     console.log(elements[i].innerHTML);
            // }
            // $('div.price').each(function (i, element) {
            // $('div.price').each(function (i, element) {
            //     console.log('2')
            //     console.log($(this).attrs('price').text)
            // })
        });

        crawler.downloadUnsupported = false;
        crawler.decodeResponses = true;

        crawler.addFetchCondition(function(queueItem) {
            return !queueItem.path.match(/\.(zip|jpe?g|png|mp4|gif)$/i);
        });

        crawler.on("crawlstart", function() {
            console.log("crawlstart");
        });

        crawler.on("fetch404", function(queueItem, response) {
            console.log("fetch404", queueItem.url, response.statusCode);
        });

        crawler.on("fetcherror", function(queueItem, response) {
            console.log("fetcherror", queueItem.url, response.statusCode);
        });

        crawler.on("complete", function() {
            console.log("complete");
        });
        crawler.start();


        return  res.status(200).json({ msg: url })
    }
}