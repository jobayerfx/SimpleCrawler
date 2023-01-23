const express = require('express');
const router = express.Router();
import Controller from '../../app/Http/Controller/CrawlerController';

const cors = require('cors');
router.use(cors());

/**
 * @description Get Crawler URL
 * @method GET
 * @access Public
 */
router.get('/', Controller.crawler);

module.exports = { router }