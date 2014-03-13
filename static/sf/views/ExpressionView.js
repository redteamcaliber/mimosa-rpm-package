define(function (require) {
    var UAC = require('UAC');

    var ExpressionView = UAC.View.extend({
        render: function () {
            var view = this;

            var exp_string = view.model.get('exp_string');
            var tokens = exp_string.split(/(AND)|(OR)/);

            var text = '';
            _.each(tokens, function (token) {
                if (!token) {

                }
                else if (token == 'AND' || token == 'OR') {
                    text += token + '\n';
                }
                else {
                    text += token;
                }
            });

            view.$el.popover({
                html: true,
                trigger: 'hover',
                content: '<pre style="border: 0; margin: 2px; font-size: 85%; overflow: auto">' + text + '</pre>',
                placement: 'left'
            })
                .data('bs.popover')
                .tip()
                .addClass('expression-popover');
        },
        close: function () {
            this.stopListening();
            this.$el.popover('destroy');
            // Manually removing the popover due to -> https://github.com/twbs/bootstrap/issues/10335
            this.$el.parent().find('.popover').remove();
        }
    });

    return ExpressionView;
});