define(function(){

    this["JST"] = this["JST"] || {};

    this["JST"]["tags-search.ejs"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape, __j = Array.prototype.join;function print() { __p += __j.call(arguments, '') }with (obj) {__p += '\n<div class="row">\n    <div class="col-sm-3" style="border: 0 solid red;border-right-width: 1px;">\n        <dl>\n            '; _.each (categories, function(category) { ;__p += '\n                <dt>' +((__t = ( category.title )) == null ? '' : __t) +'</dt>\n                '; _.each(category_map[category.id], function(tag) { ;__p += '\n                    <dd>\n                        <input id="tag" type="checkbox" value="' +((__t = ( tag.id )) == null ? '' : __t) +'"/> ' +((__t = ( tag.title )) == null ? '' : __t) +'\n                    </dd>\n                '; }) ;__p += '\n            '; }) ;__p += '\n        </dl>\n    </div>\n</div>';}return __p};

    return this["JST"];

});