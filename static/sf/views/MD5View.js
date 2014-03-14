define(function (require) {
    var DialogView = require('uac/views/DialogView');
    var templates = require('sf/ejs/templates');

    MD5View = DialogView.extend({
        render: function () {
            //console.dir(this.model.toJSON());
            this.apply_template(templates, 'md5-details.ejs', this.model.toJSON());
            this.modal();
        }
    });

    return MD5View;
});
