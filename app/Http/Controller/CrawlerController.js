const service = require('../../Service/CrawlerService/CrawlerService')
module.exports = {
    crawler : (req, res) => {
        return service.crawler(req, res)
    }
}