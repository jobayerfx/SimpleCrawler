const Crawler = require("simplecrawler");
const cheerio = require("cheerio");
const axios = require("axios");
const {validationResult} = require('express-validator');

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

            const $ = cheerio.load(html)
            console.log($.body)

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
    },
    crawlerWithCheerio : async (req, res) => {

        const {url} = req.body
        const pageHTML = await axios.get(url, {
            headers: {
                'Accept-Encoding': 'gzip, deflate, br',
            },
            //is the same as set the entire url
        })
        const htmlData = cheerio.load(pageHTML.data)

        const link = new URL(url).host
        console.log('Host: ', link)

        let image = null
        let name = null
        let price = null

        // console.log(htmlData('[data-testid="ProductDetailsBlockTestIds_name"]').text())
        // console.log("----------------PRICE-------------------")
        // console.log(htmlData('.css-1ycxqyf > div ').text())
        // console.log("----------------Name-------------------")
        // console.log(htmlData('.Layout_image__1LfSG > div > div > div > div > img').attr('src'))

        // //
        // console.log("----------------IMAGE-------------------")
        // image = htmlData('[data-testid="grid:gallery:image:wrapper:0"]').find('img').attr('src')
        // console.log(image)
        // return res.status(200).json({name: name, price : price, images : image})
        switch (link){
            case 'www.ahlens.se':
                name = htmlData('[data-testid="ProductDetailsBlockTestIds_name"]').text()
                image = htmlData('.jss167 span > img').attr('src')
                price = htmlData('[data-testid="ProductDetailsBlockTestIds_price"]').text()
                break
            case 'www.magasin.dk':
                name = htmlData('.js-productName').text()
                price = htmlData('.js-productPrice > .price > span > span > span ').text()
                image = htmlData('.productDetailsImage__image').attr('src')
                price = price.replace(/^\n|\n$/g, '')
                break
            case 'www.imerco.dk':
                name = null
                price = null
                image = htmlData('.css-bjn8wh > div > div > img').attr('src')
                break
            case 'www.johnlewis.com':
                name = htmlData('[data-testid="product:title"]').text()
                price = htmlData('[data-testid="product:price"]').text()
                image = htmlData('.Layout_image__1LfSG > div > div > div > div > img').attr('src') ?? null
                break
            case 'www.amazon.com':
                name = htmlData('#productTitle').text()
                const price_one = htmlData('.apexPriceToPay > span').first().text()
                const price_two = htmlData('.priceToPay > span').first().text()
                price = price_one ? price_one : price_two
                image = htmlData('.imgTagWrapper > img').attr('src')
                break
            case 'www.elgiganten.dk':
                name = htmlData('.product-title').text()
                price = htmlData('.price__value > span').first().text().replace('.-','')
                let pd_image = htmlData('.swiper-slide > img').attr('src')
                image = pd_image ? pd_image : null
                break
            case 'www.georgjensen.com':
                name = htmlData('.product-detail > div > h1').text().replace(/^\n|\n$/g, '')
                price = htmlData('.product-price > span').first().text().replace('DKK','').replace(/^\n|\n$/g, '')
                let p_image = htmlData('.product-image-carousel > a > picture > img').attr('src')
                image = p_image ? "https://www.georgjensen.com" + p_image : null
                break
            case 'www.sinnerup.dk':
                name = htmlData('.item-name  > h1').text().replace(/^\n|\n$/g, '')
                price = htmlData('.item-prices__value').text()
                let ps_image = htmlData('.item-prices__value > a').html()
                image = ps_image ? ps_image : null
                console.log(image)
                break
            default:
                return res.status(200).json({name: null, price : null, images : null, link: link})
        }
        // console.log(htmlData('div[class="jss319"]').text())
        // console.log("-----------------------------------")
        // console.log(htmlData('[data-testid="ProductDetailsBlockTestIds_price"]').html())
        // console.log(htmlData('.jss155 > .jss152 > .jss229 > div:nth-child(4) > span').html())
        // console.log(htmlData('div[class="jss167"]').find('span > img').attr('srcset'))
        //............................
        // console.log(htmlData('[data-testid="ProductDetailsBlockTestIds_name"]').text())
        // console.log("----------------PRICE-------------------")
        // console.log(htmlData('.css-1ycxqyf > div ').text())
        // console.log("----------------Name-------------------")
        // console.log(htmlData('.efs80uw3 > ul').html())
        // //
        // console.log("----------------IMAGE-------------------")
        // image = htmlData('[data-testid="grid:gallery:image:wrapper:0"]').find('img').attr('src')
        // console.log(image)
        return res.status(200).json({name: name, price : price, images : image, link: link})
    }
}