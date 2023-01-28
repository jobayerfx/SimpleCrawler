const {check} = require('express-validator');

exports.url =
    [
        check('url', 'URL is empty').not().isEmpty()
    ];