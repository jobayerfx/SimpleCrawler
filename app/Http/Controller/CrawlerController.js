const service = require('../../Service/CrawlerService/CrawlerService')
const {validationResult} = require('express-validator');

module.exports = {
    crawler : (req, res) => {
        const errors = validationResult(req.body);
        if (!errors.isEmpty()) {
            return res.status(401).json({errors: errors.array()});
        }
        return service.crawlerWithCheerio(req, res)
    }
}