// jquery.iocViewer.js: replaces IOC XML text elements with styled HTML.
(function ($) {

  // Define the "iocViewer()" plugin function.
  var plugin = function(opts) {
    var defaultOptions = {};

    // Check the options used by this call to the plugin.
    var options = $.extend({}, defaultOptions, opts);

    // Convert each jQuery target to styled HTML elements.
    return this.each(function() {
      var $this=$(this), iocObject, errBase='ioc-parse-error'
        , errLabel='IOC Parse Error:', errMsg;
      // Render the IOC HTML.
      try {
        iocObject = plugin.parse($.trim($this.text()));
        $this.replaceWith(plugin.convertToHtml(iocObject));
      } catch (e) {
        errMsg = e.message.replace(/[\.\s]+$/,'') + '.';
        $this.after(
          $('<div>').addClass(errBase)
            .append($('<span>').text(errLabel).addClass(errBase+'-label'))
            .append($('<span>').text(errMsg).addClass(errBase+'-message'))
        );
      }
    });
  };

  // The OpenIOC v1.0 and v1.1 XML namespaces.
  var ioc_v1_0_XmlNamespace = plugin.OPEN_IOC_V1_0_XML_NAMESPACE =
        'http://schemas.mandiant.com/2010/ioc'
    , ioc_v1_1_XmlNamespace = plugin.OPEN_IOC_V1_1_XML_NAMESPACE =
        'http://openioc.org/schemas/OpenIOC_1.1';

  // Expose the string parsing function.
  plugin.parse = function(xmlstr) {
    var doc; // Load the XML string into a DOM object.
    if (window.DOMParser) {
      doc = new DOMParser().parseFromString(xmlstr, "text/xml");
    } else {
      doc = new ActiveXObject("Microsoft.XMLDOM");
      doc.async = false;
      doc.loadXML(xmlstr); 
      if (doc.parseError.errorCode != 0) {
        throw new Error(doc.parseError.reason);
      }
    } 
    // Load the XML document, set the source string, and return.
    return this.parseDocument(doc);
  };

  // Expose the document parsing function.
  plugin.parseDocument = function(xmlDoc) {
    // Attempt to fully parse the document.
    var rootNode, attrs, ns, i;
    if (!xmlDoc || !xmlDoc.childNodes || (xmlDoc.childNodes.length < 1)) {
      throw new Error('cannot load empty XML document');
    }
    var firstChildIndex = (window.ActiveXObject && (xmlDoc.childNodes.length===2)) ? 1 : 0;
    rootNode = xmlDoc.childNodes[firstChildIndex];
    attrs = rootNode.attributes;

    // Determine if this is OpenIOC v1.0 or 1.1 and if the namespace is prefixed.
    var ioc10ns = ioc_v1_0_XmlNamespace.toLowerCase()
      , ioc11ns = ioc_v1_1_XmlNamespace.toLowerCase();


    for (i=0; i<attrs.length; i++) {
      if (attrs[i].value.toLowerCase() === ioc10ns) {
        return parseDocumentV1_0(rootNode, getPrefix(attrs[i].name));
      } else if (attrs[i].value.toLowerCase() === ioc11ns) {
        return parseDocumentV1_1(rootNode, getPrefix(attrs[i].name));
      }
    }

    // Assume it is version 1.0 or 1.1 based on the root element node name.
    if (rootNode.nodeName === 'ioc') {
      return parseDocumentV1_0(rootNode, '');
    } else if (rootNode.nodeName === 'OpenIOC') {
      return parseDocumentV1_1(rootNode, '');
    }

    // Error out If there is no namespace the root node name is not recognized.
    throw new Error('cannot determine IOC version by XML namespace or' +
        ' root element name');

    function getPrefix(str) { 
      var match = str.match(/^xmlns:(.*)$/i);
      return (match) ? (match[1] + ':') : '';
    }
  }

  function parseDocumentV1_1(rootNode, xmlNsPrefix) {
    var node=rootNode, prefix=xmlNsPrefix, iocObject={}, n;
    // Ensure correct namespace if prefixed.
    // TODO: Chrome generates an HTML error document on parse error; check it.
    if (node.nodeName !== (prefix+'OpenIOC')) {
      throw new Error('unexpected document root element "'+node.nodeName+'"');
    }
    iocObject.id = node.getAttribute('id');
    iocObject.date_updated = node.getAttribute('last-modified');
    for (i=0; i<node.childNodes.length; i++) {
      n = node.childNodes[i];
      if (n.nodeType !== 1/*IE: Node.ELEMENT_NODE*/) continue;
      switch (n.nodeName.toLowerCase()) {
        case (prefix.toLowerCase() +'metadata'): parseMetadata(n); break;
        case (prefix.toLowerCase() +'parameters'): break; // TODO: silently ignore parameters.
        case (prefix.toLowerCase() +'criteria'):
          iocObject.definition = indicatorToJson(n, [], prefix);
          break;
        case (prefix.toLowerCase() +'parsererror'):
          throw new Error(n.children[1].textContent);
        default:
          throw new Error('unexpected IOC element "'+n.nodeName+'"');
      }
    }
    // If successfully parsed then return the object.
    if (iocObject.definition) {
      return iocObject;
    } else {
      throw new Error('no "criteria" element was found');
    }
    function parseMetadata(metadataElement) {
      var children=metadataElement.childNodes, n, i;
      for (i=0; i<children.length; i++) {
        n = children[i];
        if (n.nodeType !== 1/*IE: Node.ELEMENT_NODE*/) continue;
        switch (n.nodeName.toLowerCase()) {
          case (prefix.toLowerCase() + 'short_description'): setText('name', n); break;
          case (prefix.toLowerCase() + 'description'): setText('description', n); break;
          case (prefix.toLowerCase() + 'keywords'): setText('keywords', n); break;
          case (prefix.toLowerCase() + 'authored_by'): setText('author', n); break;
          case (prefix.toLowerCase() + 'authored_date'): setText('date_created', n); break;
          case (prefix.toLowerCase() + 'links'): iocObject.links = loadLinks(n, prefix); break;
          default: throw new Error('unexpected metadata element "' + n.nodeName + '"');
        }
      }
    }
    function setText(property, node) {
      if (node.firstChild) { iocObject[property] = node.firstChild.data; }
    }
  }

  function parseDocumentV1_0(rootNode, xmlNsPrefix) {
    var node=rootNode, prefix=xmlNsPrefix, iocObject={}, n;
    // Ensure correct namespace if prefixed.
    // TODO: Chrome generates an HTML error document on parse error; check it.
    if (node.nodeName !== (prefix+'ioc')) {
      throw new Error('unexpected document root element "'+node.nodeName+'"');
    }
    iocObject.id = node.getAttribute('id');
    iocObject.date_updated = node.getAttribute('last-modified');
    for (i=0; i<node.childNodes.length; i++) {
      n = node.childNodes[i];
      if (n.nodeType !== 1/*IE: Node.ELEMENT_NODE*/) continue;
      switch (n.nodeName.toLowerCase()) {
        case (prefix.toLowerCase() + 'short_description'): setText('name', n); break;
        case (prefix.toLowerCase() + 'description'): setText('description', n); break;
        case (prefix.toLowerCase() + 'keywords'): setText('keywords', n); break;
        case (prefix.toLowerCase() + 'authored_by'): setText('author', n); break;
        case (prefix.toLowerCase() + 'authored_date'): setText('date_created', n); break;
        case (prefix.toLowerCase() + 'links'):
          iocObject.links = loadLinks(n, prefix); break;
        case (prefix+'definition'):
          iocObject.definition = indicatorToJson(n, [], prefix);
          break;
        case (prefix+'parsererror'):
          throw new Error(n.children[1].textContent);
        default:
          throw new Error('unexpected IOC element "'+n.nodeName+'"');
      }
    }
    function setText(property, node) {
      if (node.firstChild) { iocObject[property] = node.firstChild.data; }
    }
    // If successfully parsed then return the object.
    if (iocObject.definition) {
      return iocObject;
    } else {
      throw new Error('no "definition" element was found');
    }
  }

  // Generate a JSON tree object for use with jsTree from the IOC definition.
  function indicatorToJson(indicator, acc, prefix) {
    for (var i=0; i<indicator.childNodes.length; i++) {
      var n = indicator.childNodes[i];

      if (n.nodeType !== 1/*IE: Node.ELEMENT_NODE*/) {
        continue;
      } else if (n.nodeName.toLowerCase() === (prefix.toLowerCase() +'indicator')) {
        acc.push({
          id: n.getAttribute('id'),
          operator: n.getAttribute('operator').toLowerCase(),
          children: indicatorToJson(n, [], prefix)
        });
      } else if (n.nodeName.toLowerCase() === (prefix.toLowerCase() +'indicatoritem')) {
        acc.push(indicatorItemToJson(n, prefix));
      } else {
        throw new Error('unexpected indicator element "' + n.nodeName + '"');
      }
    }
    return acc;
  }

  // Loads the "links" section.
  function loadLinks(linksElement, prefix) {
    var links=[], i, el;
    prefix = (prefix) ? prefix.toLowerCase() : '';
    for (i=0; i<linksElement.childNodes.length; i++) {
      el = linksElement.childNodes[i];
      if ((el.nodeType !== 1/*IE: Node.ELEMENT_NODE*/) ||
          (el.nodeName.toLowerCase() !== (prefix+'link'))) { continue; }
      var link = {rel:el.getAttribute('rel')}
        , title = el.getAttribute('title')
        , text = $(el.childNodes[0]).text();
      if (title) { link.title = title; }
      if (text) { link.text = text; }
      links.push(link);
    }
    return (links.length==0) ? undefined: links;
  }

  // Generates an indicator item string from an <IndicatorItem> element.
  function indicatorItemToJson(item, prefix) {
    var cond=item.getAttribute('condition'), id=item.getAttribute('id')
      , node, context, content, comment, term, value
      , children=item.childNodes, len=children.length;
    // Fix the condition to use the "negate" attribute, if present.
    if (item.getAttribute('negate') &&
          item.getAttribute('negate').match(/^true$/g)) {
      cond += ' not';
    }
    // Find the context and content nodes.
    for (var i=0; i<len; i++) {
      node = children[i];
      if (node.nodeType !== 1/*IE: Node.ELEMENT_NODE*/) continue;
      switch (node.nodeName) {
        case (prefix+'Context'): context = node; break;
        case (prefix+'Content'): content = node; break;
        case (prefix+'Comment'): comment = node; break;
        default:
          throw new Error('invalid IndicatorItem child node "' + node.nodeName + '"');
      }
    }
    if (!context) {
      throw new Error('IndicatorItem ' + id + ' has no Context child node');
    }
    if (!content) {
      throw new Error('IndicatorItem ' + id + ' has no Content child node');
    }
    term = context.getAttribute('search');
    value = $(content).text();
    comment = $(comment).text();
    return {id:id, term:term, condition:cond, value:value, comment:comment};
  }

  // Convert a parsed IOC object into HTML elements.
  plugin.convertToHtml = function(iocObject) {
    // Convert the header metadata items.
    var $viewer, $metadata, $content, i;
    $viewer = $('<div>').addClass('ioc').addClass('ioc-guid-' + iocObject.id)
        .append($metadata=$('<div>').addClass('ioc-metadata'));
    if (iocObject.name) {
      $metadata.append($('<div>').addClass('ioc-name').html(iocObject.name));
    }
    var metadataItems = [['id', 'UUID'], ['author', 'Author'], ['date_created', 'Created'], ['date_updated', 'Updated'], ['description', 'Description']];
    for (i=0; i<metadataItems.length; i++) {
      var attr=metadataItems[i][0], label=metadataItems[i][1];
      if (iocObject[attr]) {
        $metadata.append($('<div>')
            .append($('<span>').html(label + ': ').addClass('ioc-metadata-label'))
            .append($('<span>').html(iocObject[attr])).addClass('ioc-metadata-value'));
      }
    }
    var links = iocObject.links;
    if (links) {
      for (i=0; i<links.length; i++) {
        var $div = $('<div>');
        $div.append($('<span>').html('Link: rel=').addClass('ioc-metadata-label'));
        $div.append($('<span>').html(links[i].rel).addClass('ioc-metadata-value'));
        $div.append($('<span>').html(', text=').addClass('ioc-metadata-label'));
        $div.append($('<span>').html(links[i].text).addClass('ioc-metadata-value'));
        if (links[i].title) {
          $div.append($('<span>').html(', title=').addClass('ioc-metadata-label'));
          $div.append($('<span>').html(links[i].title).addClass('ioc-metadata-value'));
        }
        $metadata.append($div);
      }
    }
    // Convert the logic tree.
    renderIndicator($viewer, iocObject.definition[0], 0);
    function renderIndicator(parentNode, indicator, depth) {
      var $ul=$('<ul>'), $li, $rule, nodes, node, content, labelText
        , isFirst, isLast
        , op=(indicator.operator && indicator.operator.toLowerCase());
      $ul.addClass('ioc-' + ((depth===0) ? 'definition' : op.toLowerCase()));
      $ul.addClass('ioc-guid-' + indicator.id);
      nodes = indicator.children;
      for (var i=0; i<nodes.length; i++) {
        node = nodes[i];
        // Determine the node classes and label content.
        isFirst = (i === 0);
        isLast = (i === (nodes.length - 1));
        if (depth === 0) {
          labelText = 'Hit&nbsp;if';
        } else if (op === 'and') {
          labelText = (isFirst) ? '' : '&';
        } else { // op === 'or'
          labelText = (isFirst) ? 'This' : 'Or';
        }
        // Create and append the indicator nodes.
        if (node.term) {
          $ul.append(($li=$('<li>')
            .append($('<span>').addClass('ioc-label').html(""))
            .append($rule=$('<span>').addClass('ioc-rule')
              .append($('<span>').addClass('ioc-term').text(prepTerm(node.term)))
              .append($('<span>').addClass('ioc-condition').text(node.condition))
              .append($('<span>').addClass('ioc-value').text(node.value)))));
          $li.addClass('no-nest').addClass('ioc-guid-' + node.id);
          if (node.comment) {
            $rule.attr('title', node.comment);
            $rule.addClass('ioc-commented-rule');
          }
        } else {
          $ul.append($li=$('<li>')
            .append($('<span>').addClass('ioc-label').html("")));
          renderIndicator($li, node, depth + 1);
        }
        if (isFirst) { $li.addClass('ioc-indicator-first'); }
        if (isLast) { $li.addClass('ioc-indicator-last'); }
      }
      parentNode.append($ul);
    }
    function prepTerm(str) {
      return str.replace(/\//g, ':').replace(/Item/,'');
    }
    return $viewer;
  };

  // Set the plugin version number.
  plugin.version = '0.2.0';

  // Export the plugin to jQuery.
  $.fn.iocViewer = plugin;

})(jQuery);
