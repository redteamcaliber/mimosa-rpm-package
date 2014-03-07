var StrikeFinder = StrikeFinder || {};


//
// StrikeFinder Formatting Utilities.
//

StrikeFinder.format_suppression = function (s) {
    return _.sprintf('%s \'%s\' \'%s\' (preservecase=%s, negate: %s)',
        s.itemkey, s.condition, _.escape(s.itemvalue), s.preservecase, s.negate);
};

StrikeFinder.format_acquisition = function (a) {
    return _.sprintf('Acquisition (%s) FilePath: %s FileName: %s',
        a.uuid, a.file_path, a.file_name);
};

/**
 * Invoke a template.
 * @param template - the template name.
 * @param context - the template context.
 * @returns the template result.
 */
StrikeFinder.template = function (template, context) {
    if (!StrikeFinder.templates) {
        // Error, templates does not exist.
        throw 'StrikeFinder.templates is not initialized.';
    }
    else if (!(template in StrikeFinder.templates)) {
        // Error, template not found.
        throw 'StrikeFinder template: ' + template + ' not found.';
    }
    else {
        // Add the view helpers.
        UAC.default_view_helpers(context);

        // Return the template result.
        return StrikeFinder.templates[template](context);
    }
}