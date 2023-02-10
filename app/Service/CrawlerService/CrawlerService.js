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
        let data = {name: null,  price : null, image : null, url: url, currency: null}
        switch (link){
            case 'www.ahlens.se':
                data.name = htmlData('[data-testid="ProductDetailsBlockTestIds_name"]').text()
                data.image = htmlData('.jss167 span > img').attr('src')
                data.price = htmlData('[data-testid="ProductDetailsBlockTestIds_price"]').text()
                break
            case 'www.magasin.dk':
                data.name = htmlData('.js-productName').text()
                data.price = htmlData('.js-productPrice > .price > span > span > span ').text().replace(/^\n|\n$/g, '')
                data.image = htmlData('.productDetailsImage__image').attr('src')
                break
            case 'www.johnlewis.com':
                data.name = htmlData('[data-testid="product:title"]').text()
                data.price = htmlData('[data-testid="product:price"]').text().replace('£','')
                data.currency = 'EUR'
                data.image = htmlData('.Layout_image__1LfSG > div > div > div > div > img').attr('src') ?? null
                break
            case 'www.amazon.com':
                data.name = htmlData('#productTitle').text().trim()
                const price_one = htmlData('.apexPriceToPay > span').first().text().toString().trim()
                const price_two = htmlData('.priceToPay > span').first().text().trim()
                data.price = price_one ? price_one : price_two
                data.image = htmlData('.imgTagWrapper > img').attr('src')
                break
            case 'www.elgiganten.dk':
                data.name = htmlData('.product-title').text()
                data.price = htmlData('.price__value > span').first().text().replace('.-','')
                let pd_image = htmlData('.swiper-slide > img').attr('src')
                data.image = pd_image ? pd_image : null
                break
            case 'www.georgjensen.com':
                data.name = htmlData('.product-detail > div > h1').text().toString().trim()
                data.price = htmlData('.product-price > span').first().text().replace('DKK','').replace(/^\n|\n$/g, '')
                let p_image = htmlData('.product-image-carousel > a > picture > img').attr('src')
                data.image = p_image ? "https://www.georgjensen.com" + p_image : null
                break
            case 'www.sinnerup.dk':
                data.name = htmlData('.item-name  > h1').text().toString().trim()
                data.price = htmlData('.item-prices__value').text().replace('kr.','')
                let ps_image = htmlData('.item-image > a').attr('data-srcset').split(',')[2].trim().replace('760w','')
                data.image = ps_image ? ps_image : null
                data.currency = 'Kr'
                break
            case 'www.imerco.dk':
                data.name = htmlData('.ezs9ur40 > span').text().toString().trim()
                let im_prc_1 = htmlData('.css-1hti6gr').text().toString().trim()
                let im_prc_2 = htmlData('.css-mc3fz4').text().toString().trim()
                data.price = im_prc_1 ? im_prc_1 : im_prc_2
                let temp_image = htmlData('.css-bjn8wh > div > div > img').attr('src')
                    .split('https://integration.imerco.dk/api').pop().trim()
                data.image = 'https://integration.imerco.dk/api' + temp_image
                break

            case 'www.ikea.com':
                data.name = htmlData('span.pip-header-section__title--big.notranslate').text().toString().trim()
                data.price = htmlData('span.pip-temp-price__integer').text().toString().trim().replace(':-', "")
                data.image = htmlData('span.pip-media-grid__media-image > img').attr('src').trim()
                data.currency = null
                break
            case 'www2.hm.com':
                data.name = htmlData('#js-product-name div h1').text().toString().trim()
                data.price = htmlData('span.price-value').text().toString().trim().match(/\d/g, '').join('')
                data.image = 'https:'  + htmlData('.product-detail-main-image-container > img').attr('src').trim()
                data.currency = htmlData('span.price-value').text().toString().trim().match(/[A-Za-z]/g).join("")
            case 'salling.dk':
                data.name = htmlData('.product-page__title').text().toString().trim()
                data.price = htmlData('.price__current-price').text().toString().trim()
                let img_sal = htmlData('.product-page__slider > div > img').attr('src')
                data.image = img_sal ? img_sal : null
                data.currency = 'kr'
                break
            case 'www.kitchenone.dk':
                data.name = htmlData("*[itemprop = 'name']").text().toString().trim()
                data.price = htmlData("*[itemprop = 'price']").text().toString().trim()
                let img_kit = htmlData('.basicData > div > div > div > img').attr('data-src')
                data.image = img_kit ? img_kit : null
                console.log(img_kit)
                data.currency = 'kr'
                break
            case 'www.weber.com':
                data.name = htmlData(".product-name").text().toString().trim()
                data.price = htmlData(".price").first().text().toString().trim()
                let img_weber = htmlData('.slick-slide').html()
                data.image = img_weber ? img_weber : null
                console.log(img_weber)
                data.currency = 'kr'
                break
            default:
                return res.status(200).json({error: false, message: 'Gift List', data})
        }


        return res.status(200).json({error: false, message: 'Gift List', data})

    },
}