_ = require('underscore.string');


//
// API Utilities.
//

function dot2num(dot) {
    var d = dot.split('.');
    return ((((((+d[0]) * 256) + (+d[1])) * 256) + (+d[2])) * 256) + (+d[3]);
}

function num2dot(num) {
    var d = num % 256;
    for (var i = 3; i > 0; i--) {
        num = Math.floor(num / 256);
        d = num % 256 + '.' + d;
    }
    return d;
}

/**
 * Combine to URL's ensure there are no extra slashes.
 * @param base_url - the base url.
 * @param relative_url - the relative url to append to it.
 * @returns {*} - the combined URL.
 */
function combine_urls(base_url, relative_url) {
    if (!_.endsWith(base_url, '/')) {
        if (_.startsWith(relative_url, '/')) {
            return base_url + relative_url;
        }
        else {
            return base_url + '/' + relative_url;
        }
    }
    else {
        if (_.startsWith(relative_url, '/')) {
            return base_url.substring(0, base_url.length - 1) + relative_url;
        }
        else {
            return base_url + relative_url;
        }
    }
}


exports.dot2num = dot2num;
exports.num2dot = num2dot;
exports.combine_urls = combine_urls;