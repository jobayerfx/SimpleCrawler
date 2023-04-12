const Crawler = require("simplecrawler");
const cheerio = require("cheerio");
const axios = require('axios');
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
        let data = {name: null, price : null, image : null, url: url, currency: null}
        try {
            const pageHTML = await axios.get(url, {
                headers: {
                    'Accept-Encoding': 'gzip, deflate, br',
                },
                //is the same as set the entire url
            })
            const htmlData = cheerio.load(pageHTML.data)

            const link = new URL(url).host
            switch (link){
                case 'www.ahlens.se':
                    data.name = htmlData('[data-testid="ProductDetailsBlockTestIds_name"]').text().trim()
                    data.image = htmlData('.jss167 span > img').attr('src')
                    let ahl_prc_1 = htmlData('[data-testid="ProductDetailsBlockTestIds_price"]').html()

                    data.price = ahl_prc_1 ? ahl_prc_1 : 0
                    // console.log()
                    // const htm = htmlData('.MuiGrid-container > div:nth-child(4)').html();
                    // const pp  = cheerio.load(htm)
                    // const price = pp('.jss635').text().trim();
                    // console.log(price ? price : 0)
                    break
                case 'www.magasin.dk':
                    data.name = htmlData('.js-productName').text()
                    let maga_pri_1 = htmlData('.js-productPrice > .price > span > span > span ').text().replace(/^\n|\n$/g, '')
                    data.image = htmlData('.productDetailsImage__image').attr('src')
                    let maga_pri_2 = htmlData('.js-productPrice > div > div > div > .goodie-price__value ').text().replace(/^\n|\n$/g, '')
                    data.price = maga_pri_2 ? maga_pri_2 : maga_pri_1
                    break
                    // case 'www.johnlewis.com':
                    //     data.name = htmlData('[data-testid="product:title"]').text()
                    //     data.price = htmlData('[data-testid="product:price"]').text().replace('£','')
                    //     data.currency = 'EUR'
                    //     data.image = htmlData('.Layout_image__1LfSG > div > div > div > div > img').attr('src') ?? null
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
                    break
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
                    let w_name = htmlData(".product-name").text().toString()
                    let w_price = htmlData(".price").first().text().toString()
                    let img_weber = htmlData('.main > div > img').attr('src')
                    data.image = img_weber ? img_weber.trim() : null
                    data.price = w_price ? w_price.trim() : null
                    data.name = w_name ? w_name.trim() : null
                    console.log(img_weber)
                    data.currency = 'DKK'
                    break
                case 'paustian.com':
                    data.name = htmlData(".m-product-title").text().toString().trim()
                    data.price = htmlData(".m-product-price").first().text().toString().trim()
                    const firstImage = htmlData('.item').first().attr('img','src').html();
                    const $ = cheerio.load(firstImage);
                    const imageUrl = $('img').attr('data-src');
                    console.log(imageUrl);
                    data.image = imageUrl ? imageUrl : null
                    data.currency = 'DKK'
                    break
                case 'www.bauhaus.dk':
                    data.name = htmlData(".hyphens-auto").text().toString().trim()
                    data.price = htmlData(".price").first().text().toString().trim()
                    const firstbauhausImage = htmlData('.item').first().attr('img','src').html();
                    const d = cheerio.load(firstbauhausImage);
                    const imagebauhausUrl = htmlData('.product-info-main img').attr('src');
                    console.log(imagebauhausUrl);
                    data.image = imagebauhausUrl ? imagebauhausUrl : null
                    data.currency = 'kr'
                    break
                case 'www.bog-ide.dk':
                    let bog_name = htmlData(".css-weczj-ProductHeaderTitle").text().toString()
                    let bog_price = htmlData(".css-tspljm-Price").first().text().toString()
                    // const bogImage = htmlData('.css-1jtmlf3-StyledImage').attr('img','src').html();
                    const bogUrl = htmlData('.css-wfazeb-StyledProductMedia').eq(2).attr('img', 'src').text();
                    console.log(bogUrl)

                    data.name = bog_name ? bog_name : null
                    data.price = bog_price ? bog_price : null
                    data.image = bogUrl ? bogUrl : null
                    data.currency = 'DKK'
                    break
                case 'www.dunelm.com':
                    data.name = htmlData('[data-testid="product-title"]').text()
                    data.price = htmlData('[data-testid="product-price"]').text()
                    data.image = htmlData('[data-testid="mainImage"]').attr('src')
                    data.currency = 'eur'
                    break
                case 'www.johnlewis.com':
                    data.name = htmlData('[data-cy="product-header-block"]')
                        .find('h1')
                        .text()

                    console.log('name: ', data.name)
                    data.price = htmlData('[data-cy="product-price-title"]')
                        .find('span')
                        .text()
                    data.image = htmlData('.slick-slide > div > div > img').attr('src')
                    data.currency = 'eur'
                    break
                case 'www.wayfair.com':
                    data.name = htmlData('[data-hb-id="Heading"]').text()
                    data.price = htmlData('[data-enzyme-id="PriceBlock"]')
                        .find('div > div > span')
                        .text()
                    // data.image = htmlData('.slick-slide > div > div > img').attr('src')
                    data.currency = 'usd'
                    break

                case 'www.williams-sonoma.com':
                    data.name = htmlData('[data-test-id="product-title"]').text()
                    data.price = htmlData('[data-test-id="priceLabel"]')
                        .find('.amount')
                        .text()
                    if (!data.price) {
                        data.price = htmlData('[data-test-id="priceLabel"]')
                            .find('.amount')
                            .text()
                    }
                    data.image = htmlData('[data-test-id="magnifier"]')
                        .find('div > div > div > div > img')
                        .attr('src')
                    data.currency = 'usd'
                    break

                case 'www.bedbathandbeyond.com':
                    data.name = htmlData('.first').html().toString()
                    data.price = htmlData('.s12').html()
                    data.image = htmlData('[data-test-id="magnifier"]')
                        .find('div > div > div > div > img')
                        .attr('src')
                    data.currency = 'usd'

                    break
                case 'www.cervera.se':
                    data.name = htmlData(".ProductTopInfo_productTitle__YbnOY").text().toString().trim()
                    data.price = htmlData(".ProductPrice_salePrice___aDz3.ProductPrice_root__QRibA").first().text().toString().trim().match(/\d/g, '').join('')
                    let imgCre = htmlData('.ProductImageSlider_productImage__yQnyM').attr('src').trim()
                    data.image = imgCre ? imgCre : null
                    data.currency = htmlData(".ProductPrice_salePrice___aDz3.ProductPrice_root__QRibA").first().text().toString().trim().match(/[A-Za-z]/g).join("")
                    break
                case 'designtorget.se':
                    data.name = htmlData("#product-addtocart-button").attr('data-name').trim()
                    data.price = htmlData("#product-addtocart-button").attr('data-price').trim()
                    let imgdesi = htmlData('.c-product-gallery__img.c-product-gallery__img--main').attr('src').trim()
                    data.image = imgdesi ? imgdesi : null
                    data.currency = htmlData(".price").first().text().toString().trim().match(/[A-Za-z]/g).join("")
                    break
                case 'www.granit.com':
                    data.name = htmlData("h1.page-title span").text().toString().trim()
                    data.price = htmlData(".price-container .price-wrapper span.price").first().text().toString().trim().match(/\d/g, '').join('')
                    let imgGran = htmlData('.gallery-placeholder__image').attr('src').trim()
                    data.image = imgGran ? imgGran : null
                    data.currency = htmlData(".price-container .price-wrapper span.price").first().text().toString().trim().match(/[A-Za-z]/g).join('')
                    break
                case 'www.illumsbolighus.dk':
                    data.name = htmlData("h1.product-name").text().toString().trim()
                    data.price = htmlData(".price .non-member-promo-price .sales span.value").text().toString().trim().match(/\d/g, '').join('')
                    let imgib = htmlData('.d-block.img-fluid.lazyload').attr('data-src').trim()
                    data.image = imgib ? imgib : null
                    data.currency = htmlData(".price .non-member-promo-price .sales span.value").text().toString().trim().match(/[A-Za-z]/g).join('')
                    break
                case 'www.amazon.de':
                case 'www.amazon.co.uk':
                    data.name = htmlData("#productTitle").text().toString().trim()
                    let price1 = htmlData("#price").text().toString().trim()
                    let price2 = htmlData("#price_inside_buybox").text().toString().trim()
                    let price3 = htmlData(".apexPriceToPay > span").eq(1).text().toString().trim()
                    let price4 = htmlData(".priceToPay").text().toString().trim()
                    let img_am = htmlData("#imgBlkFront").attr('src')
                    let img_am2 = htmlData("#landingImage").attr('src')
                    let img_am3 = htmlData("#imgTagWrapperId").attr('src')
                    let img_am4 = htmlData("#imgTagWrapperId > div").attr('src')
                    data.image = img_am ? img_am : img_am2 ? img_am2 : img_am3 ? img_am3 : img_am4 ? img_am4 : null
                    data.price = price1 ? price1 : price2 ? price2 : price3 ? price3 : price4 ? price4 : null
                    // data.currency = htmlData(".price .non-member-promo-price .sales span.value").text().toString().trim().match(/[A-Za-z]/g).join('')
                    break
                // case 'www.breuninger.com':
                //     data.name = htmlData('.shop-body').text()
                //     data.image = htmlData('div').text()
                //     data.price = htmlData('.productPrice').text()
                //     break
                case 'www.thewhitecompany.com':
                    data.name = htmlData('.product-details__name').text()
                    data.image = htmlData('div').text()
                    data.price = htmlData('.productPrice').text()
                    break
                case 'www.anthropologie.com':
                    data.name = htmlData('.c-pwa-product-meta-heading').text()
                    data.image = htmlData('div').text()
                    data.price = htmlData('.productPrice').text()
                    break
                case 'https://www.amara.com':
                    data.name = htmlData('.c-pwa-product-meta-heading').text()
                    data.image = htmlData('div').text()
                    data.price = htmlData('.productPrice').text()
                    break
                case 'www.oliverbonas.com':
                    // data.name = htmlData('.h3').text()
                    let oli_name_1 = htmlData('.pos-relative > div > div > div > div > h1').text()
                    let oli_image_1 = htmlData('.rf .dynamic-image').attr('src')
                    let oli_price_1 = htmlData('.price > span').text()
                    const oli = cheerio.load(htmlData('.product-media__image').html())
                    const imageUrla = oli('.dynamic-image').attr('src');
                    data.name = oli_name_1 ? oli_name_1 : null
                    data.image = imageUrla ? imageUrla : null
                    data.price = oli_price_1 ? oli_price_1 : null
                    break
                case 'www.grahamandgreen.co.uk':
                    // data.name = htmlData('.h3').text()
                    let gra_name_1 = htmlData('.page-title > h1').text().trim()
                    let gra_image_1 = htmlData('.gallery__image').attr('src')
                    let gra_price_1 = htmlData('#product-price-30180').text().trim()

                    data.name = gra_name_1 ? gra_name_1 : null
                    data.image = gra_image_1 ? gra_image_1 : null
                    data.price = gra_price_1 ? gra_price_1 : null
                    break
                case 'www.libertylondon.com':
                    data.name = htmlData('.product-details > h1').text().trim()
                    data.price = htmlData('.prices > .price').text().trim()
                    data.image = htmlData('.primary-product-image > a > img').attr('src')
                    break
                case 'www.harrods.com':
                    data.name = htmlData('[data-test="buyingControl-brand"]').text().trim()
                    data.price = htmlData('[data-test="product-price"]').text().trim()
                    data.image = htmlData('[data-test="product-image"]').attr('src')
                    break
                case 'www.kostaboda.com':
                    let ko_name = htmlData('.css-19qzjun').text().trim()
                    let ko_price = htmlData('[data-test="product-price"]').text().trim()
                    let ko_image = htmlData('.css-1unf33q > div > img').attr('data-src')

                    data.name = ko_name
                    data.price = ko_price
                    data.image = ko_image ? ko_image : null
                    break

                case 'royaldesign.se':
                    let ro_name = htmlData('.css-oo4wqa-ProductDetails > h1').text().trim()
                    let ro_price = htmlData('.css-oo4wqa-ProductDetails > .css-13a3qqo > div > div > .css-d7o27d').text()
                    let ro_image = htmlData('.css-61q2qj > img').attr('src')
                    data.name = ro_name ? ro_name : null
                    data.price = ro_price ? ro_price : null
                    data.image = ro_image ? ro_image : null
                    break
                case 'www.nk.se':
                    let nk_name = htmlData('.a5 > a').text().trim()
                    let nk_price = htmlData('.jh > div > div > div > a > span > span').eq(0).text()
                    let nk_image = htmlData('.dp > div > div > img').attr('src')

                    // console.log(htmlData('img').eq(6).attr('src'))
                    data.name = nk_name ? nk_name : null
                    data.price = nk_price ? nk_price : null
                    data.image = nk_image ? nk_image : null
                    break
                case 'www.svenskttenn.com':
                    let sve_name = htmlData('.c-product-detail__heading').text().replace(/(\r\n|\n|\r|\t)/gm, "").trim()
                    let sve_price = htmlData('.c-product-detail__price--current').text().trim()
                    let sve_image = htmlData('.easyzoom-trigger img').attr('src')

                    // console.log(htmlData('img').eq(6).attr('src'))
                    data.name = sve_name ? sve_name: null
                    data.price = sve_price ? sve_price : null
                    data.image = sve_image ? 'www.svenskttenn.com' + sve_image : null
                    break
                case 'artilleriet.se':
                    let art_name = htmlData('.Product-title').text().trim()
                    let art_price = htmlData('.Product-price').text().trim()
                    let art_image = htmlData('.Product-image > span  img').attr('src')

                    // console.log(htmlData('.Product-images').eq(1).find('img').attr('src'))
                    data.name = art_name ? art_name: null
                    data.price = art_price ? art_price : null
                    data.image = art_image ? art_image : null
                    break
                case 'www.galeria.de':
                    let gal_name = htmlData('[data-testid="productTitle"]').text()
                    let gal_price = htmlData('.Product-price').text().trim()
                    let gal_image = htmlData('.Product-image > span  img').attr('src')

                    // console.log(htmlData('.Product-images').eq(1).find('img').attr('src'))
                    data.name = gal_name ? gal_name: null
                    data.price = gal_price ? gal_price : null
                    data.image = gal_image ? gal_image : null
                    break
                case 'www.breuninger.com':
                    let bre_name = htmlData('.ents-brand-heading-bold').text()
                    let bre_price = htmlData('.Product-price').text().trim()
                    let bre_image = htmlData('img').attr('src')

                    data.name = bre_name ? bre_name: null
                    data.price = bre_price ? bre_price : null
                    data.image = bre_image ? bre_image : null
                    break

                case 'www.manufactum.de':
                    let manu_name = htmlData('.se-oFQyi_m8').eq(0).text()
                    let manu_price = htmlData('.se-vWoGiX5M > .se-Wcfg4ucA').eq(0).text().trim()
                    let manu_image = htmlData('#firstImage').attr('src')
                    data.name = manu_name ? manu_name: null
                    data.price = manu_price ? manu_price : null
                    data.image = manu_image ? manu_image : null
                    break

                case 'www.globus-baumarkt.de':
                    let glo_name = htmlData('.product-detail-name').eq(0).text().trim()
                    let glo_price = htmlData('.with-list-price').text().trim()
                    let glo_image = htmlData('.thumb-isPdpGallery > source').attr('srcset')

                    console.log(htmlData('.card-body > .tab-content > .product-detail-price-container').html())
                    data.name = glo_name ? glo_name: null
                    data.price = glo_price ? glo_price : null
                    data.image = glo_image ? glo_image : null
                    break
                case 'www.westwing.de':
                    let wes_name = htmlData('.campaign-overview__content').text().trim()
                    let wes_price = htmlData('.with-list-price').text().trim()
                    let wes_image = htmlData('.thumb-isPdpGallery > source').attr('srcset')

                    data.name = wes_name ? wes_name: null
                    data.price = wes_price ? wes_price : null
                    data.image = wes_image ? wes_image : null
                    break
                case 'www.mydays.de':
                    let myd_name = htmlData('.c-producthl__headline').eq(0).text().trim()
                    let myd_price_1 = htmlData('.product__facts__voucherinfo__price').text().trim().replace(/(\r\n|\n|\r|\t)/gm, "")
                    let myd_price_2 = htmlData('.c-mbvoucher__pricebox > span').text().trim()
                    let myd_image =htmlData('.slides > li > img').eq(0).attr('src')
                    data.name = myd_name ? myd_name: null
                    data.price = myd_price_1 ? myd_price_1 : myd_price_2 ? myd_price_2 : null
                    data.image = myd_image ? myd_image : null
                    break
                case 'www.westwingnow.de':
                    let west_name = htmlData('.ProductInfo__ProductTitle-appshell__sc-195uwu2-4').text().trim()
                    let west_price = htmlData('.ProductInfo__ProductPrice-appshell__sc-195uwu2-6 > span').text().trim()
                    let west_image = htmlData('.ww-uikit_HorizontalScrollableSnap_lf8e7kwf-sc-zvm6t4 > div:nth-child(2) > picture > img').attr('src')

                    // console.log(htmlData('.ww-uikit_HorizontalScrollableSnap_lf8e7kwf-sc-zvm6t4 > div:nth-child(2) > picture > img').attr('src'))
                    data.name = west_name ? west_name: null
                    data.price = west_price ? west_price : null
                    data.image = west_image ? west_image : null
                    break
                case 'www.connox.de':
                    let conn_name = htmlData('.product-details > h1').text().trim()
                    let conn_price_1 = htmlData('.product-price > div > span > s').text().trim()
                    let conn_price_2 = htmlData('.product-price > div > span > span').text().trim()
                    let conn_image = htmlData('.product-gallery > div > div > div > a').attr('href')

                    data.name = conn_name ? conn_name: null
                    data.price = conn_price_2 ? conn_price_2 : conn_price_1 ? conn_price_1 : null
                    data.image = conn_image ? conn_image : null
                    break
                case 'www.porzellantreff.de':
                    let porz_name = htmlData('.product-name > h1').text().trim()
                    let porz_price_1 = htmlData('.product-price > div > span > s').text().trim()
                    let porz_price_2 = htmlData('.product-price > div > span > span').text().trim()
                    let porz_image = htmlData('.product-gallery > div > div > div > a').attr('href')

                    data.name = porz_name ? porz_name: null
                    data.price = porz_price_2 ? porz_price_2 : porz_price_1 ? porz_price_1 : null
                    data.image = porz_image ? porz_image : null
                    break
                case 'www.butlers.com':
                    let butle_name = htmlData('.product-main_single__title > span').eq(0).text().trim()
                    let butle_price_1 = htmlData('  .product__price').text().trim()
                    let butle_image = htmlData('.product-image-main > div > img').attr('data-photoswipe-src').replace(/^\/{2}/, "")

                    data.name = butle_name ? butle_name: null
                    data.price = butle_price_1 ? butle_price_1 : null
                    data.image = butle_image ? 'https://' + butle_image : null
                    break
                default:
                    return res.status(200).json({error: false, message: 'Gift List', data})
            }
            return res.status(200).json({error: false, message: 'List', data})
        } catch (e) {
            return res.status(200).json({error: false, message: e.message, data})
        }

    },
}