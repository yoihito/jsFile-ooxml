import JsFile from 'JsFile';
import parseParagraphProperties from './parseParagraphProperties';
import getRelationship from './getRelationship';
import parseText from './parseText';
const {Document} = JsFile;
const {merge} = JsFile.Engine;

/**
 *
 * @param params
 * @returns {*}
 */
export default function parseParagraph (params) {
    const {node, documentData} = params;
    const result = Document.elementPrototype;
    const forEach = [].forEach;
    result.properties.tagName = 'P';

    if (!node || !documentData) {
        return result;
    }

    if (documentData.styles.defaults.paragraphProperties) {
        merge(result.properties, documentData.styles.defaults.paragraphProperties.properties);
    }

    forEach.call(node && node.childNodes || [], (node) => {
        let attrValue;
        let el;
        const localName = node.localName;

        switch (localName) {
            case 'bookmarkStart':
                attrValue = node.attributes['w:name'] && node.attributes['w:name'].value;
                if (attrValue) {
                    el = Document.elementPrototype;
                    el.properties.tagName = 'A';
                    el.properties.name = attrValue;
                    result.children.push(el);
                }

                break;
            case 'pPr':
                let props = parseParagraphProperties(node, documentData);
                if (result.properties.tagName === 'LI') {
                    /**
                     * @description Clear paragraph styles
                     * @type {*}
                     */
                    result.style = {};
                }

                merge(result, props);
                break;
            case 'hyperlink':
                let href = '#';
                el = Document.elementPrototype;
                el.properties.tagName = 'A';
                attrValue = node.attributes['r:id'] && node.attributes['r:id'].value;
                const relationship = (attrValue && getRelationship(attrValue, documentData)) || null;

                forEach.call(node && node.childNodes || [], (node) => {
                    el.children.push(parseText({
                        node,
                        documentData
                    }));
                });

                if (relationship) {
                    href = relationship.target;
                    el.properties.target = '_blank';
                } else {
                    href += (node.attributes['w:anchor'] && node.attributes['w:anchor'].value) || '';
                }

                el.properties.href = href;
                result.children.push(el);
                break;
            case 'r':
                result.children.push(parseText({
                    node,
                    documentData
                }));

                break;

            // ignore fldSimple node
        }
    });

    return result;
}