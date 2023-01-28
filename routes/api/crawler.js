const express = require('express');
const router = express.Router();
const validator = require('../../app/Validator/validator');
const Controller = require('../../app/Http/Controller/CrawlerController');

const cors = require('cors');
router.use(cors());

/**
 * @description Get Crawler URL
 * @method POST
 * @access Public
 *
 */
router.post('/', validator.url, Controller.crawler);

module.exports = router;