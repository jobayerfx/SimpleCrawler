const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Controller = require('../../app/Http/Controller/CrawlerController');

const cors = require('cors');
router.use(cors());

/**
 * @description Get Crawler URL
 * @method GET
 * @access Public
 * @api api/auth
 */
router.get('/', Controller.crawler);

module.exports = router