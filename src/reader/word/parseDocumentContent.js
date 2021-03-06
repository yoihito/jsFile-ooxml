import JsFile from 'JsFile';
import parseSectionProperties from './parseSectionProperties';
import parseDocumentContentNodes from './parseDocumentContentNodes';
const {Document} = JsFile;
const {normalizeColorValue, errors: {invalidReadFile}} = JsFile.Engine;

/**
 * @description Parsing content of document
 * @param params
 * @return {Object}
 * @private
 */
export default function parseDocumentContent (params) {
    return new Promise((resolve, reject) => {
        const {xml, documentData = {}, fileName = ''} = params;
        let node = xml && xml.querySelector('parsererror');
        if (node) {
            return reject(new Error(invalidReadFile));
        }

        const result = {
            meta: {
                name: fileName,
                wordsCount: (documentData.applicationInfo && documentData.applicationInfo.wordsCount) || null,
                zoom: (documentData.settings && documentData.settings.zoom) || 100
            },
            content: [],
            styles: documentData.styles.computed
        };
        const pagePrototype = {};
        node = xml && xml.querySelector('background');

        if (node) {
            const attrValue = node.attributes['w:color'] && node.attributes['w:color'].value;
            if (attrValue) {
                pagePrototype.style = pagePrototype.style || {};
                pagePrototype.style.backgroundColor = normalizeColorValue(attrValue);
            }

            // TODO: parse themeColor, themeShade, themeTint attributes
        }

        node = xml && xml.querySelector('body');
        if (node) {
            const nodes = [].slice.call(node.childNodes || [], 0);
            const lastNode = nodes[nodes.length - 1];
            if (lastNode.localName === 'sectPr') {
                /**
                 * @description remove last item - sectionProperties
                 */
                nodes.pop();

                documentData.styles.defaults.sectionProperties = parseSectionProperties(lastNode, documentData);
            }

            parseDocumentContentNodes({
                nodes,
                documentData
            }).then((elements) => {
                const page = Document.elementPrototype;
                page.children.push.apply(page.children, elements);
                page.style = documentData.styles.defaults.sectionProperties &&
                    documentData.styles.defaults.sectionProperties.style || {};

                //TODO: add page break, because now it's only 1 page for all content
                if (page.style.height) {
                    page.style.minHeight = page.style.height;
                    delete page.style.height;
                }

                result.content.push(page);
                resolve(new Document(result));
            }, reject);
        } else {
            resolve(new Document(result));
        }
    });
}
